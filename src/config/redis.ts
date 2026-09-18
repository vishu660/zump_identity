import { createClient } from "redis";

const redisClient = createClient ({
    url: process.env.REDIS_URL || "redis://127.0.0.1:6379",
});

redisClient.on("error", (error) => {
    console.error("Redis Client Error:", error);
});

export const connectRedis = async () => {
     await redisClient.connect();
     console.log("Redis Connected");
};

export default redisClient;
