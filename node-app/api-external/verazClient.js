const fetch = require('node-fetch');

const PHP_BASE_URL = process.env.PHP_BASE_URL || 'http://localhost/lever/php';

async function consultarVerazFromPhp({ dni, sexo }) {
  const url = `${PHP_BASE_URL}/veraz.php`;
  const body = new URLSearchParams();
  body.append('dni', dni);
  if (sexo) body.append('sexo', sexo);

  const res = await fetch(url, { method: 'POST', body });
  if (!res.ok) throw new Error(`Veraz PHP error ${res.status}`);
  const text = await res.text();
  try {
    return JSON.parse(text);
  } catch (e) {
    return { raw: text };
  }
}

module.exports = { consultarVerazFromPhp };
