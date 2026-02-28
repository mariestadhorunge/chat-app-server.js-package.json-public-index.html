const express = require("express");
const http = require("http");
const { Server } = require("socket.io");

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.static("public"));

// Socket.io
io.on("connection", (socket) => {
    console.log("En användare anslöt");

    socket.on("chat message", (msg) => {
        io.emit("chat message", msg);
    });

    socket.on("disconnect", () => {
        console.log("En användare lämnade");
    });
});

// Render sätter PORT via environment variable
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Servern kör på port ${PORT}`);
});