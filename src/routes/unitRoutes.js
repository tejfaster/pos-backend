import express from "express";

import {
  listUnits,
  getUnit,
  addUnit,
  editUnit,
  removeUnit,
} from "../controllers/unitController.js";

import {
  requireAuth,
  requireAdmin,
} from "../middleware/authMiddleware.js";

const router = express.Router();

router.get("/", requireAuth, listUnits);
router.get("/:id", requireAuth, getUnit);

router.post("/", requireAuth, requireAdmin, addUnit);
router.patch("/:id", requireAuth, requireAdmin, editUnit);
router.delete("/:id", requireAuth, requireAdmin, removeUnit);

export default router;