import { email, z } from "zod";

export const createUserSchema = z.object({
    phone: z.string().min(10),
    countryCode: z.string().min(1),
    email: z.string().email(),
    password: z.string().min(8),
    name: z.string().min(5),
    address: z.string().min(1),
    dateOfBirth: z.string().min(1),
});
