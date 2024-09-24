"use client";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useSearchParams } from "next/navigation";
import socket from "@/socket";

interface Message {
    id: number;
    sender: string;
    content: string;
    timestamp: string;
}

interface User {
    id: string;
    name: string;
    status: "online" | "offline";
    avatar: string;
}

export default function Home() {
    const searchParams = useSearchParams();
    const username = searchParams.get("username");
    const [messages, setMessages] = useState<Message[]>([]);
    const [users, setUsers] = useState<User[]>([]);
    const [inputMessage, setInputMessage] = useState("");

    useEffect(() => {
        if (username) {
            socket.auth = { username };
            socket.connect();

            socket.on("message", (data) => {
                setMessages((prevMessages) => [...prevMessages, data]);
            });

            socket.on("users", (data) => {
                setUsers(data);
            });
            socket.on("user connected", (data) => {
                setUsers((prevUsers) => [...prevUsers, data]);
            });
            socket.on("user disconnected", (id: string) => {
                setUsers((prevUsers) =>
                    prevUsers.filter((user) => user.id !== id)
                );
            });

            return () => {
                socket.off("message");
                socket.off("users");
                socket.off("user connected");
                socket.off("user disconnected");
                socket.disconnect();
            };
        }
    }, [username]);

    if (username === null) return null;

    const sendMessage = () => {
        if (inputMessage.trim() !== "") {
            const newMessage: Message = {
                id: messages.length + 1,
                sender: username,
                content: inputMessage,
                timestamp: new Date().toLocaleTimeString(),
            };
            socket.emit("message", newMessage);
            setMessages([...messages, newMessage]);
            setInputMessage("");
        }
    };

    return (
        <div className="flex h-screen bg-gray-100">
            <div className="w-1/4 bg-white border-r">
                <div className="p-4 border-b">
                    <h2 className="text-xl font-semibold">Pessoas</h2>
                </div>
                <ScrollArea className="h-[calc(100vh-5rem)]">
                    {users?.map((user) => (
                        <div
                            key={user.id}
                            className="flex items-center p-4 hover:bg-gray-100"
                        >
                            <Avatar className="h-10 w-10">
                                <AvatarImage
                                    src={user.avatar}
                                    alt={user.name}
                                />
                                <AvatarFallback>
                                    {user?.name?.length > 0
                                        ? user.name[0].toUpperCase()
                                        : "?"}
                                </AvatarFallback>
                            </Avatar>
                            <div className="ml-4">
                                <p className="text-sm font-medium">
                                    {user.name}
                                </p>
                                <p
                                    className={`text-xs ${
                                        user.status === "online"
                                            ? "text-green-500"
                                            : "text-gray-500"
                                    }`}
                                >
                                    {user.status}
                                </p>
                            </div>
                        </div>
                    ))}
                </ScrollArea>
            </div>
            <div className="flex-1 flex flex-col">
                <div className="p-4 border-b bg-white">
                    <h2 className="text-xl font-semibold">Chat</h2>
                </div>
                <ScrollArea className="flex-1 p-4">
                    {messages.map((message) => (
                        <div key={message.id} className="mb-4">
                            <div className="flex items-start">
                                <Avatar className="h-8 w-8 mr-2">
                                    <AvatarFallback></AvatarFallback>
                                </Avatar>
                                <div>
                                    <p className="text-sm font-medium">
                                        {message.sender}
                                    </p>
                                    <p className="text-sm">{message.content}</p>
                                </div>
                            </div>
                            <p className="text-xs text-gray-500 mt-1">
                                {message.timestamp}
                            </p>
                        </div>
                    ))}
                </ScrollArea>
                <div className="p-4 bg-white border-t">
                    <div className="flex space-x-2">
                        <Input
                            placeholder="Digite sua mensagem..."
                            value={inputMessage}
                            onChange={(e) => setInputMessage(e.target.value)}
                            onKeyUp={(e) => e.key === "Enter" && sendMessage()}
                        />
                        <Button onClick={sendMessage}>Enviar</Button>
                    </div>
                </div>
            </div>
        </div>
    );
}
