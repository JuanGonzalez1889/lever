require('dotenv').config(); // Cargar variables de entorno desde .env
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const session = require('express-session');
const mysql = require('mysql');
const path = require('path');
const nodemailer = require('nodemailer');

const app = express();
const PORT = process.env.PORT || 5000;

console.log('NODE_ENV:', process.env.NODE_ENV); // Verificar que se está utilizando el .env
console.log('DB_HOST:', process.env.DB_HOST); // Verificar que se está utilizando el .env
console.log('CLIENT_URL:', process.env.CLIENT_URL); // Verificar que se está utilizando el .env

const db = mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME
});

db.connect(err => {
    if (err) {
        console.error('Error connecting to the database:', err);
        return;
    }
    console.log('Connected to the database');
});

app.use(bodyParser.json());

const allowedOrigins = [process.env.CLIENT_URL, 'http://localhost']; // Agregar http://localhost como origen permitido

app.use(cors({
    origin: (origin, callback) => {
        // Permitir solicitudes desde los orígenes especificados o solicitudes sin origen (como Postman)
        if (!origin || allowedOrigins.includes(origin)) {
            callback(null, true);
        } else {
            console.error(`CORS error: Origin ${origin} not allowed`);
            callback(new Error(`Not allowed by CORS`));
        }
    },
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

       /*   if (!isMatch) {
            console.log(5);
            return res
              .status(401)
              .json({
                success: false,
                message: "Invalid username or password",
              });
          }*/

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
    const { minAFinanciar, productos, ltv, newProductName } = req.body;

    const selectedProduct = Object.keys(productos)[0]; // Obtener el producto seleccionado

    const updateProductName = new Promise((resolve, reject) => {
        if (newProductName && newProductName !== selectedProduct) {
            // Actualizar el nombre del producto en la tabla `productos`
            const updateProductosQuery = `
                UPDATE productos SET nombre = ?
                WHERE nombre = ?
            `;
            db.query(updateProductosQuery, [newProductName, selectedProduct], (err) => {
                if (err) return reject(err);

                // Actualizar el nombre del producto en la tabla `ltv`
                const updateLtvQuery = `
                    UPDATE ltv SET producto = ?
                    WHERE producto = ?
                `;
                db.query(updateLtvQuery, [newProductName, selectedProduct], (err) => {
                    if (err) return reject(err);
                    resolve();
                });
            });
        } else {
            resolve(); // No hay cambios en el nombre
        }
    });

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
                const updateQuery = `
                    UPDATE productos
                    SET interest = ?, fee = ?, minfee = ?
                    WHERE nombre = ? AND plazo = ?
                `;
                db.query(updateQuery, [interest, fee, minfee, newProductName || nombre, plazo], (err, result) => {
                    if (err) return reject(err);
                    resolve(result);
                });
            });
        })
    );

    const updateLtv = new Promise((resolve, reject) => {
        if (newProductName && newProductName !== selectedProduct) {
            // Eliminar registros antiguos de LTV con el nombre anterior
            const deleteOldLtvQuery = `
                DELETE FROM ltv WHERE producto = ?
            `;
            db.query(deleteOldLtvQuery, [selectedProduct], (err) => {
                if (err) return reject(err);

                // Insertar o actualizar los nuevos registros de LTV
                const ltvPromises = Object.entries(ltv).flatMap(([producto, years]) =>
                    Object.entries(years).map(([year, value]) => {
                        return new Promise((resolve, reject) => {
                            const query = `
                                INSERT INTO ltv (producto, year, value)
                                VALUES (?, ?, ?)
                                ON DUPLICATE KEY UPDATE
                                value = VALUES(value)
                            `;
                            db.query(query, [newProductName || producto, year, value.value || value], (err, result) => {
                                if (err) return reject(err);
                                resolve(result);
                            });
                        });
                    })
                );

                Promise.all(ltvPromises)
                    .then(resolve)
                    .catch(reject);
            });
        } else {
            // Insertar o actualizar los registros de LTV sin eliminar
            const ltvPromises = Object.entries(ltv).flatMap(([producto, years]) =>
                Object.entries(years).map(([year, value]) => {
                    return new Promise((resolve, reject) => {
                        const query = `
                            INSERT INTO ltv (producto, year, value)
                            VALUES (?, ?, ?)
                            ON DUPLICATE KEY UPDATE
                            value = VALUES(value)
                        `;
                        db.query(query, [newProductName || producto, year, value.value || value], (err, result) => {
                            if (err) return reject(err);
                            resolve(result);
                        });
                    });
                })
            );

            Promise.all(ltvPromises)
                .then(resolve)
                .catch(reject);
        }
    });

    Promise.all([updateProductName, updateConfig, ...updateProductos, updateLtv])
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

