const http = require('http');
const fs = require('fs');
const path = require('path');

const MIME = {'.html':'text/html','.css':'text/css','.js':'application/javascript','.json':'application/json','.png':'image/png','.jpg':'image/jpeg','.svg':'image/svg+xml','.woff2':'font/woff2','.woff':'font/woff','.min.js':'application/javascript','.min.css':'text/css'};

http.createServer((req, res) => {
  let fp = path.join(__dirname, req.url === '/' ? '/index.html' : req.url.split('?')[0]);
  fs.readFile(fp, (err, data) => {
    if (err) { res.writeHead(404); res.end('Not found'); return; }
    const ext = path.extname(fp);
    res.writeHead(200, {'Content-Type': MIME[ext] || 'application/octet-stream'});
    res.end(data);
  });
}).listen(8080, () => console.log('Server running at http://localhost:8080'));
