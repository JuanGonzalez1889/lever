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

const app = express();
const PORT = process.env.PORT || 5000;

app.set("trust proxy", 1);

app.use(express.static(path.join(__dirname, ".."))); // Sirve todo lo de /lever

passport.serializeUser((user, done) => done(null, user));
passport.deserializeUser((obj, done) => done(null, obj));


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
      secure: true, // <-- Para desarrollo local, debe ser false
      httpOnly: true,
      sameSite: "lax",
    },
  })
);

app.use(passport.initialize());
app.use(passport.session());

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

      // Guardar la sesión del usuario
      req.session.username = username;
      res.json({ success: true });
    });
  });
});



app.post("/api/logout", (req, res) => {
  req.session.destroy();
  res.json({ success: true });
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
  host: process.env.EMAIL_HOST,
  port: Number(process.env.EMAIL_PORT),
  secure: process.env.EMAIL_SECURE === "true", // true para 465 (SSL)
  auth: {
    user: process.env.EMAIL_FROM,
    pass: process.env.EMAIL_PASS,
  },
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
      // Aquí puedes buscar/crear el usuario en tu base de datos
      // Ejemplo simple:
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
          email_validado: 1, // <-- ¡Esto valida automáticamente el email!
          email_token: null, // <-- AGREGA ESTO para asegurar el orden
        });
        user = await db.getAgenciaUserByEmail(email);
      }
      return done(null, user);
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
  passport.authenticate("google", { failureRedirect: "/login.html" }),
  (req, res) => {
    // Guarda la sesión
    req.session.agencia_email = req.user.email;
    req.session.agencia_nombre = req.user.agencia; // <--- NUEVO
    // Redirige al home o donde quieras
    res.redirect(process.env.REDIRECT_URL); // <--- usa la variable de entorno
  }
);

app.post("/api/loginAgencias", async (req, res) => {
  const { email, password } = req.body;
  const user = await db.getAgenciaUserByEmail(email);
  if (!user || !user.password) {
    return res.json({ success: false, message: "Credenciales incorrectas" });
  }
  const validPass = await bcrypt.compare(password, user.password);
  if (!validPass) {
    return res.json({ success: false, message: "Credenciales incorrectas" });
  }

  // Validación de correo
  if (!user.email_validado) {
    return res.json({
      success: false,
      message: "Debes validar tu correo antes de ingresar. Revisa tu email.",
    });
  }

  req.session.agencia_email = user.email;
  req.session.agencia_nombre = user.agencia; // <--- NUEVO
  res.json({ success: true, user: { email: user.email } });
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
  email_validado = 0, // <-- por defecto 0, pero Google pasa 1
}) {
  return new Promise((resolve, reject) => {
    db.query(
      "INSERT INTO agencias_users (nombre_completo, email, password, agencia, telefono, google_id, email_validado, email_token) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
      [
        nombre_completo,
        email,
        password,
        agencia,
        telefono,
        google_id,
        email_validado,
        email_token,
      ],
      (err, result) => {
        if (err) return reject(err);
        resolve(result);
      }
    );
  });
};

// Agrega este endpoint para validar el email:
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
        "UPDATE agencias_users SET email_validado = 1, email_token = NULL WHERE email_token = ?",
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

const { OAuth2Client } = require("google-auth-library");
const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

app.post("/api/google-one-tap", async (req, res) => {
  const { credential } = req.body;
  if (!credential)
    return res.json({ success: false, message: "Token inválido" });

  try {
    // Verifica el token de Google
    const ticket = await googleClient.verifyIdToken({
      idToken: credential,
      audience: process.env.GOOGLE_CLIENT_ID,
    });
    const payload = ticket.getPayload();
    const email = payload.email;
    const nombre_completo = payload.name;
    const google_id = payload.sub;

    // Busca o crea el usuario en tu base de datos
    let user = await db.getAgenciaUserByEmail(email);
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

    // Guarda la sesión
    req.session.agencia_email = user.email;
    req.session.agencia_nombre = user.agencia;

    res.json({ success: true, user: { email: user.email } });
  } catch (e) {
    console.error("Error en Google One Tap:", e);
    res.json({
      success: false,
      message: "No se pudo validar el token de Google",
    });
  }
});
app.use((err, req, res, next) => {
  console.error("ERROR GLOBAL:", err);
  res
    .status(500)
    .json({ success: false, message: err.message || "Internal Server Error" });
});
app.listen(PORT, "127.0.0.1", () => {
  console.log(`Server is running on http://127.0.0.1:${PORT}`);
});
