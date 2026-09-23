# POS Billing System — Backend

Backend API for the POS Billing System, built with Node.js, Express, and PostgreSQL.

## Tech Stack

- Node.js
- Express.js
- PostgreSQL
- `pg`
- Argon2
- Nodemailer
- Cookie Parser
- CORS
- dotenv
- Nodemon

## Project Structure

```text
backend/
├── src/
│   ├── config/database.js
│   ├── controllers/
│   │   ├── authController.js
│   │   ├── categoryController.js
│   │   ├── productController.js
│   │   └── unitController.js
│   ├── db/
│   │   ├── migrations/
│   │   │   ├── 001_create_users.sql
│   │   │   ├── 002_create_sessions.sql
│   │   │   ├── 003_create_email_otp_challenges.sql
│   │   │   ├── 004_create_password_reset_tokens.sql
│   │   │   ├── 005_create_product_management.sql
│   │   │   └── 006_add_bilingual_names.sql
│   │   └── seedAdmin.js
│   ├── middleware/authMiddleware.js
│   ├── routes/
│   │   ├── authRoutes.js
│   │   ├── categoryRoutes.js
│   │   ├── productRoutes.js
│   │   └── unitRoutes.js
│   ├── services/
│   │   ├── authService.js
│   │   ├── categoryService.js
│   │   ├── emailService.js
│   │   ├── otpService.js
│   │   ├── passwordResetService.js
│   │   ├── productService.js
│   │   ├── sessionService.js
│   │   └── unitService.js
│   ├── utils/
│   │   ├── databaseErrors.js
│   │   ├── productValidation.js
│   │   └── referenceValidation.js
│   └── app.js
├── .env
├── .gitignore
├── package.json
├── package-lock.json
└── README.md
```

## Setup

### Install dependencies

```bash
npm install
```

### PostgreSQL

Create a database named `pos_billing`.

Run migrations in order:

```bash
psql -d pos_billing -f src/db/migrations/001_create_users.sql
psql -d pos_billing -f src/db/migrations/002_create_sessions.sql
psql -d pos_billing -f src/db/migrations/003_create_email_otp_challenges.sql
psql -d pos_billing -f src/db/migrations/004_create_password_reset_tokens.sql
psql -d pos_billing -f src/db/migrations/005_create_product_management.sql
psql -d pos_billing -f src/db/migrations/006_add_bilingual_names.sql
```

Current tables:

```text
users
sessions
email_otp_challenges
password_reset_tokens
categories
units
products
```

### Environment

Create `backend/.env`:

```env
PORT=5001
DATABASE_URL=postgresql://postgres:YOUR_PASSWORD@localhost:5432/pos_billing
FRONTEND_URL=http://localhost:5173

SESSION_DURATION_DAYS=7

ADMIN_FIRST_NAME=Admin
ADMIN_LAST_NAME=User
ADMIN_PHONE=YOUR_PHONE
ADMIN_EMAIL=admin@example.com
ADMIN_PASSWORD=YOUR_ADMIN_PASSWORD

SMTP_HOST=smtp.gmail.com
SMTP_PORT=465
SMTP_SECURE=true
SMTP_CONNECT_HOST=YOUR_SMTP_IPV4
SMTP_USER=yourgmail@gmail.com
SMTP_PASSWORD=YOUR_GMAIL_APP_PASSWORD
MAIL_FROM=POS Billing <yourgmail@gmail.com>

OTP_HASH_SECRET=YOUR_RANDOM_SECRET
OTP_EXPIRY_MINUTES=5
OTP_MAX_ATTEMPTS=5
OTP_COOLDOWN_SECONDS=60
RESET_TOKEN_EXPIRY_MINUTES=10
```

Never commit `.env` or real credentials.

Generate the OTP secret with:

```bash
openssl rand -hex 32
```

For Gmail SMTP, use an App Password.

### Seed admin

```bash
npm run seed:admin
```

## Running

Development:

```bash
npm run dev
```

Production:

```bash
npm start
```

Local API:

```text
http://localhost:5001
```

## Authentication API

Base URL:

```text
http://localhost:5001/api
```

### Signup

```http
POST /auth/signup
```

Example:

```json
{
  "firstName": "John",
  "lastName": "Doe",
  "phone": "+491234567890",
  "email": "john@example.com",
  "password": "Password@123"
}
```

New users are created with `role=user` and `status=active`.

### Login

```http
POST /auth/login
```

