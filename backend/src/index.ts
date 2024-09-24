import { createServer } from "node:http";
import { Server } from "socket.io";

const PORT = 3333;
const httpServer = createServer();
const io = new Server(httpServer, {
    cors: {
        origin: "http://localhost:3000",
    },
});

io.use((socket, next) => {
    const username = socket.handshake.auth.username;
    if (!username) {
        return next(new Error("invalid username"));
    }
    socket.username = username;
    next();
});

io.on("connection", (socket) => {
    console.log(`${socket.username} connected`);

    const users = [];
    for (let [id, socket] of io.of("/").sockets) {
        users.push({
            id: id,
            name: socket.username,
            status: "online",
            avatar: "",
        });
    }
    socket.emit("users", users);
    socket.broadcast.emit("user connected", {
        id: socket.id,
        name: socket.username,
        status: "online",
        avatar: "",
    });

    socket.on("message", (message) => {
        console.log(
            `Mensagem no servidor: ${socket.username}: ${JSON.stringify(
                message
            )}`
        );

        socket.broadcast.emit("message", message);
    });

    socket.on("disconnect", () => {
        console.log(`${socket.username} disconnected`);
    });
});
httpServer.listen(PORT, () => {
    console.log("listening on *: ", PORT);
});
