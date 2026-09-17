import express from "express";
import userRoutes from "./routes/user.routes.js";

const app = express();

app.use(express.json());

app.get("/api/v1/healthz", (req, res) => {
  return res.status(200).json({
    data: {
      status: "ok",
    },
  });
});

app.use("/api/v1", userRoutes);

export default app;
