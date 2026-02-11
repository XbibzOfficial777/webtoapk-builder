import { describe, it, expect } from "vitest";

describe("GitHub OAuth Configuration", () => {
  it("should have GitHub OAuth credentials configured", () => {
    const clientId = process.env.GITHUB_CLIENT_ID;
    const clientSecret = process.env.GITHUB_CLIENT_SECRET;

    expect(clientId).toBeDefined();
    expect(clientSecret).toBeDefined();
    expect(clientId).toBeTruthy();
    expect(clientSecret).toBeTruthy();
  });

  it("should validate GitHub OAuth credentials format", () => {
    const clientId = process.env.GITHUB_CLIENT_ID || "";
    const clientSecret = process.env.GITHUB_CLIENT_SECRET || "";

    // GitHub Client IDs are typically alphanumeric and at least 20 characters
    expect(clientId.length).toBeGreaterThan(10);
    expect(clientSecret.length).toBeGreaterThan(20);
  });

  it("should be able to construct OAuth URL", () => {
    const clientId = process.env.GITHUB_CLIENT_ID;
    const scope = "repo,workflow,user:email";
    const redirectUri = "http://localhost:3000/api/github/callback";

    const oauthUrl = `https://github.com/login/oauth/authorize?client_id=${clientId}&redirect_uri=${redirectUri}&scope=${scope}`;

    expect(oauthUrl).toContain("github.com/login/oauth/authorize");
    expect(oauthUrl).toContain(clientId);
    expect(oauthUrl).toContain("repo");
    expect(oauthUrl).toContain("workflow");
  });
});
