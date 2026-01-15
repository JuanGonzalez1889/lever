require("dotenv").config(); // Cargar variables de entorno desde .env
const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const session = require("express-session");
const mysql = require("mysql");
const path = require("path");
const nodemailer = require("nodemailer");
const passport = require("passport");
const GoogleStrategy = require("passport-google-oauth20").Strategy;
const getEmailTemplate = require("./emailTemplate");
const logoPath = path.join(__dirname, "logo-lever.png");
const moment = require("moment-timezone");

const app = express();
const PORT = process.env.PORT || 5000;

app.set("trust proxy", 1);

passport.serializeUser((user, done) => {
  console.log("SERIALIZE USER:", user);
  done(null, user);
});
passport.deserializeUser((obj, done) => {
  console.log("DESERIALIZE USER:", obj);
  done(null, obj);
});

console.log("NODE_ENV:", process.env.NODE_ENV); // Verificar que se está utilizando el .env
console.log("DB_HOST:", process.env.DB_HOST); // Verificar que se está utilizando el .env
console.log("CLIENT_URL:", process.env.CLIENT_URL); // Verificar que se está utilizando el .env

const db = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
});

const allowedOrigins = [
  process.env.CLIENT_URL,
  "https://www.lever.com.ar",
  "https://lever.com.ar",
  "http://localhost:3000",
  "http://localhost:5000",
  "http://localhost",
];

// Buscar usuario de agencia por email
db.getAgenciaUserByEmail = function (email) {
  return new Promise((resolve, reject) => {
    db.query(
      "SELECT * FROM agencias_users WHERE email = ?",
      [email],
      (err, results) => {
        if (err) return reject(err);
        resolve(results[0]);
      }
    );
  });
};

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
      secure: false, // true en producción con HTTPS
      httpOnly: true,
      sameSite: "lax",
      maxAge: 1000 * 60 * 60 * 8, // 8 horas
    },
  })
);

app.use(bodyParser.json());

// app.get("/api/check-session", (req, res) => {
//   console.log("CHECK SESSION:", req.session);
//   if (req.session && req.session.agencia_email) {
//     return res.json({ success: true, email: req.session.agencia_email });
//   } else {
//     console.log("No hay sesión activa");
//     console.log("SESSION DATA:", req.session.agencia_email);
//   }
//   res.json({ success: false });
// });

// SOLO en desarrollo: loguea con el usuario ingresado
if (process.env.NODE_ENV !== "production") {
  app.post("/api/login", (req, res) => {
    const { username } = req.body;
    req.session.username = username;
    req.session.rol = "admin"; // o busca el rol en la base si querés
    console.log("LOGIN SESSION:", req.session);
    return res.json({ success: true, username, rol: "admin" });
  });
} else {
  // Endpoint para manejar el login desde la base de datos
  app.post("/api/login", (req, res) => {
    const { username, password } = req.body;
    const query = `
    SELECT username, password, rol
    FROM users
    WHERE username = ?
  `;

    db.query(query, [username], (err, results) => {
      if (err) {
        return res.json({ success: false, message: "Error de base de datos" });
      }
      if (!results.length) {
        return res.json({ success: false, message: "Usuario no encontrado" });
      }
      const user = results[0];
      // Verifica la contraseña con bcrypt
      require("bcryptjs").compare(password, user.password, (err, isMatch) => {
        if (err || !isMatch) {
          return res.json({ success: false, message: "Contraseña incorrecta" });
        }
        req.session.username = user.username;
        req.session.rol = user.rol;
        return res.json({
          success: true,
          username: user.username,
          rol: user.rol,
        });
      });
    });
  });
}

// Validar sesión para el panel admin
app.get("/api/check-session-admin", async (req, res) => {
  const username = req.session.username;
  if (!username) return res.status(401).json({ success: false });

  db.query(
    "SELECT username, rol FROM users WHERE username = ?",
    [username],
    (err, results) => {
      if (err || !results.length) {
        return res.status(401).json({ success: false });
      }
      const user = results[0];
      res.json({
        success: true,
        user: {
          username: user.username,
          rol: user.rol,
        },
      });
    }
  );
});

app.post("/api/logout", (req, res) => {
  req.session.destroy();
  res.json({ success: true });
});

app.all("/api/logout/", (req, res) => {
  req.session.destroy(() => {
    res.json({ success: true });
  });
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

  const query = `
  SELECT p.id AS producto_id, p.nombre AS producto, p.plazo, p.interest, p.fee, p.minfee, 
         p.segmento_id, p.banco, p.categorias, p.retorno, l.year, l.value, l.show, c.minAFinanciar
  FROM productos p
  LEFT JOIN ltv l ON l.producto_id = p.id OR l.producto = p.nombre
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
          categorias: row.categorias,
          retorno: row.retorno || "CR,SR",
          plazos: {},
          ltv: {},
          producto_ids: [],
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
  const categorias = productos[selectedProductId]?.categorias || "A,B,C";
  const retorno = productos[selectedProductId]?.retorno || "CR,SR"; // ✅ AGREGAR
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
        UPDATE productos SET segmento_id = ?, retorno = ?
        WHERE id = ?
      `;
      db.query(
        updateSegmentoQuery,
        [segmento_id, retorno, productoIdPrincipal],
        (err) => {
          if (err) return reject(err);
          resolve();
        }
      );
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
          INSERT INTO productos (id, nombre, plazo, interest, fee, minfee, segmento_id, banco, categorias, retorno)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          ON DUPLICATE KEY UPDATE
            nombre = VALUES(nombre),
            interest = VALUES(interest),
            fee = VALUES(fee),
            minfee = VALUES(minfee),
            segmento_id = VALUES(segmento_id),
            banco = VALUES(banco),
            categorias = VALUES(categorias),
            retorno = VALUES(retorno)
        `;

          const feeValue = fee
            ? parseFloat(fee.toString().replace(",", "."))
            : 0;
          const interestValue = interest
            ? parseFloat(interest.toString().replace(",", "."))
            : 0;
          const minfeeValue = minfee
            ? parseFloat(minfee.toString().replace(",", "."))
            : 0;

          db.query(
            query,
            [
              productoIds[idx],
              newProductName || productos[productoId].nombre,
              plazo,
              interestValue,
              feeValue,
              minfeeValue,
              segmento_id,
              banco,
              categorias,
              retorno, // ✅ AGREGAR
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
      UPDATE productos SET banco = ?, retorno = ?
      WHERE id = ?
    `;
      db.query(
        updateBancoQuery,
        [banco, retorno, productoIdPrincipal],
        (err) => {
          if (err) return reject(err);
          resolve();
        }
      );
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
  const {
    nombre,
    minAFinanciar,
    ltv,
    plazos,
    segmento_id,
    banco,
    categorias,
    retorno,
  } = req.body; // <--- agregá banco

  if (!segmento_id || isNaN(Number(segmento_id)) || Number(segmento_id) === 0) {
    return res
      .status(400)
      .json({ success: false, message: "segmento_id inválido" });
  }

  const categoriasToSave = categorias || "A,B,C";

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
 INSERT INTO productos (nombre, plazo, interest, fee, minfee, segmento_id, banco, categorias, retorno)
 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
`;
      db.query(
        query,
        [
          nombre,
          primerPlazo,
          interest,
          fee,
          minfee,
          segmento_id,
          banco,
          categoriasToSave,
          retorno || "CR,SR",
        ], // <--- agregá banco
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
  INSERT INTO productos (nombre, plazo, interest, fee, minfee, segmento_id, banco, categorias, retorno)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
`;
          db.query(
            query,
            [
              nombre,
              plazo,
              interest,
              fee,
              minfee,
              segmento_id,
              banco,
              categoriasToSave,
              retorno || "CR,SR", // ✅ Al final también
            ],
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

// AGREGA ESTE LOG TEMPORAL para verificar que se carguen:
console.log("📧 EMAIL CONFIG:", {
  host: process.env.EMAIL_HOST,
  port: process.env.EMAIL_PORT,
  secure: process.env.EMAIL_SECURE,
  user: process.env.EMAIL_FROM,
  pass: process.env.EMAIL_PASS ? "***" : "NO CONFIGURADA",
});

// Configuración de Nodemailer
const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: parseInt(process.env.EMAIL_PORT, 10),
  secure: process.env.EMAIL_SECURE === "true", // true para 465 (SSL)
  auth: {
    user: process.env.EMAIL_FROM,
    pass: process.env.EMAIL_PASS,
  },
  tls: {
    rejectUnauthorized: false, // permite certificados autofirmados (desarrollo)
  },
});

// VERIFICA LA CONEXIÓN AL INICIAR
transporter.verify((error, success) => {
  if (error) {
    console.error("❌ Error conectando al servidor SMTP:", error);
  } else {
    console.log("✅ Servidor SMTP listo para enviar emails");
  }
});

// Ruta para manejar el formulario de contacto
app.post("/api/contact", (req, res) => {
  const { name, email, phone, message } = req.body;

  // Configuración del correo
  const mailOptions = {
    from: process.env.EMAIL_FROM,
    to: email, // Cambia esto al correo donde quieres recibir los mensajes
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

// Configura tu clientID y clientSecret de Google OAuth
passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: process.env.GOOGLE_CALLBACK_URL,
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        console.log("GOOGLE CALLBACK PROFILE:", profile);
        const email = profile.emails[0].value;
        let user = await db.getAgenciaUserByEmail(email);
        if (!user) {
          await db.createAgenciaUser({
            nombre_completo: profile.displayName,
            email,
            password: null,
            agencia: "",
            telefono: "",
            google_id: profile.id,
            email_validado: 1,
            email_token: null,
          });
          user = await db.getAgenciaUserByEmail(email);
        }
        return done(null, user);
      } catch (err) {
        console.error("ERROR EN GOOGLE CALLBACK:", err);
        return done(err);
      }
    }
  )
);

