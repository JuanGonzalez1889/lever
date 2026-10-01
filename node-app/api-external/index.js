const express = require('express');
const crypto = require('crypto');
const router = express.Router();

const { validateViabilidad, validateProductos, validateSimulacion } = require('./validation');
const { consultarVerazFromPhp } = require('./verazClient');

function traceId() {
  return crypto.randomUUID();
}

router.post('/viabilidad', async (req, res) => {
  const check = validateViabilidad(req.body || {});
  if (!check.ok) {
    return res.status(400).json({ error: check.error || 'missing_fields', missing: check.missing, traceId: traceId() });
  }

  const { dni, sexo } = req.body;

  try {
    const verazResult = await consultarVerazFromPhp({ dni, sexo });
    res.json({
      dni: String(dni),
      resultado: verazResult?.resultado || 'viable',
      observaciones: verazResult?.observaciones || [],
      traceId: traceId(),
    });
  } catch (err) {
    res.status(502).json({ error: 'veraz_unavailable', traceId: traceId() });
  }
});

router.post('/productos', (req, res) => {
  const check = validateProductos(req.body || {});
  if (!check.ok) {
    return res.status(400).json({ error: 'missing_fields', missing: check.missing, traceId: traceId() });
  }

  // Esqueleto: respuesta vacía hasta integrar con la lógica real de productos
  res.json({ productos: [], traceId: traceId() });
});

router.post('/simulacion', (req, res) => {
  const check = validateSimulacion(req.body || {});
  if (!check.ok) {
    return res.status(400).json({ error: check.error || 'missing_fields', missing: check.missing, traceId: traceId() });
  }

  const { productoId, monto, plazo } = req.body;
  res.json({ productoId, monto, plazo, cuotas: [], traceId: traceId() });
});

module.exports = router;
