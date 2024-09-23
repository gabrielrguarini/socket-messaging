import { createServer } from "node:http";
import { Server } from "socket.io";

const httpServer = createServer();
const io = new Server(httpServer, {
    /* options */
});

io.on("connection", (socket) => {
    // ...
});

httpServer.listen(3000, () => {
    console.log("listening on *:3000");
});
