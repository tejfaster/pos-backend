import pool from "../config/database.js";

export async function getUnits({ status = "active" } = {}) {
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
      short_name,
      type,
      status,
      created_at,
      updated_at
    FROM units
    ${whereClause}
    ORDER BY name_en ASC
  `;

  const { rows } = await pool.query(query, values);

  return rows;
}

export async function getUnitById(id) {
  const query = `
    SELECT
      id,
      name_en,
      name_hi,
      short_name,
      type,
      status,
      created_at,
      updated_at
    FROM units
    WHERE id = $1
  `;

  const { rows } = await pool.query(query, [id]);

  return rows[0] || null;
}

export async function createUnit({
  nameEn,
  nameHi = null,
  shortName,
  type,
}) {
  const query = `
    INSERT INTO units (
      name_en,
      name_hi,
      short_name,
      type
    )
    VALUES ($1, $2, $3, $4)
    RETURNING
      id,
      name_en,
      name_hi,
      short_name,
      type,
      status,
      created_at,
      updated_at
  `;

  const values = [
    nameEn.trim(),
    nameHi?.trim() || null,
    shortName.trim(),
    type.trim(),
  ];

  const { rows } = await pool.query(query, values);

  return rows[0];
}

export async function updateUnit(
  id,
  {
    nameEn,
    nameHi,
    shortName,
    type,
    status,
  }
) {
  const nameHiShouldBeCleared = nameHi === null;
  const nameHiShouldBeUpdated = nameHi !== undefined;

  const query = `
    UPDATE units
    SET
      name_en = COALESCE($1, name_en),

      name_hi = CASE
        WHEN $2 = TRUE THEN NULL
        WHEN $3 = TRUE THEN $4
        ELSE name_hi
      END,

      short_name = COALESCE($5, short_name),
      type = COALESCE($6, type),
      status = COALESCE($7, status)

    WHERE id = $8

    RETURNING
      id,
      name_en,
      name_hi,
      short_name,
      type,
      status,
      created_at,
      updated_at
  `;

  const values = [
    nameEn?.trim() || null,

    nameHiShouldBeCleared,
    nameHiShouldBeUpdated,
    nameHi?.trim() || null,

    shortName?.trim() || null,
    type?.trim() || null,
    status ?? null,

    id,
  ];

  const { rows } = await pool.query(query, values);

  return rows[0] || null;
}

export async function deactivateUnit(id) {
  const query = `
    UPDATE units
    SET status = 'inactive'
    WHERE id = $1
    RETURNING id, status
  `;

  const { rows } = await pool.query(query, [id]);

  return rows[0] || null;
}