app.get(
  "/auth/google",
  passport.authenticate("google", {
    scope: ["profile", "email"],
    prompt: "select_account",
  })
);

app.get(
  "/auth/google/callback",
  (req, res, next) => {
    console.log("LLEGA A /auth/google/callback");
    next();
  },
  passport.authenticate("google", {
    failureRedirect: process.env.REDIRECT_URL,
  }),
  (req, res) => {
    console.log("AUTENTICADO GOOGLE, USER:", req.user);
    req.session.agencia_email = req.user.email;
    req.session.agencia_nombre = req.user.agencia;
    res.redirect(process.env.REDIRECT_URL);
  }
);

app.post("/api/loginAgencias", async (req, res) => {
  const { email, password } = req.body;
  const user = await db.getAgenciaUserByEmail(email);
  console.log("USER EN LOGIN AGENCIAS:", user);
  if (!user || !user.password) {
    console.log("Usuario no encontrado o sin contraseña");
    return res.json({ success: false, message: "Credenciales incorrectas" });
  }
  console.log("Comparando password");
  const validPass = await bcrypt.compare(password, user.password);
  if (!validPass) {
    return res.json({ success: false, message: "Credenciales incorrectas" });
  }

  console.log("Usuario autenticado:", user.email);
  if (!user.email_validado) {
    return res.json({
      success: false,
      message: "Debes validar tu correo antes de ingresar. Revisa tu email.",
    });
  }

  req.session.agencia_email = user.email;
  req.session.agencia_nombre = user.agencia; // ya se guardaba
  req.session.agencia_categoria = user.categoria;

  res.json({
    success: true,
    user: {
      email: user.email,
      categoria: user.categoria,
      agencia: user.agencia || "Sin agencia", // ⭐ ahora se devuelve
      nombre: user.nombre_completo || "", // opcional
    },
  });
});

const bcrypt = require("bcrypt"); // Instala con npm install bcrypt

app.post("/api/registerAgencias", async (req, res) => {
  console.log("BODY recibido en /api/registerAgencias:", req.body);
  const { nombre_completo, email, password, agencia, telefono } = req.body;
  const user = await db.getAgenciaUserByEmail(email);
  if (user) {
    return res.json({
      success: false,
      message: "El correo ya está registrado",
    });
  }
  const hash = await bcrypt.hash(password, 10);
  const email_token = crypto.randomBytes(32).toString("hex");

  await db.createAgenciaUser({
    nombre_completo,
    email,
    password: hash,
    agencia,
    telefono,
    email_token,
  });

  // Enviar email de validación
  const link = `${process.env.CLIENT_URL.replace(
    /\/$/,
    ""
  )}/validar-email.html?token=${email_token}`;
  const html = getEmailTemplate({
    titulo: "Valida tu correo",
    mensaje: `Hola ${nombre_completo},<br>Por favor valida tu correo haciendo clic en el botón de abajo.`,
    texto_boton: "Validar mi correo",
    link,
  });
  const mailOptions = {
    from: process.env.EMAIL_FROM,
    to: email,
    subject: "Valida tu correo en Lever",
    html,
  };
  transporter.sendMail(mailOptions, (error, info) => {
    if (error) {
      console.error("Error enviando email de validación:", error);
      return res.json({
        success: false,
        message: "No se pudo enviar el correo de validación.",
      });
    }
    res.json({
      success: true,
      message: "Registro exitoso. Revisa tu correo para validar la cuenta.",
    });
  });
});

// Actualiza la función:
db.createAgenciaUser = function ({
  nombre_completo,
  email,
  password,
  agencia,
  telefono,
  google_id = null,
  email_token = null,
  email_validado = 0,
  categoria = "A",
}) {
  return new Promise((resolve, reject) => {
    db.query(
      "INSERT INTO agencias_users (nombre_completo, email, password, agencia, telefono, google_id, email_validado, email_token, categoria) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)",
      [
        nombre_completo,
        email,
        password,
        agencia,
        telefono,
        google_id,
        email_validado,
        email_token,
        categoria,
      ],
      (err, result) => {
        if (err) return reject(err);
        resolve(result);
      }
    );
  });
};

// Agrega este endpoint para validar el email:
//al validar el mail, asignar categoria 'A' si no tiene ya una asignada
app.get("/api/validar-email", async (req, res) => {
  const { token } = req.query;
  if (!token) return res.json({ success: false, message: "Token inválido" });
  db.query(
    "SELECT * FROM agencias_users WHERE email_token = ?",
    [token],
    (err, results) => {
      if (err || !results.length)
        return res.json({
          success: false,
          message: "Token inválido o expirado",
        });
      db.query(
        "UPDATE agencias_users SET email_validado = 1, email_token = NULL, categoria = COALESCE(categoria, 'A') WHERE email_token = ?", // <--- AGREGAR
        [token],
        (err2) => {
          if (err2)
            return res.json({
              success: false,
              message: "Error validando el correo",
            });
          res.json({
            success: true,
            message:
              "Tu cuenta fue activada correctamente. Ya puedes iniciar sesión.",
          });
        }
      );
    }
  );
});

