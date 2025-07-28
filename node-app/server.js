require("dotenv").config(); // Cargar variables de entorno desde .env
const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const session = require("express-session");
const mysql = require("mysql");
const path = require("path");
const nodemailer = require("nodemailer");

const app = express();
const PORT = process.env.PORT || 5000;

console.log("NODE_ENV:", process.env.NODE_ENV); // Verificar que se está utilizando el .env
console.log("DB_HOST:", process.env.DB_HOST); // Verificar que se está utilizando el .env
console.log("CLIENT_URL:", process.env.CLIENT_URL); // Verificar que se está utilizando el .env

const db = mysql.createConnection({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
});

db.connect((err) => {
  if (err) {
    console.error("Error connecting to the database:", err);
    return;
  }
  console.log("Connected to the database");
});

app.use(bodyParser.json());

const allowedOrigins = [process.env.CLIENT_URL, "http://api.lever.com.ar/"]; // Agregar http://localhost como origen permitido

app.use(
  cors({
    origin: (origin, callback) => {
      // Permitir solicitudes desde los orígenes especificados o solicitudes sin origen (como Postman)
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        console.error(`CORS error: Origin ${origin} not allowed`);
        callback(new Error(`Not allowed by CORS`));
      }
    },
    credentials: true,
  })
);

app.use(
  session({
    secret: "secret-key",
    resave: false,
    saveUninitialized: true,
    cookie: {
      secure: true, // <-- Para desarrollo local, debe ser false
      httpOnly: true,
      sameSite: "lax",
    },
  })
);

