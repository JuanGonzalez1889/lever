require('dotenv').config();
const mysql = require('mysql');

const db = mysql.createConnection({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'leverSRL',
});

const alterJson = `ALTER TABLE productos
  ADD COLUMN IF NOT EXISTS tipo_credito VARCHAR(100) NULL,
  ADD COLUMN IF NOT EXISTS highlights JSON NULL;`;

const alterText = `ALTER TABLE productos
  ADD COLUMN IF NOT EXISTS tipo_credito VARCHAR(100) NULL,
  ADD COLUMN IF NOT EXISTS highlights TEXT NULL;`;

db.connect((err) => {
  if (err) return console.error('DB connect error:', err.message);
  console.log('Connected to DB, running ALTER...');
  // Try JSON alter first
  db.query(alterJson, (e, r) => {
    if (e) {
      console.warn('JSON alter failed, trying TEXT fallback:', e.message);
      db.query(alterText, (e2, r2) => {
        if (e2) {
          console.error('Fallback alter also failed:', e2.message);
          process.exit(1);
        }
        console.log('ALTER applied (TEXT).');
        process.exit(0);
      });
    } else {
      console.log('ALTER applied (JSON).');
      process.exit(0);
    }
  });
});
