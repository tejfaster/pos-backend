import crypto from "crypto";

import { query } from "../config/database.js";

const OTP_EXPIRY_MINUTES = Number(
  process.env.OTP_EXPIRY_MINUTES || 10
);

const OTP_MAX_ATTEMPTS = Number(
  process.env.OTP_MAX_ATTEMPTS || 5
);

const OTP_COOLDOWN_SECONDS = Number(
  process.env.OTP_COOLDOWN_SECONDS || 60
);

const RESET_TOKEN_EXPIRY_MINUTES =
  Number(
    process.env.RESET_TOKEN_EXPIRY_MINUTES ||
      10
  );

function getOtpSecret() {
  const secret =
    process.env.OTP_HASH_SECRET;

  if (!secret) {
    throw new Error(
      "OTP_HASH_SECRET is not configured."
    );
  }

  return secret;
}

function createOtpHash(otp) {
  return crypto
    .createHmac(
      "sha256",
      getOtpSecret()
    )
    .update(otp)
    .digest("hex");
}

function createResetTokenHash(token) {
  return crypto
    .createHash("sha256")
    .update(token)
    .digest("hex");
}

function generateOtp() {
  return crypto
    .randomInt(100000, 1000000)
    .toString();
}

function generateResetToken() {
  return crypto
    .randomBytes(32)
    .toString("hex");
}

function secureCompare(
  first,
  second
) {
  const firstBuffer =
    Buffer.from(first, "hex");

  const secondBuffer =
    Buffer.from(second, "hex");

  if (
    firstBuffer.length !==
    secondBuffer.length
  ) {
    return false;
  }

  return crypto.timingSafeEqual(
    firstBuffer,
    secondBuffer
  );
}

export async function createOtpChallenge({
  userId,
  email,
  purpose,
}) {
  /*
   * Prevent rapid repeated OTP requests.
   */
  const cooldownResult =
    await query(
      `
        SELECT
          id,
          created_at
        FROM email_otp_challenges
        WHERE user_id = $1
          AND purpose = $2
          AND created_at >
              CURRENT_TIMESTAMP -
              ($3 * INTERVAL '1 second')
          AND used_at IS NULL
        ORDER BY created_at DESC
        LIMIT 1
      `,
      [
        userId,
        purpose,
        OTP_COOLDOWN_SECONDS,
      ]
    );

  if (
    cooldownResult.rows.length > 0
  ) {
    const createdAt =
      new Date(
        cooldownResult.rows[0]
          .created_at
      );

    const retryAfterSeconds =
      Math.max(
        1,
        OTP_COOLDOWN_SECONDS -
          Math.floor(
            (Date.now() -
              createdAt.getTime()) /
              1000
          )
      );

    const error = new Error(
      "Please wait before requesting another verification code."
    );

    error.code =
      "OTP_COOLDOWN";

    error.retryAfterSeconds =
      retryAfterSeconds;

    throw error;
  }

  /*
   * Invalidate previous active challenges.
   */
  await query(
    `
      UPDATE email_otp_challenges
      SET used_at = CURRENT_TIMESTAMP
      WHERE user_id = $1
        AND purpose = $2
        AND used_at IS NULL
    `,
    [userId, purpose]
  );

  const otp = generateOtp();

  const otpHash =
    createOtpHash(otp);

  const expiresAt =
    new Date(
      Date.now() +
        OTP_EXPIRY_MINUTES *
          60 *
          1000
    );

  const result =
    await query(
      `
        INSERT INTO email_otp_challenges (
          user_id,
          email,
          purpose,
          otp_hash,
          expires_at,
          attempts,
          max_attempts
        )
        VALUES (
          $1,
          $2,
          $3,
          $4,
          $5,
          0,
          $6
        )
        RETURNING
          id,
          user_id,
          email,
          purpose,
          expires_at,
          attempts,
          max_attempts,
          created_at
      `,
      [
        userId,
        email,
        purpose,
        otpHash,
        expiresAt,
        OTP_MAX_ATTEMPTS,
      ]
    );

  return {
    challenge:
      result.rows[0],

    /*
     * OTP exists only in application memory
     * long enough for email delivery.
     *
     * It is never stored in plaintext.
     */
    otp,
  };
}

