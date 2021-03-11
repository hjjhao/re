const WebSocket = require("ws");
const broadcast = require("./broadcast");
const action = require("./action");

module.exports = {
  webSocketInit(server,app) {
    const webSocketServer = new WebSocket.Server({ server });
    webSocketServer.on("connection", (webSocket) => {
      console.info("Total connected clients:", webSocketServer.clients.size);
      const clients = (app.locals.clients = webSocketServer.clients);
      webSocket.on("message", function incoming(data) {
        if (data && data.split("=")[0] == "searchKey" && data.split("=")[1]) {
          action.crawlAction(data.split("=")[1],app);
        }
        broadcast.broadcast(clients, data);
      });
    });
  },
};
