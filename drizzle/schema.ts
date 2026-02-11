import { int, mysqlEnum, mysqlTable, text, timestamp, varchar, json, boolean, longtext, decimal } from "drizzle-orm/mysql-core";
import { relations } from "drizzle-orm";

/**
 * Core user table backing auth flow.
 * Extend this file with additional tables as your product grows.
 * Columns use camelCase to match both database fields and generated types.
 */
export const users = mysqlTable("users", {
  /**
   * Surrogate primary key. Auto-incremented numeric value managed by the database.
   * Use this for relations between tables.
   */
  id: int("id").autoincrement().primaryKey(),
  /** Manus OAuth identifier (openId) returned from the OAuth callback. Unique per user. */
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

/**
 * GitHub integration tokens for each user
 */
export const githubTokens = mysqlTable("github_tokens", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  accessToken: text("accessToken").notNull(),
  refreshToken: text("refreshToken"),
  tokenExpiry: timestamp("tokenExpiry"),
  githubUsername: varchar("githubUsername", { length: 255 }).notNull(),
  githubId: varchar("githubId", { length: 64 }).notNull(),
  scope: text("scope"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type GithubToken = typeof githubTokens.$inferSelect;
export type InsertGithubToken = typeof githubTokens.$inferInsert;

/**
 * APK build configurations
 */
export const buildConfigurations = mysqlTable("build_configurations", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  packageId: varchar("packageId", { length: 255 }).notNull(),
  appVersion: varchar("appVersion", { length: 64 }).notNull(),
  appName: varchar("appName", { length: 255 }).notNull(),
  targetUrl: text("targetUrl").notNull(),
  iconUrl: text("iconUrl"),
  splashUrl: text("splashUrl"),
  description: text("description"),
  repositoryName: varchar("repositoryName", { length: 255 }),
  repositoryUrl: text("repositoryUrl"),
  isPublic: boolean("isPublic").default(false).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type BuildConfiguration = typeof buildConfigurations.$inferSelect;
export type InsertBuildConfiguration = typeof buildConfigurations.$inferInsert;

/**
 * Build history and status tracking
 */
export const builds = mysqlTable("builds", {
  id: int("id").autoincrement().primaryKey(),
  configurationId: int("configurationId").notNull(),
  userId: int("userId").notNull(),
  status: mysqlEnum("status", ["pending", "running", "success", "failed", "cancelled"]).default("pending").notNull(),
  githubRunId: varchar("githubRunId", { length: 64 }),
  githubRunNumber: int("githubRunNumber"),
  artifactUrl: text("artifactUrl"),
  artifactSize: decimal("artifactSize", { precision: 15, scale: 2 }),
  errorMessage: longtext("errorMessage"),
  startedAt: timestamp("startedAt"),
  completedAt: timestamp("completedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Build = typeof builds.$inferSelect;
export type InsertBuild = typeof builds.$inferInsert;

/**
 * Build logs for debugging and monitoring
 */
export const buildLogs = mysqlTable("build_logs", {
  id: int("id").autoincrement().primaryKey(),
  buildId: int("buildId").notNull(),
  logContent: longtext("logContent").notNull(),
  logType: mysqlEnum("logType", ["stdout", "stderr", "info", "warning", "error"]).default("stdout").notNull(),
  timestamp: timestamp("timestamp").defaultNow().notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type BuildLog = typeof buildLogs.$inferSelect;
export type InsertBuildLog = typeof buildLogs.$inferInsert;

/**
 * GitHub Actions workflow configurations
 */
export const workflowConfigs = mysqlTable("workflow_configs", {
  id: int("id").autoincrement().primaryKey(),
  configurationId: int("configurationId").notNull(),
  workflowYaml: longtext("workflowYaml").notNull(),
  workflowName: varchar("workflowName", { length: 255 }).notNull(),
  isActive: boolean("isActive").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type WorkflowConfig = typeof workflowConfigs.$inferSelect;
export type InsertWorkflowConfig = typeof workflowConfigs.$inferInsert;

/**
 * Build notifications tracking
 */
export const buildNotifications = mysqlTable("build_notifications", {
  id: int("id").autoincrement().primaryKey(),
  buildId: int("buildId").notNull(),
  userId: int("userId").notNull(),
  notificationType: mysqlEnum("notificationType", ["email", "toast", "webhook"]).notNull(),
  status: mysqlEnum("status", ["pending", "sent", "failed"]).default("pending").notNull(),
  message: text("message"),
  sentAt: timestamp("sentAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type BuildNotification = typeof buildNotifications.$inferSelect;
export type InsertBuildNotification = typeof buildNotifications.$inferInsert;

/**
 * Relations
 */
export const usersRelations = relations(users, ({ many }) => ({
  githubTokens: many(githubTokens),
  buildConfigurations: many(buildConfigurations),
  builds: many(builds),
}));

export const buildConfigurationsRelations = relations(buildConfigurations, ({ one, many }) => ({
  user: one(users, { fields: [buildConfigurations.userId], references: [users.id] }),
  builds: many(builds),
  workflowConfig: many(workflowConfigs),
}));

export const buildsRelations = relations(builds, ({ one, many }) => ({
  configuration: one(buildConfigurations, { fields: [builds.configurationId], references: [buildConfigurations.id] }),
  user: one(users, { fields: [builds.userId], references: [users.id] }),
  logs: many(buildLogs),
  notifications: many(buildNotifications),
}));