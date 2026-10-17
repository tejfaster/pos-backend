import crypto from "crypto";
import argon2 from "argon2";

import pool, { query } from "../config/database.js";
import { createSession } from "./sessionService.js";

function validateNewPassword(password) {
  if (!password) {
    const error = new Error(
      "New password is required."
    );

    error.code = "INVALID_NEW_PASSWORD";

    throw error;
  }

  if (password.length < 8) {
    const error = new Error(
      "Password must be at least 8 characters."
    );

    error.code = "INVALID_NEW_PASSWORD";

    throw error;
  }

  if (!/[A-Z]/.test(password)) {
    const error = new Error(
      "Password must contain an uppercase letter."
    );

    error.code = "INVALID_NEW_PASSWORD";

    throw error;
  }

  if (!/[a-z]/.test(password)) {
    const error = new Error(
      "Password must contain a lowercase letter."
    );

    error.code = "INVALID_NEW_PASSWORD";

    throw error;
  }

  if (!/[0-9]/.test(password)) {
    const error = new Error(
      "Password must contain a number."
    );

    error.code = "INVALID_NEW_PASSWORD";

    throw error;
  }

  if (!/[^A-Za-z0-9]/.test(password)) {
    const error = new Error(
      "Password must contain a special character."
    );

    error.code = "INVALID_NEW_PASSWORD";

    throw error;
  }
}

function validateBillPrefix(billPrefix) {
  if (
    typeof billPrefix !== "string" ||
    !/^[A-Z]{3}$/.test(billPrefix.trim().toUpperCase())
  ) {
    const error = new Error(
      "Bill prefix must contain exactly 3 uppercase letters."
    );

    error.code = "INVALID_BILL_PREFIX";

    throw error;
  }

  return billPrefix.trim().toUpperCase();
}

export async function signupUser({
  firstName,
  lastName,
  phone,
  email,
  password,
  billPrefix,
}) {
  const normalizedEmail =
    email.trim().toLowerCase();

  const normalizedPhone =
    phone.trim();

  const normalizedBillPrefix =
    validateBillPrefix(billPrefix);

  const existingEmail = await query(
    `
      SELECT id
      FROM users
      WHERE LOWER(email) = $1
      LIMIT 1
    `,
    [normalizedEmail]
  );

  if (existingEmail.rows.length > 0) {
    const error = new Error(
      "This email address is already registered."
    );

    error.code =
      "EMAIL_ALREADY_EXISTS";

    throw error;
  }

  const existingPhone = await query(
    `
      SELECT id
      FROM users
      WHERE phone = $1
      LIMIT 1
    `,
    [normalizedPhone]
  );

  if (existingPhone.rows.length > 0) {
    const error = new Error(
      "This phone number is already registered."
    );

    error.code =
      "PHONE_ALREADY_EXISTS";

    throw error;
  }

  const existingBillPrefix = await query(
    `
      SELECT id
      FROM users
      WHERE bill_prefix = $1
      LIMIT 1
    `,
    [normalizedBillPrefix]
  );

  if (existingBillPrefix.rows.length > 0) {
    const error = new Error(
      "This bill prefix is already in use."
    );

    error.code =
      "BILL_PREFIX_ALREADY_EXISTS";

    throw error;
  }

  validateNewPassword(password);

  const passwordHash =
    await argon2.hash(password);

  const result = await query(
    `
      INSERT INTO users (
        first_name,
        last_name,
        phone,
        email,
        password_hash,
        role,
        status,
        bill_prefix
      )
      VALUES (
        $1,
        $2,
        $3,
        $4,
        $5,
        'user',
        'active',
        $6
      )
      RETURNING
        id,
        first_name,
        last_name,
        phone,
        email,
        role,
        status,
        bill_prefix,
        created_at
    `,
    [
      firstName.trim(),
      lastName.trim(),
      normalizedPhone,
      normalizedEmail,
      passwordHash,
      normalizedBillPrefix,
    ]
  );

  return result.rows[0];
}

export async function loginUser({
  email,
  password,
}) {
  const normalizedEmail =
    email.trim().toLowerCase();

  const result = await query(
    `
      SELECT
        id,
        first_name,
        last_name,
        phone,
        email,
        password_hash,
        role,
        status,
        bill_prefix,
        created_at
      FROM users
      WHERE LOWER(email) = $1
      LIMIT 1
    `,
    [normalizedEmail]
  );

  if (result.rows.length === 0) {
    const error = new Error(
      "Invalid email or password."
    );

    error.code =
      "INVALID_CREDENTIALS";

    throw error;
  }

  const user = result.rows[0];

  if (user.status === "disabled") {
    const error = new Error(
      "Your account has been disabled. Please contact an administrator."
    );

    error.code =
      "ACCOUNT_DISABLED";

    throw error;
  }

  const passwordValid =
    await argon2.verify(
      user.password_hash,
      password
    );

  if (!passwordValid) {
    const error = new Error(
      "Invalid email or password."
    );

    error.code =
      "INVALID_CREDENTIALS";

    throw error;
  }

  const session =
    await createSession(user.id);

  return {
    user: {
      id: user.id,
      first_name: user.first_name,
      last_name: user.last_name,
      phone: user.phone,
      email: user.email,
      role: user.role,
      status: user.status,
      bill_prefix: user.bill_prefix,
      created_at: user.created_at,
    },
    session,
  };
}