app.get("/api/check-session", async (req, res) => {
  let email = req.session.agencia_email || req.session.username;
  if (!email) return res.status(401).json({ success: false });

  try {
    const user = await db.getAgenciaUserByEmail(email); // Debe ser una promesa
    if (!user) return res.status(401).json({ success: false });

    const necesitaCompletarPerfil =
      user.google_id && (!user.agencia || !user.telefono);
    res.json({
      success: true,
      user: {
        email: user.email,
        agencia: user.agencia,
        telefono: user.telefono,
        google_id: user.google_id,
        nombre_completo: user.nombre_completo,
        categoria: user.categoria,
      },
      necesitaCompletarPerfil,
    });
  } catch (e) {
    res.status(500).json({ success: false, message: "Error interno" });
  }
});

app.post("/api/completarPerfilGoogle", async (req, res) => {
  const { email, agencia, telefono } = req.body;
  db.query(
    "UPDATE agencias_users SET agencia = ?, telefono = ? WHERE email = ?",
    [agencia, telefono, email],
    (err, result) => {
      if (err)
        return res.json({ success: false, message: "Error al actualizar" });
      res.json({ success: true });
    }
  );
});

const crypto = require("crypto");

// Debes tener nodemailer configurado como ya lo tienes

// Guardar los tokens en memoria (para demo, en producción usa una tabla)
const resetTokens = {};

app.post("/api/forgot-password", async (req, res) => {
  const { email } = req.body;
  // Buscar usuario en agencias_users
  const user = await db.getAgenciaUserByEmail(email);
  if (!user) {
    return res.json({
      success: false,
      message: "Si el correo existe, recibirás instrucciones.",
    });
  }
  // Generar token único
  const token = crypto.randomBytes(32).toString("hex");
  // Guardar token y expiración (1 hora)
  resetTokens[token] = { email, expires: Date.now() + 3600 * 1000 };

  // Enviar email con el enlace
  const resetUrl = `${process.env.CLIENT_URL.replace(
    /\/$/,
    ""
  )}/reset-password.html?token=${token}`;
  const html = getEmailTemplate({
    titulo: "Restablece tu contraseña",
    mensaje: `Hola,<br>Haz clic en el botón para crear una nueva contraseña para tu cuenta.`,
    texto_boton: "Restablecer contraseña",
    link: resetUrl,
  });
  const mailOptions = {
    from: process.env.EMAIL_FROM,
    to: email,
    subject: "Recuperación de contraseña - Lever",
    html,
  };
  transporter.sendMail(mailOptions, (error, info) => {
    if (error) {
      console.error("Error enviando email de recuperación:", error);
      return res.json({
        success: false,
        message: "No se pudo enviar el correo.",
      });
    }
    res.json({
      success: true,
      message: "Si el correo existe, recibirás instrucciones.",
    });
  });
});

app.post("/api/reset-password", async (req, res) => {
  const { token, password } = req.body;
  const data = resetTokens[token];
  if (!data || data.expires < Date.now()) {
    return res.json({
      success: false,
      message: "El enlace es inválido o expiró.",
    });
  }
  const email = data.email;
  const hash = await bcrypt.hash(password, 10);
  // Actualizar contraseña en agencias_users
  db.query(
    "UPDATE agencias_users SET password = ? WHERE email = ?",
    [hash, email],
    (err, result) => {
      if (err) {
        console.error("Error actualizando contraseña:", err);
        return res.json({
          success: false,
          message: "No se pudo actualizar la contraseña.",
        });
      }
      // Eliminar el token usado
      delete resetTokens[token];
      res.json({
        success: true,
        message: "Contraseña actualizada correctamente.",
      });
    }
  );
});

// Actualizar agencia y teléfono de un usuario (panel admin)
app.put("/api/admin/usuarios/:id", (req, res) => {
  const { id } = req.params;
  const { agencia, telefono } = req.body;

  // Intentamos en las posibles tablas según cómo esté tu esquema
  const tables = ["agencias_users", "usuarios", "users"];

  const tryUpdate = (idx = 0) => {
    if (idx >= tables.length) {
      return res
        .status(404)
        .json({ success: false, message: "Usuario no encontrado" });
    }
    const table = tables[idx];
    const sql = `UPDATE ${table} SET agencia = ?, telefono = ? WHERE id = ?`;
    db.query(sql, [agencia || null, telefono || null, id], (err, result) => {
      if (err) {
        // Si la tabla no existe o hay error de SQL, probamos la siguiente
        return tryUpdate(idx + 1);
      }
      if (result.affectedRows > 0) {
        return res.json({ success: true });
      }
      // Si no afectó filas, probamos la siguiente tabla
      return tryUpdate(idx + 1);
    });
  };

  tryUpdate();
});

// Actualizar agencia y teléfono (ya lo tienes, lo dejo de referencia)
app.put("/api/admin/usuarios/:id", (req, res) => {
  const { id } = req.params;
  const { agencia, telefono } = req.body;
  const tables = ["agencias_users", "usuarios", "users"];

  const tryUpdate = (idx = 0) => {
    if (idx >= tables.length)
      return res
        .status(404)
        .json({ success: false, message: "Usuario no encontrado" });
    const table = tables[idx];
    const sql = `UPDATE ${table} SET agencia = ?, telefono = ? WHERE id = ?`;
    db.query(sql, [agencia || null, telefono || null, id], (err, result) => {
      if (err) return tryUpdate(idx + 1);
      if (result.affectedRows > 0) return res.json({ success: true });
      return tryUpdate(idx + 1);
    });
  };
  tryUpdate();
});

// Actualizar categoría del usuario
app.put("/api/admin/usuarios/:id/categoria", (req, res) => {
  const { id } = req.params;
  const { categoria } = req.body;
  const tables = ["agencias_users", "usuarios", "users"];

  const tryUpdate = (idx = 0) => {
    if (idx >= tables.length)
      return res
        .status(404)
        .json({ success: false, message: "Usuario no encontrado" });
    const table = tables[idx];
    const sql = `UPDATE ${table} SET categoria = ? WHERE id = ?`;
    db.query(sql, [categoria || "A", id], (err, result) => {
      if (err) return tryUpdate(idx + 1);
      if (result.affectedRows > 0) return res.json({ success: true });
      return tryUpdate(idx + 1);
    });
  };
  tryUpdate();
});

