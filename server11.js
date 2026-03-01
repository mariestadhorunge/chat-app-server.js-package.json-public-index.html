const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.static("public"));

let users = []; // track connected users

io.on("connection", (socket) => {

  // Register user
  socket.on("register user", ({ name, role }) => {
    users.push({ name, role, socketId: socket.id });
    io.emit("update user list", users.map(u => u.name));
  });

  // Normal chat messages
  socket.on("chat message", (msg) => {
    io.emit("chat message", msg);
  });

  // Private messages
  socket.on("private message", ({ toName, message, fromName }) => {
    const recipient = users.find(u => u.name === toName);
    if (recipient) {
      io.to(recipient.socketId).emit("private message", {
        from: fromName,
        text: message
      });
    }
  });

  // Remove user on disconnect
  socket.on("disconnect", () => {
    users = users.filter(u => u.socketId !== socket.id);
    io.emit("update user list", users.map(u => u.name));
  });
});

server.listen(process.env.PORT || 3000, () => {
  console.log("Server running");
});