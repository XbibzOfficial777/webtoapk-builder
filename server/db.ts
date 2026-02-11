import { eq, desc, and } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { InsertUser, users, githubTokens, buildConfigurations, builds, buildLogs, workflowConfigs, buildNotifications } from "../drizzle/schema";
import { ENV } from './_core/env';

let _db: ReturnType<typeof drizzle> | null = null;

// Lazily create the drizzle instance so local tooling can run without a DB.
export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    const values: InsertUser = {
      openId: user.openId,
    };
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = 'admin';
      updateSet.role = 'admin';
    }

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    await db.insert(users).values(values).onDuplicateKeyUpdate({
      set: updateSet,
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);

  return result.length > 0 ? result[0] : undefined;
}

// GitHub Token helpers
export async function upsertGithubToken(userId: number, token: {
  accessToken: string;
  refreshToken?: string;
  tokenExpiry?: Date;
  githubUsername: string;
  githubId: string;
  scope?: string;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const existing = await db
    .select()
    .from(githubTokens)
    .where(and(eq(githubTokens.userId, userId), eq(githubTokens.githubId, token.githubId)))
    .limit(1);

  if (existing.length > 0) {
    await db
      .update(githubTokens)
      .set({
        accessToken: token.accessToken,
        refreshToken: token.refreshToken,
        tokenExpiry: token.tokenExpiry,
        githubUsername: token.githubUsername,
        scope: token.scope,
        updatedAt: new Date(),
      })
      .where(eq(githubTokens.id, existing[0].id));
  } else {
    await db.insert(githubTokens).values({
      userId,
      ...token,
    });
  }
}

export async function getGithubTokenByUserId(userId: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db
    .select()
    .from(githubTokens)
    .where(eq(githubTokens.userId, userId))
    .limit(1);
  return result.length > 0 ? result[0] : undefined;
}

// Build Configuration helpers
export async function createBuildConfiguration(config: {
  userId: number;
  name: string;
  packageId: string;
  appVersion: string;
  appName: string;
  targetUrl: string;
  iconUrl?: string;
  splashUrl?: string;
  description?: string;
  repositoryName?: string;
  repositoryUrl?: string;
  isPublic?: boolean;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(buildConfigurations).values(config);
  return result;
}

export async function getBuildConfigurationById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db
    .select()
    .from(buildConfigurations)
    .where(eq(buildConfigurations.id, id))
    .limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function getBuildConfigurationsByUserId(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return await db
    .select()
    .from(buildConfigurations)
    .where(eq(buildConfigurations.userId, userId))
    .orderBy(desc(buildConfigurations.createdAt));
}

export async function updateBuildConfiguration(id: number, updates: Partial<typeof buildConfigurations.$inferInsert>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(buildConfigurations).set({ ...updates, updatedAt: new Date() }).where(eq(buildConfigurations.id, id));
}

// Build helpers
export async function createBuild(build: {
  configurationId: number;
  userId: number;
  status?: "pending" | "running" | "success" | "failed" | "cancelled";
  githubRunId?: string;
  githubRunNumber?: number;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(builds).values({
    ...build,
    status: build.status || "pending",
  });
  return result;
}

export async function getBuildById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(builds).where(eq(builds.id, id)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function getBuildsByConfigurationId(configurationId: number, limit = 50) {
  const db = await getDb();
  if (!db) return [];
  return await db
    .select()
    .from(builds)
    .where(eq(builds.configurationId, configurationId))
    .orderBy(desc(builds.createdAt))
    .limit(limit);
}

export async function updateBuild(id: number, updates: Partial<typeof builds.$inferInsert>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(builds).set({ ...updates, updatedAt: new Date() }).where(eq(builds.id, id));
}

// Build Log helpers
export async function addBuildLog(buildId: number, logContent: string, logType: "stdout" | "stderr" | "info" | "warning" | "error" = "stdout") {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.insert(buildLogs).values({
    buildId,
    logContent,
    logType,
  });
}

export async function getBuildLogs(buildId: number) {
  const db = await getDb();
  if (!db) return [];
  return await db
    .select()
    .from(buildLogs)
    .where(eq(buildLogs.buildId, buildId))
    .orderBy(buildLogs.timestamp);
}

// Workflow Config helpers
export async function createWorkflowConfig(config: {
  configurationId: number;
  workflowYaml: string;
  workflowName: string;
  isActive?: boolean;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.insert(workflowConfigs).values(config);
}

export async function getWorkflowConfigByConfigurationId(configurationId: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db
    .select()
    .from(workflowConfigs)
    .where(eq(workflowConfigs.configurationId, configurationId))
    .limit(1);
  return result.length > 0 ? result[0] : undefined;
}

// Build Notification helpers
export async function createBuildNotification(notification: {
  buildId: number;
  userId: number;
  notificationType: "email" | "toast" | "webhook";
  message?: string;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.insert(buildNotifications).values(notification);
}

export async function updateBuildNotificationStatus(id: number, status: "pending" | "sent" | "failed", sentAt?: Date) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db
    .update(buildNotifications)
    .set({ status, sentAt: sentAt || new Date() })
    .where(eq(buildNotifications.id, id));
}