// Actualizar email del usuario (y marcar no verificado si existen esos campos)
app.put("/api/admin/usuarios/:id/email", (req, res) => {
  const { id } = req.params;
  const { email } = req.body;
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return res.status(400).json({ success: false, message: "Email inválido" });
  }

  const tables = ["agencias_users", "usuarios", "users"];
  const tryUpdate = (idx = 0) => {
    if (idx >= tables.length)
      return res
        .status(404)
        .json({ success: false, message: "Usuario no encontrado" });
    const table = tables[idx];

    // Primero actualiza el email
    db.query(
      `UPDATE ${table} SET email = ? WHERE id = ?`,
      [email, id],
      (err, result) => {
        if (err) return tryUpdate(idx + 1);
        if (result.affectedRows > 0) {
          // Intentar marcar no verificado (si las columnas existen)
          const flagsSql = `
          UPDATE ${table}
          SET email_verificado = 0, verificado = 0, validado_email = 0, emailVerified = 0
          WHERE id = ?
        `;
          db.query(flagsSql, [id], () => {
            // Ignorar errores si alguna columna no existe
            return res.json({ success: true });
          });
        } else {
          return tryUpdate(idx + 1);
        }
      }
    );
  };
  tryUpdate();
});

// Reenviar email de verificación
app.post("/api/admin/usuarios/:id/resend-verification", (req, res) => {
  const { id } = req.params;
  const tables = ["agencias_users", "usuarios", "users"];

  const trySelect = (idx = 0) => {
    if (idx >= tables.length) {
      return res
        .status(404)
        .json({ success: false, message: "Usuario no encontrado" });
    }
    const table = tables[idx];
    db.query(
      `SELECT id, email, nombre_completo AS nombre FROM ${table} WHERE id = ?`,
      [id],
      (err, rows) => {
        if (err || !rows || rows.length === 0) return trySelect(idx + 1);

        const user = rows[0];

        // ✅ GENERAR TOKEN ÚNICO
        const email_token = crypto.randomBytes(32).toString("hex");

        // ✅ ACTUALIZAR TOKEN EN LA BD
        db.query(
          `UPDATE ${table} SET email_token = ? WHERE id = ?`,
          [email_token, id],
          (updateErr) => {
            if (updateErr) {
              console.error("Error actualizando token:", updateErr);
              return res
                .status(500)
                .json({ success: false, message: "Error al generar token" });
            }

            const verifyLink = `${process.env.CLIENT_URL.replace(
              /\/$/,
              ""
            )}/validar-email.html?token=${email_token}`;
            const html = getEmailTemplate({
              titulo: "Verificación de correo",
              mensaje: `Hola ${
                user.nombre || ""
              }, por favor verifica tu correo haciendo clic en el botón de abajo.`,
              texto_boton: "Validar mi correo",
              link: verifyLink,
            });

            transporter.sendMail(
              {
                from: process.env.EMAIL_FROM,
                to: user.email,
                subject: "Verificación de correo - Lever",
                html,
              },
              (sendErr) => {
                if (sendErr) {
                  console.error("Error enviando verificación:", sendErr);
                  return res.status(500).json({
                    success: false,
                    message: "No se pudo enviar el email",
                  });
                }
                return res.json({ success: true });
              }
            );
          }
        );
      }
    );
  };
  trySelect();
});

const { OAuth2Client } = require("google-auth-library");
const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

app.post("/api/google-one-tap", async (req, res) => {
  const { credential } = req.body;
  if (!credential)
    return res.json({ success: false, message: "Token inválido" });

  try {
    const ticket = await googleClient.verifyIdToken({
      idToken: credential,
      audience: process.env.GOOGLE_CLIENT_ID,
    });
    const payload = ticket.getPayload();
    const email = payload.email;
    const nombre_completo = payload.name;
    const google_id = payload.sub;

    let user = await db.getAgenciaUserByEmail(email);
    console.log("USER EN GOOGLE ONE TAP:", user);
    if (!user) {
      await db.createAgenciaUser({
        nombre_completo,
        email,
        password: null,
        agencia: "",
        telefono: "",
        google_id,
        email_validado: 1,
        email_token: null,
      });
      user = await db.getAgenciaUserByEmail(email);
    }

    req.session.agencia_email = user.email;
    req.session.agencia_nombre = user.agencia; // ya se guardaba
    console.log("SESSION DESPUÉS DE GOOGLE ONE TAP:", req.session);

    res.json({
      success: true,
      user: {
        email: user.email,
        agencia: user.agencia || "Sin agencia", // ⭐ ahora se devuelve
        nombre: user.nombre_completo || nombre_completo || "",
        categoria: user.categoria, // opcional
      },
    });
  } catch (e) {
    console.error("Error en Google One Tap:", e);
    res.json({
      success: false,
      message: "No se pudo validar el token de Google",
    });
  }
});

app.get("/api/admin/usuarios", (req, res) => {
  const sql = `
    SELECT
      id,
      nombre_completo,
      email,
      agencia,
      telefono,
      categoria,
      created_at,
      email_validado              AS email_verificado,  -- flag para el front
      email_validado              AS email_validado,
      0                           AS verificado,
      0                           AS validado_email
    FROM agencias_users
    ORDER BY created_at DESC
  `;
  db.query(sql, (err, results) => {
    if (err) {
      console.error("Error fetching usuarios:", err);
      return res
        .status(500)
        .json({ success: false, message: "Error fetching usuarios" });
    }
    res.json(results);
  });
});

// Actualizar categoría de usuario
app.put("/api/admin/usuarios/:id/categoria", (req, res) => {
  const { categoria } = req.body;
  if (!["A", "B", "C"].includes(categoria)) {
    return res
      .status(400)
      .json({ success: false, message: "Categoría inválida" });
  }

  db.query(
    "UPDATE agencias_users SET categoria = ? WHERE id = ?",
    [categoria, req.params.id],
    (err, result) => {
      if (err) {
        console.error("Error actualizando categoría:", err);
        return res.status(500).json({ success: false, error: err });
      }
      res.json({ success: true });
    }
  );
});

// Obtener productos filtrados por categoría del usuario
app.get("/api/productos-por-categoria", (req, res) => {
  const { categoria } = req.query;

  if (!categoria) {
    return res.status(400).json({
      success: false,
      message: "Categoría requerida",
    });
  }

  // Buscar productos que contengan la categoría del usuario
  db.query(
    `SELECT p.nombre, p.segmento_id, s.nombre AS segmento_nombre, p.banco, p.categorias 
     FROM productos p 
     LEFT JOIN segmentos s ON p.segmento_id = s.id 
     WHERE FIND_IN_SET(?, p.categorias) > 0`,
    [categoria],
    (err, results) => {
      if (err) {
        console.error("Error fetching productos por categoría:", err);
        return res
          .status(500)
          .json({ success: false, message: "Error fetching productos" });
      }
      res.json(results);
    }
  );
});

// Actualizar categorías de un producto
app.put("/api/productos/:id/categorias", (req, res) => {
  let { categorias } = req.body;
  console.log(
    `📝 Actualizando producto ${req.params.id} con categorías: "${categorias}"`
  ); // <--- AGREGAR

  // Normalizar: permitir string vacío "", y A,B,C en cualquier orden
  if (categorias === undefined) {
    return res
      .status(400)
      .json({ success: false, message: "Categorías requeridas" });
  }
  if (typeof categorias !== "string") {
    return res
      .status(400)
      .json({ success: false, message: "Formato inválido" });
  }

  categorias = categorias.trim(); // puede quedar "" válido

  // Validar contenido si no está vacío
  if (categorias.length > 0) {
    const parts = categorias
      .split(",")
      .map((c) => c.trim())
      .filter(Boolean);
    const valid = ["A", "B", "C"];
    // Si hay algo no válido, 400
    if (parts.some((c) => !valid.includes(c))) {
      return res
        .status(400)
        .json({ success: false, message: "Categorías inválidas" });
    }
    // Eliminar duplicados y ordenar opcionalmente
    categorias = Array.from(new Set(parts)).join(",");
  }

  db.query(
    "UPDATE productos SET categorias = ? WHERE id = ?",
    [categorias, req.params.id],
    (err, result) => {
      if (err) {
        console.error("Error actualizando categorías:", err);
        return res.status(500).json({ success: false, error: err });
      }
      res.json({ success: true });
    }
  );
});

