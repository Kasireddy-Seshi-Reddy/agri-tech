import { type User, type InsertUser, users, predictions, chatHistory, queries, type Query } from "@shared/schema";
import { eq, desc } from "drizzle-orm";
import { db, pool } from "./db";
import connectPg from "connect-pg-simple";
import { randomUUID } from "crypto";
import session from "express-session";
import createMemoryStore from "memorystore";
import fs from "fs/promises";
import path from "path";

const MemoryStore = createMemoryStore(session);
const USERS_FILE = path.join(process.cwd(), ".users.json");
const CHATS_FILE = path.join(process.cwd(), ".chats.json");
const PREDICTIONS_FILE = path.join(process.cwd(), ".predictions.json");
const QUERIES_FILE = path.join(process.cwd(), ".queries.json");

export interface HistoryEntry {
  id: number;
  timestamp: string;
  sensorData: { N: number; P: number; K: number; moisture: number; temperature: number; ph: number; ec: number };
  prediction: { crop: string; confidence: number };
  soilHealthIndex: number;
}

export type Message = {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  isError?: boolean;
};

export interface IStorage {
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUserPassword(id: string, newPasswordHash: string): Promise<User>;
  getChatHistory(userId: string): Promise<Message[]>;
  saveChatHistory(userId: string, messages: Message[]): Promise<void>;
  getPredictions(userId: string): Promise<HistoryEntry[]>;
  addPrediction(userId: string, entry: HistoryEntry): Promise<void>;
  deletePrediction(userId: string, id?: number): Promise<void>;
  deleteUser(id: string): Promise<void>;
  updateUserBanStatus(id: string, isBanned: boolean): Promise<User>;
  getAllUsers(): Promise<User[]>;
  getAllPredictions(): Promise<(HistoryEntry & { userId: string })[]>;
  getAllChatHistory(): Promise<(Message & { userId: string })[]>;
  getOverviewStats(): Promise<{ totalUsers: number, totalPredictions: number, totalChats: number }>;
  createQuery(userId: string, question: string): Promise<Query>;
  getQueriesByUser(userId: string): Promise<Query[]>;
  getAllQueries(): Promise<Query[]>;
  answerQuery(queryId: number, answer: string): Promise<Query>;
  sessionStore: session.Store;
}

export class MemStorage implements IStorage {
  private users: Map<string, User>;
  private chats: Map<string, Message[]>;
  private predictions: Map<string, HistoryEntry[]>;
  private queries: Map<number, Query>;
  private queryIdCounter = 1;
  sessionStore: session.Store;

  constructor() {
    this.users = new Map();
    this.chats = new Map();
    this.predictions = new Map();
    this.queries = new Map();
    this.sessionStore = new MemoryStore({
      checkPeriod: 86400000,
    });
    Promise.all([
      this.loadUsers(),
      this.loadChats(),
      this.loadPredictions(),
      this.loadQueries()
    ]).catch(console.error);
  }

  private async loadUsers() {
    try {
      const data = await fs.readFile(USERS_FILE, "utf-8");
      this.users = new Map(Object.entries(JSON.parse(data)));
    } catch (error: any) {
      if (error.code !== "ENOENT") console.error("Failed to load users:", error);
    }
  }

  private async saveUsers() {
    try {
      await fs.writeFile(USERS_FILE, JSON.stringify(Object.fromEntries(this.users), null, 2), "utf-8");
    } catch (error) {
      console.error("Failed to save users:", error);
    }
  }

  private async loadChats() {
    try {
      const data = await fs.readFile(CHATS_FILE, "utf-8");
      this.chats = new Map(Object.entries(JSON.parse(data)));
    } catch (error: any) {
      if (error.code !== "ENOENT") console.error("Failed to load chats:", error);
    }
  }

  private async saveChats() {
    try {
      await fs.writeFile(CHATS_FILE, JSON.stringify(Object.fromEntries(this.chats), null, 2), "utf-8");
    } catch (error) {
      console.error("Failed to save chats:", error);
    }
  }

  private async loadPredictions() {
    try {
      const data = await fs.readFile(PREDICTIONS_FILE, "utf-8");
      this.predictions = new Map(Object.entries(JSON.parse(data)));
    } catch (error: any) {
      if (error.code !== "ENOENT") console.error("Failed to load predictions:", error);
    }
  }

  private async savePredictions() {
    try {
      await fs.writeFile(PREDICTIONS_FILE, JSON.stringify(Object.fromEntries(this.predictions), null, 2), "utf-8");
    } catch (error) {
      console.error("Failed to save predictions:", error);
    }
  }

  private async loadQueries() {
    try {
      const data = await fs.readFile(QUERIES_FILE, "utf-8");
      const parsed = JSON.parse(data);
      this.queries = new Map(Object.entries(parsed).map(([k, v]) => [Number(k), v as Query]));
      if (this.queries.size > 0) {
        this.queryIdCounter = Math.max(...Array.from(this.queries.keys())) + 1;
      }
    } catch (error: any) {
      if (error.code !== "ENOENT") console.error("Failed to load queries:", error);
    }
  }

