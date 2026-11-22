const { Pool } = require("pg");
require("dotenv").config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: parseInt(process.env.DB_POOL_MAX || "20", 10),
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
});

pool.on("error", (err, client) => {
  console.error("Unexpected error on idle client", err);
});

module.exports = {
  query: (text, params) => pool.query(text, params),
  pool,
};