export async function changeUserPassword({
  userId,
  currentPassword,
  newPassword,
}) {
  if (!currentPassword) {
    const error = new Error(
      "Current password is required."
    );

    error.code =
      "INVALID_CURRENT_PASSWORD";

    throw error;
  }

  validateNewPassword(newPassword);

  const result = await query(
    `
      SELECT password_hash
      FROM users
      WHERE id = $1
      LIMIT 1
    `,
    [userId]
  );

  if (result.rows.length === 0) {
    const error = new Error(
      "User account was not found."
    );

    error.code = "USER_NOT_FOUND";

    throw error;
  }

  const user = result.rows[0];

  const currentPasswordValid =
    await argon2.verify(
      user.password_hash,
      currentPassword
    );

  if (!currentPasswordValid) {
    const error = new Error(
      "Current password is incorrect."
    );

    error.code =
      "INVALID_CURRENT_PASSWORD";

    throw error;
  }

  if (currentPassword === newPassword) {
    const error = new Error(
      "New password must be different from your current password."
    );

    error.code = "SAME_PASSWORD";

    throw error;
  }

  const newPasswordHash =
    await argon2.hash(newPassword);

  await query(
    `
      UPDATE users
      SET password_hash = $1
      WHERE id = $2
    `,
    [newPasswordHash, userId]
  );
}

export async function findActiveUserByPhone(
  phone
) {
  if (
    typeof phone !== "string" ||
    !phone.trim()
  ) {
    return null;
  }

  const normalizedPhone =
    phone.trim();

  const result = await query(
    `
      SELECT
        id,
        first_name,
        last_name,
        phone,
        email,
        role,
        status
      FROM users
      WHERE phone = $1
        AND status = 'active'
      LIMIT 1
    `,
    [normalizedPhone]
  );

  if (result.rows.length === 0) {
    return null;
  }

  return result.rows[0];
}

export async function findActiveUserByEmail(
  email
) {
  if (
    typeof email !== "string" ||
    !email.trim()
  ) {
    return null;
  }

  const normalizedEmail =
    email.trim().toLowerCase();

  const result = await query(
    `
      SELECT
        id,
        first_name,
        last_name,
        email,
        status
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

export async function resetUserPassword({
  resetToken,
  newPassword,
}) {
  if (
    typeof resetToken !== "string" ||
    !resetToken.trim()
  ) {
    const error = new Error(
      "Invalid or expired password reset link."
    );

    error.code = "INVALID_RESET_TOKEN";

    throw error;
  }

  if (typeof newPassword !== "string") {
    const error = new Error(
      "Invalid password."
    );

    error.code = "INVALID_PASSWORD";

    throw error;
  }

  if (newPassword.length < 8) {
    const error = new Error(
      "Password must be at least 8 characters."
    );

    error.code = "INVALID_PASSWORD";

    throw error;
  }

  if (!/[A-Z]/.test(newPassword)) {
    const error = new Error(
      "Password must contain an uppercase letter."
    );

    error.code = "INVALID_PASSWORD";

    throw error;
  }

  if (!/[a-z]/.test(newPassword)) {
    const error = new Error(
      "Password must contain a lowercase letter."
    );

    error.code = "INVALID_PASSWORD";

    throw error;
  }

  if (!/[0-9]/.test(newPassword)) {
    const error = new Error(
      "Password must contain a number."
    );

    error.code = "INVALID_PASSWORD";

    throw error;
  }

  if (!/[^A-Za-z0-9]/.test(newPassword)) {
    const error = new Error(
      "Password must contain a special character."
    );

    error.code = "INVALID_PASSWORD";

    throw error;
  }

  const tokenHash = crypto
    .createHash("sha256")
    .update(resetToken.trim())
    .digest("hex");

  const passwordHash =
    await argon2.hash(newPassword);

  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const tokenResult =
      await client.query(
        `
          SELECT
            prt.id,
            prt.user_id,
            prt.expires_at,
            prt.used_at,
            u.status
          FROM password_reset_tokens prt
          INNER JOIN users u
            ON u.id = prt.user_id
          WHERE prt.token_hash = $1
          FOR UPDATE
        `,
        [tokenHash]
      );

    if (!tokenResult.rows.length) {
      const error = new Error(
        "Invalid or expired password reset link."
      );

      error.code =
        "INVALID_RESET_TOKEN";

      throw error;
    }

    const resetRecord =
      tokenResult.rows[0];

    if (resetRecord.used_at) {
      const error = new Error(
        "This password reset link has already been used."
      );

      error.code =
        "RESET_TOKEN_USED";

      throw error;
    }

    if (
      new Date(
        resetRecord.expires_at
      ).getTime() <= Date.now()
    ) {
      const error = new Error(
        "This password reset link has expired."
      );

      error.code =
        "RESET_TOKEN_EXPIRED";

      throw error;
    }

    if (
      resetRecord.status === "disabled"
    ) {
      const error = new Error(
        "Your account has been disabled. Please contact an administrator."
      );

      error.code =
        "ACCOUNT_DISABLED";

      throw error;
    }

    await client.query(
      `
        UPDATE users
        SET password_hash = $1
        WHERE id = $2
      `,
      [
        passwordHash,
        resetRecord.user_id,
      ]
    );

    await client.query(
      `
        UPDATE password_reset_tokens
        SET used_at = CURRENT_TIMESTAMP
        WHERE id = $1
      `,
      [resetRecord.id]
    );

    await client.query(
      `
        DELETE FROM sessions
        WHERE user_id = $1
      `,
      [resetRecord.user_id]
    );

    await client.query(
      `
        UPDATE email_otp_challenges
        SET used_at = CURRENT_TIMESTAMP
        WHERE user_id = $1
          AND used_at IS NULL
      `,
      [resetRecord.user_id]
    );

    await client.query("COMMIT");

    return {
      success: true,
    };
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}