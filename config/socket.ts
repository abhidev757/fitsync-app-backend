import { Server } from "socket.io";
import http from "http";
import express from "express";

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: ["http://localhost:3001"],
    credentials: true,
  },
});

const userSocketMap: Map<string, string> = new Map(); 
const trainerSocketMap: Map<string, string> = new Map(); 

io.on("connection", (socket) => {
    console.log("🟢 New connection:", socket.id);
  
    // Register user or trainer
    socket.on("register-user", ({ userId }) => {
      userSocketMap.set(userId, socket.id);
      console.log("User Socket Map:",userSocketMap);
      console.log("User connected:", userId);
      for (const [trainerId, trainerSockId] of trainerSocketMap.entries()) {
        io.to(socket.id).emit("user-status-change", {
          userId: trainerId,      
          isOnline: true,
        });
      }
      io.emit("user-status-change", { userId, isOnline: true });
    });
  
    socket.on("register-trainer", ({ trainerId }) => {
      trainerSocketMap.set(trainerId, socket.id);
      console.log("Trainer Socket Map:",trainerSocketMap);
      console.log("Trainer connected:", trainerId);
      for (const [userId, userSocketId] of userSocketMap.entries()) {
        io.to(socket.id).emit("user-status-change", {
          userId,
          isOnline: true,
        });
      }
      io.emit("user-status-change", { userId: trainerId, isOnline: true });

    });
  
    // Handle private message
    socket.on("private-message", ({ toUserId, message }) => {
      const toSocketId = userSocketMap.get(toUserId) || trainerSocketMap.get(toUserId);
      console.log("SocketId:",toSocketId)
      if (toSocketId) {
        io.to(toSocketId).emit("receive-message", message);
        console.log("📤 Message sent to", toUserId);
      }
    });
  
    socket.on("disconnect", () => {
      console.log("❌ Disconnected:", socket.id);
      // If it was a user, remove & notify
      for (const [userId, sockId] of userSocketMap.entries()) {
        if (sockId === socket.id) {
          userSocketMap.delete(userId);
          io.emit("user-status-change", { userId, isOnline: false });
        }
      }
      // If it was a trainer, just remove
      for (const [trainerId, sockId] of trainerSocketMap.entries()) {
        if (sockId === socket.id) {
          trainerSocketMap.delete(trainerId);
        }
      }
    });
  });

export { io, app, server };
