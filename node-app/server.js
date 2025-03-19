const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const session = require('express-session');
const mysql = require('mysql');
const path = require('path');

const app = express();
const PORT = 5000;

const db = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'leverSRL'
});

db.connect(err => {
    if (err) {
        console.error('Error connecting to the database:', err);
        return;
    }
    console.log('Connected to the database');
});

app.use(bodyParser.json());
app.use(cors({
    origin: ['http://localhost:3000', 'http://localhost'],
    credentials: true
}));
app.use(
  session({
    secret: "secret-key",
    resave: false,
    saveUninitialized: true,
    cookie: {
      secure: true, // Solo para HTTPS
      httpOnly: true,
      sameSite: "lax",
    },
  })
);


// Endpoint para manejar el login desde la base de datos
app.post('/api/login', (req, res) => {
    const { username, password } = req.body;
console.log(username, password);
    const query = `
        SELECT username, password
        FROM users
        WHERE username = ?
    `;

    db.query(query, [username], (err, results) => {
        if (err) {
            console.error('Error fetching user:', err);
            return res.status(500).json({ success: false, message: 'Internal Server Error' });
        }
        console.log(1)

        if (results.length === 0) {
            return res.status(401).json({ success: false, message: 'Invalid username or password' });
        }
        console.log(2);

        const user = results[0];
        console.log(user);

        // Verificar la contraseña (asumiendo que está encriptada con bcryptjs)
        const bcrypt = require('bcryptjs');
        bcrypt.compare(password, user.password, (err, isMatch) => {
          console.log(3);
          if (err) {
            console.log(4);
            console.error("Error comparing passwords:", err);
            return res
              .status(500)
              .json({ success: false, message: "Internal Server Error" });
          }

          if (!isMatch) {
            console.log(5);
            return res
              .status(401)
              .json({
                success: false,
                message: "Invalid username or password",
              });
          }

          // Guardar la sesión del usuario
          req.session.username = username;
          res.json({ success: true });
        });
        
    });
});

// Endpoint para registrar nuevos usuarios (opcional)
/*app.post('/api/register', (req, res) => {
    const { username, password } = req.body;

    // Encriptar la contraseña antes de guardarla
    const bcrypt = require('bcrypt');
    const saltRounds = 10;

    bcrypt.hash(password, saltRounds, (err, hashedPassword) => {
        if (err) {
            console.error('Error hashing password:', err);
            return res.status(500).json({ success: false, message: 'Internal Server Error' });
        }

        const query = `
            INSERT INTO users (username, password)
            VALUES (?, ?)
        `;

        db.query(query, [username, hashedPassword], (err, result) => {
            if (err) {
                console.error('Error inserting user:', err);
                return res.status(500).json({ success: false, message: 'Internal Server Error' });
            }

            res.json({ success: true });
        });
    });
});*/
/*ESTO POR EL MOMENTO NO LO VOY A USAR YA QUE NO TENGO UNA VISTA DE REGISTRO Y POR EL MOMENTO NO LA NECESITO*/

app.post('/api/logout', (req, res) => {
    req.session.destroy();
    res.json({ success: true });
});

app.get('/api/check-session', (req, res) => {
  /*   if (req.session.username) {
        res.json({ success: true });
    } else {
        res.status(401).json({ success: false });
    } */
});

app.get('/api/data', (req, res) => {
    console.log(req.session);
    /*if (!req.session.username) {
        return res.status(401).json({ success: false, message: 'Unauthorized' });
    }*/

    const query = `
        SELECT p.nombre AS producto, p.plazo, p.interest, p.fee, p.minfee, l.year, l.value, l.show, c.minAFinanciar
        FROM productos p
        LEFT JOIN ltv l ON p.nombre = l.producto
        LEFT JOIN configuracion c ON 1=1
    `;

    db.query(query, (err, results) => {
        if (err) {
            console.error('Error fetching data:', err);
            return res.status(500).json({ success: false, message: 'Internal Server Error' });
        }

        const data = { productos: {}, ltv: {}, minAFinanciar: null };
        results.forEach(row => {
            const productoNombre = row.producto;
            if (!data.productos[productoNombre]) {
                data.productos[productoNombre] = { plazos: {} };
            }
            data.productos[productoNombre].plazos[row.plazo] = {
                interest: row.interest,
                fee: row.fee,
                minfee: row.minfee
            };
            if (!data.ltv[productoNombre]) {
                data.ltv[productoNombre] = {};
            }
            if (row.year) {
                data.ltv[productoNombre][row.year] = {
                    value: row.value,
                    show: row.show
                };
            }
            if (row.minAFinanciar !== null) {
                data.minAFinanciar = row.minAFinanciar;
            }
        });

        res.json(data);
    });
});

