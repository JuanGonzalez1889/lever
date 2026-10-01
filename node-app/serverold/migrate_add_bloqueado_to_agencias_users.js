/**
 * Script de migración: agrega columna `bloqueado` a la tabla `agencias_users`.
 * Ejecutar con: node migrate_add_bloqueado_to_agencias_users.js
 */
const mysql = require('mysql');
require('dotenv').config();

const db = mysql.createConnection({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  multipleStatements: true,
});

db.connect(err => {
  if (err) {
    console.error('Error conectando a la DB:', err);
    process.exit(1);
  }
  console.log('Conectado a la DB. Ejecutando migración...');

  const sql = `ALTER TABLE agencias_users
    ADD COLUMN IF NOT EXISTS bloqueado TINYINT(1) DEFAULT 0`;

  const sql2 = `ALTER TABLE agencias_users
    ADD COLUMN IF NOT EXISTS bloqueo_motivo TEXT NULL`;

  db.query(sql, (err, result) => {
    if (err) {
      console.error('Error ejecutando migración:', err);
      process.exit(1);
    }
    // Ejecutar segunda alter para motivo
    db.query(sql2, (err2, result2) => {
      if (err2) {
        console.error('Error ejecutando migración (motivo):', err2);
        process.exit(1);
      }
      console.log('Migración ejecutada correctamente. Resultado:', result, result2);
      db.end();
    });
  });
});
