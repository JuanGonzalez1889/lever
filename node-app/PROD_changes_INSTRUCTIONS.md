Instrucciones para aplicar cambios en serverPROD.js

IMPORTANTE: Haz backup antes de editar:
cp serverPROD.js serverPROD.js.bak

1) Añadir guardado de bandera `bloqueado` en sesión
- Buscar dentro de app.post("/api/loginAgencias", ...) la sección donde validas y asignas la sesión. Después de autenticación, pega este bloque:

```js
// ---- Iniciar sesión con datos mínimos y flag bloqueado ----
req.session.agencia_email = user.email;
req.session.agencia_nombre = user.agencia || user.nombre_completo || '';
req.session.agencia_categoria = user.categoria || null;
req.session.user = req.session.user || {};
req.session.user.id = user.id;
req.session.user.email = user.email;
req.session.user.bloqueado = !!user.bloqueado;
// ---------------------------------------------------------
```

Repetir lo mismo en:
- `/auth/google/callback` donde haces `req.session.agencia_email = req.user.email;` (pegalo después)
- `/api/google-one-tap` donde haces `req.session.agencia_email = user.email;`


2) Reemplazar o actualizar `/api/check-session` por la versión que devuelve 403 cuando el usuario está bloqueado

Sustituir el handler actual por este:

```js
app.get("/api/check-session", async (req, res) => {
  try {
    const email = req.session?.agencia_email || req.session?.username;
    if (!email) return res.json({ success: false });

    const user = await db.getAgenciaUserByEmail(email);
    if (!user) return res.json({ success: false });

    if (user.bloqueado) {
      return res.status(403).json({ success: false, message: "Usuario bloqueado" });
    }

    return res.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        agencia: user.agencia,
        nombre: user.nombre_completo,
        categoria: user.categoria,
      },
    });
  } catch (err) {
    console.error("check-session error", err);
    return res.status(500).json({ success: false, error: "Error interno" });
  }
});
```

3) Añadir helpers y middlewares (si aún no están)
Pegá este bloque en la sección de utilidades, por ejemplo cerca del final del archivo, antes de la definición de rutas finales:

```js
// Comprueba bloqueo por id (promesa)
async function checkNotBlockedById(userId) {
  return new Promise((resolve, reject) => {
    db.query("SELECT bloqueado FROM agencias_users WHERE id = ?", [userId], (err, results) => {
      if (err) return reject(err);
      if (!results || !results.length) return resolve(false);
      resolve(!!results[0].bloqueado);
    });
  });
}

// Middleware para rutas (opcional)
async function checkNotBlocked(req, res, next) {
  try {
    const email = req.session?.agencia_email || (req.user && req.user.email);
    if (!email) return res.status(401).json({ success: false });
    const user = await db.getAgenciaUserByEmail(email);
    if (user && user.bloqueado) return res.status(403).json({ success: false, message: 'Cuenta bloqueada' });
    next();
  } catch (err) {
    console.error('checkNotBlocked error', err);
    res.status(500).json({ success: false });
  }
}

// Middleware simple de admin
function adminAuth(req, res, next) {
  const username = req.session?.username;
  if (!username) return res.status(401).json({ success: false });
  next();
}
```

4) Asegurar endpoint admin para bloquear/desbloquear
Si no existe, añade este endpoint (manejo robusto de columnas faltantes):

```js
app.put('/api/admin/agencias_users/:id/bloquear', adminAuth, (req, res) => {
  const { id } = req.params;
  const { bloqueado } = req.body;
  const value = bloqueado ? 1 : 0;
  const doUpdate = () => {
    db.query('UPDATE agencias_users SET bloqueado = ?, bloqueo_motivo = ? WHERE id = ?', [value, req.body.motivo || null, id], (err, result) => {
      if (err) {
        console.error('Error actualizando bloqueado:', err);
        if (err && err.code === 'ER_BAD_FIELD_ERROR') {
          console.log('Columna `bloqueado` no existe. Creando columna y reintentando...');
          db.query("ALTER TABLE agencias_users ADD COLUMN bloqueado TINYINT(1) DEFAULT 0, ADD COLUMN bloqueo_motivo TEXT NULL", (alterErr) => {
            if (alterErr) {
              console.error('Error creando columna bloqueado:', alterErr);
              return res.status(500).json({ success: false, message: 'Error creando columna bloqueado', error: alterErr.message });
            }
            db.query('UPDATE agencias_users SET bloqueado = ?, bloqueo_motivo = ? WHERE id = ?', [value, req.body.motivo || null, id], (err2, result2) => {
              if (err2) {
                console.error('Error actualizando bloqueado tras crear columna:', err2);
                return res.status(500).json({ success: false, message: 'Error actualizando usuario', error: err2.message });
              }
              return res.json({ success: true, id, bloqueado: !!value });
            });
          });
          return;
        }
        return res.status(500).json({ success: false, message: 'Error actualizando usuario', error: err.message });
      }
      res.json({ success: true, id, bloqueado: !!value });
    });
  };
  doUpdate();
});
```

5) Pruebas y despliegue
- Reiniciar Node (pm2 o systemd) y revisar logs.
- Probar login de agencia normal y con usuario bloqueado.
- Verificar `/api/check-session` devuelve 403 para bloqueados.

---
Si preferís, puedo generar un archivo parche (diff) listo para pegar en `serverPROD.js` con 3-4 cambios aplicados. Para eso necesito que me confirmes si el archivo se llama exactamente `serverPROD.js` en producción y si querés que reemplace las secciones automáticament e (yo genero el diff aquí y vos lo aplicás con `vim`).

Fin del archivo.
