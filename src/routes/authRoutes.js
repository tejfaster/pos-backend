import { Router } from "express";

import {
  signup,
  login,
  getCurrentUser,
  logout,
  changePassword,
  requestPasswordReset,
  verifyPasswordResetOtp,
  confirmPasswordReset
} from "../controllers/authController.js";

import {
  requireAuth,
} from "../middleware/authMiddleware.js";

const router = Router();

router.post(
  "/signup",
  signup
);

router.post(
  "/login",
  login
);

router.get(
  "/me",
  requireAuth,
  getCurrentUser
);

router.post(
  "/logout",
  logout
);

router.post(
  "/change-password",
  requireAuth,
  changePassword
);

router.post(
  "/password-reset/request",
  requestPasswordReset
);

router.post(
    "/password-reset/verify", 
    verifyPasswordResetOtp
);

router.post(
    "/password-reset/confirm",
     confirmPasswordReset
    );

export default router;