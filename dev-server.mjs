// dev-server.mjs
//
// Servidor estático mínimo para probar Atlas Learning en local.
// Deliberadamente no usa ninguna dependencia externa ni bundler:
// Software Architecture C9 dice que esta fase no elige librerías ni
// frameworks, y el proyecto es HTML/CSS/JS ES Modules puro (C1). Este
// script solo sirve archivos tal cual existen en disco.
//
// Uso: node dev-server.mjs [puerto]
// Luego abrir http://localhost:<puerto>/

import http from 'node:http';
import fs from 'node:fs/promises';
import path from 'node:path';

const PORT = Number(process.argv[2]) || 8080;
const ROOT = process.cwd();

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.woff2': 'font/woff2',
};

const server = http.createServer(async (req, res) => {
  try {
    const urlPath = decodeURIComponent(new URL(req.url, 'http://localhost').pathname);
    let filePath = path.join(ROOT, urlPath === '/' ? 'index.html' : urlPath);

    let stat;
    try {
      stat = await fs.stat(filePath);
    } catch {
      // Ruta no encontrada: en una SPA con hash-routing esto solo
      // debería pasar para paths "limpios" reales, nunca para rutas
      // internas de la app (que viven en el hash, nunca se envían al
      // servidor). Se sirve 404.html, igual que haría GitHub Pages.
      filePath = path.join(ROOT, '404.html');
      stat = await fs.stat(filePath).catch(() => null);
      if (!stat) {
        res.writeHead(404).end('Not found');
        return;
      }
    }

    if (stat.isDirectory()) {
      filePath = path.join(filePath, 'index.html');
    }

    const ext = path.extname(filePath);
    const body = await fs.readFile(filePath);
    res.writeHead(200, { 'Content-Type': MIME_TYPES[ext] ?? 'application/octet-stream' });
    res.end(body);
  } catch (err) {
    res.writeHead(500).end('Internal error: ' + String(err));
  }
});

server.listen(PORT, () => {
  console.log(`Atlas Learning sirviendo en http://localhost:${PORT}/`);
});
