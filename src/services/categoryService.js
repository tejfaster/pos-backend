import pool from "../config/database.js";

export async function getCategories({ status = "active" } = {}) {
  const values = [];
  const conditions = [];

  if (status) {
    values.push(status);
    conditions.push(`status = $${values.length}`);
  }

  const whereClause = conditions.length
    ? `WHERE ${conditions.join(" AND ")}`
    : "";

  const query = `
    SELECT
      id,
      name_en,
      name_hi,
      status,
      created_at,
      updated_at
    FROM categories
    ${whereClause}
    ORDER BY name_en ASC
  `;

  const { rows } = await pool.query(query, values);

  return rows;
}

export async function getCategoryById(id) {
  const query = `
    SELECT
      id,
      name_en,
      name_hi,
      status,
      created_at,
      updated_at
    FROM categories
    WHERE id = $1
  `;

  const { rows } = await pool.query(query, [id]);

  return rows[0] || null;
}

export async function createCategory({ nameEn, nameHi = null }) {
  const query = `
    INSERT INTO categories (
      name_en,
      name_hi
    )
    VALUES ($1, $2)
    RETURNING
      id,
      name_en,
      name_hi,
      status,
      created_at,
      updated_at
  `;

  const values = [
    nameEn.trim(),
    nameHi?.trim() || null,
  ];

  const { rows } = await pool.query(query, values);

  return rows[0];
}

export async function updateCategory(
  id,
  { nameEn, nameHi, status }
) {
  const query = `
    UPDATE categories
    SET
      name_en = COALESCE($1, name_en),
      name_hi = CASE
        WHEN $2 = TRUE THEN NULL
        WHEN $3 = TRUE THEN $4
        ELSE name_hi
      END,
      status = COALESCE($5, status)
    WHERE id = $6
    RETURNING
      id,
      name_en,
      name_hi,
      status,
      created_at,
      updated_at
  `;

  const nameHiShouldBeCleared = nameHi === null;
  const nameHiShouldBeUpdated = nameHi !== undefined;

  const values = [
    nameEn?.trim() || null,
    nameHiShouldBeCleared,
    nameHiShouldBeUpdated,
    nameHi?.trim() || null,
    status ?? null,
    id,
  ];

  const { rows } = await pool.query(query, values);

  return rows[0] || null;
}

export async function deactivateCategory(id) {
  const query = `
    UPDATE categories
    SET status = 'inactive'
    WHERE id = $1
    RETURNING id, status
  `;

  const { rows } = await pool.query(query, [id]);

  return rows[0] || null;
}