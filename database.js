const { Pool } = require('pg');

// Configuração para Vercel (usa variáveis de ambiente) ou local
const pool = new Pool({
  user: process.env.DB_USER || 'postgres',
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME || 'oficios',
  password: process.env.DB_PASSWORD || '123@',
  port: parseInt(process.env.DB_PORT || '5432'),
  // Para Vercel/Produção, adicione SSL se necessário
  ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false
});

module.exports = pool;