Successful login creates a server-side session and sends an HttpOnly cookie.

### Current user

```http
GET /auth/me
```

Requires authentication.

### Logout

```http
POST /auth/logout
```

Deletes the server-side session and clears the cookie.

### Change password

```http
POST /auth/change-password
```

Requires authentication.

## Password Reset

Password reset uses email OTP verification followed by a short-lived, single-use reset token.

```text
Request reset
     ↓
Email OTP
     ↓
Verify OTP
     ↓
Receive reset token
     ↓
Submit new password
     ↓
Argon2 password hash
     ↓
Invalidate reset token
     ↓
Invalidate all existing sessions
```

### Request password reset

```http
POST /auth/password-reset/request
```

Example:

```json
{
  "email": "john@example.com"
}
```

The endpoint intentionally returns a generic response so it does not reveal whether an email address is registered.

### Verify OTP

```http
POST /auth/password-reset/verify
```

Example:

```json
{
  "email": "john@example.com",
  "otp": "123456"
}
```

Successful verification returns a temporary reset token.

### Confirm password reset

```http
POST /auth/password-reset/confirm
```

Example:

```json
{
  "resetToken": "RESET_TOKEN",
  "newPassword": "NewPassword@123"
}
```

A successful reset:

1. Validates the reset token.
2. Checks expiry and one-time-use status.
3. Hashes the new password with Argon2.
4. Updates the password.
5. Marks the reset token as used.
6. Invalidates all existing sessions.
7. Invalidates remaining OTP challenges.

## Product Management

The backend provides APIs for managing:

- Categories
- Units
- Products

Product, category, and unit read operations require authentication.

Create, update, and delete operations require administrator access.

### Categories

```http
GET    /api/categories
GET    /api/categories/:id
POST   /api/categories
PATCH  /api/categories/:id
DELETE /api/categories/:id
```

Create category:

```json
{
  "nameEn": "Cement",
  "nameHi": "सीमेंट"
}
```

English category names are required. Hindi names are optional.

### Units

```http
GET    /api/units
GET    /api/units/:id
POST   /api/units
PATCH  /api/units/:id
DELETE /api/units/:id
```

Create unit:

```json
{
  "nameEn": "Kilogram",
  "nameHi": "किलोग्राम",
  "shortName": "kg",
  "type": "weight"
}
```

English unit names are required. Hindi names are optional.

`shortName` and `type` remain single fields.

### Products

```http
GET    /api/products
GET    /api/products/:id
POST   /api/products
PATCH  /api/products/:id
DELETE /api/products/:id
```

Create product:

```json
{
  "nameEn": "OPC 53 Grade Cement",
  "nameHi": "ओपीसी 53 ग्रेड सीमेंट",
  "categoryId": 1,
  "unitId": 1,
  "brand": "UltraTech"
}
```

Each product has one ID and one database row.

The product stores:

```text
name_en
name_hi
category_id
unit_id
brand
status
```

Brand remains a single field.

### Product Search

Product search supports:

- English product names
- Hindi product names
- Brand names

Examples:

```http
GET /api/products?search=cement
```

```http
GET /api/products?search=सीमेंट
```

### Category Filtering

```http
GET /api/products?categoryId=1
```

### Soft Deletion

Delete operations do not physically remove products, categories, or units.

Instead, the resource status is changed to:

```text
inactive
```

## Security

### Passwords

Passwords are never stored as plaintext. They are hashed using Argon2.

### Sessions

The application uses server-side sessions. The browser receives the session token through an HttpOnly cookie. The database stores a SHA-256 hash of the session token.

### OTPs

OTP codes:

- Use cryptographically secure random generation.
- Are 6 digits.
- Are never stored as plaintext.
- Are stored as HMAC-SHA256 hashes.
- Expire after the configured timeout.
- Have a maximum verification-attempt limit.
- Have a resend cooldown.

### Reset tokens

Reset tokens:

- Use cryptographically secure random bytes.
- Are never stored as plaintext.
- Are stored as SHA-256 hashes.
- Expire after a configured period.
- Are single-use.

### Session invalidation

After a successful password reset, all existing sessions for that user are deleted.

### Authorization

Product, category, and unit modifications require administrator authorization.

## Email

Password-reset OTP emails are sent using Nodemailer and SMTP.

For Gmail:

```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=465
SMTP_SECURE=true
SMTP_USER=yourgmail@gmail.com
SMTP_PASSWORD=your_app_password
```

