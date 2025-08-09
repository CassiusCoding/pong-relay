const express = require('express');
const http = require('http');
const { WebSocketServer } = require('ws');

const app = express();
const server = http.createServer(app);
const wss = new WebSocketServer({ server, path: '/ws' });

const PORT = process.env.PORT || 3000;

app.get('/', (_req, res) => res.status(200).send('Pong relay OK'));

const rooms = new Map(); // code -> {host, client}
function code(){ return Math.random().toString(36).slice(2,6).toUpperCase(); }
function send(ws, msg){ if(ws && ws.readyState === ws.OPEN) ws.send(JSON.stringify(msg)); }
function broadcast(c, from, msg){ const r=rooms.get(c); if(!r) return; [r.host,r.client].forEach(ws=>{ if(ws && ws!==from) send(ws,msg); }); }

wss.on('connection', (ws) => {
  ws.room = null; ws.role = null;
  ws.on('message', (buf) => {
    let m; try { m = JSON.parse(buf); } catch { return; }
    if (m.t === 'create') {
      let c = code(); while (rooms.has(c)) c = code();
      rooms.set(c, { host: ws, client: null });
      ws.room = c; ws.role = 'host';
      return send(ws, { t: 'created', room: c });
    }
    if (m.t === 'join') {
      const c = (m.room || '').toUpperCase();
      const r = rooms.get(c);
      if (!r || r.client) return send(ws, { t: 'joined', ok: false });
      r.client = ws; ws.room = c; ws.role = 'client';
      send(ws, { t: 'joined', ok: true, room: c });
      return send(r.host, { t: 'joined', ok: true, room: c });
    }
    if (!ws.room || !rooms.get(ws.room)) return;
    if (m.t === 'input' && ws.role === 'client') {
      const r = rooms.get(ws.room);
      return send(r.host, { t: 'input', up: !!m.up, down: !!m.down });
    }
    if (m.t === 'state' && ws.role === 'host') {
      return broadcast(ws.room, ws, { t: 'state', s: m.s });
    }
    if (m.t === 'start' && ws.role === 'host') {
      return broadcast(ws.room, ws, { t: 'start' });
    }
  });

  ws.on('close', () => {
    const c = ws.room; if (!c) return; const r = rooms.get(c); if (!r) return;
    if (ws === r.host) { if (r.client) send(r.client, { t: 'peer_left' }); rooms.delete(c); }
    else if (ws === r.client) { rooms.set(c, { host: r.host, client: null }); if (r.host) send(r.host, { t: 'peer_left' }); }
  });
});

server.listen(PORT, () => console.log('Relay listening on :' + PORT));