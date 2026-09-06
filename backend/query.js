const { Pool } = require('pg');
const pool = new Pool({
  user: 'postgres',
  password: 'admin123',
  host: 'localhost',
  port: 5432,
  database: 'workforce_marketplace'
});

async function run() {
  const res = await pool.query('SELECT id, email, username, role, "isActive" FROM "users"');
  console.log(res.rows);
  pool.end();
}
run();
