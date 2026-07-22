require("dotenv").config();
const mysql = require("mysql");

const db = mysql.createConnection({
  host: process.env.DB_HOST || "localhost",
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD || "",
  database: process.env.DB_NAME || "leverSRL",
});

const alterTable = `ALTER TABLE agencias_users
  ADD COLUMN IF NOT EXISTS agente INT NULL;`;

db.connect((err) => {
  if (err) {
    console.error("DB connect error:", err.message);
    process.exit(1);
  }

  console.log("Connected to DB, adding agente column...");
  db.query(alterTable, (queryError) => {
    if (queryError) {
      console.error("ALTER failed:", queryError.message);
      process.exit(1);
    }

    console.log("Column agente is ready on agencias_users.");
    process.exit(0);
  });
});