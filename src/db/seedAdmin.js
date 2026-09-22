import dotenv from "dotenv";
import argon2 from "argon2";

import { query } from "../config/database.js";

dotenv.config();

async function seedAdmin() {
  try {
    const requiredVariables = [
      "ADMIN_FIRST_NAME",
      "ADMIN_LAST_NAME",
      "ADMIN_PHONE",
      "ADMIN_EMAIL",
      "ADMIN_PASSWORD",
    ];

    for (const variable of requiredVariables) {
      if (!process.env[variable]) {
        throw new Error(
          `Missing environment variable: ${variable}`
        );
      }
    }

    const existingAdmin = await query(
      `
        SELECT id
        FROM users
        WHERE role = 'admin'
        LIMIT 1
      `
    );

    if (existingAdmin.rows.length > 0) {
      console.log("An admin account already exists.");
      return;
    }

    const passwordHash = await argon2.hash(
      process.env.ADMIN_PASSWORD
    );

    await query(
      `
        INSERT INTO users (
          first_name,
          last_name,
          phone,
          email,
          password_hash,
          role,
          status
        )
        VALUES ($1, $2, $3, $4, $5, 'admin', 'active')
      `,
      [
        process.env.ADMIN_FIRST_NAME.trim(),
        process.env.ADMIN_LAST_NAME.trim(),
        process.env.ADMIN_PHONE.trim(),
        process.env.ADMIN_EMAIL.trim().toLowerCase(),
        passwordHash,
      ]
    );

    console.log("Initial admin account created successfully.");
  } catch (error) {
    console.error("Failed to seed admin:", error);
    process.exitCode = 1;
  }
}

await seedAdmin();