  private async saveQueries() {
    try {
      await fs.writeFile(QUERIES_FILE, JSON.stringify(Object.fromEntries(this.queries), null, 2), "utf-8");
    } catch (error) {
      console.error("Failed to save queries:", error);
    }
  }

  async getUser(id: string): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find((user) => user.username === username);
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = randomUUID();
    const user: User = { ...insertUser, id };
    this.users.set(id, user);
    await this.saveUsers();
    return user;
  }

  async updateUserPassword(id: string, newPasswordHash: string): Promise<User> {
    const user = this.users.get(id);
    if (!user) throw new Error("User not found");
    const updatedUser = { ...user, password: newPasswordHash };
    this.users.set(id, updatedUser);
    await this.saveUsers();
    return updatedUser;
  }

  async getChatHistory(userId: string): Promise<Message[]> {
    return this.chats.get(userId) || [];
  }

  async saveChatHistory(userId: string, messages: Message[]): Promise<void> {
    this.chats.set(userId, messages);
    await this.saveChats();
  }

  async getPredictions(userId: string): Promise<HistoryEntry[]> {
    return this.predictions.get(userId) || [];
  }

  async addPrediction(userId: string, entry: HistoryEntry): Promise<void> {
    const current = this.predictions.get(userId) || [];
    current.unshift(entry);
    if (current.length > 50) current.pop();
    this.predictions.set(userId, current);
    await this.savePredictions();
  }

  async deletePrediction(userId: string, id?: number): Promise<void> {
    if (id === undefined) {
      this.predictions.set(userId, []);
    } else {
      const current = this.predictions.get(userId) || [];
      this.predictions.set(userId, current.filter(e => e.id !== id));
    }
    await this.savePredictions();
  }

  async deleteUser(id: string): Promise<void> {
    this.users.delete(id);
    await this.saveUsers();
  }

  async updateUserBanStatus(id: string, isBanned: boolean): Promise<User> {
    const user = this.users.get(id);
    if (!user) throw new Error("User not found");
    const updatedUser = { ...user, isBanned };
    this.users.set(id, updatedUser);
    await this.saveUsers();
    return updatedUser;
  }

  async createQuery(userId: string, question: string): Promise<Query> {
    const query: Query = {
      id: this.queryIdCounter++,
      userId,
      question,
      answer: null,
      status: "pending",
      timestamp: new Date().toISOString()
    };
    this.queries.set(query.id, query);
    await this.saveQueries();
    return query;
  }

  async getQueriesByUser(userId: string): Promise<Query[]> {
    return Array.from(this.queries.values())
      .filter(q => q.userId === userId)
      .sort((a, b) => b.id - a.id);
  }

  async getAllQueries(): Promise<Query[]> {
    return Array.from(this.queries.values()).sort((a, b) => b.id - a.id);
  }

  async answerQuery(queryId: number, answer: string): Promise<Query> {
    const query = this.queries.get(queryId);
    if (!query) throw new Error("Query not found");
    const updated = { ...query, answer, status: "answered" };
    this.queries.set(queryId, updated);
    await this.saveQueries();
    return updated;
  }

  async getAllUsers(): Promise<User[]> {
    return Array.from(this.users.values());
  }

  async getAllPredictions(): Promise<(HistoryEntry & { userId: string })[]> {
    const all: (HistoryEntry & { userId: string })[] = [];
    for (const [userId, entries] of this.predictions.entries()) {
      all.push(...entries.map(e => ({ ...e, userId })));
    }
    return all.sort((a, b) => b.id - a.id);
  }

  async getAllChatHistory(): Promise<(Message & { userId: string })[]> {
    const all: (Message & { userId: string })[] = [];
    for (const [userId, messages] of this.chats.entries()) {
      all.push(...messages.map(m => ({ ...m, userId })));
    }
    return all;
  }

  async getOverviewStats(): Promise<{ totalUsers: number, totalPredictions: number, totalChats: number }> {
    return {
      totalUsers: this.users.size,
      totalPredictions: Array.from(this.predictions.values()).reduce((acc, curr) => acc + curr.length, 0),
      totalChats: Array.from(this.chats.values()).reduce((acc, curr) => acc + curr.length, 0)
    };
  }
}

export class DatabaseStorage implements IStorage {
  sessionStore: session.Store;

  constructor() {
    if (pool) {
      const PostgresqlStore = connectPg(session);
      this.sessionStore = new PostgresqlStore({
        pool: pool,
        createTableIfMissing: true,
      });
    } else {
      this.sessionStore = new MemoryStore({ checkPeriod: 86400000 });
    }
  }

