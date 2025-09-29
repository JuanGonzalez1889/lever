require("dotenv").config();
const mysql = require("mysql");
const bcrypt = require("bcryptjs");

const db = mysql.createConnection({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
});

db.connect((err) => {
  if (err) {
    console.error("Error conectando a la base de datos:", err);
    process.exit(1);
  }
  console.log("Conectado a la base de datos");
});

const nuevaClave = "admin123"; // La clave que quieres poner
bcrypt.hash(nuevaClave, 10, (err, hash) => {
  if (err) {
    console.error("Error encriptando la clave:", err);
    process.exit(1);
  }
  db.query(
    "UPDATE users SET password = ? WHERE username = 'admin'",
    [hash],
    (err) => {
      if (err) {
        console.error("Error actualizando la clave:", err);
      } else {
        console.log("Contraseña de admin blanqueada correctamente.");
      }
      db.end();
    }
  );
});
