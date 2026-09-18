import crypto from "crypto";
import argon2 from "argon2";

import redisClient from "../config/redis.js";
import User from "../models/user.model.js";
import Session from "../models/session.model.js";
import AuthActivity from "../models/authActivity.model.js";
import { generateTokens } from "../utils/token.js";

export const requestOtp = async (
  phone: string,
  countryCode: string
) => {
  const phoneNumber = `${countryCode}${phone}`;

  const otpKey = `otp:${phoneNumber}`;
  const cooldownKey = `otp:cooldown:${phoneNumber}`;

  const cooldownExists = await redisClient.exists(cooldownKey);

  if (cooldownExists) {
    throw new Error("OTP_COOLDOWN");
  }

  const otp = crypto.randomInt(100000, 1000000).toString();

  const otpHash = await argon2.hash(otp);

  await redisClient.set(otpKey, otpHash, {
    EX: 300,
  });

  await redisClient.set(cooldownKey, "1", {
    EX: 30,
  });

  console.log(`OTP generated for ${phoneNumber}: ${otp}`);

  return {
    expiresIn: 300,
  };
};

export const verifyOtp = async (
  phone: string,
  countryCode: string,
  otp: string,
  ipAddress?: string,
  userAgent?: string
) => {
  const phoneNumber = `${countryCode}${phone}`;

  const otpKey = `otp:${phoneNumber}`;
  const attemptsKey = `otp:attempts:${phoneNumber}`;

  const storedOtpHash = await redisClient.get(otpKey);

  if (!storedOtpHash) {
    throw new Error("OTP_INVALID_OR_EXPIRED");
  }

  const attemptsValue = await redisClient.get(attemptsKey);

  const attempts = attemptsValue
    ? Number(attemptsValue)
    : 0;

  if (attempts >= 5) {
    await redisClient.del(otpKey);
    await redisClient.del(attemptsKey);

    throw new Error("OTP_MAX_ATTEMPTS");
  }

  const otpValid = await argon2.verify(
    storedOtpHash,
    otp
  );

  if (!otpValid) {
    const newAttempts = attempts + 1;

    if (newAttempts >= 5) {
      await redisClient.del(otpKey);
      await redisClient.del(attemptsKey);

      throw new Error("OTP_MAX_ATTEMPTS");
    }

    await redisClient.set(
      attemptsKey,
      newAttempts.toString(),
      {
        EX: 300,
      }
    );

    throw new Error("OTP_INVALID");
  }

  await redisClient.del(otpKey);
  await redisClient.del(attemptsKey);

  const user = await User.findOne({
    phone,
    countryCode,
    status: "active",
  });

  if (!user) {
    throw new Error("USER_NOT_FOUND");
  }

  const {
    accessToken,
    refreshToken,
    tokenId,
    familyId,
  } = generateTokens(user.id);

  const issuedAt = new Date();

  const expiresAt = new Date(
    issuedAt.getTime() +
      7 * 24 * 60 * 60 * 1000
  );

  const newSession = new Session({
    userId: user._id,
    tokenId,
    familyId,
    issuedAt,
    expiresAt,
    ...(userAgent ? { userAgent } : {}),
  });

  await newSession.save();

  await AuthActivity.create({
    userId: user._id,
    event: "login_otp",
    success: true,
    ...(ipAddress ? { ipAddress } : {}),
    ...(userAgent ? { userAgent } : {}),
  });

  return {
    accessToken,
    refreshToken,
  };
};