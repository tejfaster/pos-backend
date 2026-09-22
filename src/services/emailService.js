import nodemailer from "nodemailer";
import dotenv from "dotenv";

dotenv.config();

const {
  SMTP_HOST,
  SMTP_PORT,
  SMTP_SECURE,
  SMTP_USER,
  SMTP_PASSWORD,
  MAIL_FROM,
  SMTP_CONNECT_HOST,
} = process.env;

function validateEmailConfiguration() {
  const requiredVariables = [
    "SMTP_HOST",
    "SMTP_PORT",
    "SMTP_USER",
    "SMTP_PASSWORD",
    "MAIL_FROM",
  ];

  const missingVariables =
    requiredVariables.filter(
      (variable) =>
        !process.env[variable]
    );

  if (missingVariables.length > 0) {
    const error = new Error(
      `Missing email configuration: ${missingVariables.join(
        ", "
      )}`
    );

    error.code =
      "EMAIL_CONFIGURATION_ERROR";

    throw error;
  }
}

function createTransporter() {
  validateEmailConfiguration();

  /*
   * SMTP_HOST is the logical mail server name.
   *
   * SMTP_CONNECT_HOST is an optional development
   * override that lets us connect directly to a
   * known-working IPv4 address while still using
   * SMTP_HOST for TLS/SNI certificate validation.
   */
  const connectHost =
    SMTP_CONNECT_HOST ||
    SMTP_HOST;

  return nodemailer.createTransport({
    host: connectHost,

    port: Number(
      SMTP_PORT || 587
    ),

    /*
     * Force IPv4.
     */
    family: 4,

    /*
     * Port 587 uses STARTTLS.
     * Therefore SMTP_SECURE should be false.
     */
    secure:
      String(
        SMTP_SECURE
      ).toLowerCase() ===
      "true",

    /*
     * Require STARTTLS.
     */
    requireTLS: true,

    /*
     * SMTP authentication.
     */
    auth: {
      user: SMTP_USER,
      pass: SMTP_PASSWORD,
    },

    /*
     * TLS configuration.
     *
     * Even when connecting to an IP address,
     * validate the certificate against the real
     * SMTP hostname.
     */
    tls: {
      servername: SMTP_HOST,
      rejectUnauthorized: true,
    },
  });
}

function escapeHtml(value) {
  return String(value)
    .replaceAll(
      "&",
      "&amp;"
    )
    .replaceAll(
      "<",
      "&lt;"
    )
    .replaceAll(
      ">",
      "&gt;"
    )
    .replaceAll(
      '"',
      "&quot;"
    )
    .replaceAll(
      "'",
      "&#039;"
    );
}

/**
 * Verify SMTP connectivity and authentication.
 */
export async function verifyEmailService() {
  const transporter =
    createTransporter();

  try {
    await transporter.verify();

    console.log(
      "Email service connected successfully."
    );

    return true;
  } catch (error) {
    console.error(
      "Email service verification failed:",
      error
    );

    const serviceError =
      new Error(
        "Email service is unavailable."
      );

    serviceError.code =
      "EMAIL_SERVICE_ERROR";

    /*
     * Keep the original error available
     * for server-side debugging.
     *
     * Do not return it directly to clients.
     */
    serviceError.cause =
      error;

    throw serviceError;
  }
}

/**
 * Generic email sender.
 *
 * OTP generation and verification do not
 * belong here. This service only delivers email.
 */