app.use(passport.initialize());
app.use(passport.session());

app.use(express.static(path.join(__dirname, ".."))); // Sirve todo lo de /lever

app.use((req, res, next) => {
  console.log("COOKIE DE SESIÓN:", req.headers.cookie);
  console.log("SESSION DATA:", req.session);
  next();
});

const cron = require("node-cron");

// Ejecutar hoy a las 14:00 (hora del servidor)
cron.schedule("0 18 * * 5", () => {
  console.log("Enviando reporte semanal de usuarios (Viernes 18:00)...");
  enviarReporteUsuariosSemana();
});

const ExcelJS = require("exceljs");

// Función para enviar el reporte semanal
async function enviarReporteUsuariosSemana(req, res) {
  try {
    db.query(
      `SELECT nombre_completo, email, agencia, created_at
       FROM agencias_users
       WHERE created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)
       ORDER BY created_at DESC`,
      async (err, rows) => {
        if (err) {
          console.error(
            "Error consultando usuarios para el reporte semanal:",
            err
          );
          if (res) return res.status(500).json({ success: false, error: err });
          return;
        }
        if (!rows.length) {
          console.log("No hay usuarios nuevos esta semana.");
          if (res)
            return res.json({
              success: true,
              message: "No hay usuarios nuevos esta semana.",
            });
          return;
        }

        // Crear el Excel primero
        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet("Usuarios Semana");

        // Agregar imagen al workbook
        const imageId = workbook.addImage({
          filename: logoPath,
          extension: "png", // o 'jpeg' según tu archivo
        });
        worksheet.addImage(imageId, {
          tl: { col: 0, row: 0 },
          ext: { width: 200, height: 40 },
        });

        // Agregar 2 filas vacías antes del header (header en la fila 3)
        worksheet.addRow([]);
        worksheet.addRow([]);

        // Agregar header manualmente en la fila 6
        worksheet.addRow(["Nombre", "Email", "Agencia", "Fecha"]);

        // Agregar los datos
        rows.forEach((u) => {
          worksheet.addRow([
            u.nombre_completo || "",
            u.email || "",
            u.agencia || "",
            u.created_at
              ? u.created_at.toISOString().slice(0, 19).replace("T", " ")
              : "",
          ]);
        });

        // (Opcional) Ajustar el ancho de columnas manualmente:
        worksheet.getColumn(1).width = 30;
        worksheet.getColumn(2).width = 30;
        worksheet.getColumn(3).width = 30;
        worksheet.getColumn(4).width = 22;

        // Guardar el Excel en memoria
        const buffer = await workbook.xlsx.writeBuffer();

        // Enviar el mail con el Excel adjunto
        transporter.sendMail(
          {
            from: `"Lever Notificaciones" <${process.env.EMAIL_FROM}>`,
            to: "alejandro.amado@lever.com.ar, sandro.pippo@lever.com.ar, juan.gonzalez@lever.com.ar",
            subject: "Usuarios registrados esta semana",
            text: "Adjunto encontrarás el listado de usuarios registrados esta semana.",
            attachments: [
              {
                filename: "usuarios_semana.xlsx",
                content: buffer,
                contentType:
                  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
              },
            ],
          },
          (error, info) => {
            if (error) {
              console.error("Error enviando reporte semanal:", error);
              if (res) return res.status(500).json({ success: false, error });
            } else {
              console.log(
                "Reporte semanal de usuarios enviado:",
                info.response
              );
              if (res)
                return res.json({
                  success: true,
                  message: "Reporte enviado",
                  info: info.response,
                });
            }
          }
        );
      }
    );
  } catch (err) {
    console.error("Error en el envío manual:", err);
    if (res) return res.status(500).json({ success: false, error: err });
  }
}

// Endpoint temporal para probar manualmente
//app.get("/api/test-reporte-usuarios", enviarReporteUsuariosSemana);

//////////////////////////
//AGENCIAS PANEL INTERNO
//////////////////////////

app.get("/api/agencias", (req, res) => {
  db.query("SELECT * FROM agencias", (err, rows) => {
    if (err) return res.json({ success: false, error: err });
    res.json({ success: true, agencias: rows });
  });
});

// Agregar agencia
app.post("/api/agencias", (req, res) => {
  const {
    nombre,
    agencia,
    agente,
    comision,
    telefono,
    localidad,
    domicilio,
    provincia,
    sellado,
    observaciones,
  } = req.body;
  db.query(
    "INSERT INTO agencias (nombre, agencia, agente, comision, telefono, localidad, domicilio, provincia, sellado, observaciones) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
    [
      nombre,
      agencia,
      agente,
      comision,
      telefono,
      localidad,
      domicilio,
      provincia,
      sellado,
      observaciones,
    ],
    (err) => {
      if (err) return res.json({ success: false, error: err });
      res.json({ success: true });
    }
  );
});

// Editar agencia
app.put("/api/agencias/:id", (req, res) => {
  const {
    nombre,
    agencia,
    agente,
    comision,
    telefono,
    localidad,
    domicilio,
    provincia,
    sellado,
    observaciones,
  } = req.body;
  db.query(
    "UPDATE agencias SET nombre=?, agencia=?, agente=?, comision=?, telefono=?, localidad=?, domicilio=?, provincia=?, sellado=?, observaciones=? WHERE id=?",
    [
      nombre,
      agencia,
      agente,
      comision,
      telefono,
      localidad,
      domicilio,
      provincia,
      sellado,
      observaciones,
      req.params.id,
    ],
    (err) => {
      if (err) return res.json({ success: false, error: err });
      res.json({ success: true });
    }
  );
});

// Eliminar agencia
app.delete("/api/agencias/:id", (req, res) => {
  db.query("DELETE FROM agencias WHERE id=?", [req.params.id], (err) => {
    if (err) return res.json({ success: false, error: err });
    res.json({ success: true });
  });
});

// Listar agentes
app.get("/api/agentes", (req, res) => {
  db.query("SELECT * FROM agentes", (err, rows) => {
    if (err) return res.json({ success: false, error: err });
    res.json({ success: true, agentes: rows });
  });
});

// Agregar agente
app.post("/api/agentes", (req, res) => {
  console.log("BODY RECIBIDO:", req.body);
  const { nombre } = req.body;
  if (!nombre)
    return res.status(400).json({ success: false, error: "Falta nombre" });
  db.query("INSERT INTO agentes (nombre) VALUES (?)", [nombre], (err) => {
    if (err) return res.status(500).json({ success: false, error: err });
    res.json({ success: true });
  });
});

