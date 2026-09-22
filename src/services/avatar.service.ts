import crypto from "crypto";
import { PutObjectCommand, DeleteObjectCommand, HeadObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import s3Client, { avatarBucket } from "../config/s3.js";


export const MAX_AVATAR_SIZE = Number (
    process.env.S3_MAX_AVATAR_SIZE || 5 * 1024 * 1024
);

const PRESIGNED_URL_EXPIRES = Number (
    process.env.S3_PRESIGNED_URL_EXPIRES || 600
);

export const ALLOWED_CONTENT_TYPES = [
    "image/jpeg",
    "image/png",
    "image/webp",
];

export const createAvatarUploadUrl = async (
    userId: string,
    contentType: string,
    fileSize: number,
) => {
    if (!ALLOWED_CONTENT_TYPES.includes(contentType)) {
        throw new Error("INVALID_AVATAR_CONTENT_TYPE");
    }

    if (fileSize <= 0 || fileSize > MAX_AVATAR_SIZE) {
        throw new Error("INVALID_AVATAR_SIZE");
    }

    const extension = contentType.split("/")[1];

    const objectKey = `${userId}/${crypto.randomUUID()}.${extension}`;

    const command = new PutObjectCommand({
        Bucket: avatarBucket,
        Key: objectKey,
        ContentType: contentType,
    });

    const uploadUrl = await getSignedUrl(
        s3Client,
        command,
        {
            expiresIn: PRESIGNED_URL_EXPIRES,
        }
    );

    return {
        uploadUrl,
        avatarKey: objectKey,
        expiresIn: PRESIGNED_URL_EXPIRES,
    };
        
};

export const getAvatarMetadata = async (
    avatarKey: string,
) => {
    const command = new HeadObjectCommand({
        Bucket: avatarBucket,
        Key: avatarKey,
    });

    const result = await s3Client.send(command);

    return {
        contentType: result.ContentType,
        contentLength: result.ContentLength,
    };
};

export const deleteAvatarObject = async (
    avatarKey: string,
) => {
     const command = new DeleteObjectCommand({
        Bucket: avatarBucket,
        Key: avatarKey,
     });

     await s3Client.send(command);
     
};