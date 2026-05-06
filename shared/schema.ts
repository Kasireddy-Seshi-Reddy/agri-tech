import { sql } from "drizzle-orm";
import { pgTable, text, varchar, serial, jsonb, boolean, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  isBanned: boolean("is_banned").default(false),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
}).extend({
  username: z.string().email("Please enter a valid email address."),
  password: z.string()
    .min(8, "Password must be at least 8 characters")
    .regex(/[a-z]/, "Must contain a lowercase letter")
    .regex(/[A-Z]/, "Must contain an uppercase letter")
    .regex(/[0-9]/, "Must contain a number")
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

export const predictions = pgTable("predictions", {
  id: serial("id").primaryKey(),
  userId: text("user_id").notNull(),
  timestamp: text("timestamp").notNull(),
  sensorData: jsonb("sensor_data").notNull(),
  prediction: jsonb("prediction").notNull(),
  soilHealthIndex: integer("soil_health_index").notNull(),
});

export const chatHistory = pgTable("chat_history", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull(),
  role: text("role").notNull(),
  content: text("content").notNull(),
  isError: boolean("is_error").default(false),
});

export const queries = pgTable("queries", {
  id: serial("id").primaryKey(),
  userId: text("user_id").notNull(),
  question: text("question").notNull(),
  answer: text("answer"),
  status: text("status").notNull().default("pending"),
  timestamp: text("timestamp").notNull(),
});

export const insertQuerySchema = createInsertSchema(queries).pick({
  question: true,
});

export type Prediction = typeof predictions.$inferSelect;
export type ChatMessage = typeof chatHistory.$inferSelect;
export type Query = typeof queries.$inferSelect;
export type InsertQuery = z.infer<typeof insertQuerySchema>;
