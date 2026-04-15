const { Pool } = require('pg');

async function migrate() {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    const existing = await client.query(
      `SELECT DISTINCT salary_head_id FROM salary_head_formulas`
    );
    const existingHeadIds = new Set(existing.rows.map(r => r.salary_head_id));

    const heads = await client.query(
      `SELECT id, code, name, formula FROM salary_heads WHERE formula IS NOT NULL AND formula != ''`
    );

    let inserted = 0;
    let skipped = 0;

    for (const h of heads.rows) {
      if (existingHeadIds.has(h.id)) {
        skipped++;
        continue;
      }

      await client.query(
        `INSERT INTO salary_head_formulas (salary_head_id, rule_name, formula, priority, enabled, round_method, round_digits)
         VALUES ($1, $2, $3, 100, TRUE, 'ROUND', 2)`,
        [h.id, `${h.code || h.name} Default`, h.formula]
      );
      inserted++;
    }

    await client.query(
      `UPDATE salary_heads SET formula = NULL WHERE formula IS NOT NULL`
    );

    await client.query('COMMIT');
    console.log(`Migration complete: ${inserted} inserted, ${skipped} skipped (already had rules), ${heads.rows.length} total processed`);
    console.log('salary_heads.formula column cleared for all rows');
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Migration failed:', err.message);
    throw err;
  } finally {
    client.release();
    await pool.end();
  }
}

migrate().catch(() => process.exit(1));
