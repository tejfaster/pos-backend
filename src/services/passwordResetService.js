import crypto from "crypto";

import { query } from "../config/database.js";
import {
  changeUserPassword,
} from "./authService.js";

const RESET_TOKEN_DURATION_MINUTES =
  Number(
    process.env.PASSWORD_RESET_TOKEN_MINUTES ||
      30
  );

function hashToken(token) {
  return crypto
    .createHash("sha256")
    .update(token)
    .digest("hex");
}

function createRawToken() {
  return crypto.randomBytes(32).toString("hex");
}

export async function createPasswordResetToken(
  userId
) {
  const rawToken = createRawToken();

  const tokenHash =
    hashToken(rawToken);

  const expiresAt = new Date(
    Date.now() +
      RESET_TOKEN_DURATION_MINUTES *
        60 *
        1000
  );

  /*
   * Only one active reset token should
   * remain for a user.
   */
  await query(
    `
      UPDATE password_reset_tokens
      SET used_at = CURRENT_TIMESTAMP
      WHERE user_id = $1
        AND used_at IS NULL
    `,
    [userId]
  );

  await query(
    `
      INSERT INTO password_reset_tokens (
        user_id,
        token_hash,
        expires_at
      )
      VALUES ($1, $2, $3)
    `,
    [
      userId,
      tokenHash,
      expiresAt,
    ]
  );

  return {
    rawToken,
    expiresAt,
  };
}

export async function resetPasswordWithToken({
  token,
  newPassword,
}) {
  if (!token) {
    const error = new Error(
      "Invalid or expired password reset link."
    );

    error.code =
      "INVALID_RESET_TOKEN";

    throw error;
  }

  const tokenHash =
    hashToken(token);

  const result = await query(
    `
      SELECT
        id,
        user_id,
        expires_at,
        used_at
      FROM password_reset_tokens
      WHERE token_hash = $1
      LIMIT 1
    `,
    [tokenHash]
  );

  if (result.rows.length === 0) {
    const error = new Error(
      "Invalid or expired password reset link."
    );

    error.code =
      "INVALID_RESET_TOKEN";

    throw error;
  }

  const resetToken = result.rows[0];

  if (resetToken.used_at) {
    const error = new Error(
      "Invalid or expired password reset link."
    );

    error.code =
      "INVALID_RESET_TOKEN";

    throw error;
  }

  if (
    new Date(resetToken.expires_at) <=
    new Date()
  ) {
    const error = new Error(
      "Invalid or expired password reset link."
    );

    error.code =
      "INVALID_RESET_TOKEN";

    throw error;
  }

  /*
   * We use the existing password-changing
   * service so the same password policy and
   * Argon2 hashing rules are used.
   *
   * We pass a special internal flow here.
   */
  await updatePasswordFromReset({
    userId: resetToken.user_id,
    newPassword,
  });

  await query(
    `
      UPDATE password_reset_tokens
      SET used_at = CURRENT_TIMESTAMP
      WHERE id = $1
        AND used_at IS NULL
    `,
    [resetToken.id]
  );
}

async function updatePasswordFromReset({
  userId,
  newPassword,
}) {
  /*
   * Importing and reusing the complete
   * change-password flow would require the
   * user's current password, which a reset
   * flow intentionally does not have.
   *
   * The password policy is therefore
   * reproduced here temporarily.
   */
  if (!newPassword) {
    const error = new Error(
      "New password is required."
    );

    error.code =
      "INVALID_NEW_PASSWORD";

    throw error;
  }

  if (newPassword.length < 8) {
    const error = new Error(
      "Password must be at least 8 characters."
    );

    error.code =
      "INVALID_NEW_PASSWORD";

    throw error;
  }

  if (!/[A-Z]/.test(newPassword)) {
    const error = new Error(
      "Password must contain an uppercase letter."
    );

    error.code =
      "INVALID_NEW_PASSWORD";

    throw error;
  }

  if (!/[a-z]/.test(newPassword)) {
    const error = new Error(
      "Password must contain a lowercase letter."
    );

    error.code =
      "INVALID_NEW_PASSWORD";

    throw error;
  }

  if (!/[0-9]/.test(newPassword)) {
    const error = new Error(
      "Password must contain a number."
    );

    error.code =
      "INVALID_NEW_PASSWORD";

    throw error;
  }

  if (!/[^A-Za-z0-9]/.test(newPassword)) {
    const error = new Error(
      "Password must contain a special character."
    );

    error.code =
      "INVALID_NEW_PASSWORD";

    throw error;
  }

  /*
   * Use Argon2 through a local import so
   * the new password is hashed exactly like
   * normal account passwords.
   */
  const argon2 =
    await import("argon2");

  const passwordHash =
    await argon2.default.hash(
      newPassword
    );

  await query(
    `
      UPDATE users
      SET password_hash = $1
      WHERE id = $2
    `,
    [
      passwordHash,
      userId,
    ]
  );

  /*
   * A password reset should invalidate
   * every existing session.
   */
  await query(
    `
      DELETE FROM sessions
      WHERE user_id = $1
    `,
    [userId]
  );
}

export async function findUserByEmail(
  email
) {
  const normalizedEmail =
    email.trim().toLowerCase();

  const result = await query(
    `
      SELECT
        id,
        first_name,
        email
      FROM users
      WHERE LOWER(email) = $1
        AND status = 'active'
      LIMIT 1
    `,
    [normalizedEmail]
  );

  if (result.rows.length === 0) {
    return null;
  }

  return result.rows[0];
}