import { drizzle } from 'drizzle-orm/node-postgres';
import { InferModel, eq,inArray } from 'drizzle-orm';
import { pgTable, serial, text, integer, timestamp } from 'drizzle-orm/pg-core';
import { Pool } from 'pg';
import dotenv from "dotenv"

dotenv.config();

export const users = pgTable('users', {
    id: serial('id').primaryKey(),
    username: text('username').notNull(),
    email: text('email').notNull(),
    password: text('password').notNull(),
    salt: text('salt'),
    sessiontoken: text('sessiontoken'),
});

export const messages = pgTable('messages', {
    id: serial('id').primaryKey(),
    conversation_id: integer('conversation_id')
        .references(() => conversations.id, { onDelete: 'cascade' })
        .notNull(),
    sender_id: integer('sender_id')
        .references(() => users.id, { onDelete: 'cascade' })
        .notNull(),
    content: text('content').notNull(),
    created_at: timestamp('created_at').defaultNow(),
});
export const conversations = pgTable('conversations', {
    id: serial('id').primaryKey(),
    createdAt: timestamp('created_at').defaultNow(),
});

// Conversation Participants table schema
export const conversationParticipants = pgTable('conversation_participants', {
    id: serial('id').primaryKey(),
    conversation_id: integer('conversation_id')
        .references(() => conversations.id, { onDelete: 'cascade' })
        .notNull(),
    user_id: integer('user_id')
        .references(() => users.id, { onDelete: 'cascade' })
        .notNull(),
});


export type User = InferModel<typeof users>;
export type NewUser = InferModel<typeof users, 'insert'>;

const pool = new Pool({
    connectionString: process.env.DB,
    user: process.env.USER,
  host: process.env.HOST,
  database: process.env.BDNAME,
  password: process.env.PASS, 
  port: Number(process.env.DBPORT) || 5432,

});

export const db = drizzle(pool);

// Function to get conversation IDs for a specific user
export const getUserConversations = async (userId: number) => {
    return await db
      .select({ conversationId: conversationParticipants.conversation_id })
      .from(conversationParticipants)
      .where(eq(conversationParticipants.user_id, userId));
  };

// Function to get details of conversations for a user
export const getConversationDetails = async (userId: number) => {
    const conversations = await getUserConversations(userId);
    const conversationIds = conversations.map(convo => convo.conversationId);
  
    return await db
      .select({
        conversationId: conversationParticipants.conversation_id,
        participantId: conversationParticipants.user_id,
        username: users.username,
      })
      .from(conversationParticipants)
      .innerJoin(users, eq(conversationParticipants.user_id, users.id))
      .where(inArray(conversationParticipants.conversation_id, conversationIds));
  };
  

export const getUsers = async () =>
    await db.select({ id: users.id, username: users.username, email: users.email }).from(users);

export const getUserByEmail = async (email: string) =>
    await db.select().from(users).where(eq(users.email, email));

export const getUserUsername = async (username: string) =>
    await db.select().from(users).where(eq(users.username, username));

export const getUserBySessionToken = async (sessionToken: string) =>
    await db.select().from(users).where(eq(users.sessiontoken, sessionToken));
export const createUser = async (newUser: NewUser) =>
    await db
        .insert(users)
        .values(newUser)
        .returning({ id: users.id, username: users.username, email: users.email });
export const updateUserById = async (id: number, updatedUser: User) =>
    await db
        .update(users)
        .set(updatedUser)
        .where(eq(users.id, id))
        .returning({ id: users.id, username: users.username, email: users.email });


// export const getConversation= async(conversationId:String) => {
//     socket.join(conversationId);
//     console.log(`User ${socket.id} joined conversation ${conversationId}`);

//     try {
//       // Fetch messages for the conversation
//       const messagesList = await db.select({}).from(messages).where(eq('conversation_id',conversationId)).orderBy('created_at');
      
//       // Emit messages to the client
//       socket.emit('loadMessages', messagesList);
//     } catch (err) {
//       console.error('Error fetching messages:', err);
//     }
//   }