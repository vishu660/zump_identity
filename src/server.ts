import "dotenv/config";
import app from "./app.js";
import { connectDatabase } from "./config/database.js";
import { connectRedis } from "./config/redis.js";
import { ensureAvatarBucket } from "./config/s3.js";

const PORT = 3000;

const startServer = async () => {
  await connectDatabase();
  await connectRedis();
  await ensureAvatarBucket();

  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
};

startServer();