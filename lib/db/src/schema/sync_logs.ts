import { pgTable, text, serial, timestamp, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const syncLogsTable = pgTable("sync_logs", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  platform: text("platform").notNull(),
  status: text("status").notNull().default("pending"),
  message: text("message"),
  syncedAt: timestamp("synced_at").defaultNow().notNull(),
});

export const insertSyncLogSchema = createInsertSchema(syncLogsTable).omit({ id: true, syncedAt: true });
export type InsertSyncLog = z.infer<typeof insertSyncLogSchema>;
export type SyncLog = typeof syncLogsTable.$inferSelect;
