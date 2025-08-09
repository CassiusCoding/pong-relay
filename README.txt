Pong Relay (Render/Railway)

Deploy (Render):
1) New GitHub repo → add these two files: server.js, package.json.
2) On render.com: New → Web Service → connect the repo.
3) Build command: npm install
4) Start command: node server.js
5) After deploy, your app URL will be like: https://pong-relay-xyz.onrender.com

Use it from the page:
- In your HTML, add (inside <head>):
  <meta name="ws-origin" content="wss://pong-relay-xyz.onrender.com">

The page will prefer same-origin /pong/ws, but will auto-fallback to the remote relay if same-origin fails.