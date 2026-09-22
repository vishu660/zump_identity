import type { Response } from "express";
import { z } from "zod";
import User from "../models/user.model.js";
import type { AuthenticatedRequest } from "../middleware/auth.middleware.js";
import { createAvatarUploadUrl, deleteAvatarObject, getAvatarMetadata, MAX_AVATAR_SIZE, ALLOWED_CONTENT_TYPES } from "../services/avatar.service.js";
import { error } from "console";


export const presignAvatar = async (
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

       const { contentType, fileSize } = req.body;

       const result = await createAvatarUploadUrl (
          userId,
          contentType,
          Number(fileSize),
       );

       return res.status(200).json({
        data: result,
       });

    }catch (error) {
      if (error instanceof Error) {
        if (error.message === "INVALID_AVATAR_CONTENT_TYPE") {
            return res.status(400).json({
                error: {
                    code: "INVALID_AVATAR_CONTENT_TYPE",
                    message: "Unsupported avatar content type",
                    details: {},
                },
            });
        }

        if (error.message === "INVALID_AVATAR_SIZE") {
            return res.status(400).json({
                error: {
                    code: "INVALID_AVATAR_SIZE",
                    message: "Avatar file size is invalid",
                    details: {},
                },
            });
        }
      }

      return res.status(500).json({
        error: {
            code: "AVATAR_PRESIGN_FAILED",
            message: "Unable to create avatar upload URL",
            details: {},
        },
      });
    }
};

const confirmAvatarSchema = z.object({
    avatarKey: z.string().min(1),
});

export const confirmAvatar = async (
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

        const validation = confirmAvatarSchema.safeParse(req.body); 

        if (!validation.success) {
            return res.status(400).json({
                error: {
                    code: "INVALID_AVATAR_KEY",
                    message: "avatarKey is required",
                    details: {},
                },
            });
        }

        const { avatarKey } = validation.data;

        const expectedPrefix = `${userId}/`;

        if (!avatarKey.startsWith(expectedPrefix)) {
            return res.status(403).json({
                error: {
                    code: "INVALID_AVATAR_KEY",
                    message: "Avatar does not belong to this user",
                    details: {},
                },
            });
        }

        const user = await User.findById(userId);

        if (!user) {
            return res.status(404).json({
                error: {
                    code: "USER_NOT_FOUND",
                    message: "User not found",
                    details: {},
                },
            });
        }

        let metaData;

    try {
       metaData = await getAvatarMetadata(avatarKey);
    } catch {
        return res.status(400).json({
            error : {
                code: "AVATAR_NOT_FOUND",
                message: "Uploaded avatar was not found",
                details: {},
            },
        });
    }

    if (
        !metaData.contentType || !ALLOWED_CONTENT_TYPES.includes(metaData.contentType)
    ) {
        return res.status(400).json({
            error: {
                code: "INVALID_AVATAR_CONTENT_TYPE",
                message: "Uploaded avatar content type is not allowed",
                details: {},
            },
        });
    }

    if (
        !metaData.contentLength || metaData.contentLength <= 0 || metaData.contentLength > MAX_AVATAR_SIZE
    ) {
        return res.status(400).json({
            error: {
                code: "INVALID_AVATAR_SIZE",
                message: "Uploaded avatar size is invalid",
                details: {},
            },
        });
    }

    const oldAvatarKey = user.avatarKey;

    user.avatarKey = avatarKey;

    await user.save();

    if (oldAvatarKey && oldAvatarKey !== avatarKey) {
         await deleteAvatarObject(oldAvatarKey);
    }

    return res.status(200).json({
        data: {
            avatarKey: user.avatarKey,
        },
    });
       
    } catch {
        return res.status(500).json({
            error: {
                code: "AVATAR_CONFIRMATION_FAILED",
                message: "Unable to confirm avatar",
                details: {},
            },
        });
    }
};
