import "socket.io";

declare module "socket.io-client" {
    interface Socket {
        username: string;
        sessionID: string;
        userID: string;
    }
}