// Listar provincias
app.get("/api/provincias", (req, res) => {
  db.query("SELECT * FROM provincias", (err, rows) => {
    if (err) return res.json({ success: false, error: err });
    res.json({ success: true, provincias: rows });
  });
});

// Listar localidades por provincia
app.get("/api/localidades", (req, res) => {
  const { provincia_id } = req.query;
  db.query(
    "SELECT * FROM localidades WHERE provincia_id = ?",
    [provincia_id],
    (err, rows) => {
      if (err) return res.json({ success: false, error: err });
      res.json({ success: true, localidades: rows });
    }
  );
});

// Listar bancos
app.get("/api/bancos", (req, res) => {
  db.query("SELECT * FROM bancos ORDER BY prioridad ASC", (err, rows) => {
    if (err) return res.json({ success: false, error: err });
    res.json({ success: true, bancos: rows });
  });
});

// Agregar banco
app.post("/api/bancos", (req, res) => {
  const { nombre, prioridad } = req.body;
  db.query(
    "INSERT INTO bancos (nombre, prioridad) VALUES (?, ?)",
    [nombre, prioridad || 0],
    (err) => {
      if (err) return res.json({ success: false, error: err });
      res.json({ success: true });
    }
  );
});

// Editar banco
app.put("/api/bancos/:id", (req, res) => {
  const { nombre, prioridad } = req.body;
  db.query(
    "UPDATE bancos SET nombre = ?, prioridad = ? WHERE id = ?",
    [nombre, prioridad, req.params.id],
    (err) => {
      if (err) return res.json({ success: false, error: err });
      res.json({ success: true });
    }
  );
});
// Eliminar banco
app.delete("/api/bancos/:id", (req, res) => {
  db.query("DELETE FROM bancos WHERE id = ?", [req.params.id], (err) => {
    if (err) return res.json({ success: false, error: err });
    res.json({ success: true });
  });
});

// Listar productos de un banco
app.get("/api/productos_bancos", (req, res) => {
  const { banco_id } = req.query;
  if (banco_id) {
    db.query(
      "SELECT * FROM productos_bancos WHERE banco_id = ?",
      [banco_id],
      (err, rows) => {
        if (err) return res.json({ success: false, error: err });
        res.json({ success: true, productos: rows });
      }
    );
  } else {
    db.query("SELECT * FROM productos_bancos", (err, rows) => {
      if (err) return res.json({ success: false, error: err });
      res.json({ success: true, productos: rows });
    });
  }
});

// Agregar producto
app.post("/api/productos_bancos", (req, res) => {
  const { banco_id, nombre, tipo_credito } = req.body;
  db.query(
    "INSERT INTO productos_bancos (banco_id, nombre, tipo_credito) VALUES (?, ?, ?)",
    [banco_id, nombre, tipo_credito],
    (err) => {
      if (err) return res.json({ success: false, error: err });
      res.json({ success: true });
    }
  );
});

// Editar producto
app.put("/api/productos_bancos/:id", (req, res) => {
  const { nombre, tipo_credito } = req.body;
  db.query(
    "UPDATE productos_bancos SET nombre = ?, tipo_credito = ? WHERE id = ?",
    [nombre, tipo_credito, req.params.id],
    (err) => {
      if (err) return res.json({ success: false, error: err });
      res.json({ success: true });
    }
  );
});

// Eliminar producto
app.delete("/api/productos_bancos/:id", (req, res) => {
  db.query(
    "DELETE FROM productos_bancos WHERE id = ?",
    [req.params.id],
    (err) => {
      if (err) return res.json({ success: false, error: err });
      res.json({ success: true });
    }
  );
});

// Listar plazos de un producto
app.get("/api/banco_plazos", (req, res) => {
  const { producto_banco_id } = req.query;
  db.query(
    "SELECT * FROM banco_plazos WHERE producto_banco_id = ?",
    [producto_banco_id],
    (err, rows) => {
      if (err) return res.json({ success: false, error: err });
      res.json({ success: true, plazos: rows });
    }
  );
});

// Agregar plazo
app.post("/api/banco_plazos", (req, res) => {
  const { producto_banco_id, plazo, tna, comision } = req.body;
  db.query(
    "INSERT INTO banco_plazos (producto_banco_id, plazo, tna, comision) VALUES (?, ?, ?, ?)",
    [producto_banco_id, plazo, tna, comision],
    (err) => {
      if (err) return res.json({ success: false, error: err });
      res.json({ success: true });
    }
  );
});

// Editar plazo
app.put("/api/banco_plazos/:id", (req, res) => {
  const { plazo, tna, comision } = req.body;
  db.query(
    "UPDATE banco_plazos SET plazo = ?, tna = ?, comision = ? WHERE id = ?",
    [plazo, tna, comision, req.params.id],
    (err) => {
      if (err) return res.json({ success: false, error: err });
      res.json({ success: true });
    }
  );
});

// Eliminar plazo
app.delete("/api/banco_plazos/:id", (req, res) => {
  db.query("DELETE FROM banco_plazos WHERE id = ?", [req.params.id], (err) => {
    if (err) return res.json({ success: false, error: err });
    res.json({ success: true });
  });
});

// Eliminar todos los plazos de un producto
app.delete("/api/banco_plazos/producto/:producto_banco_id", (req, res) => {
  db.query(
    "DELETE FROM banco_plazos WHERE producto_banco_id = ?",
    [req.params.producto_banco_id],
    (err) => {
      if (err) return res.json({ success: false, error: err });
      res.json({ success: true });
    }
  );
});

// Eliminar todos los LTV de un producto
app.delete("/api/config_ltv/producto/:producto_banco_id", (req, res) => {
  db.query(
    "DELETE FROM config_ltv WHERE producto_banco_id = ?",
    [req.params.producto_banco_id],
    (err) => {
      if (err) return res.json({ success: false, error: err });
      res.json({ success: true });
    }
  );
});

// Listar LTV de un producto
app.get("/api/config_ltv", (req, res) => {
  const { producto_banco_id } = req.query;
  db.query(
    "SELECT * FROM config_ltv WHERE producto_banco_id = ?",
    [producto_banco_id],
    (err, rows) => {
      if (err) return res.json({ success: false, error: err });
      res.json({ success: true, ltvs: rows });
    }
  );
});

// Agregar LTV
app.post("/api/config_ltv", (req, res) => {
  const { producto_banco_id, anio, ltv } = req.body;
  db.query(
    "INSERT INTO config_ltv (producto_banco_id, anio, ltv) VALUES (?, ?, ?)",
    [producto_banco_id, anio, ltv],
    (err) => {
      if (err) return res.json({ success: false, error: err });
      res.json({ success: true });
    }
  );
});

// Editar LTV
app.put("/api/config_ltv/:id", (req, res) => {
  const { anio, ltv } = req.body;
  db.query(
    "UPDATE config_ltv SET anio = ?, ltv = ? WHERE id = ?",
    [anio, ltv, req.params.id],
    (err) => {
      if (err) return res.json({ success: false, error: err });
      res.json({ success: true });
    }
  );
});

// Eliminar LTV
app.delete("/api/config_ltv/:id", (req, res) => {
  db.query("DELETE FROM config_ltv WHERE id = ?", [req.params.id], (err) => {
    if (err) return res.json({ success: false, error: err });
    res.json({ success: true });
  });
});

