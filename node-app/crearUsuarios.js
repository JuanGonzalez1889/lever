require("dotenv").config();
const mysql = require("mysql");
const bcrypt = require("bcryptjs");

// Usa las variables del .env
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

// Lista de usuarios a crear
const usuarios = [
  { username: "vmontes", password: "montes123" },
  { username: "jventurini", password: "venturini123" },
  { username: "lbillone", password: "billone123" },
  { username: "jbriones", password: "briones123" },
  { username: "aamado", password: "amado123" },
  { username: "spippo", password: "pippo123" },
  { username: "bpippo", password: "pippo123" },
  { username: "pina", password: "pina123" },
  { username: "egomez", password: "gomez123" },
];

async function crearUsuarios() {
  for (const user of usuarios) {
    const hash = await bcrypt.hash(user.password, 10);
    db.query(
      "INSERT INTO users (username, password) VALUES (?, ?)",
      [user.username, hash],
      (err) => {
        if (err) {
          console.error(`Error creando usuario ${user.username}:`, err);
        } else {
          console.log(`Usuario ${user.username} creado correctamente`);
        }
      }
    );
  }
}

crearUsuarios();
