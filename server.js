const express = require("express");
const http = require("http");
const { Server } = require("socket.io");

const app = express();
const server = http.createServer(app);
const io = new Server(server);




const livereload = require("livereload");
const connectLivereload = require("connect-livereload");

// Starta livereload-server som kollar public-mappen
const liveReloadServer = livereload.createServer();
liveReloadServer.watch(__dirname + "/public");

// Koppla livereload till express
app.use(connectLivereload());



app.use(express.static("public")); // mappen public innehåller index.html + AdminIcon.png + ModIcon.png

let users = [];

io.on("connection", (socket) => {
  console.log("En användare anslöt");

  socket.on("join", (username, password) => {
    // Sätt status admin/mod
    socket.username = username;
    socket.isAdmin = (username === "Admin" && password === "1");
    socket.isMod = (username === "Mod" && password === "1");

    // Lägg till användare i listan
    users.push({
      name: username,
      isAdmin: socket.isAdmin,
      isMod: socket.isMod
    });

    io.emit("updateUsers", users);
    io.emit("chat message", {
      name: username,
      text: "har gått med i chatten",
      isAdmin: socket.isAdmin,
      isMod: socket.isMod
    });
  });

  socket.on("chat message", (msg) => {
    const user = users.find(u => u.name === socket.username);
    io.emit("chat message", {
      name: socket.username,
      text: msg,
      isAdmin: user?.isAdmin || false,
      isMod: user?.isMod || false
    });
  });
  
   // ────── HÄR SKA DU LÄGGA IN KICK-KODEN ──────
  // NY KOD START: Kicka användare
  socket.on("kick", (targetName) => {
    // Endast Admin kan kicka
    if (!socket.isAdmin) return;

    // Hitta socket för användaren som ska kickas
    const targetSocket = Array.from(io.sockets.sockets.values()).find(s => s.username === targetName);
    if(targetSocket){
      // Skicka meddelande om att användaren blev kickad
      targetSocket.emit("kicked", "Du har blivit kickad av Admin!");
      // Koppla bort användaren
      targetSocket.disconnect(true);
	      // Skicka meddelande till chatten att Admin kickade användaren
    io.emit("chat message", {
      name: "Admin",
      text: `har kickat ${targetName}`,
      isAdmin: true,
      isMod: false
    });
    }
  });
  // NY KOD SLUT
  //
  

  socket.on("disconnect", () => {
    if(socket.username){
      users = users.filter(u => u.name !== socket.username);
      io.emit("updateUsers", users);
      io.emit("chat message", {
        name: socket.username,
        text: "lämnade chatten",
        isAdmin: socket.isAdmin,
        isMod: socket.isMod
      });
    }
    console.log("En användare lämnade");
  });
});



const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Servern kör på port ${PORT}`);
});