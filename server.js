const express = require("express");
const http = require("http");
const app = express();

const { addUser, removeUser, getUser, getUserInRoom } = require("./users");

const server = http.createServer(app);

const io = require("socket.io")(server, {
  cors: {
    origin: "*",
  },
});

io.on("connection", (socket) => {
  console.log("user joined");

  socket.on("join", ({ name, room }, callback) => {
    // const { error, user } = addUser(id, name, room);
    const { user, error } = addUser(socket.id, name, room);

    // console.log(user);
    // console.log(error);
    if (error) {
      return callback(error);
    }
    socket.join(user.room);

    socket.emit("message", {
      user: "admin",
      text: `${user.name} welcome to the room ${user.room}`,
    });

    socket.broadcast.to(user.room).emit("message", {
      user: "admin",
      text: `${user.name} has joined the chat`,
    });

    io.to(user.room).emit("roomData", {
      room: user.room,
      users: getUserInRoom(user.room),
    });

    callback();
    // console.log(room, name);
  });

  socket.on("sendMessage", (message, callback) => {
    const user = getUser(socket.id);

    io.to(user.room).emit("message", { user: user.name, text: message });
    io.to(user.room).emit("roomData", {
      room: user.room,
      users: getUserInRoom(user.room),
    });

    callback();
  });

  socket.on("disconnect", () => {
    const user = removeUser(socket.id);
    if (user) {
      io.to(user.room).emit("message", {
        user: "admin",
        text: `${user.name} has left`,
      });
    }
  });
});
app.get("/", (req, res) => {
  res.send("hello world");
});

server.listen(5000, () => console.log("server running on port 5000"));
