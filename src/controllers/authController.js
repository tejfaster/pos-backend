import {
  signupUser,
  loginUser,
  changeUserPassword,
  findActiveUserByEmail,
  resetUserPassword,
} from "../services/authService.js";

import {
  createSession,
  deleteSession,
  deleteOtherSessions,
} from "../services/sessionService.js";

import {
  createOtpChallenge,
  verifyOtpChallenge,
  invalidateOtpChallenge,
} from "../services/otpService.js";

import {
  sendPasswordResetOtpEmail,
} from "../services/emailService.js";

export async function signup(req, res) {
  try {
    const {
      firstName,
      lastName,
      phone,
      email,
      password,
    } = req.body;

    const user = await signupUser({
      firstName,
      lastName,
      phone,
      email,
      password,
    });

    return res.status(201).json({
      success: true,
      message:
        "Account created successfully.",
      user,
    });
  } catch (error) {
    console.error(
      "Signup error:",
      error
    );

    if (
      error.code ===
      "EMAIL_ALREADY_EXISTS"
    ) {
      return res.status(409).json({
        success: false,
        code: error.code,
        message: error.message,
      });
    }

    if (
      error.code ===
      "PHONE_ALREADY_EXISTS"
    ) {
      return res.status(409).json({
        success: false,
        code: error.code,
        message: error.message,
      });
    }

    if (
      error.code ===
      "INVALID_NEW_PASSWORD"
    ) {
      return res.status(400).json({
        success: false,
        code: error.code,
        message: error.message,
      });
    }

    return res.status(500).json({
      success: false,
      code: "UNKNOWN_ERROR",
      message:
        "Something went wrong. Please try again.",
    });
  }
}

export async function login(req, res) {
  try {
    const {
      email,
      password,
    } = req.body;

    const result = await loginUser({
      email,
      password,
    });

    res.cookie(
      "session",
      result.session.token,
      {
        httpOnly: true,

        secure:
          process.env.NODE_ENV ===
          "production",

        sameSite:
          process.env.NODE_ENV ===
          "production"
            ? "none"
            : "lax",

        expires:
          result.session.expiresAt,

        path: "/",
      }
    );

    return res.json({
      success: true,
      message: "Login successful.",
      user: result.user,
    });
  } catch (error) {
    console.error(
      "Login error:",
      error
    );

    if (
      error.code ===
      "INVALID_CREDENTIALS"
    ) {
      return res.status(401).json({
        success: false,
        code: error.code,
        message: error.message,
      });
    }

    if (
      error.code ===
      "ACCOUNT_DISABLED"
    ) {
      return res.status(403).json({
        success: false,
        code: error.code,
        message: error.message,
      });
    }

    return res.status(500).json({
      success: false,
      code: "UNKNOWN_ERROR",
      message:
        "Something went wrong. Please try again.",
    });
  }
}

export async function getCurrentUser(
  req,
  res
) {
  return res.json({
    success: true,
    user: req.user,
  });
}

