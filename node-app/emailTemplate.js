function getEmailTemplate({ titulo, mensaje, texto_boton, link }) {
  return `
  <!DOCTYPE html>
  <html lang="es">
  <head>
    <meta charset="UTF-8">
    <title>${titulo}</title>
    <style>
      body { background: #f6f8fc; font-family: Arial, sans-serif; margin: 0; padding: 0; }
      .email-container {
        max-width: 420px; margin: 40px auto; background: #fff; border-radius: 12px;
        box-shadow: 0 4px 24px rgba(40,40,64,0.08); padding: 32px 24px 28px 24px; text-align: center;
      }
      .logo { font-size:2em;font-weight:bold;color:#2adc9f;margin-bottom:18px; }
      h2 { color: #282840; font-size: 1.4em; margin-bottom: 10px; }
      p { color: #444; font-size: 1.05em; margin-bottom: 28px; }
      .btn {
        display: inline-block; background: #2adc9f; color: #fff !important; text-decoration: none;
        padding: 13px 32px; border-radius: 6px; font-weight: bold; font-size: 1.1em; margin-bottom: 18px;
      }
      .footer { color: #aaa; font-size: 0.95em; margin-top: 32px; }
    </style>
  </head>
  <body>
    <div class="email-container">
      <div style="font-size:2em;font-weight:bold;color:#2adc9f;margin-bottom:18px;">LEVER</div>
      <h2>${titulo}</h2>
      <p>${mensaje}</p>
      <a href="${link}" class="btn">${texto_boton}</a>
      <div class="footer">
        Si no solicitaste este correo, puedes ignorarlo.<br>
        © Lever
      </div>
    </div>
  </body>
  </html>
  `;
}
module.exports = getEmailTemplate;