// Endpoint para manejar el login desde la base de datos
app.post("/api/login", (req, res) => {
  const { username, password } = req.body;
  console.log(username, password);
  const query = `
        SELECT username, password
        FROM users
        WHERE username = ?
    `;

  db.query(query, [username], (err, results) => {
    if (err) {
      console.error("Error fetching user:", err);
      return res
        .status(500)
        .json({ success: false, message: "Internal Server Error" });
    }
    console.log(1);

    if (results.length === 0) {
      return res
        .status(401)
        .json({ success: false, message: "Invalid username or password" });
    }
    console.log(2);

    const user = results[0];
    console.log(user);

    // Verificar la contraseña (asumiendo que está encriptada con bcryptjs)
    const bcrypt = require("bcryptjs");
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

app.post("/api/logout", (req, res) => {
  req.session.destroy();
  res.json({ success: true });
});

app.get("/api/check-session", (req, res) => {
  /*   if (req.session.username) {
        res.json({ success: true });
    } else {
        res.status(401).json({ success: false });
    } */
});
app.get("/api/segmentos", (req, res) => {
  db.query("SELECT id, nombre FROM segmentos", (err, results) => {
    if (err) {
      console.error("Error fetching segmentos:", err);
      return res
        .status(500)
        .json({ success: false, message: "Error fetching segmentos" });
    }
    res.json(results);
  });
});

app.get("/api/productos-con-segmento", (req, res) => {
  db.query(
    "SELECT p.nombre, p.segmento_id, s.nombre AS segmento_nombre, p.banco FROM productos p LEFT JOIN segmentos s ON p.segmento_id = s.id",
    (err, results) => {
      if (err) {
        console.error("Error fetching productos:", err);
        return res
          .status(500)
          .json({ success: false, message: "Error fetching productos" });
      }
      res.json(results);
    }
  );
});
// NUEVO: Función utilitaria para obtener el id de producto por nombre
function getLastProductIdByName(nombre) {
  return new Promise((resolve, reject) => {
    db.query(
      "SELECT id FROM productos WHERE nombre = ? ORDER BY id DESC LIMIT 1",
      [nombre],
      (err, results) => {
        if (err) return reject(err);
        if (!results.length) return reject(new Error("Producto no encontrado"));
        resolve(results[0].id);
      }
    );
  });
}

app.get("/api/data", (req, res) => {
  console.log(req.session);
  /*if (!req.session.username) {
        return res.status(401).json({ success: false, message: 'Unauthorized' });
    }*/

  const query = `
    SELECT p.id AS producto_id, p.nombre AS producto, p.plazo, p.interest, p.fee, p.minfee, p.segmento_id, p.banco, l.year, l.value, l.show, c.minAFinanciar
    FROM productos p
    LEFT JOIN ltv l ON p.id = l.producto_id
    LEFT JOIN configuracion c ON 1=1
`;

  db.query(query, (err, results) => {
    if (err) {
      console.error("Error fetching data:", err);
      return res
        .status(500)
        .json({ success: false, message: "Internal Server Error" });
    }

    const data = { productos: {}, minAFinanciar: null };
    results.forEach((row) => {
      // Clave única por producto
      const productoKey = `${row.producto}__${row.segmento_id}__${row.banco}`;
      if (!data.productos[productoKey]) {
        data.productos[productoKey] = {
          nombre: row.producto,
          segmento_id: row.segmento_id,
          banco: row.banco,
          plazos: {},
          ltv: {},
          producto_ids: [], // Para guardar los IDs reales de cada plazo
        };
      }
      // Guardar el ID real de cada plazo (para editar/eliminar)
      if (!data.productos[productoKey].producto_ids.includes(row.producto_id)) {
        data.productos[productoKey].producto_ids.push(row.producto_id);
      }
      data.productos[productoKey].plazos[row.plazo] = {
        interest: row.interest,
        fee: row.fee,
        minfee: row.minfee,
        producto_id: row.producto_id, // Para saber el ID real de ese plazo
      };
      if (row.year) {
        data.productos[productoKey].ltv[row.year] = {
          value: row.value,
          show: row.show,
        };
      }
      if (row.minAFinanciar !== null) {
        data.minAFinanciar = row.minAFinanciar;
      }
    });
    res.json(data);
  });
});

app.post("/api/data", (req, res) => {
  console.log("BODY RECIBIDO EN /api/data:", JSON.stringify(req.body, null, 2));
  const { minAFinanciar, productos, ltv, newProductName } = req.body;

  const selectedProductId = Object.keys(productos)[0];
  const segmento_id = productos[selectedProductId]?.segmento_id || null;
  const oldName = productos[selectedProductId]?.nombre || null;
  const banco = productos[selectedProductId]?.banco || null;
  const productoIds = productos[selectedProductId]?.producto_ids || [];
  const productoIdPrincipal = productoIds[0]; // Usá solo el primero

  // Actualizar nombre del producto por ID
  const updateProductName = new Promise((resolve, reject) => {
    if (newProductName && newProductName !== oldName) {
      const updateProductosQuery = `
      UPDATE productos SET nombre = ?
      WHERE id = ?
    `;
      db.query(
        updateProductosQuery,
        [newProductName, productoIdPrincipal],
        (err) => {
          if (err) return reject(err);
          resolve();
        }
      );
    } else {
      resolve();
    }
  });

  const plazosActuales = Object.keys(productos[selectedProductId].plazos).map(
    Number
  );

  const deletePlazosViejos = new Promise((resolve, reject) => {
    const deleteQuery = `
    DELETE FROM productos
    WHERE id = ? AND plazo NOT IN (${
      plazosActuales.length ? plazosActuales.map(() => "?").join(",") : "NULL"
    })
  `;
    db.query(deleteQuery, [productoIdPrincipal, ...plazosActuales], (err) => {
      if (err) return reject(err);
      resolve();
    });
  });

  // Actualizar segmento por ID
  const updateSegmento = new Promise((resolve, reject) => {
    if (segmento_id) {
      const updateSegmentoQuery = `
        UPDATE productos SET segmento_id = ?
        WHERE id = ?
      `;
      db.query(updateSegmentoQuery, [segmento_id, selectedProductId], (err) => {
        if (err) return reject(err);
        resolve();
      });
    } else {
      resolve();
    }
  });

  // Actualizar minAFinanciar
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

  // Limpiar el objeto productos para que solo quede la clave nueva
  if (newProductName && newProductName !== oldName) {
    const newKey = `${newProductName}__${segmento_id}__${banco}`;
    Object.keys(productos).forEach((key) => {
      if (key !== newKey) {
        delete productos[key];
      }
    });
  }

  // Actualizar o insertar plazos por producto_id y plazo
  const updateProductos = Object.entries(productos).flatMap(
    ([productoId, { plazos }]) =>
      Object.entries(plazos).map(([plazo, { interest, fee, minfee }], idx) => {
        return new Promise((resolve, reject) => {
          const query = `
          INSERT INTO productos (id, nombre, plazo, interest, fee, minfee, segmento_id, banco)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?)
          ON DUPLICATE KEY UPDATE
            nombre = VALUES(nombre),
            interest = VALUES(interest),
            fee = VALUES(fee),
            minfee = VALUES(minfee),
            segmento_id = VALUES(segmento_id),
            banco = VALUES(banco)
        `;
          db.query(
            query,
            [
              productoIds[idx], // el id correspondiente al plazo
              newProductName || productos[productoId].nombre,
              plazo,
              interest,
              fee,
              minfee,
              segmento_id,
              banco,
            ],
            (err, result) => {
              if (err) return reject(err);
              resolve(result);
            }
          );
        });
      })
  );

  const updateLtv = new Promise((resolve, reject) => {
    const ltvPromises = Object.entries(ltv[selectedProductId] || {}).map(
      ([year, value]) => {
        let ltvValue = value.value ?? value;
        let ltvShow = value.show ?? 1;
        return new Promise((resolve, reject) => {
          const query = `
            INSERT INTO ltv (producto_id, year, value, \`show\`)
            VALUES (?, ?, ?, ?)
            ON DUPLICATE KEY UPDATE value = VALUES(value), \`show\` = VALUES(\`show\`)
          `;
          db.query(
            query,
            [productoIdPrincipal, year, ltvValue, ltvShow],
            (err, result) => {
              if (err) return reject(err);
              resolve(result);
            }
          );
        });
      }
    );
    Promise.all(ltvPromises).then(resolve).catch(reject);
  });

 const updateBanco = new Promise((resolve, reject) => {
   if (banco !== undefined && productoIdPrincipal) {
     const updateBancoQuery = `
      UPDATE productos SET banco = ?
      WHERE id = ?
    `;
     db.query(updateBancoQuery, [banco, productoIdPrincipal], (err) => {
       if (err) return reject(err);
       resolve();
     });
   } else {
     resolve();
   }
 });

  // Ejecutar primero el delete y después el resto
  Promise.all([
    updateProductName,
    deletePlazosViejos,
    updateSegmento,
    updateBanco,
    updateConfig,
    ...updateProductos,
    updateLtv,
  ])
    .then(() => res.json({ success: true }))
    .catch((err) => {
      console.error("Error saving data:", err);
      res
        .status(400)
        .json({ success: false, message: err.message || "Datos inválidos" });
    });
});

app.get("/api/calculadora", (req, res) => {
  console.log("ENTRO ACA");
  const queryProductos = `
        SELECT nombre AS producto, plazo, interest, fee, minfee
        FROM productos
    `;
  const queryLtv = `
        SELECT l.producto_id, p.nombre AS producto, l.year, l.value
        FROM ltv l
        JOIN productos p ON l.producto_id = p.id
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
    }),
  ])
    .then(([productos, ltv, minAFinanciar]) => {
      const data = { productos: {}, minAFinanciar };

      productos.forEach((row) => {
        if (!data.productos[row.producto]) {
          data.productos[row.producto] = { plazos: {} };
        }
        data.productos[row.producto].plazos[row.plazo] = {
          interest: row.interest,
          fee: row.fee,
          minfee: row.minfee,
        };
      });

      ltv.forEach((row) => {
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
    .catch((err) => {
      console.error("Error fetching data:", err);
      res
        .status(500)
        .json({ success: false, message: "Internal Server Error" });
    });
});

app.post("/api/new-product", async (req, res) => {
  const { nombre, minAFinanciar, ltv, plazos, segmento_id, banco } = req.body; // <--- agregá banco

  if (!segmento_id || isNaN(Number(segmento_id)) || Number(segmento_id) === 0) {
    return res
      .status(400)
      .json({ success: false, message: "segmento_id inválido" });
  }

  try {
    // 1. Insertar minAFinanciar en configuracion
    await new Promise((resolve, reject) => {
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

    // 2. Insertar una fila principal para el producto y obtener su ID
    const primerPlazo = Object.keys(plazos)[0];
    const { interest, fee, minfee } = plazos[primerPlazo];
    const productoId = await new Promise((resolve, reject) => {
      const query = `
       INSERT INTO productos (nombre, plazo, interest, fee, minfee, segmento_id, banco)
       VALUES (?, ?, ?, ?, ?, ?, ?)
      `;
      db.query(
        query,
        [nombre, primerPlazo, interest, fee, minfee, segmento_id, banco], // <--- agregá banco
        (err, result) => {
          if (err) return reject(err);
          resolve(result.insertId);
        }
      );
    });

    // 3. Insertar el resto de los plazos (excepto el primero)
    const otrosPlazos = Object.entries(plazos).slice(1);
    await Promise.all(
      otrosPlazos.map(([plazo, { interest, fee, minfee }]) => {
        return new Promise((resolve, reject) => {
          const query = `
        INSERT INTO productos (nombre, plazo, interest, fee, minfee, segmento_id, banco)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `;
          db.query(
            query,
            [nombre, plazo, interest, fee, minfee, segmento_id, banco], // <--- agregá banco
            (err, result) => {
              if (err) return reject(err);
              resolve(result);
            }
          );
        });
      })
    );

    // 4. Insertar los LTV usando el productoId principal
    await Promise.all(
      Object.entries(ltv).map(([year, { value, show }]) => {
        return new Promise((resolve, reject) => {
          const ltvShow = show ?? 1; // Valor por defecto 1
          const query = `
            INSERT INTO ltv (producto_id, year, value, \`show\`)
            VALUES (?, ?, ?, ?)
          `;
          db.query(query, [productoId, year, value, show], (err, result) => {
            if (err) return reject(err);
            resolve(result);
          });
        });
      })
    );

    res.json({ success: true, productoId });
  } catch (err) {
    console.error("Error creating new product:", err);
    res.status(500).json({ success: false, message: "Internal Server Error" });
  }
});

