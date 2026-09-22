import dotenv from "dotenv";

import { query } from "./config/database.js";

import {
  createOtpChallenge,
} from "./services/otpService.js";

import {
  sendPasswordResetOtpEmail,
  verifyEmailService,
} from "./services/emailService.js";

dotenv.config();

async function testOtpEmail() {
  try {
    /*
     * We use the configured SMTP email as the
     * test recipient unless TEST_EMAIL is set.
     *
     * You can set TEST_EMAIL to another
     * registered account email if needed.
     */
    const testEmail =
      (
        process.env.TEST_EMAIL ||
        process.env.SMTP_USER ||
        ""
      )
        .trim()
        .toLowerCase();

    if (!testEmail) {
      throw new Error(
        "TEST_EMAIL or SMTP_USER must be configured."
      );
    }

    console.log(
      "Checking email service..."
    );

    await verifyEmailService();

    /*
     * Find the test user.
     */
    const userResult = await query(
      `
        SELECT
          id,
          first_name,
          email,
          status
        FROM users
        WHERE LOWER(email) = $1
        LIMIT 1
      `,
      [testEmail]
    );

    if (
      userResult.rows.length === 0
    ) {
      throw new Error(
        "Test email does not belong to a user account."
      );
    }

    const user =
      userResult.rows[0];

    if (
      user.status !== "active"
    ) {
      throw new Error(
        "Test user account is not active."
      );
    }

    console.log(
      "Creating password reset OTP..."
    );

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

    /*
     * Send the OTP through the real
     * email service.
     *
     * The OTP is not printed.
     */
    await sendPasswordResetOtpEmail({
      email: user.email,
      firstName: user.first_name,
      otp,
    });

    console.log("");
    console.log(
      "========================================"
    );
    console.log(
      "OTP EMAIL TEST SUCCESSFUL"
    );
    console.log(
      "========================================"
    );
    console.log(
      `Recipient: ${user.email}`
    );
    console.log(
      `Challenge ID: ${challenge.id}`
    );
    console.log(
      `Expires: ${challenge.expires_at}`
    );
    console.log(
      "Check the email inbox for the OTP."
    );
    console.log(
      "The OTP itself is intentionally not printed."
    );
    console.log(
      "========================================"
    );
    console.log("");
  } catch (error) {
    console.error("");
    console.error(
      "OTP email test failed:"
    );
    console.error(
      error.message
    );
    console.error("");
    process.exitCode = 1;
  }
}

await testOtpEmail();