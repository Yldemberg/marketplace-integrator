import { pgTable, text, serial, timestamp, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const mlTokensTable = pgTable("ml_tokens", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().unique(),
  accessToken: text("access_token").notNull(),
  refreshToken: text("refresh_token"),
  expiresAt: timestamp("expires_at"),
  mlUserId: text("ml_user_id"),
  mlNickname: text("ml_nickname"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertMlTokenSchema = createInsertSchema(mlTokensTable).omit({ id: true, createdAt: true });
export type InsertMlToken = z.infer<typeof insertMlTokenSchema>;
export type MlToken = typeof mlTokensTable.$inferSelect;