  async getUser(id: string): Promise<User | undefined> {
    if (!db) return undefined;
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    if (!db) return undefined;
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    if (!db) throw new Error("Database not configured");
    const [user] = await db.insert(users).values(insertUser).returning();
    return user;
  }

  async updateUserPassword(id: string, newPasswordHash: string): Promise<User> {
    if (!db) throw new Error("Database not configured");
    const [user] = await db.update(users).set({ password: newPasswordHash }).where(eq(users.id, id)).returning();
    return user;
  }

  async getChatHistory(userId: string): Promise<Message[]> {
    if (!db) return [];
    const results = await db.select().from(chatHistory).where(eq(chatHistory.userId, userId));
    return results.map(r => ({
      id: r.id,
      role: r.role as any,
      content: r.content,
      isError: r.isError ?? false
    }));
  }

  async saveChatHistory(userId: string, messages: Message[]): Promise<void> {
    if (!db) return;
    await db.delete(chatHistory).where(eq(chatHistory.userId, userId));
    if (messages.length === 0) return;
    await db.insert(chatHistory).values(
      messages.map(m => ({
        id: m.id,
        userId: userId,
        role: m.role,
        content: m.content,
        isError: m.isError ?? false
      }))
    );
  }

  async getPredictions(userId: string): Promise<HistoryEntry[]> {
    if (!db) return [];
    const results = await db.select().from(predictions)
      .where(eq(predictions.userId, userId))
      .orderBy(desc(predictions.id));
      
    return results.map(r => ({
      id: r.id,
      timestamp: r.timestamp,
      sensorData: r.sensorData as any,
      prediction: r.prediction as any,
      soilHealthIndex: r.soilHealthIndex
    }));
  }

  async addPrediction(userId: string, entry: HistoryEntry): Promise<void> {
    if (!db) return;
    await db.insert(predictions).values({
      userId,
      timestamp: entry.timestamp,
      sensorData: entry.sensorData,
      prediction: entry.prediction,
      soilHealthIndex: entry.soilHealthIndex
    });
  }

  async deletePrediction(userId: string, id?: number): Promise<void> {
    if (!db) return;
    if (id === undefined) {
      await db.delete(predictions).where(eq(predictions.userId, userId));
    } else {
      await db.delete(predictions).where(eq(predictions.id, id));
    }
  }

  async getAllUsers(): Promise<User[]> {
    if (!db) return [];
    return await db.select().from(users);
  }

  async getAllPredictions(): Promise<(HistoryEntry & { userId: string })[]> {
    if (!db) return [];
    const results = await db.select().from(predictions).orderBy(desc(predictions.id));
    return results.map(r => ({
      id: r.id,
      userId: r.userId,
      timestamp: r.timestamp,
      sensorData: r.sensorData as any,
      prediction: r.prediction as any,
      soilHealthIndex: r.soilHealthIndex
    }));
  }

  async getAllChatHistory(): Promise<(Message & { userId: string })[]> {
    if (!db) return [];
    const results = await db.select().from(chatHistory);
    return results.map(r => ({
      id: r.id,
      userId: r.userId,
      role: r.role as any,
      content: r.content,
      isError: r.isError ?? false
    }));
  }

  async getOverviewStats(): Promise<{ totalUsers: number, totalPredictions: number, totalChats: number }> {
    if (!db) return { totalUsers: 0, totalPredictions: 0, totalChats: 0 };
    const u = await db.select().from(users);
    const p = await db.select().from(predictions);
    const c = await db.select().from(chatHistory);
    return {
      totalUsers: u.length,
      totalPredictions: p.length,
      totalChats: c.length
    };
  }

  async deleteUser(id: string): Promise<void> {
    if (!db) return;
    await db.delete(users).where(eq(users.id, id));
  }

  async updateUserBanStatus(id: string, isBanned: boolean): Promise<User> {
    if (!db) throw new Error("Database not configured");
    const [user] = await db.update(users).set({ isBanned }).where(eq(users.id, id)).returning();
    return user;
  }

  async createQuery(userId: string, question: string): Promise<Query> {
    if (!db) throw new Error("Database not configured");
    const [query] = await db.insert(queries).values({
      userId,
      question,
      timestamp: new Date().toISOString()
    }).returning();
    return query;
  }

  async getQueriesByUser(userId: string): Promise<Query[]> {
    if (!db) return [];
    return await db.select().from(queries).where(eq(queries.userId, userId)).orderBy(desc(queries.id));
  }

  async getAllQueries(): Promise<Query[]> {
    if (!db) return [];
    return await db.select().from(queries).orderBy(desc(queries.id));
  }

  async answerQuery(queryId: number, answer: string): Promise<Query> {
    if (!db) throw new Error("Database not configured");
    const [query] = await db.update(queries)
      .set({ answer, status: "answered" })
      .where(eq(queries.id, queryId))
      .returning();
    return query;
  }
}

export const storage = process.env.DATABASE_URL ? new DatabaseStorage() : new MemStorage();
