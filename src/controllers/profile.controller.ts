import type { Response } from "express";
import User from "../models/user.model.js";
import redisClient from "../config/redis.js";
import { updateProfileSchema, replaceProfileSchema } from "../validators/profile.validator.js";
import type { AuthenticatedRequest } from "../middleware/auth.middleware.js";
import { createAvatarViewUrl } from "../services/avatar.service.js";

const PROFILE_CACHE_TTL = 300;

export const getMyProfile = async (
    req: AuthenticatedRequest,
    res: Response,
) => {

    try{
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

        const cacheKey = `user:profile:${userId}`;

        const cachedProfile = await redisClient.get(cacheKey);


        if (cachedProfile) {
            return res.status(200).json({
                data: JSON.parse(cachedProfile),
            });
        }

        const user = await User.findOne({
            _id: userId,
            status: "active",
        }).select("_id phone countryCode email name avatarKey address dateOfBirth status deletedAt createdAt updatedAt");

        if (!user) {
            return res.status(404).json({
                 error: {
                code: "USER_NOT_FOUND",
                message: "User not found",
                details: {},
                },
            });
        }

        let avatarUrl: string | null = null;

        if (user.avatarKey) {
            avatarUrl = await createAvatarViewUrl(user.avatarKey);
        }

        const profile = {
            id: user.id,
            phone: user.phone,
            countryCode: user.countryCode,
            email: user.email,
            name: user.name,
            avatarUrl,
            avatarKey: user.avatarKey ?? null,
            address: user.address ?? null,
            dateOfBirth: user.dateOfBirth,
            status: user.status,
            deletedAt: user.deletedAt ?? null,
            createdAt: user.createdAt,
            updatedAt: user.updatedAt,
        };

        await redisClient.set(
            cacheKey,
            JSON.stringify(profile),
            {
              EX: PROFILE_CACHE_TTL,
            }
        );

        return res.status(200).json({
            data: profile,
        });

    } catch (error){
         console.error("Get profile error:", error);
         
          return res.status(500).json({
            error: {
                    code: "PROFILE_FETCH_FAILED",
                    message: "Unable to fetch profile",
                    details: {},
                },
             });
    }

};

export const getPublicProfile = async (
    req: AuthenticatedRequest,
    res: Response,
) => {
    try {
        const userId = req.params.id;

        const user = await User.findOne({
            _id: userId,
            status: "active",
        }).select(
            "_id name avatarKey status createdAt"
        );

        if (!user) {
            return res.status(404).json({
                error: {
                    code: "USER_NOT_FOUND",
                    message: "User not found",
                    details: {},
                },
            });
        }

        return res.status(200).json({
            data: {
                id: user.id,
                name: user.name,
                avatarKey: user.avatarKey ?? null,
                status: user.status,
                createdAt: user.createdAt,
            },
        });

    } catch (error) {
        return res.status(500).json({
            error: {
                code: "PROFILE_FETCH_FAILED",
                message: "Unable to fetch profile",
                details: {},
            },
        });
    }
};

export const updateMyProfile = async (
    req: AuthenticatedRequest,
    res: Response,
) => {
    try{
        const userId = req.userId;

        if (!userId) {
            return res.status(401).json({
                error:{
                    code: "UNAUTHORIZED",
                    message: "Authentication required",
                    details: {},
                },
            });
        }

        const validation = updateProfileSchema.safeParse(req.body);

        if (!validation.success) {
            return res.status(400).json({
                error: {
                    code: "VALIDATION_ERROR",
                    message: "Invalid profile data",
                    details: validation.error.flatten(),
                },
            });
        }

        const updates = validation.data;

        const user = await User.findOne({
            _id: userId,
            status: "active",
        });

        if (!user) {
            return res.status(404).json({
                error: {
                    code: "USER_NOT_FOUND",
                    message: "User not found",
                    details: {},
                },
            });
        }

        if (updates.name !== undefined) {
            user.name = updates.name;
        }

        if (updates.address !== undefined) {
            user.address = updates.address;
        }

        if (updates.dateOfBirth !== undefined) {
            user.dateOfBirth = new Date(updates.dateOfBirth);
        }

        if (updates.avatarKey !== undefined) {
            user.avatarKey = updates.avatarKey;
        }

        await user.save();

        await redisClient.del(`user:profile:${userId}`);

        return res.status(200).json({
            data: {
                id: user.id,
                phone: user.phone,
                countryCode: user.countryCode,
                email: user.email,
                name: user.name,
                address: user.address ?? null,
                dateOfBirth: user.dateOfBirth ?? null,
                status: user.status,
                deletedAt: user.deletedAt ?? null,
                createdAt: user.createdAt,
                updatedAt: user.updatedAt,
            },
        });
    } catch (error){
           console.error("Update profile error:", error);

           return res.status(500).json({
            error: {
                code: "PROFILE_UPDATE_FAILED",
                message: "Unable to update profile",
                details: {},
            },
           });
    }
};

export const replaceMyProfile = async (
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

        const validation = replaceProfileSchema.safeParse(req.body);

        if (!validation.success) {
            return res.status(400).json({
                error: {
                    code: "VALIDATION_ERROR",
                    message: "Invalid profile data",
                    details: validation.error.flatten(),
                },
            });
        }

        const user = await User.findOne({
            _id: userId,
            status: "active",
        });

        if (!user) {
            return res.status(404).json({
                error: {
                    code: "USER_NOT_FOUND",
                    message: "User not found",
                    details: {},
                },
            });
        }

        const updates = validation.data;

        if (updates.name !== undefined) {
            user.name = updates.name;
        }

        user.address = updates.address ?? undefined;

        user.dateOfBirth = updates.dateOfBirth ? new Date(updates.dateOfBirth) : undefined;

        user.avatarKey = updates.avatarKey ?? undefined;

        await user.save();

        await redisClient.del(`user:profile:${userId}`);

        return res.status(200).json({
           data: {
            id: user.id,
            phone: user.phone,
            countryCode: user.countryCode,
            email: user.email,
            name: user.name,
            avatarKey: user.avatarKey ?? null,
            address: user.address ?? null,
            dateOfBirth: user.dateOfBirth ?? null,
            status: user.status,
            deletedAt: user.deletedAt ?? null,
            createdAt: user.createdAt,
            updatedAt: user.updatedAt,
           },
        });
    } catch (error){
        console.error("Replace profile error:", error);

        return res.status(500).json({
            error: {
                code: "PROFILE_REPLACE_FAILED",
                message: "Unable to replace profile",
                details: {},
            },
        });
    }
};
