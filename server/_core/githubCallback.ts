import { Router, Request, Response } from "express";
import type { CreateExpressContextOptions } from "@trpc/server/adapters/express";
import { appRouter } from "../routers";
import { createContext } from "./context";

export const githubCallbackRouter = Router();

githubCallbackRouter.get("/github/callback", async (req: Request, res: Response) => {
  try {
    const code = req.query.code as string;

    if (!code) {
      return res.status(400).json({ error: "Missing authorization code" });
    }

    // Get the caller context
    const contextOpts: CreateExpressContextOptions = { req, res, info: {} as any };
    const ctx = await createContext(contextOpts);

    if (!ctx.user) {
      // User not authenticated, redirect to login
      return res.redirect("/");
    }

    // Call the handleCallback mutation
    const caller = appRouter.createCaller(ctx);
    const result = await caller.github.handleCallback({ code });

    // Redirect to dashboard with success message
    res.redirect(`/?github_connected=true&username=${encodeURIComponent(result.username)}`);
  } catch (error) {
    console.error("GitHub callback error:", error);
    res.redirect("/?github_error=true");
  }
});
