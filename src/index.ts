import express from 'express';
import http from 'http';
import bodyParser from 'body-parser';
import cookieParser from 'cookie-parser';
import compression from 'compression';
import cors from 'cors';
import { InferModel, eq } from 'drizzle-orm';
import { messages, db } from './db/users';
import 'dotenv/config';
import router from './router';
import { Server } from 'socket.io';

const app = express();

app.use(cors({ credentials: true }));
app.use(compression());
app.use(cookieParser());
app.use(bodyParser.json());
app.use('/', router);

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: 'http://localhost:5173',
    methods: ["GET", "POST"],
    credentials: true,
  }
});

const onlineUsers = new Set();

interface Message {
  id: number;
  conversation_id: number;
  sender_id: number;
  content: string;
  created_at: Date;
}

io.on('connection', (socket) => {
  console.log("User connected:", socket.id);

  socket.on('joinConversation', async (conversationId) => {
    socket.join(conversationId);
    console.log(`User ${socket.id} joined conversation ${conversationId}`);
  
    try {
      const messagesList = await db
        .select()
        .from(messages)
        .where(eq(messages.conversation_id, conversationId));
  
      socket.emit('loadMessages', messagesList);
    } catch (err) {
      console.error('Error fetching messages:', err);
    }
  });

 
  socket.on('goOnline', (userId) => {
    onlineUsers.add(userId);
    console.log(`User ${userId} is online`);
    io.emit('onlineStatusChanged', { userId, online: true });
  });

  socket.on('sendMessage', async ({ conversationId, senderId, content }) => {
    try {
     
      const [newMessage] = await db.insert(messages).values({
        conversation_id: conversationId,
        sender_id: senderId,
        content: content,
        created_at: new Date(),
      }).returning();

      
      io.to(conversationId).emit('newMessage', newMessage);
    } catch (err) {
      console.error('Error saving message:', err);
    }
  });

  
  socket.on('disconnect', (user_Id) => {
    
    let userId = Array.from(onlineUsers).find(id => id === user_Id);
    if (userId) {
      onlineUsers.delete(userId);
      console.log(`User ${userId} is offline`);
      io.emit('onlineStatusChanged', { userId, online: false });
    }
    console.log('User disconnected:', socket.id);
  });
});

server.listen(8080, () => {
  console.log('Server running...');
});
