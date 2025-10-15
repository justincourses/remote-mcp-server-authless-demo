import { sql } from "drizzle-orm";
import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

export const testTable = sqliteTable("test", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
  createdAt: integer("created_at", { mode: "timestamp" }).default(sql`CURRENT_TIMESTAMP`),
});

export const conversationTable = sqliteTable("conversations", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  sessionId: text("session_id").notNull(),
  userQuestion: text("user_question").notNull(),
  aiResponse: text("ai_response").notNull(),
  logFileKey: text("log_file_key").notNull(),
  createdAt: integer("created_at", { mode: "timestamp" }).default(sql`CURRENT_TIMESTAMP`),
});

// FAQ document index table
export const faqIndexTable = sqliteTable("faq_index", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  fileName: text("file_name").notNull().unique(),
  title: text("title").notNull(),
  description: text("description"),
  tags: text("tags"), // JSON array as string
  r2Key: text("r2_key").notNull(),
  lastIndexed: integer("last_indexed", { mode: "timestamp" }).default(sql`CURRENT_TIMESTAMP`),
  createdAt: integer("created_at", { mode: "timestamp" }).default(sql`CURRENT_TIMESTAMP`),
});
