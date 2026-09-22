import { S3Client, HeadBucketCommand, CreateBucketCommand } from "@aws-sdk/client-s3";

const s3Client = new S3Client({
    endpoint:process.env.S3_ENDPOINT!,
    region: process.env.S3_REGION!,
    credentials: {
        accessKeyId: process.env.S3_ACCESS_KEY!,
        secretAccessKey: process.env.S3_SECRET_KEY!,
    },
    forcePathStyle: true,
});

export const avatarBucket = process.env.S3_BUCKET!;

export const ensureAvatarBucket = async () => {
    try{
        await s3Client.send(
            new HeadBucketCommand({
                Bucket: avatarBucket,
            })
        );

        console.log("Avatar bucket exists");
    } catch {
        await s3Client.send(
            new CreateBucketCommand({
                Bucket: avatarBucket,
            })
        );

        console.log("Avatar bucket created");
    }
};

export default s3Client;