export async function sendEmail({
  to,
  subject,
  text,
  html,
}) {
  if (
    typeof to !== "string" ||
    !to.trim()
  ) {
    const error =
      new Error(
        "Recipient email address is required."
      );

    error.code =
      "INVALID_RECIPIENT_EMAIL";

    throw error;
  }

  if (
    typeof subject !== "string" ||
    !subject.trim()
  ) {
    const error =
      new Error(
        "Email subject is required."
      );

    error.code =
      "INVALID_EMAIL_SUBJECT";

    throw error;
  }

  if (
    typeof text !== "string" ||
    !text.trim()
  ) {
    const error =
      new Error(
        "Email body is required."
      );

    error.code =
      "INVALID_EMAIL_BODY";

    throw error;
  }

  const transporter =
    createTransporter();

  try {
    const info =
      await transporter.sendMail({
        from:
          MAIL_FROM ||
          SMTP_USER,

        to: to.trim(),

        subject:
          subject.trim(),

        text,

        ...(html
          ? { html }
          : {}),
      });

    return {
      messageId:
        info.messageId,

      accepted:
        info.accepted,

      rejected:
        info.rejected,
    };
  } catch (error) {
    console.error(
      "Email delivery failed:",
      error
    );

    const serviceError =
      new Error(
        "Unable to send email."
      );

    serviceError.code =
      "EMAIL_DELIVERY_ERROR";

    serviceError.cause =
      error;

    throw serviceError;
  }
}

/**
 * Send a password reset OTP email.
 *
 * The plaintext OTP is passed only to the
 * email transport. It is not stored, logged,
 * or returned by this function.
 */
export async function sendPasswordResetOtpEmail({
  email,
  firstName,
  otp,
}) {
  if (
    typeof email !== "string" ||
    !email.trim()
  ) {
    const error =
      new Error(
        "Recipient email address is required."
      );

    error.code =
      "INVALID_RECIPIENT_EMAIL";

    throw error;
  }

  if (
    typeof otp !== "string" ||
    !/^\d+$/.test(otp)
  ) {
    const error =
      new Error(
        "Invalid OTP."
      );

    error.code =
      "INVALID_OTP";

    throw error;
  }

  const name =
    typeof firstName ===
      "string" &&
    firstName.trim()
      ? firstName.trim()
      : "there";

  const safeName =
    escapeHtml(name);

  const safeOtp =
    escapeHtml(otp);

  const subject =
    "POS Billing - Password Reset OTP";

  const text = [
    `Hello ${name},`,
    "",
    "We received a request to reset your POS Billing account password.",
    "",
    `Your password reset OTP is: ${otp}`,
    "",
    "This OTP is valid for a limited time.",
    "Do not share this OTP with anyone.",
    "",
    "If you did not request a password reset, you can safely ignore this email.",
    "",
    "POS Billing",
  ].join("\n");

  const html = `
    <!DOCTYPE html>
    <html lang="en">
      <head>
        <meta charset="UTF-8" />
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1.0"
        />
        <title>
          POS Billing - Password Reset
        </title>
      </head>

      <body
        style="
          margin: 0;
          padding: 0;
          background: #f5f5f5;
          font-family: Arial, Helvetica, sans-serif;
          color: #222222;
        "
      >
        <div
          style="
            max-width: 520px;
            margin: 40px auto;
            padding: 32px 24px;
            background: #ffffff;
            border-radius: 12px;
          "
        >
          <h2
            style="
              margin: 0 0 24px;
              font-size: 22px;
            "
          >
            POS Billing
          </h2>

          <p>
            Hello ${safeName},
          </p>

          <p>
            We received a request to reset your
            POS Billing account password.
          </p>

          <p>
            Your verification code is:
          </p>

          <div
            style="
              margin: 24px 0;
              padding: 18px;
              text-align: center;
              border-radius: 8px;
              background: #f5f5f5;
              font-size: 30px;
              font-weight: 700;
              letter-spacing: 8px;
            "
          >
            ${safeOtp}
          </div>

          <p>
            This OTP is valid for a limited time.
          </p>

          <p>
            <strong>
              Do not share this code with anyone.
            </strong>
          </p>

          <p>
            If you did not request a password
            reset, you can safely ignore this email.
          </p>

          <p>
            POS Billing
          </p>
        </div>
      </body>
    </html>
  `;

  return sendEmail({
    to: email,
    subject,
    text,
    html,
  });
}