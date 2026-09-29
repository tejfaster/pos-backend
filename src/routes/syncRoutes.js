import express from "express";

import { syncData } from "../controllers/syncController.js";

import { requireAuth } from "../middleware/authMiddleware.js";

const router = express.Router();

router.get("/", requireAuth, syncData);

export default router;