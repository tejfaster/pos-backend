import { getUserFromSession } from "../services/sessionService.js";

export async function requireAuth(req, res, next) {
  try {
    const sessionToken = req.cookies.session;

    const user = await getUserFromSession(
      sessionToken
    );

    if (!user) {
      return res.status(401).json({
        success: false,
        code: "UNAUTHORIZED",
        message: "Authentication required.",
      });
    }

    if (user.status === "disabled") {
      return res.status(403).json({
        success: false,
        code: "ACCOUNT_DISABLED",
        message:
          "Your account has been disabled. Please contact an administrator.",
      });
    }

    req.user = user;

    next();
  } catch (error) {
    console.error(
      "Authentication middleware error:",
      error
    );

    return res.status(500).json({
      success: false,
      code: "UNKNOWN_ERROR",
      message:
        "Something went wrong. Please try again.",
    });
  }
}

export function requireAdmin(req, res, next) {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      code: "UNAUTHORIZED",
      message: "Authentication required.",
    });
  }

  if (req.user.role !== "admin") {
    return res.status(403).json({
      success: false,
      code: "FORBIDDEN",
      message: "Admin access required.",
    });
  }

  next();
}