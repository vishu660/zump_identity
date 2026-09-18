import { z } from "zod";
import redisClient from "../config/redis.js";



export const otpRequestSchema = z.object({
    phone: z.string().min(1),
    countryCode: z.string().regex(/^\+\d{1,3}$/),
});

export const otpVerifySchema = z.object({
    phone: z.string().min(1, "Phone is requires"),
    countryCode: z.string().regex(/^\+\d{1,3}$/, "Invaild country code"),
    otp: z.string().regex(/^\d{6}$/, "OTP must be digits"),
});