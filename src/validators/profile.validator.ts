import { z } from "zod";

export const updateProfileSchema = z.object({
    name: z.string().min(2).optional(),
    address: z.string().min(1).optional(),
    dateOfBirth: z.string().min(1).optional(),
    avatarKey: z.string().min(1).optional(),
});

export const replaceProfileSchema = z.object({
    name: z.string().min(2).optional(),
    address: z.string().min(1).optional(),
    dateOfBirth: z.string().min(1).optional(),
    avatarKey: z.string().min(1).optional(),
});