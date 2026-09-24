-- 006_add_bilingual_names.sql

-- =========================================================
-- Categories
-- =========================================================

ALTER TABLE categories
    RENAME COLUMN name TO name_en;

ALTER TABLE categories
    ADD COLUMN name_hi VARCHAR(100);


-- =========================================================
-- Units
-- =========================================================

ALTER TABLE units
    RENAME COLUMN name TO name_en;

ALTER TABLE units
    ADD COLUMN name_hi VARCHAR(50);


-- =========================================================
-- Products
-- =========================================================

ALTER TABLE products
    RENAME COLUMN name TO name_en;

ALTER TABLE products
    ADD COLUMN name_hi VARCHAR(255);