app.post('/api/data', (req, res) => {
    /* if (!req.session.username) {
        return res.status(401).json({ success: false, message: 'Unauthorized' });
    } */

    const { minAFinanciar, productos, ltv } = req.body;

    const updateConfig = new Promise((resolve, reject) => {
        const query = `
            INSERT INTO configuracion (id, minAFinanciar)
            VALUES (1, ?)
            ON DUPLICATE KEY UPDATE minAFinanciar = VALUES(minAFinanciar)
        `;
        db.query(query, [minAFinanciar], (err, result) => {
            if (err) return reject(err);
            resolve(result);
        });
    });

    const updateProductos = Object.entries(productos).flatMap(([nombre, { plazos }]) =>
        Object.entries(plazos).map(([plazo, { interest, fee, minfee }]) => {
            return new Promise((resolve, reject) => {
                const query = `
                    UPDATE productos
                    SET interest = ?, fee = ?, minfee = ?
                    WHERE nombre = ? AND plazo = ?
                `;
                db.query(query, [interest, fee, minfee, nombre, plazo], (err, result) => {
                    if (err) return reject(err);
                    resolve(result);
                });
            });
        })
    );

    const updateLtv = Object.entries(ltv).flatMap(([producto, years]) =>
        Object.entries(years).map(([year, value]) => {
            return new Promise((resolve, reject) => {
                const query = `
                    UPDATE ltv
                    SET value = ?, \`show\` = ?
                    WHERE producto = ? AND year = ?
                `;
                db.query(query, [value.value || value, value.show || false, producto, year], (err, result) => {
                    if (err) return reject(err);
                    resolve(result);
                });
            });
        })
    );

    Promise.all([updateConfig, ...updateProductos, ...updateLtv])
        .then(() => res.json({ success: true }))
        .catch(err => {
            console.error('Error saving data:', err);
            res.status(500).json({ success: false, message: 'Internal Server Error' });
        });
});

app.get('/api/calculadora', (req, res) => {
    const queryProductos = `
        SELECT nombre AS producto, plazo, interest, fee, minfee
        FROM productos
    `;
    const queryLtv = `
        SELECT producto, year, value
        FROM ltv
    `;
    const queryMinAFinanciar = `
        SELECT minAFinanciar
        FROM configuracion
        WHERE id = 1
    `;

    Promise.all([
        new Promise((resolve, reject) => {
            db.query(queryProductos, (err, results) => {
                if (err) return reject(err);
                resolve(results);
            });
        }),
        new Promise((resolve, reject) => {
            db.query(queryLtv, (err, results) => {
                if (err) return reject(err);
                resolve(results);
            });
        }),
        new Promise((resolve, reject) => {
            db.query(queryMinAFinanciar, (err, results) => {
                if (err) return reject(err);
                resolve(results[0]?.minAFinanciar || null);
            });
        })
    ])
        .then(([productos, ltv, minAFinanciar]) => {
            const data = { productos: {}, minAFinanciar };

            productos.forEach(row => {
                if (!data.productos[row.producto]) {
                    data.productos[row.producto] = { plazos: {} };
                }
                data.productos[row.producto].plazos[row.plazo] = {
                    interest: row.interest,
                    fee: row.fee,
                    minfee: row.minfee
                };
            });

            ltv.forEach(row => {
                if (!data.productos[row.producto]) {
                    data.productos[row.producto] = {};
                }
                if (!data.productos[row.producto].ltv) {
                    data.productos[row.producto].ltv = {};
                }
                data.productos[row.producto].ltv[row.year] = row.value;
            });

            res.json(data);
        })
        .catch(err => {
            console.error('Error fetching data:', err);
            res.status(500).json({ success: false, message: 'Internal Server Error' });
        });
});

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
