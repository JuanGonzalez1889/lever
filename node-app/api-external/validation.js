function requireFields(obj, fields) {
  const missing = [];
  fields.forEach((f) => {
    if (obj[f] === undefined || obj[f] === null || obj[f] === '') missing.push(f);
  });
  return missing;
}

function validateViabilidad(body) {
  const missing = requireFields(body, ['dni', 'anio', 'marca']);
  if (missing.length) return { ok: false, missing };
  if (!/^[0-9]{6,10}$/.test(String(body.dni))) return { ok: false, error: 'dni_format' };
  if (body.anio && (body.anio < 1900 || body.anio > new Date().getFullYear()+1)) return { ok: false, error: 'anio_out_of_range' };
  return { ok: true };
}

function validateProductos(body) {
  const missing = requireFields(body, ['resultadoViabilidad', 'anio', 'marca']);
  if (missing.length) return { ok: false, missing };
  return { ok: true };
}

function validateSimulacion(body) {
  const missing = requireFields(body, ['productoId', 'monto', 'plazo']);
  if (missing.length) return { ok: false, missing };
  if (isNaN(Number(body.monto)) || Number(body.monto) <= 0) return { ok: false, error: 'monto_invalid' };
  if (!Number.isInteger(body.plazo) || body.plazo <= 0) return { ok: false, error: 'plazo_invalid' };
  return { ok: true };
}

module.exports = { validateViabilidad, validateProductos, validateSimulacion };