app.delete("/api/plazo", (req, res) => {
  const { productoId, plazo } = req.body;
  const query = `
    DELETE FROM productos
    WHERE id = ? AND plazo = ?
  `;
  db.query(query, [productoId, plazo], (err, result) => {
    if (err) {
      console.error("Error eliminando el plazo:", err);
      return res
        .status(500)
        .json({ success: false, message: "Error eliminando el plazo" });
    }
    if (result.affectedRows === 0) {
      return res
        .status(404)
        .json({ success: false, message: "Plazo no encontrado" });
    }
    res.json({ success: true });
  });
});

app.delete("/api/producto", (req, res) => {
  const { productoId } = req.body;
  const deleteLtvQuery = `
    DELETE FROM ltv
    WHERE producto_id = ?
  `;
  const deletePlazosQuery = `
    DELETE FROM productos
    WHERE id = ?
  `;
  db.query(deleteLtvQuery, [productoId], (err) => {
    if (err) {
      console.error("Error eliminando LTV del producto:", err);
      return res.status(500).json({
        success: false,
        message: "Error eliminando LTV del producto",
      });
    }
    db.query(deletePlazosQuery, [productoId], (err) => {
      if (err) {
        console.error("Error eliminando plazos del producto:", err);
        return res.status(500).json({
          success: false,
          message: "Error eliminando plazos del producto",
        });
      }
      res.json({ success: true });
    });
  });
});

