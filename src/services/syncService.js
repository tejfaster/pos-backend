import pool from "../config/database.js";

export async function getFullSyncData() {
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const categoriesResult = await client.query(`
      SELECT
        id,
        name_en,
        name_hi,
        status,
        created_at,
        updated_at
      FROM categories
      ORDER BY id ASC
    `);

    const unitsResult = await client.query(`
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
      ORDER BY id ASC
    `);

    const productsResult = await client.query(`
      SELECT
        id,
        name_en,
        name_hi,
        category_id,
        unit_id,
        brand,
        status,
        created_at,
        updated_at
      FROM products
      ORDER BY id ASC
    `);

    await client.query("COMMIT");

    return {
      categories: categoriesResult.rows,
      units: unitsResult.rows,
      products: productsResult.rows,
      syncedAt: new Date().toISOString(),
    };
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}