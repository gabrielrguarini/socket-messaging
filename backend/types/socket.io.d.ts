import "socket.io";

declare module "socket.io" {
    interface Socket {
        username: string;
        sessionID: string;
        userID: string;
    }
}
