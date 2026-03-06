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
const adminSocketMap: Map<string, string> = new Map();

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

    socket.on("register-admin", ({ adminId }) => {
      adminSocketMap.set(adminId, socket.id);
      console.log("Admin Socket Map:", adminSocketMap);
      console.log("Admin connected:", adminId);
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
      // If it was a trainer, remove & notify
      for (const [trainerId, sockId] of trainerSocketMap.entries()) {
        if (sockId === socket.id) {
          trainerSocketMap.delete(trainerId);
          io.emit("user-status-change", { userId: trainerId, isOnline: false });
        }
      }
      // If it was an admin, remove
      for (const [adminId, sockId] of adminSocketMap.entries()) {
        if (sockId === socket.id) {
          adminSocketMap.delete(adminId);
        }
      }
    });


// 1. Participant enters a room
socket.on("join-video-room", ({ sessionId, userId, name, role }) => {
    socket.join(sessionId);
    console.log(`User ${name} (${role}) joined room ${sessionId}`); // Confirm this shows in Terminal

    // Use socket.to() so only OTHER people in the room get this
    socket.to(sessionId).emit("user-joined", {
        fromSocketId: socket.id,
        userId,
        name,
        role
    });
});

// 2. Relay the Offer (Peer A -> Server -> Peer B)
socket.on("send-signal", ({ toSocketId, signal, fromName, role }) => {
    io.to(toSocketId).emit("receive-signal", {
        signal,
        fromSocketId: socket.id,
        fromName,
        role
    });
});

// 3. Relay the Return Signal (Peer B -> Server -> Peer A)
socket.on("return-signal", ({ toSocketId, signal }) => {
    io.to(toSocketId).emit("receiving-returned-signal", {
        signal,
        fromSocketId: socket.id
    });
});

// 4. Handle Disconnection
socket.on("disconnect", () => {
    // Standard cleanup
    io.emit("user-disconnected", socket.id);
});

  });

export { io, app, server, userSocketMap, trainerSocketMap, adminSocketMap };