TLS certificate validation remains enabled.

## Error Codes

Authentication errors use structured codes such as:

```text
EMAIL_ALREADY_EXISTS
PHONE_ALREADY_EXISTS
INVALID_CREDENTIALS
ACCOUNT_DISABLED
UNAUTHORIZED
FORBIDDEN
INVALID_OTP
OTP_EXPIRED
OTP_MAX_ATTEMPTS
OTP_COOLDOWN
INVALID_RESET_TOKEN
RESET_TOKEN_EXPIRED
RESET_TOKEN_USED
INVALID_PASSWORD
NETWORK_ERROR
UNKNOWN_ERROR
```

Product management also uses structured errors such as:

```text
PRODUCT_NOT_FOUND
PRODUCT_ID_INVALID
PRODUCT_NAME_EN_REQUIRED
PRODUCT_NAME_EN_INVALID
PRODUCT_NAME_HI_INVALID
CATEGORY_NOT_FOUND
CATEGORY_ID_INVALID
UNIT_NOT_FOUND
UNIT_ID_INVALID
BRAND_INVALID
STATUS_INVALID
DUPLICATE_RESOURCE
INVALID_REFERENCE
```

## CORS

Local development:

```env
FRONTEND_URL=http://localhost:5173
```

For production, set this to the actual frontend origin.

## Testing with cURL

### Authentication

Request OTP:

```bash
curl -X POST http://localhost:5001/api/auth/password-reset/request \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@example.com"}'
```

Verify OTP:

```bash
curl -X POST http://localhost:5001/api/auth/password-reset/verify \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@example.com","otp":"123456"}'
```

Confirm password reset:

```bash
curl -X POST http://localhost:5001/api/auth/password-reset/confirm \
  -H "Content-Type: application/json" \
  -d '{"resetToken":"YOUR_RESET_TOKEN","newPassword":"NewPassword@123"}'
```

Never commit real passwords, OTPs, reset tokens, SMTP credentials, or other secrets.

## NPM Scripts

```bash
npm run dev
npm start
npm run seed:admin
```

## Authentication Architecture

```text
React + Vite Frontend
        │
        │ HTTP / JSON
        ▼
Express API
        │
        ├── Controllers
        ├── Auth Service
        ├── Session Service
        ├── OTP Service
        ├── Email Service
        ├── Product Service
        ├── Category Service
        ├── Unit Service
        └── Authentication Middleware
        │
        ▼
PostgreSQL
        ├── users
        ├── sessions
        ├── email_otp_challenges
        ├── password_reset_tokens
        ├── categories
        ├── units
        └── products
```

## Product Management Architecture

```text
React + Vite Frontend
        │
        │ HTTP / JSON
        ▼
Express API
        │
        ├── Product Controller
        ├── Product Service
        ├── Category Controller
        ├── Category Service
        ├── Unit Controller
        └── Unit Service
        │
        ▼
PostgreSQL
        ├── categories
        ├── units
        └── products
```

## Current Status

### Authentication

- [x] User signup
- [x] Admin seeding
- [x] Argon2 password hashing
- [x] Login
- [x] Server-side sessions
- [x] HttpOnly session cookies
- [x] Authenticated user endpoint
- [x] Logout
- [x] Change password
- [x] Email password-reset request
- [x] Secure OTP generation
- [x] OTP HMAC hashing
- [x] OTP expiry
- [x] OTP attempt limit
- [x] OTP resend cooldown
- [x] OTP verification
- [x] Secure password-reset tokens
- [x] Password reset
- [x] Session invalidation after password reset

### Product Management

- [x] Product database schema
- [x] Category management API
- [x] Unit management API
- [x] Product management API
- [x] Product search
- [x] Category filtering
- [x] Soft deletion
- [x] Admin-only product management
- [x] English/Hindi product names
- [x] English/Hindi category names
- [x] English/Hindi unit names
- [x] Single ID and row for each bilingual resource

### Catalogue

- [ ] Final product catalogue
- [ ] Product catalogue import/seed

The actual product catalogue will be finalized and imported separately.

## Future Production Improvements

- Automated database migrations
- Expired session/OTP/token cleanup
- API rate limiting
- Security headers
- Production HTTPS configuration
- Reverse proxy/API gateway
- Automated tests
- Production logging and monitoring
- Backup and recovery strategy
- Production deployment

## License

This project is currently under development.
