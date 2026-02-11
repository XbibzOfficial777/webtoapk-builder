import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, router, protectedProcedure } from "./_core/trpc";
import { z } from "zod";
import * as db from "./db";
import { TRPCError } from "@trpc/server";
import { Octokit } from "octokit";

// GitHub OAuth configuration
const GITHUB_CLIENT_ID = process.env.GITHUB_CLIENT_ID || "";
const GITHUB_CLIENT_SECRET = process.env.GITHUB_CLIENT_SECRET || "";

export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return {
        success: true,
      } as const;
    }),
  }),

  // GitHub integration routers
  github: router({
    // Get GitHub OAuth URL
    getOAuthUrl: publicProcedure.query(() => {
      const scope = "repo,workflow,user:email";
      const redirectUri = `${process.env.VITE_FRONTEND_FORGE_API_URL || "http://localhost:3000"}/api/github/callback`;
      return `https://github.com/login/oauth/authorize?client_id=${GITHUB_CLIENT_ID}&redirect_uri=${redirectUri}&scope=${scope}`;
    }),

    // Handle OAuth callback
    handleCallback: publicProcedure
      .input(z.object({ code: z.string() }))
      .mutation(async ({ input, ctx }) => {
        if (!ctx.user) throw new TRPCError({ code: "UNAUTHORIZED" });

        try {
          // Exchange code for access token
          const response = await fetch("https://github.com/login/oauth/access_token", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Accept: "application/json",
            },
            body: JSON.stringify({
              client_id: GITHUB_CLIENT_ID,
              client_secret: GITHUB_CLIENT_SECRET,
              code: input.code,
            }),
          });

          const data = await response.json() as any;

          if (data.error) {
            throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: data.error_description });
          }

          // Get user info from GitHub
          const octokit = new Octokit({ auth: data.access_token });
          const userInfo = await (octokit as any).rest.users.getAuthenticated();

          // Store token in database
          await db.upsertGithubToken(ctx.user.id, {
            accessToken: data.access_token,
            refreshToken: data.refresh_token,
            tokenExpiry: data.expires_in ? new Date(Date.now() + data.expires_in * 1000) : undefined,
            githubUsername: userInfo.data.login,
            githubId: userInfo.data.id.toString(),
            scope: data.scope,
          });

          return { success: true, username: userInfo.data.login };
        } catch (error) {
          console.error("GitHub OAuth error:", error);
          throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Failed to authenticate with GitHub" });
        }
      }),

    // Get stored GitHub token
    getToken: protectedProcedure.query(async ({ ctx }) => {
      const token = await db.getGithubTokenByUserId(ctx.user.id);
      if (!token) return null;
      return {
        username: token.githubUsername,
        githubId: token.githubId,
      };
    }),

    // Create repository
    createRepository: protectedProcedure
      .input(z.object({
        repoName: z.string(),
        description: z.string().optional(),
        isPrivate: z.boolean().default(false),
      }))
      .mutation(async ({ input, ctx }) => {
        const token = await db.getGithubTokenByUserId(ctx.user.id);
        if (!token) throw new TRPCError({ code: "UNAUTHORIZED", message: "GitHub not connected" });

        try {
          const octokit = new Octokit({ auth: token.accessToken });
          const repo = await (octokit as any).rest.repos.createForAuthenticatedUser({
            name: input.repoName,
            description: input.description,
            private: input.isPrivate,
            auto_init: true,
          });

          return {
            url: repo.data.html_url,
            name: repo.data.name,
            fullName: repo.data.full_name,
          };
        } catch (error) {
          console.error("Repository creation error:", error);
          throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Failed to create repository" });
        }
      }),

    // Push workflow file to repository
    pushWorkflow: protectedProcedure
      .input(z.object({
        owner: z.string(),
        repo: z.string(),
        workflowYaml: z.string(),
        workflowName: z.string(),
      }))
      .mutation(async ({ input, ctx }) => {
        const token = await db.getGithubTokenByUserId(ctx.user.id);
        if (!token) throw new TRPCError({ code: "UNAUTHORIZED", message: "GitHub not connected" });

        try {
          const octokit = new Octokit({ auth: token.accessToken });
          const path = `.github/workflows/${input.workflowName}.yml`;

          // Get current file if exists
          let sha: string | undefined;
          try {
            const existing = await (octokit as any).rest.repos.getContent({
              owner: input.owner,
              repo: input.repo,
              path,
            });
            sha = (existing.data as any).sha;
          } catch {
            // File doesn't exist, that's fine
          }

          await (octokit as any).rest.repos.createOrUpdateFileContents({
            owner: input.owner,
            repo: input.repo,
            path,
            message: `Add ${input.workflowName} workflow`,
            content: Buffer.from(input.workflowYaml).toString("base64"),
            sha,
          });

          return { success: true };
        } catch (error) {
          console.error("Workflow push error:", error);
          throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Failed to push workflow" });
        }
      }),

    // Set repository secrets
    setRepositorySecrets: protectedProcedure
      .input(z.object({
        owner: z.string(),
        repo: z.string(),
        secrets: z.record(z.string(), z.string()),
      }))
      .mutation(async ({ input, ctx }) => {
        const token = await db.getGithubTokenByUserId(ctx.user.id);
        if (!token) throw new TRPCError({ code: "UNAUTHORIZED", message: "GitHub not connected" });

        try {
          const octokit = new Octokit({ auth: token.accessToken });

          for (const [key, value] of Object.entries(input.secrets)) {
            try {
              await (octokit as any).rest.actions.createOrUpdateRepoSecret({
                owner: input.owner,
                repo: input.repo,
                secret_name: key,
                encrypted_value: value as string,
              } as any);
            } catch (err) {
              console.error(`Failed to set secret ${key}:`, err);
            }
          }

          return { success: true };
        } catch (error) {
          console.error("Secrets setup error:", error);
          throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Failed to set repository secrets" });
        }
      }),

    // Get workflow runs
    getWorkflowRuns: protectedProcedure
      .input(z.object({
        owner: z.string(),
        repo: z.string(),
        workflowId: z.string(),
        limit: z.number().default(10),
      }))
      .query(async ({ input, ctx }) => {
        const token = await db.getGithubTokenByUserId(ctx.user.id);
        if (!token) throw new TRPCError({ code: "UNAUTHORIZED", message: "GitHub not connected" });

        try {
          const octokit = new Octokit({ auth: token.accessToken });
          const runs = await (octokit as any).rest.actions.listWorkflowRuns({
            owner: input.owner,
            repo: input.repo,
            workflow_id: input.workflowId,
            per_page: input.limit,
          });

          return runs.data.workflow_runs.map((run: any) => ({
            id: run.id,
            number: run.run_number,
            status: run.status,
            conclusion: run.conclusion,
            createdAt: run.created_at,
            updatedAt: run.updated_at,
            htmlUrl: run.html_url,
          }));
        } catch (error) {
          console.error("Workflow runs error:", error);
          throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Failed to fetch workflow runs" });
        }
      }),

    // Get workflow run logs
    getWorkflowRunLogs: protectedProcedure
      .input(z.object({
        owner: z.string(),
        repo: z.string(),
        runId: z.number(),
      }))
      .query(async ({ input, ctx }) => {
        const token = await db.getGithubTokenByUserId(ctx.user.id);
        if (!token) throw new TRPCError({ code: "UNAUTHORIZED", message: "GitHub not connected" });

        try {
          const octokit = new Octokit({ auth: token.accessToken });
          const logs = await (octokit as any).rest.actions.downloadWorkflowRunLogs({
            owner: input.owner,
            repo: input.repo,
            run_id: input.runId,
          });

          return logs.data;
        } catch (error) {
          console.error("Workflow logs error:", error);
          throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Failed to fetch workflow logs" });
        }
      }),

    // Get artifacts
    getArtifacts: protectedProcedure
      .input(z.object({
        owner: z.string(),
        repo: z.string(),
        runId: z.number(),
      }))
      .query(async ({ input, ctx }) => {
        const token = await db.getGithubTokenByUserId(ctx.user.id);
        if (!token) throw new TRPCError({ code: "UNAUTHORIZED", message: "GitHub not connected" });

        try {
          const octokit = new Octokit({ auth: token.accessToken });
          const artifacts = await (octokit as any).rest.actions.listWorkflowRunArtifacts({
            owner: input.owner,
            repo: input.repo,
            run_id: input.runId,
          });

          return artifacts.data.artifacts.map((artifact: any) => ({
            id: artifact.id,
            name: artifact.name,
            size: artifact.size_in_bytes,
            createdAt: artifact.created_at,
            expiresAt: artifact.expires_at,
          }));
        } catch (error) {
          console.error("Artifacts error:", error);
          throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Failed to fetch artifacts" });
        }
      }),

    // Download artifact
    downloadArtifact: protectedProcedure
      .input(z.object({
        owner: z.string(),
        repo: z.string(),
        artifactId: z.number(),
      }))
      .query(async ({ input, ctx }) => {
        const token = await db.getGithubTokenByUserId(ctx.user.id);
        if (!token) throw new TRPCError({ code: "UNAUTHORIZED", message: "GitHub not connected" });

        try {
          const octokit = new Octokit({ auth: token.accessToken });
          const url = await (octokit as any).rest.actions.downloadArtifact({
            owner: input.owner,
            repo: input.repo,
            artifact_id: input.artifactId,
            archive_format: "zip",
          });

          return { url: (url as any).url };
        } catch (error) {
          console.error("Download artifact error:", error);
          throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Failed to download artifact" });
        }
      }),
  }),

  // Build configuration routers
  configurations: router({
    // Create new configuration
    create: protectedProcedure
      .input(z.object({
        name: z.string(),
        packageId: z.string(),
        appVersion: z.string(),
        appName: z.string(),
        targetUrl: z.string().url(),
        iconUrl: z.string().optional(),
        splashUrl: z.string().optional(),
        description: z.string().optional(),
        isPublic: z.boolean().default(false),
      }))
      .mutation(async ({ input, ctx }) => {
        await db.createBuildConfiguration({
          userId: ctx.user.id,
          ...input,
        });
        const configs = await db.getBuildConfigurationsByUserId(ctx.user.id);
        const newConfig = configs[0];
        return { id: newConfig?.id || 0 };
      }),

    // Get all configurations for user
    list: protectedProcedure.query(async ({ ctx }) => {
      return await db.getBuildConfigurationsByUserId(ctx.user.id);
    }),

    // Get single configuration
    get: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input, ctx }) => {
        const config = await db.getBuildConfigurationById(input.id);
        if (!config || config.userId !== ctx.user.id) {
          throw new TRPCError({ code: "FORBIDDEN" });
        }
        return config;
      }),

    // Update configuration
    update: protectedProcedure
      .input(z.object({
        id: z.number(),
        name: z.string().optional(),
        packageId: z.string().optional(),
        appVersion: z.string().optional(),
        appName: z.string().optional(),
        targetUrl: z.string().url().optional(),
        iconUrl: z.string().optional(),
        splashUrl: z.string().optional(),
        description: z.string().optional(),
        isPublic: z.boolean().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        const config = await db.getBuildConfigurationById(input.id);
        if (!config || config.userId !== ctx.user.id) {
          throw new TRPCError({ code: "FORBIDDEN" });
        }

        const { id, ...updates } = input;
        await db.updateBuildConfiguration(id, updates);
        return { success: true };
      }),

    // Delete configuration
    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input, ctx }) => {
        const config = await db.getBuildConfigurationById(input.id);
        if (!config || config.userId !== ctx.user.id) {
          throw new TRPCError({ code: "FORBIDDEN" });
        }
        // TODO: Implement soft delete or cascading delete
        return { success: true };
      }),
  }),

  // Build management routers
  builds: router({
    // Trigger a new build
    trigger: protectedProcedure
      .input(z.object({
        configurationId: z.number(),
      }))
      .mutation(async ({ input, ctx }) => {
        const config = await db.getBuildConfigurationById(input.configurationId);
        if (!config || config.userId !== ctx.user.id) {
          throw new TRPCError({ code: "FORBIDDEN" });
        }

        // Create build record
        await db.createBuild({
          configurationId: input.configurationId,
          userId: ctx.user.id,
          status: "pending",
        });
        const builds = await db.getBuildsByConfigurationId(input.configurationId, 1);
        const newBuild = builds[0];
        return { buildId: newBuild?.id || 0 };
      }),

    // Get build history
    history: protectedProcedure
      .input(z.object({
        configurationId: z.number(),
        limit: z.number().default(50),
      }))
      .query(async ({ input, ctx }) => {
        const config = await db.getBuildConfigurationById(input.configurationId);
        if (!config || config.userId !== ctx.user.id) {
          throw new TRPCError({ code: "FORBIDDEN" });
        }

        return await db.getBuildsByConfigurationId(input.configurationId, input.limit);
      }),

    // Get single build
    get: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input, ctx }) => {
        const build = await db.getBuildById(input.id);
        if (!build || build.userId !== ctx.user.id) {
          throw new TRPCError({ code: "FORBIDDEN" });
        }
        return build;
      }),

    // Update build status
    updateStatus: protectedProcedure
      .input(z.object({
        id: z.number(),
        status: z.enum(["pending", "running", "success", "failed", "cancelled"]),
        githubRunId: z.string().optional(),
        githubRunNumber: z.number().optional(),
        artifactUrl: z.string().optional(),
        errorMessage: z.string().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        const build = await db.getBuildById(input.id);
        if (!build || build.userId !== ctx.user.id) {
          throw new TRPCError({ code: "FORBIDDEN" });
        }

        const { id, ...updates } = input;
        await db.updateBuild(id, {
          ...updates,
          startedAt: updates.status === "running" ? new Date() : build.startedAt,
          completedAt: (updates.status === "success" || updates.status === "failed" || updates.status === "cancelled") ? new Date() : build.completedAt,
        });

        return { success: true };
      }),

    // Get build logs
    getLogs: protectedProcedure
      .input(z.object({ buildId: z.number() }))
      .query(async ({ input, ctx }) => {
        const build = await db.getBuildById(input.buildId);
        if (!build || build.userId !== ctx.user.id) {
          throw new TRPCError({ code: "FORBIDDEN" });
        }

        return await db.getBuildLogs(input.buildId);
      }),

    // Add build log
    addLog: protectedProcedure
      .input(z.object({
        buildId: z.number(),
        logContent: z.string(),
        logType: z.enum(["stdout", "stderr", "info", "warning", "error"]).default("stdout"),
      }))
      .mutation(async ({ input, ctx }) => {
        const build = await db.getBuildById(input.buildId);
        if (!build || build.userId !== ctx.user.id) {
          throw new TRPCError({ code: "FORBIDDEN" });
        }

        await db.addBuildLog(input.buildId, input.logContent, input.logType);
        return { success: true };
      }),
  }),
});

export type AppRouter = typeof appRouter;