export async function verifyOtpChallenge({
  email,
  otp,
  purpose,
}) {
  const normalizedEmail =
    email.trim().toLowerCase();

  const result =
    await query(
      `
        SELECT
          id,
          user_id,
          email,
          purpose,
          otp_hash,
          expires_at,
          attempts,
          max_attempts,
          verified_at,
          used_at
        FROM email_otp_challenges
        WHERE LOWER(email) = $1
          AND purpose = $2
          AND used_at IS NULL
        ORDER BY created_at DESC
        LIMIT 1
      `,
      [
        normalizedEmail,
        purpose,
      ]
    );

  if (
    result.rows.length === 0
  ) {
    const error = new Error(
      "Invalid or expired verification code."
    );

    error.code =
      "INVALID_OTP";

    throw error;
  }

  const challenge =
    result.rows[0];

  if (
    challenge.verified_at
  ) {
    const error = new Error(
      "This verification code has already been used."
    );

    error.code =
      "OTP_ALREADY_VERIFIED";

    throw error;
  }

  if (
    new Date(
      challenge.expires_at
    ).getTime() <= Date.now()
  ) {
    const error = new Error(
      "This verification code has expired."
    );

    error.code =
      "OTP_EXPIRED";

    throw error;
  }

  if (
    challenge.attempts >=
    challenge.max_attempts
  ) {
    const error = new Error(
      "Too many incorrect verification attempts."
    );

    error.code =
      "OTP_MAX_ATTEMPTS";

    throw error;
  }

  /*
   * Increment the attempt before comparison.
   */
  await query(
    `
      UPDATE email_otp_challenges
      SET attempts = attempts + 1
      WHERE id = $1
    `,
    [challenge.id]
  );

  if (
    typeof otp !== "string" ||
    !/^\d{6}$/.test(otp)
  ) {
    const error = new Error(
      "Invalid verification code."
    );

    error.code =
      "INVALID_OTP";

    throw error;
  }

  const submittedHash =
    createOtpHash(otp);

  const isValid =
    secureCompare(
      submittedHash,
      challenge.otp_hash
    );

  if (!isValid) {
    const error = new Error(
      "Invalid verification code."
    );

    error.code =
      "INVALID_OTP";

    throw error;
  }

  await query(
    `
      UPDATE email_otp_challenges
      SET verified_at = CURRENT_TIMESTAMP
      WHERE id = $1
        AND verified_at IS NULL
        AND used_at IS NULL
    `,
    [challenge.id]
  );

  /*
   * Create a one-time password-reset
   * authorization token.
   */
  const resetToken =
    generateResetToken();

  const resetTokenHash =
    createResetTokenHash(
      resetToken
    );

  const resetExpiresAt =
    new Date(
      Date.now() +
        RESET_TOKEN_EXPIRY_MINUTES *
          60 *
          1000
    );

  await query(
    `
      UPDATE password_reset_tokens
      SET used_at = CURRENT_TIMESTAMP
      WHERE user_id = $1
        AND used_at IS NULL
    `,
    [challenge.user_id]
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
      challenge.user_id,
      resetTokenHash,
      resetExpiresAt,
    ]
  );

  return {
    userId:
      challenge.user_id,

    resetToken,

    expiresAt:
      resetExpiresAt,
  };
}

export async function invalidateOtpChallenge(
  challengeId
) {
  if (!challengeId) {
    return;
  }

  await query(
    `
      UPDATE email_otp_challenges
      SET used_at = CURRENT_TIMESTAMP
      WHERE id = $1
        AND used_at IS NULL
    `,
    [challengeId]
  );
}