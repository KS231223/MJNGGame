
const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const path = require("path");

const app = express();

app.use(express.static(path.join(__dirname, "../frontend/dist")));


app.get('/{*any}', (req, res) => {
  res.sendFile(path.join(__dirname, "../frontend/dist/index.html"));
});


const server = http.createServer(app);


const io = new Server(server, {
  cors: {
    origin: "http://localhost:5173",
    methods: ["GET", "POST"],
  },
});

const tables = {}; 

io.on("connection", (socket) => {
  console.log("User connected:", socket.id);


  socket.on("create-or-join-table", (tableId) => {
    if (!tables[tableId]) {
      tables[tableId] = new Set();
      console.log(`Table created: ${tableId}`);
    }

    socket.join(tableId);
    tables[tableId].add(socket.id);
    console.log(`${socket.id} joined table ${tableId}`);


    socket.emit("joined-table", tableId);
  });


  socket.on("send-message", ({ tableId, message }) => {
    if (tables[tableId] && message.trim() !== "") {
      io.to(tableId).emit("receive-message", {
        sender: socket.id,
        message,
      });
    }
  });


  socket.on("disconnect", () => {
    console.log("User disconnected:", socket.id);

    for (const [tableId, users] of Object.entries(tables)) {
      if (users.has(socket.id)) {
        users.delete(socket.id);
        console.log(`${socket.id} removed from table ${tableId}`);

        if (users.size === 0) {
          delete tables[tableId];
          console.log(`Table ${tableId} deleted (empty)`);
        }
      }
    }
  });
});


server.listen(3000, () => {
  console.log("Backend running on http://localhost:3000");
});
