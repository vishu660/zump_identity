import type { Request, Response } from "express";
import argon2 from "argon2";
import mongoose from "mongoose";
import redisClient from "../config/redis.js";
import User from "../models/user.model.js";
import Session from "../models/session.model.js";
import AuthActivity from "../models/authActivity.model.js";
import { createUserSchema } from "../validators/user.validator.js";
import { loginSchema } from "../validators/auth.validator.js";
import { generateTokens } from "../utils/token.js";
import type { AuthenticatedRequest } from "../middleware/auth.middleware.js";
import { error } from "console";

export const signupUser = async (req: Request, res: Response) => {
  const result = createUserSchema.safeParse(req.body);

  if (!result.success) {
    return res.status(400).json({
      error: {
        code: "VALIDATION_ERROR",
        message: "Invalid request data",
        details: result.error.flatten(),
      },
    });
  }

  const {
    phone,
    countryCode,
    email,
    name,
    password,
    dateOfBirth,
    address,
  } = result.data;

  const existingUser = await User.findOne({
    $or: [
      { phone, status: "active" },
      { email, status: "active" },
    ],
  });

  if (existingUser) {
    return res.status(409).json({
      error: {
        code: "USER_ALREADY_EXISTS",
        message: "Phone or email already exists",
        details: {},
      },
    });
  }

  const passwordHash = await argon2.hash(password);

  const session = await mongoose.startSession();

  try {
    session.startTransaction();

    const user = new User({
      phone,
      countryCode,
      email,
      name,
      passwordHash,
      dateOfBirth: new Date(dateOfBirth),
      address,
      status: "active",
    });

    await user.save({ session });

    const authActivity = new AuthActivity({
      userId: user._id,
      event: "signup",
      success: true,
      ipAddress: req.ip ?? undefined,
      userAgent: req.get("user-agent") ?? undefined,
    });

    await authActivity.save({ session });

    await session.commitTransaction();

    return res.status(201).json({
      data: {
        id: user.id,
        phone: user.phone,
        countryCode: user.countryCode,
        email: user.email,
        name: user.name,
        avatarKey: user.avatarKey,
        address: user.address,
        dateOfBirth: user.dateOfBirth,
        status: user.status,
        deletedAt: user.deletedAt ?? null,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      },
    });
  } catch (error) {
    await session.abortTransaction();

    console.error("Signup error:", error);

    return res.status(500).json({
      error: {
        code: "SIGNUP_FAILED",
        message: "Unable to create account",
        details: {},
      },
    });
  } finally {
    await session.endSession();
  }
};

export const loginUser = async (req: Request, res: Response) => {
  const result = loginSchema.safeParse(req.body);

  if (!result.success) {
    return res.status(400).json({
      error: {
        code: "VALIDATION_ERROR",
        message: "Invalid request data",
        details: result.error.flatten(),
      },
    });
  }

  const { email, password } = result.data;
  const userAgent = req.get("user-agent");

  const user = await User.findOne({
    email,
    status: "active",
  });

  if (!user) {
    return res.status(401).json({
      error: {
        code: "INVALID_CREDENTIALS",
        message: "Invalid email or password",
        details: {},
      },
    });
  }

  const passwordValid = await argon2.verify(
    user.passwordHash,
    password
  );

  if (!passwordValid) {
    await AuthActivity.create({
      userId: user._id,
      event: "login_failed",
      success: false,
      ipAddress: req.ip ?? undefined,
      ...(userAgent ? { userAgent } : {}),
    });

    return res.status(401).json({
      error: {
        code: "INVALID_CREDENTIALS",
        message: "Invalid email or password",
        details: {},
      },
    });
  }

  const {
    accessToken,
    refreshToken,
    tokenId,
    familyId,
  } = generateTokens(user.id);

  const issuedAt = new Date();

  const expiresAt = new Date(
    issuedAt.getTime() + 7 * 24 * 60 * 60 * 1000
  );

  await Session.create({
    userId: user._id,
    tokenId,
    familyId,
    issuedAt,
    expiresAt,
    ...(userAgent ? { userAgent } : {}),
  });

  await AuthActivity.create({
    userId: user._id,
    event: "login_password",
    success: true,
    ipAddress: req.ip ?? undefined,
    ...(userAgent ? { userAgent } : {}),
  });

  return res.status(200).json({
    data: {
      accessToken,
      refreshToken,
    },
  });
};


export const logoutController = async (
  req: AuthenticatedRequest,
  res: Response,
) => {
  try {
      const userId = req.userId;  

      if (!userId) {
        return res.status(401).json({
          error: {
            code: "UNAUTHORIZED",
            message: "Authentication required",    
            details: {},
          },
        });
      }

      const { refreshToken } = req.body;

      if (!refreshToken) {
        return res.status(400).json({
          error: {
            code: "REFRESH_TOKEN_REQUIRED",
            message: "Refresh token is required",
            details: {},
          },
        });
      }

      const session = await Session.findOne({
        userId,
        revokedAt: null,
      });

      if (!session) {
        return res.status(400).json({
          error: {
            code: "SESSION_NOT_FOUND",
            message: "Active session not found",
            details: {},
          },
        });
      }

      session.revokedAt = new Date();

      await session.save();

      await redisClient.del(`user:profile:${userId}`);

      await AuthActivity.create({
        userId,
        event: "logout",
        success: true,
        ipAddress: req.ip ?? undefined,
        ...(req.get("user-agent")
        ? { userAgent: req.get("user-agent")}
        : {}),
      });

      return res.status(200).json({
        data: {
             message: "Logout successful",
        },
      });
  } catch (error) {
    console.error("Logout error:", error);

    return res.status(500).json({
      error: {
        code: "LOGOUT_FAILED",
        message: "Unable to logout",
        details: {},
      },
    });
  }
};