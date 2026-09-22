import dotenv from "dotenv";

import {
  verifyEmailService,
  sendEmail,
} from "./services/emailService.js";

dotenv.config();

async function testEmail() {
  try {
    console.log(
      "Testing SMTP connection..."
    );

    await verifyEmailService();

    console.log(
      "Sending test email..."
    );

    const result = await sendEmail({
      to: process.env.SMTP_USER,

      subject:
        "POS Billing SMTP Test",

      text:
        "This is a test email from the POS Billing backend.",
    });

    console.log("");
    console.log(
      "========================================"
    );
    console.log(
      "SMTP TEST SUCCESSFUL"
    );
    console.log(
      "========================================"
    );
    console.log(
      "Email accepted by SMTP server."
    );
    console.log(
      `Message ID: ${result.messageId}`
    );
    console.log(
      "Check the configured email inbox."
    );
    console.log(
      "========================================"
    );
    console.log("");
  } catch (error) {
    console.error("");
    console.error(
      "========================================"
    );
    console.error(
      "SMTP TEST FAILED"
    );
    console.error(
      "========================================"
    );

    console.error(
      "Code:",
      error?.cause?.code ||
        error?.code
    );

    console.error(
      "Command:",
      error?.cause?.command ||
        error?.command
    );

    console.error(
      "Response:",
      error?.cause?.response ||
        error?.response
    );

    console.error(
      "Response Code:",
      error?.cause?.responseCode ||
        error?.responseCode
    );

    console.error(
      "Message:",
      error?.cause?.message ||
        error?.message
    );

    console.error(
      "========================================"
    );
    console.error("");

    process.exitCode = 1;
  }
}

await testEmail();