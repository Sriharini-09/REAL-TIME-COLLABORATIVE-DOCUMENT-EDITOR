import { WebSocketServer } from 'ws';

const wss = new WebSocketServer({ port: 3000 });
let latestContent = '';

wss.on('connection', (ws) => {
  console.log('Client connected');

  ws.send(JSON.stringify({ type: 'init', data: latestContent }));

  ws.on('message', (message) => {
    try {
      const msg = JSON.parse(message);
      if (msg.type === 'update') {
        latestContent = msg.data;

        // Broadcast to all other clients
        wss.clients.forEach(client => {
          if (client !== ws && client.readyState === ws.OPEN) {
            client.send(JSON.stringify({ type: 'update', data: latestContent }));
          }
        });
      }
    } catch (err) {
      console.error('Invalid message received:', err);
    }
  });

  ws.on('close', () => {
    console.log('Client disconnected');
  });
});

console.log('WebSocket server running on ws://localhost:3000');