app.post('/api/new-product', (req, res) => {
    const { nombre, minAFinanciar, ltv, plazos } = req.body;

    const insertProduct = new Promise((resolve, reject) => {
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

    const insertPlazos = Object.entries(plazos).map(([plazo, { interest, fee, minfee }]) => {
        return new Promise((resolve, reject) => {
            const query = `
                INSERT INTO productos (nombre, plazo, interest, fee, minfee)
                VALUES (?, ?, ?, ?, ?)
            `;
            db.query(query, [nombre, plazo, interest, fee, minfee], (err, result) => {
                if (err) return reject(err);
                resolve(result);
            });
        });
    });

    const insertLtv = Object.entries(ltv).map(([year, { value, show }]) => {
        return new Promise((resolve, reject) => {
            const query = `
                INSERT INTO ltv (producto, year, value, \`show\`)
                VALUES (?, ?, ?, ?)
            `;
            db.query(query, [nombre, year, value, show], (err, result) => {
                if (err) return reject(err);
                resolve(result);
            });
        });
    });

    Promise.all([insertProduct, ...insertPlazos, ...insertLtv])
        .then(() => res.json({ success: true }))
        .catch(err => {
            console.error('Error creating new product:', err);
            res.status(500).json({ success: false, message: 'Internal Server Error' });
        });
});

app.delete('/api/plazo', (req, res) => {
    const { producto, plazo } = req.body;

    const query = `
        DELETE FROM productos
        WHERE nombre = ? AND plazo = ?
    `;

    db.query(query, [producto, plazo], (err, result) => {
        if (err) {
            console.error('Error eliminando el plazo:', err);
            return res.status(500).json({ success: false, message: 'Error eliminando el plazo' });
        }

        if (result.affectedRows === 0) {
            return res.status(404).json({ success: false, message: 'Plazo no encontrado' });
        }

        res.json({ success: true });
    });
});

app.delete('/api/producto', (req, res) => {
    const { producto } = req.body;

    const deleteLtvQuery = `
        DELETE FROM ltv
        WHERE producto = ?
    `;
    const deletePlazosQuery = `
        DELETE FROM productos
        WHERE nombre = ?
    `;

    // Ejecutar las consultas en serie
    db.query(deleteLtvQuery, [producto], (err) => {
        if (err) {
            console.error('Error eliminando LTV del producto:', err);
            return res.status(500).json({ success: false, message: 'Error eliminando LTV del producto' });
        }

        db.query(deletePlazosQuery, [producto], (err) => {
            if (err) {
                console.error('Error eliminando plazos del producto:', err);
                return res.status(500).json({ success: false, message: 'Error eliminando plazos del producto' });
            }

            res.json({ success: true });
        });
    });
});

app.delete('/api/ltv', (req, res) => {
    const { producto, year } = req.body;

    const query = `
        DELETE FROM ltv
        WHERE producto = ? AND year = ?
    `;

    db.query(query, [producto, year], (err, result) => {
        if (err) {
            console.error('Error eliminando el LTV:', err);
            return res.status(500).json({ success: false, message: 'Error eliminando el LTV' });
        }

        if (result.affectedRows === 0) {
            return res.status(404).json({ success: false, message: 'LTV no encontrado' });
        }

        res.json({ success: true });
    });
});

// Configuración de Nodemailer
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: "leverweb25@gmail.com", // Tu correo electrónico
    pass: "bvzw qlcz fwcx idkp", // Reemplaza con la contraseña de aplicación generada
  },
});

// Ruta para manejar el formulario de contacto
app.post('/api/contact', (req, res) => {
    const { name, email, phone, message } = req.body;

    // Configuración del correo
    const mailOptions = {
      from: email,
      to: "leverweb25@gmail.com", // Cambia esto al correo donde quieres recibir los mensajes
      subject: `Nuevo mensaje de contacto de ${name}`,
      text: `Nombre: ${name}\nCorreo: ${email}\nTeléfono: ${phone}\n\nMensaje:\n${message}`,
    };

    // Enviar el correo
    transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
            console.error('Error al enviar el correo:', error);
            return res.status(500).json({ message: 'Error al enviar el correo' });
        }
        console.log('Correo enviado:', info.response);
        res.status(200).json({ message: 'Correo enviado correctamente' });
    });
});

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
