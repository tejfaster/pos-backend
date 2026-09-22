import crypto from "crypto";

import { query } from "../config/database.js";

function hashToken(token) {
  return crypto
    .createHash("sha256")
    .update(token)
    .digest("hex");
}

export async function createSession(userId) {
  const token = crypto.randomBytes(32).toString("hex");

  const tokenHash = hashToken(token);

  const durationDays = Number(
    process.env.SESSION_DURATION_DAYS || 7
  );

  const expiresAt = new Date();

  expiresAt.setDate(
    expiresAt.getDate() + durationDays
  );

  await query(
    `
      INSERT INTO sessions (
        user_id,
        token_hash,
        expires_at
      )
      VALUES ($1, $2, $3)
    `,
    [userId, tokenHash, expiresAt]
  );

  return {
    token,
    expiresAt,
  };
}

export async function getUserFromSession(token) {
  if (!token) {
    return null;
  }

  const tokenHash = hashToken(token);

  const result = await query(
    `
      SELECT
        u.id,
        u.first_name,
        u.last_name,
        u.phone,
        u.email,
        u.role,
        u.status,
        u.created_at
      FROM sessions s
      INNER JOIN users u
        ON u.id = s.user_id
      WHERE s.token_hash = $1
        AND s.expires_at > CURRENT_TIMESTAMP
      LIMIT 1
    `,
    [tokenHash]
  );

  if (result.rows.length === 0) {
    return null;
  }

  return result.rows[0];
}

export async function deleteSession(token) {
  if (!token) {
    return;
  }

  const tokenHash = hashToken(token);

  await query(
    `
      DELETE FROM sessions
      WHERE token_hash = $1
    `,
    [tokenHash]
  );
} 

export async function deleteOtherSessions(
  userId,
  currentToken
) {
  if (!userId) {
    return;
  }

  if (!currentToken) {
    await query(
      `
        DELETE FROM sessions
        WHERE user_id = $1
      `,
      [userId]
    );

    return;
  }

  const currentTokenHash =
    hashToken(currentToken);

  await query(
    `
      DELETE FROM sessions
      WHERE user_id = $1
        AND token_hash <> $2
    `,
    [userId, currentTokenHash]
  );
}