app.delete("/api/ltv", (req, res) => {
  const { productoId, year } = req.body;
  const query = `
    DELETE FROM ltv
    WHERE producto_id = ? AND year = ?
  `;
  db.query(query, [productoId, year], (err, result) => {
    if (err) {
      console.error("Error eliminando el LTV:", err);
      return res
        .status(500)
        .json({ success: false, message: "Error eliminando el LTV" });
    }
    if (result.affectedRows === 0) {
      return res
        .status(404)
        .json({ success: false, message: "LTV no encontrado" });
    }
    res.json({ success: true });
  });
});

app.post("/api/featuresCategoria", (req, res) => {
  try {
    const { categoria } = req.body;
    if (!categoria) {
      return res
        .status(400)
        .json({ features: [], error: "Categoría requerida" });
    }

    const query = `
      SELECT tv.valor
      FROM segmentos s
      JOIN segmento_tipo_vehiculo stv ON s.id = stv.segmento_id
      JOIN tipos_vehiculos_infoauto tv ON stv.tipo_vehiculo_id = tv.id
      WHERE s.nombre = ?
    `;

    db.query(query, [categoria], (err, results) => {
      if (err) {
        console.error("Error al obtener features:", err);
        return res
          .status(500)
          .json({ features: [], error: "Error en la base de datos" });
      }
      const features = results.map((row) => row.valor);
      // Siempre responder JSON, aunque esté vacío
      res.json({ features });
    });
  } catch (e) {
    console.error("Error inesperado en /api/featuresCategoria:", e);
    res
      .status(500)
      .json({ features: [], error: "Error inesperado en el servidor" });
  }
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
app.post("/api/contact", (req, res) => {
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
      console.error("Error al enviar el correo:", error);
      return res.status(500).json({ message: "Error al enviar el correo" });
    }
    console.log("Correo enviado:", info.response);
    res.status(200).json({ message: "Correo enviado correctamente" });
  });
});

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
