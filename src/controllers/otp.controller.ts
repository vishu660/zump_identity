import type { Request, Response } from "express";

import { otpRequestSchema, otpVerifySchema } from "../validators/otp.validator.js";
import { requestOtp, verifyOtp } from "../services/otp.service.js";


export const requestOtpController = async (
  req: Request,
  res: Response
) => {
  const result = otpRequestSchema.safeParse(req.body);

  if (!result.success) {
    return res.status(400).json({
      error: {
        code: "VALIDATION_ERROR",
        message: "Invalid request data",
        details: result.error.flatten(),
      },
    });
  }

  const { phone, countryCode } = result.data;

  try {
    const data = await requestOtp(phone, countryCode);

    return res.status(200).json({
      data,
    });
  } catch (error) {
    console.error("OTP ERROR:", error);

    if (
      error instanceof Error &&
      error.message === "OTP_COOLDOWN"
    ) {
      return res.status(429).json({
        error: {
          code: "OTP_COOLDOWN",
          message: "Please wait before requesting another OTP",
          details: {},
        },
      });
    }

    return res.status(500).json({
      error: {
        code: "OTP_REQUEST_FAILED",
        message: "Unable to request OTP",
        details: {},
      },
    });
  }
};


export const verifyOtpController = async (
  req: Request,
  res: Response
) => {
  const result = otpVerifySchema.safeParse(req.body);

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
    otp,
  } = result.data;

  try {
    const data = await verifyOtp(
      phone,
      countryCode,
      otp,
      req.ip ?? undefined,
      req.get("user-agent") ?? undefined
    );

    return res.status(200).json({
      data,
    });
  } catch (error) {
    if (
      error instanceof Error &&
      error.message === "OTP_MAX_ATTEMPTS"
    ) {
      return res.status(401).json({
        error: {
          code: "OTP_MAX_ATTEMPTS",
          message: "OTP verification attempts exceeded",
          details: {},
        },
      });
    }

    if (
      error instanceof Error &&
      (
        error.message === "OTP_INVALID" ||
        error.message === "OTP_INVALID_OR_EXPIRED"
      )
    ) {
      return res.status(401).json({
        error: {
          code: "INVALID_OTP",
          message: "Invalid or expired OTP",
          details: {},
        },
      });
    }

    if (
      error instanceof Error &&
      error.message === "USER_NOT_FOUND"
    ) {
      return res.status(404).json({
        error: {
          code: "USER_NOT_FOUND",
          message: "User not found",
          details: {},
        },
      });
    }

    console.error("OTP verification error:", error);

    return res.status(500).json({
      error: {
        code: "OTP_VERIFICATION_FAILED",
        message: "Unable to verify OTP",
        details: {},
      },
    });
  }
};