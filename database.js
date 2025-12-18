const { Pool } = require('pg');

const pool = new Pool({
  user: 'postgres',        // seu usuário do postgres
  host: 'localhost',
  database: 'oficios',   // nome do banco
  password: '123@',   // senha do postgres
  port: 5432,
});

module.exports = pool;
