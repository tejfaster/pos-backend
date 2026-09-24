-- 005_create_product_management.sql

-- =========================================================
-- Categories
-- =========================================================

CREATE TABLE categories (
    id BIGSERIAL PRIMARY KEY,

    name VARCHAR(100) NOT NULL,

    status VARCHAR(20) NOT NULL DEFAULT 'active',

    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT categories_status_check
        CHECK (status IN ('active', 'inactive'))
);

CREATE UNIQUE INDEX categories_name_unique
    ON categories (LOWER(name));


-- =========================================================
-- Units
-- =========================================================

CREATE TABLE units (
    id BIGSERIAL PRIMARY KEY,

    name VARCHAR(50) NOT NULL,
    short_name VARCHAR(20) NOT NULL,
    type VARCHAR(30) NOT NULL,

    status VARCHAR(20) NOT NULL DEFAULT 'active',

    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT units_status_check
        CHECK (status IN ('active', 'inactive'))
);

CREATE UNIQUE INDEX units_name_unique
    ON units (LOWER(name));

CREATE UNIQUE INDEX units_short_name_unique
    ON units (LOWER(short_name));


-- =========================================================
-- Products
-- =========================================================

CREATE TABLE products (
    id BIGSERIAL PRIMARY KEY,

    name VARCHAR(255) NOT NULL,

    category_id BIGINT NOT NULL
        REFERENCES categories(id)
        ON DELETE RESTRICT,

    unit_id BIGINT
        REFERENCES units(id)
        ON DELETE RESTRICT,

    brand VARCHAR(100),

    status VARCHAR(20) NOT NULL DEFAULT 'active',

    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT products_status_check
        CHECK (status IN ('active', 'inactive'))
);


CREATE INDEX products_category_id_idx
    ON products(category_id);

CREATE INDEX products_unit_id_idx
    ON products(unit_id);

CREATE INDEX products_status_idx
    ON products(status);

CREATE INDEX products_name_idx
    ON products(LOWER(name));


-- =========================================================
-- Updated-at triggers
-- =========================================================

CREATE TRIGGER categories_updated_at
BEFORE UPDATE ON categories
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();


CREATE TRIGGER units_updated_at
BEFORE UPDATE ON units
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();


CREATE TRIGGER products_updated_at
BEFORE UPDATE ON products
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();