app.get("/api/config-ltv", (req, res) => {
  db.query("SELECT * FROM config_ltv", (err, rows) => {
    if (err) return res.json({ success: false, error: err });
    res.json({ success: true, ltvs: rows });
  });
});

app.get("/api/config-bancos", (req, res) => {
  db.query("SELECT * FROM bancos", (err, rows) => {
    if (err) return res.json({ success: false, error: err });
    // Devuelve un objeto con id como clave
    const config = {};
    rows.forEach((b) => {
      config[b.id] = {
        tna: b.tna,
        comision: b.comision,
        tipo_credito: b.tipo_credito,
      };
    });
    res.json({ success: true, config });
  });
});

app.get("/api/config-bancos-plazos", (req, res) => {
  db.query("SELECT * FROM banco_plazos", (err, rows) => {
    if (err) return res.json({ success: false, error: err });
    res.json({ success: true, config: rows });
  });
});

app.get("/api/interno/productos", (req, res) => {
  db.query("SELECT * FROM productos", (err, rows) => {
    if (err) return res.json({ success: false, error: err });
    res.json(rows);
  });
});

app.get("/api/interno/ltv", (req, res) => {
  db.query("SELECT * FROM ltv", (err, rows) => {
    if (err) return res.json({ success: false, error: err });
    res.json(rows);
  });
});

// Registrar una cotización
app.post("/api/cotizaciones", (req, res) => {
  const {
    cliente_dni,
    cliente_nombre,
    cliente_apellido,
    agencia,
    producto,
    monto,
    usuario,
    vehiculo_marca,
    vehiculo_modelo,
    vehiculo_anio,
    vehiculo_precio,
    persona,
    sellado,
    observaciones,
    cotizacion_original_id,
    sexo,
    fiador_nombre,
    fiador_apellido,
    fiador_dni,
  } = req.body;

  // Guarda la fecha en la zona horaria de Buenos Aires
  const fecha = moment()
    .tz("America/Argentina/Buenos_Aires")
    .format("YYYY-MM-DD HH:mm:ss");

  db.query(
    `INSERT INTO cotizaciones (
      fecha, cliente_dni, cliente_nombre, cliente_apellido, agencia, producto, monto, usuario,
      vehiculo_marca, vehiculo_modelo, vehiculo_anio, vehiculo_precio, persona, sellado, observaciones, cotizacion_original_id, sexo, fiador_nombre, fiador_apellido, fiador_dni
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      fecha,
      cliente_dni,
      cliente_nombre,
      cliente_apellido,
      agencia,
      producto,
      monto,
      usuario,
      vehiculo_marca,
      vehiculo_modelo,
      vehiculo_anio,
      vehiculo_precio,
      persona,
      sellado,
      observaciones,
      cotizacion_original_id ? Number(cotizacion_original_id) : null,
      sexo || "",
      fiador_nombre,
      fiador_apellido,
      fiador_dni,
    ],
    (err, result) => {
      if (err) return res.status(500).json({ success: false, error: err });
      res.json({ success: true, id: result.insertId });

      if (cotizacion_original_id) {
        db.query("UPDATE cotizaciones SET recotizado = 1 WHERE id = ?", [
          cotizacion_original_id,
        ]);
      }
    }
  );
});

// Listar cotizaciones
app.get("/api/cotizaciones", (req, res) => {
  db.query("SELECT * FROM cotizaciones ORDER BY fecha DESC", (err, rows) => {
    if (err) return res.status(500).json({ success: false, error: err });
    res.json({ success: true, cotizaciones: rows });
  });
});

// Obtener cotización por ID
app.get("/api/cotizaciones/:id", (req, res) => {
  db.query(
    "SELECT * FROM cotizaciones WHERE id = ?",
    [req.params.id],
    (err, rows) => {
      if (err) return res.status(500).json({ success: false, error: err });
      if (!rows.length)
        return res
          .status(404)
          .json({ success: false, message: "No encontrada" });
      res.json({ success: true, cotizacion: rows[0] });
    }
  );
});

app.post("/api/cotizaciones/observacion", (req, res) => {
  const { id, observaciones } = req.body;
  db.query(
    "UPDATE cotizaciones SET observaciones = ? WHERE id = ?",
    [observaciones, id],
    (err) => {
      if (err) return res.status(500).json({ success: false });
      res.json({ success: true });
    }
  );
});

app.listen(PORT, "127.0.0.1", () => {
  console.log(`Server is running on http://127.0.0.1:${PORT}`);
});

app.post("/api/operaciones", (req, res) => {
  const { cod_cotizacion, nombre, apellido, dni, capital, plazo } = req.body;

  const fecha_operacion = new Date(); // Fecha y hora actual

  db.query(
    `INSERT INTO operaciones (
      cod_cotizacion, fecha_operacion, nombre, apellido, dni, capital, plazo
    ) VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [cod_cotizacion, fecha_operacion, nombre, apellido, dni, capital, plazo],
    (err, result) => {
      if (err) return res.status(500).json({ success: false, error: err });
      res.json({ success: true, id: result.insertId });
    }
  );
});

app.get("/api/operaciones", (req, res) => {
  db.query(
    "SELECT * FROM operaciones ORDER BY fecha_operacion DESC",
    (err, rows) => {
      if (err) return res.status(500).json({ success: false, error: err });
      res.json({ success: true, operaciones: rows });
    }
  );
});

app.put("/api/operaciones/:id", (req, res) => {
  const { id } = req.params;
  const campos = req.body;
  const keys = Object.keys(campos);
  const values = Object.values(campos);

  if (keys.length === 0) return res.json({ success: false });

  const setClause = keys.map((key) => `${key} = ?`).join(", ");
  db.query(
    `UPDATE operaciones SET ${setClause} WHERE id = ?`,
    [...values, id],
    (err, result) => {
      if (err) return res.status(500).json({ success: false, error: err });
      res.json({ success: true });
    }
  );
});

function requireAuth(req, res, next) {
  const email = req.session.agencia_email || req.session.username;
  if (!email) {
    return res.status(401).json({ success: false, message: "No autenticado" });
  }
  next();
}

function ensureAuthenticated(req, res, next) {
  if (req.session && req.session.userId) {
    return next();
  }
  res.status(401).json({ success: false, error: "No autenticado" });
}

app.post("/api/analytics", async (req, res) => {
  try {
    const event = req.body;

    // ⭐ ELIMINAR la conversión de zona horaria, usar NOW() de MySQL
    if (event.category === "DNI_Consulta") {
      await db.query(
        `INSERT INTO analytics_dni_consultas 
        (session_id, timestamp, dni, tipo_documento, nombre_solicitante, viabilidad, agencia, categoria_usuario) 
        VALUES (?, NOW(), ?, ?, ?, ?, ?, ?)`,
        [
          event.sessionId,
          event.dni,
          event.label,
          event.nombreSolicitante,
          event.viabilidad,
          event.agencia,
          event.categoriaUsuario,
        ]
      );
    } else {
      await db.query(
        `INSERT INTO analytics_events 
        (session_id, timestamp, category, action, label, value, step, url, metodo, agencia) 
        VALUES (?, NOW(), ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          event.sessionId,
          event.category,
          event.action,
          event.label,
          event.value,
          event.step,
          event.url,
          event.metodo || null,
          event.agencia || null,
        ]
      );
    }

    res.json({ success: true });
  } catch (error) {
    console.error("Error guardando analytics:", error);
    res.status(500).json({ error: "Error interno" });
  }
});

