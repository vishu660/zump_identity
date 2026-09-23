import express from "express";

import userRoutes from "./routes/user.routes.js";
import { isDatabaseReady } from "./config/database.js";
import { isRedisReady } from "./config/redis.js";

const app = express();

app.use(express.json());


app.get("/api/v1/healthz", (req, res) => {
  return res.status(200).json({
    data: {
      status: "ok",
    },
  });
});


app.get("/api/v1/readyz", (req, res) => {
  const mongoReady = isDatabaseReady();
  const redisReady = isRedisReady();

  if (!mongoReady || !redisReady) {
    return res.status(503).json({
      error: {
        code: "SERVICE_NOT_READY",
        message: "Service dependencies are not ready",
        details: {
          mongodb: mongoReady,
          redis: redisReady,
        },
      },
    });
  }

  return res.status(200).json({
    data: {
      status: "ready",
      mongodb: true,
      redis: true,
    },
  });
});

app.use("/api/v1", userRoutes);

export default app;