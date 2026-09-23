import pool from "../config/database.js";

async function categoryExists(categoryId) {
  const query = `
    SELECT id
    FROM categories
    WHERE id = $1
      AND status = 'active'
  `;

  const { rows } = await pool.query(query, [categoryId]);

  return rows.length > 0;
}

async function unitExists(unitId) {
  const query = `
    SELECT id
    FROM units
    WHERE id = $1
      AND status = 'active'
  `;

  const { rows } = await pool.query(query, [unitId]);

  return rows.length > 0;
}

export async function getProducts({
  search = "",
  categoryId = null,
  status = "active",
} = {}) {
  const values = [];
  const conditions = [];

  if (status) {
    values.push(status);
    conditions.push(`p.status = $${values.length}`);
  }

  if (categoryId !== null && categoryId !== undefined) {
    values.push(categoryId);
    conditions.push(`p.category_id = $${values.length}`);
  }

  if (search.trim()) {
    values.push(`%${search.trim()}%`);

    conditions.push(`
      (
        p.name_en ILIKE $${values.length}
        OR p.name_hi ILIKE $${values.length}
        OR p.brand ILIKE $${values.length}
      )
    `);
  }

  const whereClause = conditions.length
    ? `WHERE ${conditions.join(" AND ")}`
    : "";

  const query = `
    SELECT
      p.id,

      p.name_en,
      p.name_hi,

      p.brand,
      p.status,

      p.category_id,
      c.name_en AS category_name_en,
      c.name_hi AS category_name_hi,

      p.unit_id,
      u.name_en AS unit_name_en,
      u.name_hi AS unit_name_hi,
      u.short_name AS unit_short_name,
      u.type AS unit_type,

      p.created_at,
      p.updated_at

    FROM products p

    INNER JOIN categories c
      ON c.id = p.category_id

    LEFT JOIN units u
      ON u.id = p.unit_id

    ${whereClause}

    ORDER BY p.name_en ASC
  `;

  const { rows } = await pool.query(query, values);

  return rows;
}

export async function getProductById(id) {
  const query = `
    SELECT
      p.id,

      p.name_en,
      p.name_hi,

      p.brand,
      p.status,

      p.category_id,
      c.name_en AS category_name_en,
      c.name_hi AS category_name_hi,

      p.unit_id,
      u.name_en AS unit_name_en,
      u.name_hi AS unit_name_hi,
      u.short_name AS unit_short_name,
      u.type AS unit_type,

      p.created_at,
      p.updated_at

    FROM products p

    INNER JOIN categories c
      ON c.id = p.category_id

    LEFT JOIN units u
      ON u.id = p.unit_id

    WHERE p.id = $1
  `;

  const { rows } = await pool.query(query, [id]);

  return rows[0] || null;
}

export async function createProduct({
  nameEn,
  nameHi = null,
  categoryId,
  unitId = null,
  brand = null,
}) {
  const validCategory = await categoryExists(categoryId);

  if (!validCategory) {
    const error = new Error("Category not found.");
    error.code = "CATEGORY_NOT_FOUND";
    error.status = 400;
    throw error;
  }

  if (unitId !== null) {
    const validUnit = await unitExists(unitId);

    if (!validUnit) {
      const error = new Error("Unit not found.");
      error.code = "UNIT_NOT_FOUND";
      error.status = 400;
      throw error;
    }
  }

  const query = `
    INSERT INTO products (
      name_en,
      name_hi,
      category_id,
      unit_id,
      brand
    )
    VALUES ($1, $2, $3, $4, $5)

    RETURNING
      id,
      name_en,
      name_hi,
      category_id,
      unit_id,
      brand,
      status,
      created_at,
      updated_at
  `;

  const values = [
    nameEn.trim(),
    nameHi?.trim() || null,
    categoryId,
    unitId,
    brand?.trim() || null,
  ];

  const { rows } = await pool.query(query, values);

  return rows[0];
}

export async function updateProduct(
  id,
  {
    nameEn,
    nameHi,
    categoryId,
    unitId,
    brand,
    status,
  }
) {
  const existingProduct = await getProductById(id);

  if (!existingProduct) {
    return null;
  }

  if (categoryId !== undefined) {
    const validCategory = await categoryExists(categoryId);

    if (!validCategory) {
      const error = new Error("Category not found.");
      error.code = "CATEGORY_NOT_FOUND";
      error.status = 400;
      throw error;
    }
  }

  if (unitId !== undefined && unitId !== null) {
    const validUnit = await unitExists(unitId);

    if (!validUnit) {
      const error = new Error("Unit not found.");
      error.code = "UNIT_NOT_FOUND";
      error.status = 400;
      throw error;
    }
  }

  const nameHiShouldBeCleared = nameHi === null;
  const nameHiShouldBeUpdated = nameHi !== undefined;

  const unitShouldBeCleared = unitId === null;
  const unitShouldBeUpdated = unitId !== undefined;

  const brandShouldBeCleared = brand === null;
  const brandShouldBeUpdated = brand !== undefined;

  const query = `
    UPDATE products
    SET
      name_en = COALESCE($1, name_en),

      name_hi = CASE
        WHEN $2 = TRUE THEN NULL
        WHEN $3 = TRUE THEN $4
        ELSE name_hi
      END,

      category_id = COALESCE($5, category_id),

      unit_id = CASE
        WHEN $6 = TRUE THEN NULL
        WHEN $7 = TRUE THEN $8
        ELSE unit_id
      END,

      brand = CASE
        WHEN $9 = TRUE THEN NULL
        WHEN $10 = TRUE THEN $11
        ELSE brand
      END,

      status = COALESCE($12, status)

    WHERE id = $13

    RETURNING
      id,
      name_en,
      name_hi,
      category_id,
      unit_id,
      brand,
      status,
      created_at,
      updated_at
  `;

  const values = [
    nameEn?.trim() || null,

    nameHiShouldBeCleared,
    nameHiShouldBeUpdated,
    nameHi?.trim() || null,

    categoryId ?? null,

    unitShouldBeCleared,
    unitShouldBeUpdated,
    unitId ?? null,

    brandShouldBeCleared,
    brandShouldBeUpdated,
    brand?.trim() || null,

    status ?? null,

    id,
  ];

  const { rows } = await pool.query(query, values);

  return rows[0] || null;
}

export async function deleteProduct(id) {
  const query = `
    UPDATE products
    SET status = 'inactive'
    WHERE id = $1
    RETURNING id, status
  `;

  const { rows } = await pool.query(query, [id]);

  return rows[0] || null;
}