const http = require('http');
const fs = require('fs');
const path = require('path');

// Use `PORT=3001 node server.js` when the default port is already in use.
const requestedPort = Number.parseInt(process.env.PORT, 10);
const PORT = Number.isInteger(requestedPort) && requestedPort > 0 && requestedPort < 65536
  ? requestedPort
  : 3000;
const MIME = {
  '.html': 'text/html',
  '.css': 'text/css',
  '.js': 'application/javascript',
  '.json': 'application/json',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon'
};

const server = http.createServer((req, res) => {
  let file = req.url === '/' ? '/index.html' : req.url.split('?')[0];
  const filePath = path.join(__dirname, file);
  const ext = path.extname(filePath);

  fs.readFile(filePath, (err, data) => {
    if (err) {
      res.writeHead(404);
      res.end('Not found');
      return;
    }
    res.writeHead(200, {
      'Content-Type': MIME[ext] || 'application/octet-stream',
      'Cache-Control': 'no-cache'
    });
    res.end(data);
  });
});

server.on('error', (error) => {
  if (error.code === 'EADDRINUSE') {
    console.error(`Port ${PORT} is already in use. Stop the other server or run: PORT=3001 node server.js`);
    process.exitCode = 1;
    return;
  }

  throw error;
});

server.listen(PORT, () => {
  console.log('\n  AETHER is running!\n');
  console.log('  Open in your browser:\n');
  console.log('    http://localhost:' + PORT + '\n');
  console.log('  The install icon will appear in the address bar.\n');
});
