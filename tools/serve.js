#!/usr/bin/env node
/*
 * Petit serveur statique local (zero dependance) pour servir dropin-test.html sur http://localhost:3000.
 * A utiliser si "npx serve" est bloque (policy PowerShell). Node est deja requis par get-token.js.
 *
 * Lancer :  node serve.js
 * Puis ouvrir : http://localhost:3000/dropin-test.html
 * (Le port 3000 est obligatoire : c'est l'origine autorisee par le clientKey Adyen.)
 */
const http = require('http');
const fs = require('fs');
const path = require('path');

const ROOT = __dirname;
const PORT = process.env.PORT || 3000;
const MIME = {
  '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8', '.json': 'application/json',
  '.png': 'image/png', '.jpg': 'image/jpeg', '.svg': 'image/svg+xml', '.pem': 'text/plain',
};

http.createServer((req, res) => {
  let p = decodeURIComponent(req.url.split('?')[0]);
  if (p === '/') p = '/dropin-test.html';
  const file = path.normalize(path.join(ROOT, p));
  if (!file.startsWith(ROOT)) { res.writeHead(403); return res.end('Forbidden'); }
  fs.readFile(file, (err, data) => {
    if (err) { res.writeHead(404, { 'Content-Type': 'text/plain' }); return res.end('Not found: ' + p); }
    res.writeHead(200, { 'Content-Type': MIME[path.extname(file)] || 'application/octet-stream' });
    res.end(data);
  });
}).listen(PORT, () => {
  console.log('\n  Kit test -> http://localhost:' + PORT + '/dropin-test.html');
  console.log('  Ctrl+C pour arreter.\n');
});