app.get("/api/analytics/summary", (req, res) => {
  const summarySql = `
    SELECT 
      SUM(category = 'Pantalla_1' AND action = 'dni_search') AS total_busquedas,
      SUM(category = 'Pantalla_1' AND action = 'viabilidad_resultado' AND label = 'VIABLE') AS viables,
      SUM(category = 'Pantalla_1' AND action = 'viabilidad_resultado' AND label = 'VIABLE CON OBSERVACIONES') AS observados,
      SUM(category = 'Navegacion' AND action = 'step_advance') AS avances
    FROM analytics_events
  `;
  db.query(summarySql, (err, rows) => {
    if (err) return res.status(500).json({ success: false, error: err });
    res.json({ success: true, summary: rows[0] || {} });
  });
});

app.get("/api/analytics/dni", (req, res) => {
  const dniSql = `
    SELECT 
      id,
      dni,
      nombre_solicitante,
      tipo_documento,
      viabilidad,
      agencia,
      categoria_usuario,
      timestamp
    FROM analytics_dni_consultas
    ORDER BY timestamp DESC
    LIMIT 500
  `;
  db.query(dniSql, (err, rows) => {
    if (err) return res.status(500).json({ success: false, error: err });
    res.json({ success: true, items: rows });
  });
});

app.get("/api/analytics/daily", (req, res) => {
  const sql = `
    SELECT DATE(timestamp) as dia,
      SUM(category='Auth' AND action='login_success') AS logins,
      SUM(category='UI' AND action='click') AS clicks,
      SUM(category='Pantalla_1' AND action='dni_search') AS busquedas,
      SUM(category='Navegacion' AND action='step_advance') AS avances
    FROM analytics_events
    GROUP BY dia
    ORDER BY dia DESC
    LIMIT 30;
  `;
  db.query(sql, (err, rows) => {
    if (err) return res.status(500).json({ success: false, error: err });
    res.json({ success: true, items: rows });
  });
});

app.get("/api/analytics/ui-clicks", (req, res) => {
  const sql = `
    SELECT 
      label AS boton,
      timestamp,
      1 AS clicks
    FROM analytics_events
    WHERE category='UI' AND action='click' AND label IS NOT NULL
    ORDER BY timestamp DESC
    LIMIT 1000;
  `;
  db.query(sql, (err, rows) => {
    if (err) return res.status(500).json({ success: false, error: err });
    res.json({ success: true, items: rows });
  });
});

// Métricas de selects del paso 2
app.get("/api/analytics/vehiculo-selects", requireAuth, (req, res) => {
  const sql = `
    SELECT 
      action,
      label,
      COUNT(*) as total
    FROM analytics_events
    WHERE category = 'Paso_2' 
      AND action IN ('select_categoria', 'select_anio', 'select_marca', 'select_modelo')
      AND label IS NOT NULL
    GROUP BY action, label
    ORDER BY action, total DESC;
  `;
  db.query(sql, (err, rows) => {
    if (err)
      return res.status(500).json({ success: false, error: err.message });

    // Agrupar por tipo de select
    const result = {
      categorias: [],
      anios: [],
      marcas: [],
      modelos: [],
    };

    rows.forEach((row) => {
      const item = { label: row.label, total: row.total };
      if (row.action === "select_categoria") result.categorias.push(item);
      if (row.action === "select_anio") result.anios.push(item);
      if (row.action === "select_marca") result.marcas.push(item);
      if (row.action === "select_modelo") result.modelos.push(item);
    });

    res.json({ success: true, data: result });
  });
});

// ...coloca esto justo debajo del endpoint /api/analytics/vehiculo-selects

app.get("/api/analytics/paso3", requireAuth, (req, res) => {
  const sqlProductos = `
    SELECT 
      label AS producto, 
      timestamp
    FROM analytics_events
    WHERE category='Paso_3' AND action='select_producto' AND label IS NOT NULL
    ORDER BY timestamp DESC
    LIMIT 500;
  `;
  const sqlMontos = `
    SELECT label AS monto, timestamp
    FROM analytics_events
    WHERE category='Paso_3' AND action='monto_neto_financiar' AND label IS NOT NULL
    ORDER BY timestamp DESC
    LIMIT 200;
  `;
  db.query(sqlProductos, (err, productos) => {
    if (err)
      return res.status(500).json({ success: false, error: err.message });
    db.query(sqlMontos, (err2, montos) => {
      if (err2)
        return res.status(500).json({ success: false, error: err2.message });
      res.json({ success: true, data: { productos, montos } });
    });
  });
});

// Métricas Paso 4: plazos y botones
app.get("/api/analytics/paso4", requireAuth, (req, res) => {
  const sqlPlazos = `
    SELECT 
      label, 
      timestamp
    FROM analytics_events
    WHERE category = 'Paso_4' 
      AND action = 'select_plazo'
    ORDER BY timestamp DESC
  `;

  const sqlBotones = `
    SELECT 
      label, 
      timestamp
    FROM analytics_events
    WHERE category = 'Paso_4' 
      AND action = 'click'
    ORDER BY timestamp DESC
  `;

  db.query(sqlPlazos, (err1, plazos) => {
    if (err1)
      return res.status(500).json({ success: false, error: err1.message });

    // ⭐ LIMPIAR: Extraer solo el número de cuotas del label
    const plazosLimpios = plazos.map((p) => {
      const match = (p.label || "").match(/(\d+)\s*CUOTAS?/i);
      return {
        plazo: match ? `${match[1]} CUOTAS` : p.label,
        timestamp: p.timestamp,
      };
    });

    db.query(sqlBotones, (err2, botones) => {
      if (err2)
        return res.status(500).json({ success: false, error: err2.message });
      res.json({
        success: true,
        data: {
          plazos: plazosLimpios,
          botones: botones || [],
        },
      });
    });
  });
});

app.get("/api/analytics/avances-paso", requireAuth, (req, res) => {
  const sql = `
    SELECT COUNT(*) AS total
    FROM analytics_events
    WHERE category = 'UI' 
      AND action = 'click' 
      AND label LIKE '%siguiente%';
  `;
  db.query(sql, (err, rows) => {
    if (err)
      return res.status(500).json({ success: false, error: err.message });
    res.json({ success: true, total: rows[0]?.total || 0 });
  });
});

// Endpoint para logins por usuario/mes
app.get("/api/analytics/logins-por-usuario", requireAuth, (req, res) => {
  const sql = `
    SELECT 
      label AS email,
      metodo,
      agencia,
      CAST(timestamp AS CHAR) as timestamp
    FROM analytics_events
    WHERE category = 'Auth'
      AND action = 'login_success'
      AND label IS NOT NULL
    ORDER BY timestamp DESC;
  `;
  db.query(sql, (err, rows) => {
    if (err)
      return res.status(500).json({ success: false, error: err.message });

    console.log(`📊 LOGINS ENCONTRADOS EN BD: ${rows.length}`);
    console.log("Primer registro:", rows[0]);

    res.json({ success: true, logins: rows || [] });
  });
});