export async function logout(req, res) {
  try {
    const sessionToken =
      req.cookies.session;

    await deleteSession(
      sessionToken
    );

    res.clearCookie("session", {
      httpOnly: true,

      secure:
        process.env.NODE_ENV ===
        "production",

      sameSite:
        process.env.NODE_ENV ===
        "production"
          ? "none"
          : "lax",

      path: "/",
    });

    return res.json({
      success: true,
      message:
        "Logout successful.",
    });
  } catch (error) {
    console.error(
      "Logout error:",
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

export async function changePassword(
  req,
  res
) {
  try {
    const {
      currentPassword,
      newPassword,
    } = req.body;

    if (
      !currentPassword ||
      !newPassword
    ) {
      return res.status(400).json({
        success: false,
        code: "INVALID_REQUEST",
        message:
          "Current password and new password are required.",
      });
    }

    await changeUserPassword({
      userId: req.user.id,
      currentPassword,
      newPassword,
    });

    /*
     * Keep the current session active
     * and invalidate every other session.
     */
    const currentSessionToken =
      req.cookies.session;

    await deleteOtherSessions(
      req.user.id,
      currentSessionToken
    );

    return res.json({
      success: true,
      message:
        "Password changed successfully.",
    });
  } catch (error) {
    console.error(
      "Change password error:",
      error
    );

    if (
      error.code ===
      "INVALID_CURRENT_PASSWORD"
    ) {
      return res.status(401).json({
        success: false,
        code: error.code,
        message: error.message,
      });
    }

    if (
      error.code ===
      "INVALID_NEW_PASSWORD"
    ) {
      return res.status(400).json({
        success: false,
        code: error.code,
        message: error.message,
      });
    }

    if (
      error.code === "SAME_PASSWORD"
    ) {
      return res.status(400).json({
        success: false,
        code: error.code,
        message: error.message,
      });
    }

    if (
      error.code === "USER_NOT_FOUND"
    ) {
      return res.status(404).json({
        success: false,
        code: error.code,
        message: error.message,
      });
    }

    return res.status(500).json({
      success: false,
      code: "UNKNOWN_ERROR",
      message:
        "Something went wrong. Please try again.",
    });
  }
}

export async function requestPasswordReset(
  req,
  res
) {
  /*
   * Always use the same response for both
   * registered and unregistered email addresses.
   */
  const genericResponse = {
    success: true,
    message:
      "If an account exists for this email address, a verification code has been sent.",
  };

  try {
    const { email } = req.body;

    if (
      typeof email !== "string" ||
      !email.trim()
    ) {
      return res.json(
        genericResponse
      );
    }

    const user =
      await findActiveUserByEmail(
        email
      );

    /*
     * Do not reveal whether the email
     * belongs to an account.
     */
    if (!user) {
      return res.json(
        genericResponse
      );
    }

    const {
      challenge,
      otp,
    } =
      await createOtpChallenge({
        userId: user.id,
        email: user.email,
        purpose:
          "PASSWORD_RESET",
      });

    try {
      await sendPasswordResetOtpEmail({
        email: user.email,
        firstName: user.first_name,
        otp,
      });
    } catch (emailError) {
      /*
       * Email delivery failed.
       * Immediately invalidate the challenge.
       */
      await invalidateOtpChallenge(
        challenge.id
      );

      throw emailError;
    }

    return res.json(
      genericResponse
    );
  } catch (error) {
    console.error(
      "Password reset request error:",
      error
    );

    /*
     * Rate-limit errors are safe to expose.
     */
    if (
      error.code === "OTP_COOLDOWN"
    ) {
      return res.status(429).json({
        success: false,
        code: error.code,
        message:
          "Please wait before requesting another verification code.",
        retryAfterSeconds:
          error.retryAfterSeconds,
      });
    }

    if (
      error.code ===
      "OTP_REQUEST_LIMIT"
    ) {
      return res.status(429).json({
        success: false,
        code: error.code,
        message:
          "Too many verification code requests. Please try again later.",
      });
    }

    if (
      error.code ===
        "EMAIL_DELIVERY_ERROR" ||
      error.code ===
        "EMAIL_SERVICE_ERROR"
    ) {
      return res.status(500).json({
        success: false,
        code:
          "EMAIL_SERVICE_ERROR",
        message:
          "Unable to send the verification code. Please try again later.",
      });
    }

    return res.status(500).json({
      success: false,
      code: "UNKNOWN_ERROR",
      message:
        "Something went wrong. Please try again.",
    });
  }
}

export async function verifyPasswordResetOtp(req, res) {
  try {
    const { email, otp } = req.body;

    if (
      typeof email !== "string" ||
      !email.trim() ||
      typeof otp !== "string" ||
      !otp.trim()
    ) {
      return res.status(400).json({
        success: false,
        code: "INVALID_OTP",
        message: "Invalid verification code.",
      });
    }

    const result = await verifyOtpChallenge({
      email,
      otp: otp.trim(),
      purpose: "PASSWORD_RESET",
    });

    return res.json({
      success: true,
      message: "Verification code verified successfully.",
      resetToken: result.resetToken,
      expiresAt: result.expiresAt,
    });
  } catch (error) {
    console.error("Password reset OTP verification error:", error);

    if (
      error.code === "INVALID_OTP" ||
      error.code === "OTP_EXPIRED" ||
      error.code === "OTP_ALREADY_VERIFIED" ||
      error.code === "OTP_MAX_ATTEMPTS"
    ) {
      return res.status(400).json({
        success: false,
        code: error.code,
        message: error.message,
      });
    }

    return res.status(500).json({
      success: false,
      code: "UNKNOWN_ERROR",
      message: "Something went wrong. Please try again.",
    });
  }
}

export async function confirmPasswordReset(req, res) {
  try {
    const { resetToken, newPassword } = req.body;

    if (
      typeof resetToken !== "string" ||
      !resetToken.trim() ||
      typeof newPassword !== "string"
    ) {
      return res.status(400).json({
        success: false,
        code: "INVALID_REQUEST",
        message: "Invalid password reset request.",
      });
    }

    await resetUserPassword({
      resetToken,
      newPassword,
    });

    return res.json({
      success: true,
      message: "Your password has been reset successfully.",
    });
  } catch (error) {
    console.error("Password reset confirmation error:", error);

    if (
      error.code === "INVALID_RESET_TOKEN" ||
      error.code === "RESET_TOKEN_USED" ||
      error.code === "RESET_TOKEN_EXPIRED"
    ) {
      return res.status(400).json({
        success: false,
        code: error.code,
        message: error.message,
      });
    }

    if (error.code === "INVALID_PASSWORD") {
      return res.status(400).json({
        success: false,
        code: error.code,
        message: error.message,
      });
    }

    if (error.code === "ACCOUNT_DISABLED") {
      return res.status(403).json({
        success: false,
        code: error.code,
        message: error.message,
      });
    }

    return res.status(500).json({
      success: false,
      code: "UNKNOWN_ERROR",
      message: "Something went wrong. Please try again.",
    });
  }
}