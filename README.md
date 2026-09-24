# POS Billing System — Backend

Backend API for the POS Billing System. It provides authentication, session management, password reset, product/category/unit management, product search, bilingual product data, and the hardware-product catalogue used by the React + Vite frontend.

## Project Status

The backend currently includes:

- User authentication with session-based login
- Admin authorization
- Password reset flow
- Product CRUD
- Category CRUD
- Unit CRUD
- Product search and filtering
- Soft-delete support through product/category/unit status
- English and Hindi product names
- Bihar hardware/building-material product catalogue
- Seed data for units
- PostgreSQL database
- CORS configuration for the frontend
- Email support for authentication/password-reset flows

The application is currently being developed for a small POS deployment. The product catalogue seed is intended for development and initial setup, not production data migration.

---

## Tech Stack

- Node.js
- Express.js
- PostgreSQL
- `pg`
- JavaScript
- Session-based authentication
- bcrypt/password hashing
- Nodemailer/email service
- dotenv
- CORS

The frontend is a separate React + Vite application.

---

## Project Structure

```text
backend/
├── src/
│   ├── config/
│   │   └── database.js
│   ├── controllers/
│   │   ├── authController.js
│   │   ├── categoryController.js
│   │   ├── productController.js
│   │   └── unitController.js
│   ├── db/
│   │   ├── migrations/
│   │   │   ├── 001_create_user.sql
│   │   │   ├── 002_create_sessions.sql
│   │   │   ├── 003_create_password_reset_token.sql
│   │   │   ├── 004_create_email_otp_challenges.sql
│   │   │   ├── 005_create_product_management.sql
│   │   │   ├── 006_add_bilingual_names.sql
│   │   │   ├── 007_seed_bihar_hardware_catalogue.sql
│   │   │   └── 008_seed_units.sql
│   │   └── seedAdmin.js
│   ├── routes/
│   ├── middleware/
│   ├── services/
│   └── server.js
├── .env
├── package.json
└── README.md
```

---

# Database

The backend uses PostgreSQL.

## Main Tables

### Users

Stores application users and their roles.

### Sessions

Stores authenticated sessions used by the application.

### Password Reset Tokens

Stores password-reset information.

### Email OTP Challenges

Supports email verification/OTP flows.

### Categories

```text
id
name_en
name_hi
status
created_at
updated_at
```

### Units

```text
id
name_en
name_hi
short_name
type
status
created_at
updated_at
```

### Products

```text
id
name_en
name_hi
category_id
unit_id
brand
status
created_at
updated_at
```

---

# Product and Unit Design

The current application does **not** use a product-level unit to determine the billing unit.

A product represents the item itself:

```text
Product
├── English/transliterated name
├── Hindi name
├── Category
└── Brand
```

A billing line contains the selected unit:

```text
Billing Item
├── Product
├── Quantity
├── Unit
├── Rate
└── Final Price
```

Therefore, the frontend does not assign a unit when creating/editing a product.

The billing screen selects the unit independently for each billing item.

The database still contains `products.unit_id` because it exists in the current schema, but the current catalogue leaves it `NULL` and billing does not depend on it.

---

# Database Setup

Create a PostgreSQL database and configure the connection in `.env`.

Example:

```env
PORT=5001
DB_HOST=localhost
DB_PORT=5432
DB_NAME=pos_billing
DB_USER=postgres
DB_PASSWORD=your_password
```

Use the actual environment variable names expected by `src/config/database.js`.

---

# Migrations

Schema migrations:

```text
001_create_user.sql
002_create_sessions.sql
003_create_password_reset_token.sql
004_create_email_otp_challenges.sql
005_create_product_management.sql
006_add_bilingual_names.sql
```

Seed scripts:

```text
007_seed_bihar_hardware_catalogue.sql
008_seed_units.sql
```

## Recommended Development Setup Order

1. Create the PostgreSQL database.
2. Run migrations `001` through `006`.
3. Run `008_seed_units.sql`.
4. Run `007_seed_bihar_hardware_catalogue.sql`.
5. Seed the admin user with `seedAdmin.js`.

### Important

`007_seed_bihar_hardware_catalogue.sql` is a development catalogue replacement seed.

It replaces the existing product catalogue and should **not** be run against a production database containing real billing/product data.

---

# Hardware Catalogue

The current Bihar hardware/building-material catalogue contains:

**1,060 products**

The catalogue contains:

- English/transliterated product names
- Hindi product names
- Categories
- Product sizes embedded directly in the product name

Examples:

```text
Hathodi
हथौड़ी

Cement (50 kg)
सीमेंट (50 kg)

TMT Bar (12 mm)
टीएमटी बार (12 mm)
```

## Catalogue Naming

```text
Product Name (English) / Transliteration
        ↓
products.name_en

Product Name (Local/Hindi)
        ↓
products.name_hi
```

The Roman/transliterated name is stored in `name_en`.

The Hindi name is stored in `name_hi`.

There is no separate product size field. Sizes remain part of the product name.

## Packing / Unit

The catalogue source contained a `Packing/Unit` column.

That value is intentionally **not** stored as the product's unit.

The current application selects units at the billing-line level.

Example:

```text
Product: Cement (50 kg)
Quantity: 2
Unit: Bag
Rate: 420
Final Price: 840
```

---

# Units

Units are managed independently from products.

Examples include:

```text
kg
gm
bag
liter
bundle
packet
carton
piece
```

Each unit can contain:

```text
English name
Hindi name
Short name
Type
Status
```

The billing screen allows the user to select the appropriate unit for each billing item.

---

# Environment Variables

Create a `.env` file in the backend project.

Typical configuration includes:

```env
PORT=5001

DB_HOST=localhost
DB_PORT=5432
DB_NAME=pos_billing
DB_USER=postgres
DB_PASSWORD=your_password

SESSION_SECRET=your_session_secret

FRONTEND_URL=http://localhost:5173
```

Email configuration is also required for email/password-reset functionality.

Use the variable names expected by the current backend configuration.

Do not commit `.env` or other secrets to Git.

---

# Admin User

The project includes:

```text
src/db/seedAdmin.js
```

Use this script to create the initial administrator account during development/setup.

The admin role is required for:

- Creating products
- Updating products
- Deleting products
- Creating categories
- Updating categories
- Deleting categories
- Creating units
- Updating units
- Deleting units

---

# Running the Backend

Install dependencies:

```bash
npm install
```

Start the development server:

```bash
npm run dev
```

The backend runs on:

```text
http://localhost:5001
```

The API base URL is:

```text
http://localhost:5001/api
```

---

# Authentication

Authentication uses server-side sessions.

The frontend sends requests with credentials enabled:

```js
fetch(url, {
  credentials: "include",
});
```

The application does not use a frontend-managed Bearer/JWT token for normal authentication.

## Authentication API

The backend provides endpoints for:

- Registration
- Login
- Logout
- Current authenticated user
- Password reset
- OTP/email verification where applicable

---

# Product API

Base path:

```text
/api/products
```

## Get Products

```http
GET /api/products
```

Authentication is required.

## Get One Product

```http
GET /api/products/:id
```

Authentication is required.

## Create Product

```http
POST /api/products
```

Admin authentication is required.

Current product data:

```json
{
  "nameEn": "Hathodi",
  "nameHi": "हथौड़ी",
  "categoryId": 1,
  "brand": null,
  "status": "active"
}
```

The frontend does not send a product-level `unitId`.

## Update Product

```http
PATCH /api/products/:id
```

Admin authentication is required.

## Delete Product

```http
DELETE /api/products/:id
```

Admin authentication is required.

Product deletion uses the application's status/soft-delete design.

---

# Product Search

The product API supports search/filtering used by the billing and product-management screens.

The frontend can search by:

- English/transliterated name
- Hindi name
- Brand
- Category

---

# Category API

Base path:

```text
/api/categories
```

Endpoints:

```http
GET    /api/categories
POST   /api/categories
PATCH  /api/categories/:id
DELETE /api/categories/:id
```

Authentication is required.

Management operations require admin authorization.

Categories contain:

```text
name_en
name_hi
status
```

---

# Unit API

Base path:

```text
/api/units
```

Endpoints:

```http
GET    /api/units
POST   /api/units
PATCH  /api/units/:id
DELETE /api/units/:id
```

Authentication is required.

Management operations require admin authorization.

Unit data contains:

```text
name_en
name_hi
short_name
type
status
```

The frontend normally requests active units for billing.

---

# Product Status

Products support status-based management.

Typical values include:

```text
active
inactive
```

Soft deletion allows records to remain in the database while being removed from normal active results.

The same status-based approach is used for categories and units.

---

# Security

The backend includes:

