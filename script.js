// Initialize Quill editor
const quill = new Quill('#editor', {
  theme: 'snow'
});

let socket;
let isManuallyTriggered = false;
let lastSentContent = '';
let reconnectTimeout = null;

// Function to connect to WebSocket
function connectWebSocket() {
  socket = new WebSocket('ws://localhost:3000');

  socket.addEventListener('open', () => {
    console.log('WebSocket connected');

    // When the connection is opened, send the latest content if any
    if (lastSentContent) {
      socket.send(JSON.stringify({
        type: 'update',
        data: lastSentContent
      }));
    }
  });

  socket.addEventListener('message', (event) => {
    try {
      const message = JSON.parse(event.data);

      // Validate message format
      if (!message.type || !message.data) {
        console.error('Invalid message format received:', message);
        return; // Ignore invalid messages
      }

      if (message.type === 'init') {
        quill.root.innerHTML = message.data; // Initialize content
        lastSentContent = message.data; // Track initial content
      }

      if (message.type === 'update') {
        // Update content only if it differs
        if (!isManuallyTriggered && quill.root.innerHTML !== message.data) {
          isManuallyTriggered = true;
          quill.root.innerHTML = message.data;
          lastSentContent = message.data; // Keep track of the last content
          isManuallyTriggered = false;
        }
      }
    } catch (err) {
      console.error('Failed to parse server message:', err);
    }
  });

  socket.addEventListener('close', () => {
    console.warn('WebSocket closed. Reconnecting in 3 seconds...');
    clearTimeout(reconnectTimeout); // Clear previous timeout
    reconnectTimeout = setTimeout(connectWebSocket, 3000); // Retry on close
  });

  socket.addEventListener('error', (err) => {
    console.error('WebSocket error:', err);
    socket.close(); // Close the socket if there’s an error
  });
}

// Initial WebSocket connection
connectWebSocket();

// Prevent sending updates if content hasn’t changed
quill.on('text-change', (delta, oldDelta, source) => {
  if (source === 'user' && socket.readyState === WebSocket.OPEN) {
    const content = quill.root.innerHTML;

    // Only send content if it has changed
    if (content !== lastSentContent) {
      socket.send(JSON.stringify({
        type: 'update',
        data: content
      }));
      lastSentContent = content; // Update the last sent content
    }
  }
});
