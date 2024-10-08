"use client";
import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useSearchParams } from "next/navigation";
import socket from "@/socket";
import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetTitle,
    SheetTrigger,
} from "@/components/ui/sheet";
import { Menu, SmilePlus } from "lucide-react";
import EmojiPicker, { EmojiStyle } from "emoji-picker-react";

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
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const [openEmoji, setOpenEmoji] = useState(false);
    const refInput = useRef<HTMLInputElement>(null);
    const refEmoji = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (username) {
            socket.auth = { username };
            socket.connect();
            socket.on("session", ({ sessionID, userID, username }) => {
                socket.auth = { sessionID };
                localStorage.setItem("sessionID", sessionID);
                localStorage.setItem("username", username);
                socket.userID = userID;
            });

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
                socket.off("session");
                socket.off("message");
                socket.off("users");
                socket.off("user connected");
                socket.off("user disconnected");
                socket.disconnect();
            };
        }
    }, [username]);
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (
                refEmoji.current &&
                !refEmoji.current.contains(event.target as Node)
            ) {
                setOpenEmoji(false);
            }
        };

        document.addEventListener("mousedown", handleClickOutside);
        return () =>
            document.removeEventListener("mousedown", handleClickOutside);
    }, []);

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

    const Sidebar = () => (
        <div className="w-full bg-white">
            <ScrollArea className="h-[calc(100vh-5rem)]">
                {users.map((user, index) => (
                    <div
                        key={index}
                        className="flex items-center p-4 hover:bg-gray-100"
                    >
                        <Avatar className="h-10 w-10">
                            <AvatarImage src={user.avatar} alt={user.name} />
                            <AvatarFallback>{user.name[0]}</AvatarFallback>
                        </Avatar>
                        <div className="ml-4">
                            <p className="text-sm font-medium">
                                {user.name === username ? "Você" : user.name}
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
    );

    return (
        <div className="flex h-screen bg-gray-100">
            <div className="hidden md:block md:w-1/4 bg-white border-r">
                <h2 className="px-4 pt-4 text-xl font-semibold">Usuários</h2>
                <p className="px-4 text-sm text-gray-400">
                    Lista de usuários conectados no chat.
                </p>
                <Sidebar />
            </div>
            <div className="flex-1 flex flex-col">
                <div className="p-4 border-b bg-white flex justify-between items-center">
                    <h2 className="text-xl font-semibold">Chat</h2>
                    <Sheet>
                        <SheetTrigger asChild>
                            <Button
                                variant="outline"
                                size="icon"
                                className="md:hidden"
                            >
                                <Menu className="h-4 w-4" />
                            </Button>
                        </SheetTrigger>
                        <SheetContent
                            side="left"
                            className="w-[300px] sm:w-[400px]"
                        >
                            <SheetTitle>Usuários</SheetTitle>
                            <SheetDescription>
                                Lista de usuários conectados no chat.
                            </SheetDescription>
                            <Sidebar />
                        </SheetContent>
                    </Sheet>
                </div>
                <ScrollArea className="flex-1 p-4">
                    {messages.map((message) => (
                        <div key={message.id} className="mb-4">
                            <div className="flex items-start">
                                <Avatar className="h-8 w-8 mr-2">
                                    <AvatarFallback>
                                        {message.sender[0]}
                                    </AvatarFallback>
                                </Avatar>
                                <div>
                                    <p className="text-sm font-medium">
                                        {message.sender}
                                    </p>
                                    <p className="font-light">
                                        {message.content}
                                    </p>
                                </div>
                            </div>
                            <p className="text-xs text-gray-500 mt-1">
                                {message.timestamp}
                            </p>
                        </div>
                    ))}
                    <div ref={messagesEndRef} />
                </ScrollArea>
                <div className="p-4 bg-white border-t relative">
                    <div className="flex space-x-2">
                        <div className="flex-1 relative flex">
                            <Input
                                ref={refInput}
                                placeholder="Digite sua mensagem..."
                                value={inputMessage}
                                onChange={(e) =>
                                    setInputMessage(e.target.value)
                                }
                                onKeyUp={(e) =>
                                    e.key === "Enter" && sendMessage()
                                }
                            />
                            <SmilePlus
                                className="absolute right-2 top-0 translate-y-[25%] text-stone-500 cursor-pointer"
                                onClick={() => {
                                    setOpenEmoji(!openEmoji);
                                }}
                            />
                        </div>

                        <div
                            ref={refEmoji}
                            className="absolute inset -top-[450px] sm:right-20 sm:w-[350px]"
                        >
                            {/*  */}

                            <EmojiPicker
                                emojiStyle={EmojiStyle.NATIVE}
                                onEmojiClick={(emoji) => {
                                    setInputMessage(inputMessage + emoji.emoji);
                                    refInput.current?.focus();
                                }}
                                open={openEmoji}
                                width={`100%`}
                            />
                        </div>
                        <Button onClick={sendMessage}>Send</Button>
                    </div>
                </div>
            </div>
        </div>
    );
}