- Password hashing
- Session-based authentication
- Admin authorization
- Protected API routes
- Environment-based secrets
- CORS restrictions
- Parameterized PostgreSQL queries
- Password reset token handling
- Email/OTP security flows

Never commit credentials, database passwords, session secrets, email passwords, or API keys.

---

# CORS

Development frontend:

```text
http://localhost:5173
```

Backend:

```text
http://localhost:5001
```

Because authentication uses cookies/sessions, requests must be configured with credentials where required.

---

# Error Handling

The API returns structured HTTP responses for common cases:

```text
400 Bad Request
401 Unauthorized
403 Forbidden
404 Not Found
409 Conflict
500 Internal Server Error
```

---

# Example API Request

Example login request:

```bash
curl -X POST http://localhost:5001/api/auth/login   -H "Content-Type: application/json"   -d '{
    "email": "admin@example.com",
    "password": "your-password"
  }'
```

Example product request:

```bash
curl -X GET "http://localhost:5001/api/products"   -H "Content-Type: application/json"
```

For session-authenticated requests, the session cookie must be preserved.

---

# NPM Scripts

Check `package.json` for the exact available scripts.

Typical commands:

```bash
npm install
npm run dev
```

Additional scripts may be available for:

- Production start
- Database/seed setup
- Admin creation
- Testing
- Linting

---

# Application Architecture

```text
React + Vite Frontend
        │
        │ HTTP / Session Cookie
        ▼
Express API
        │
        ├── Authentication
        ├── Authorization
        ├── Product Controller
        ├── Category Controller
        └── Unit Controller
        │
        ▼
PostgreSQL
```

## Product Flow

```text
Product Management
        │
        ▼
Product API
        │
        ▼
PostgreSQL products table
```

## Billing Flow

```text
Product Search
      │
      ▼
Select Product
      │
      ├── Quantity
      ├── Unit
      └── Rate
      │
      ▼
Final Price = Quantity × Rate
```

The unit is selected for the billing item rather than being used as a fixed property of the product.

---

# Frontend Integration

Frontend repository:

https://github.com/tejfaster/pos-billing

The frontend uses:

```env
VITE_API_URL=http://localhost:5001/api
```

The frontend is responsible for:

- Billing UI
- Product search UI
- Product management UI
- Category management UI
- Unit selection UI
- Hindi/English display
- Theme/accessibility controls
- Printing

The backend is responsible for:

- Authentication
- Authorization
- Persistent data
- Product/category/unit APIs
- PostgreSQL storage
- Catalogue data
- Server-side validation and security

---

# Current Development Status

## Completed

- Authentication/session system
- Admin authorization
- Password reset infrastructure
- Product management API
- Category management API
- Unit management API
- Bilingual product names
- Bilingual categories/units
- Product search/filtering
- Soft-delete/status handling
- Bihar hardware catalogue seed
- 1,060 catalogue products
- Unit seed data
- React frontend integration

## Current Product Model

```text
Product
├── name_en
├── name_hi
├── category_id
├── brand
└── status
```

## Current Billing Model

```text
Billing Item
├── product
├── quantity
├── unit
├── rate
└── final price
```

---

# Future Improvements

Potential future work includes:

- Production-grade migration/version tracking
- Automated tests
- API validation schemas
- Request logging
- Rate limiting
- Improved audit logging
- Backup/restore strategy
- Production deployment configuration
- Database monitoring
- More granular permissions
- Billing/invoice persistence
- Customer management
- Sales history
- Reporting
- Inventory management

---

# Development Git Workflow

The project uses feature branches.

Recommended flow:

```text
main
  │
  ▼
dev
  │
  ▼
feature/*
  │
  ▼
dev
  │
  ▼
main
```

Example:

```bash
git checkout dev
git pull origin dev

git checkout -b feature/product-management
```

After completing and testing the feature:

```bash
git add .
git commit -m "feat: update product management"
git push -u origin feature/product-management
```

Merge the feature into `dev`, test the integration, and then merge `dev` into `main` when the release is ready.

---

# Development Notes

This project is currently under active development.

The catalogue seed is intended to establish the initial product dataset during development.

Before deploying to production:

- Back up the PostgreSQL database.
- Do not run the catalogue replacement seed against production data.
- Configure production environment variables.
- Restrict CORS to the production frontend.
- Use secure session configuration.
- Configure HTTPS.
- Set up database backups.
- Review authentication and authorization.
- Add appropriate monitoring and logging.

---

# License

This project is currently a private development project.
