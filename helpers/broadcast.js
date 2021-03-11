const WebSocket = require("ws");

module.exports = {
  broadcast(clients, message) {
    if (!clients || clients.length == 0) return;
    clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(message);
      }
    });
  },
};
