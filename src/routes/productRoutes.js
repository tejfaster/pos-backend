import express from "express";

import {
  listProducts,
  getProduct,
  addProduct,
  editProduct,
  removeProduct,
} from "../controllers/productController.js";

import {
  requireAuth,
  requireAdmin,
} from "../middleware/authMiddleware.js";

const router = express.Router();

// Read products
router.get("/", requireAuth, listProducts);
router.get("/:id", requireAuth, getProduct);

// Create / update / deactivate products
router.post("/", requireAuth, requireAdmin, addProduct);
router.patch("/:id", requireAuth, requireAdmin, editProduct);
router.delete("/:id", requireAuth, requireAdmin, removeProduct);

export default router;