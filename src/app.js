import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import cookieParser from "cookie-parser";

import { query } from "./config/database.js";
import authRoutes from "./routes/authRoutes.js";
import productRoutes from "./routes/productRoutes.js";
import categoryRoutes from "./routes/categoryRoutes.js";
import unitRoutes from "./routes/unitRoutes.js";


dotenv.config();

const app = express();

const PORT = process.env.PORT || 5001;

app.use(
  cors({
    origin: process.env.FRONTEND_URL,
    credentials: true,
  })
);

app.use(express.json());
app.use(cookieParser());

app.use("/api/auth", authRoutes);
app.use("/api/products", productRoutes);
app.use("/api/categories", categoryRoutes);
app.use("/api/units", unitRoutes);

app.get("/api/health", async (req, res) => {
  try {
    await query("SELECT 1");

    res.json({
      success: true,
      message: "POS Billing API is running",
      database: "connected",
    });
  } catch (error) {
    console.error("Database health check failed:", error);

    res.status(500).json({
      success: false,
      message: "Database connection failed",
    });
  }
});

app.listen(PORT, () => {
  console.log(`POS Billing API running on port ${PORT}`);
});