import { pgTable, text, serial, integer, boolean, decimal, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  walletAddress: text("wallet_address").notNull().unique(),
});

export const loans = pgTable("loans", {
  id: serial("id").primaryKey(),
  loanToken: text("loan_token").notNull(),
  loanAmount: decimal("loan_amount", { precision: 18, scale: 6 }).notNull(),
  collateralToken: text("collateral_token").notNull(),
  collateralAmount: decimal("collateral_amount", { precision: 18, scale: 6 }).notNull(),
  apr: decimal("apr", { precision: 5, scale: 2 }).notNull(),
  termDays: integer("term_days").notNull(),
  creator: text("creator").notNull(),
  tokenAddress: text("token_address").notNull(),
  status: text("status").notNull().default("active"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  owner: text("owner"),
  transactionHash: text("transaction_hash"),
  purchasedAt: timestamp("purchased_at"),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
  walletAddress: true,
});

export const insertLoanSchema = createInsertSchema(loans).omit({
  id: true,
  createdAt: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

export type InsertLoan = z.infer<typeof insertLoanSchema>;
export type Loan = typeof loans.$inferSelect;
