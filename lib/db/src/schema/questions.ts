import { pgTable, text, serial, timestamp, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const questionsTable = pgTable("questions", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  mlQuestionId: text("ml_question_id").notNull().unique(),
  pergunta: text("pergunta").notNull(),
  resposta: text("resposta"),
  status: text("status").notNull().default("UNANSWERED"),
  itemId: text("item_id").notNull(),
  thumbnail: text("thumbnail"),
  permalink: text("permalink"),
  loja: text("loja"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  answeredAt: timestamp("answered_at"),
});

export const insertQuestionSchema = createInsertSchema(questionsTable).omit({ id: true, createdAt: true });
export type InsertQuestion = z.infer<typeof insertQuestionSchema>;
export type Question = typeof questionsTable.$inferSelect;
