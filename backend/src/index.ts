import { createServer } from "node:http";
import { Server, Socket } from "socket.io";

const PORT = 3333;
const httpServer = createServer();
const io = new Server(httpServer, {
    cors: {
        origin: "http://localhost:3000",
    },
});
interface Session {
    userID: string;
    username: string;
}
const sessionStore = {
    sessions: new Map<string, Session>(),
    findSession(sessionID: string) {
        return this.sessions.get(sessionID);
    },
    saveSession(sessionID: string, session: Session) {
        this.sessions.set(sessionID, session);
    },
};

const randomId = (): string => Math.random().toString(36).substring(2, 10);

io.use((socket, next) => {
    const sessionID = socket.handshake.auth.sessionID;

    if (sessionID) {
        const session = sessionStore.findSession(sessionID);
        if (session) {
            socket.sessionID = sessionID;
            socket.userID = session.userID;
            socket.username = session.username;
            return next();
        }
    }

    const username = socket.handshake.auth.username;
    if (!username) {
        return next(new Error("invalid username"));
    }

    // Criar nova sessão
    socket.sessionID = randomId();
    socket.userID = randomId();
    socket.username = username;
    sessionStore.saveSession(socket.sessionID, {
        userID: socket.userID,
        username: socket.username,
    });

    next();
});

io.on("connection", (socket) => {
    console.log(`${socket.username} connected`);

    socket.emit("session", {
        sessionID: socket.sessionID,
        userID: socket.userID,
        username: socket.username,
    });

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
        id: socket.userID,
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
        console.log(`${socket.username} socket ${socket.id} disconnected`);
        socket.broadcast.emit("user disconnected", socket.id);
    });
});
httpServer.listen(PORT, () => {
    console.log("listening on *: ", PORT);
});
