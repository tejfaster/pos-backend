import express from "express";

import {
  listCategories,
  getCategory,
  addCategory,
  editCategory,
  removeCategory,
} from "../controllers/categoryController.js";

import {
  requireAuth,
  requireAdmin,
} from "../middleware/authMiddleware.js";

const router = express.Router();

router.get("/", requireAuth, listCategories);
router.get("/:id", requireAuth, getCategory);

router.post("/", requireAuth, requireAdmin, addCategory);
router.patch("/:id", requireAuth, requireAdmin, editCategory);
router.delete("/:id", requireAuth, requireAdmin, removeCategory);

export default router;
