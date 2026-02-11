/**
 * GitHub Service
 * Handles automated repository setup, workflow creation, and build management
 */

import { Octokit } from "octokit";
import * as db from "./db";
import { generateApkBuildWorkflow } from "./workflows";

export class GithubService {
  private octokit: Octokit;

  constructor(accessToken: string) {
    this.octokit = new Octokit({ auth: accessToken });
  }

  /**
   * Setup a new repository with APK builder workflow
   */
  async setupRepositoryForApkBuilder(
    owner: string,
    repoName: string,
    config: {
      packageId: string;
      appName: string;
      appVersion: string;
      targetUrl: string;
      iconUrl?: string;
      splashUrl?: string;
    }
  ) {
    try {
      // 1. Create .github/workflows directory structure
      const workflowName = "build-apk";
      const workflowYaml = generateApkBuildWorkflow(config);

      // 2. Push workflow file
      await this.pushWorkflowFile(owner, repoName, workflowName, workflowYaml);

      // 3. Setup repository secrets
      await this.setupRepositorySecrets(owner, repoName, {
        APP_NAME: config.appName,
        PACKAGE_ID: config.packageId,
        TARGET_URL: config.targetUrl,
      });

      // 4. Create initial README
      await this.createReadme(owner, repoName, config);

      // 5. Create GitHub Actions badge in README
      await this.updateReadmeWithBadges(owner, repoName, workflowName);

      return {
        success: true,
        workflowName,
        message: "Repository setup completed successfully",
      };
    } catch (error) {
      console.error("Repository setup error:", error);
      throw error;
    }
  }

  /**
   * Push workflow YAML file to repository
   */
  private async pushWorkflowFile(
    owner: string,
    repo: string,
    workflowName: string,
    workflowYaml: string
  ) {
    const path = `.github/workflows/${workflowName}.yml`;

    try {
      // Try to get existing file
      let sha: string | undefined;
      try {
        const existing = await (this.octokit as any).rest.repos.getContent({
          owner,
          repo,
          path,
        });
        sha = (existing.data as any).sha;
      } catch {
        // File doesn't exist yet
      }

      // Create or update file
      await (this.octokit as any).rest.repos.createOrUpdateFileContents({
        owner,
        repo,
        path,
        message: `Add ${workflowName} GitHub Actions workflow`,
        content: Buffer.from(workflowYaml).toString("base64"),
        sha,
      });

      console.log(`Workflow file pushed: ${path}`);
    } catch (error) {
      console.error("Error pushing workflow file:", error);
      throw error;
    }
  }

  /**
   * Setup repository secrets
   */
  private async setupRepositorySecrets(
    owner: string,
    repo: string,
    secrets: Record<string, string>
  ) {
    try {
      for (const [key, value] of Object.entries(secrets)) {
        try {
          await (this.octokit as any).rest.actions.createOrUpdateRepoSecret({
            owner,
            repo,
            secret_name: key,
            encrypted_value: value,
          } as any);
          console.log(`Secret set: ${key}`);
        } catch (err) {
          console.warn(`Failed to set secret ${key}:`, err);
        }
      }
    } catch (error) {
      console.error("Error setting up secrets:", error);
      throw error;
    }
  }

  /**
   * Create initial README file
   */
  private async createReadme(
    owner: string,
    repo: string,
    config: {
      appName: string;
      packageId: string;
      appVersion: string;
      targetUrl: string;
    }
  ) {
    const readmeContent = `# ${config.appName}

This repository contains the APK build configuration for **${config.appName}**.

## Configuration

- **App Name**: ${config.appName}
- **Package ID**: ${config.packageId}
- **Version**: ${config.appVersion}
- **Target URL**: ${config.targetUrl}

## Building

The APK is automatically built using GitHub Actions. To trigger a build:

1. Go to the **Actions** tab
2. Select the **Build APK** workflow
3. Click **Run workflow**

## Downloads

Built APK files are available as artifacts in the GitHub Actions workflow runs.

---

Built with [Web-to-APK Builder](https://github.com/XbibzOfficial777/webtoapk-builder)
`;

    try {
      await (this.octokit as any).rest.repos.createOrUpdateFileContents({
        owner,
        repo,
        path: "README.md",
        message: "Add README",
        content: Buffer.from(readmeContent).toString("base64"),
      });
      console.log("README created");
    } catch (error) {
      console.error("Error creating README:", error);
      // Don't throw, README is optional
    }
  }

  /**
   * Update README with workflow badges
   */
  private async updateReadmeWithBadges(
    owner: string,
    repo: string,
    workflowName: string
  ) {
    try {
      const badgeUrl = `https://github.com/${owner}/${repo}/actions/workflows/${workflowName}.yml/badge.svg`;
      const workflowUrl = `https://github.com/${owner}/${repo}/actions/workflows/${workflowName}.yml`;

      const badge = `[![${workflowName}](${badgeUrl})](${workflowUrl})`;

      // Get existing README
      const existing = await (this.octokit as any).rest.repos.getContent({
        owner,
        repo,
        path: "README.md",
      });

      let content = Buffer.from((existing.data as any).content, "base64").toString();

      // Add badge if not already present
      if (!content.includes(badge)) {
        content = `${badge}\n\n${content}`;

        await (this.octokit as any).rest.repos.createOrUpdateFileContents({
          owner,
          repo,
          path: "README.md",
          message: "Add workflow badge",
          content: Buffer.from(content).toString("base64"),
          sha: (existing.data as any).sha,
        });
      }
    } catch (error) {
      console.warn("Error updating README with badges:", error);
      // Don't throw, badges are optional
    }
  }

  /**
   * Trigger a workflow run
   */
  async triggerWorkflow(
    owner: string,
    repo: string,
    workflowId: string,
    ref: string = "main"
  ) {
    try {
      const response = await (this.octokit as any).rest.actions.createWorkflowDispatch({
        owner,
        repo,
        workflow_id: workflowId,
        ref,
      });

      return { success: true, runId: response.status };
    } catch (error) {
      console.error("Error triggering workflow:", error);
      throw error;
    }
  }

  /**
   * Get workflow runs
   */
  async getWorkflowRuns(
    owner: string,
    repo: string,
    workflowId: string,
    limit: number = 10
  ) {
    try {
      const response = await (this.octokit as any).rest.actions.listWorkflowRuns({
        owner,
        repo,
        workflow_id: workflowId,
        per_page: limit,
      });

      return response.data.workflow_runs.map((run: any) => ({
        id: run.id,
        number: run.run_number,
        status: run.status,
        conclusion: run.conclusion,
        createdAt: run.created_at,
        updatedAt: run.updated_at,
        htmlUrl: run.html_url,
      }));
    } catch (error) {
      console.error("Error fetching workflow runs:", error);
      throw error;
    }
  }

  /**
   * Get workflow run logs
   */
  async getWorkflowRunLogs(owner: string, repo: string, runId: number) {
    try {
      const response = await (this.octokit as any).rest.actions.downloadWorkflowRunLogs({
        owner,
        repo,
        run_id: runId,
      });

      return response.data;
    } catch (error) {
      console.error("Error fetching workflow logs:", error);
      throw error;
    }
  }

  /**
   * Get artifacts from workflow run
   */
  async getArtifacts(owner: string, repo: string, runId: number) {
    try {
      const response = await (this.octokit as any).rest.actions.listWorkflowRunArtifacts({
        owner,
        repo,
        run_id: runId,
      });

      return response.data.artifacts.map((artifact: any) => ({
        id: artifact.id,
        name: artifact.name,
        size: artifact.size_in_bytes,
        createdAt: artifact.created_at,
        expiresAt: artifact.expires_at,
      }));
    } catch (error) {
      console.error("Error fetching artifacts:", error);
      throw error;
    }
  }

  /**
   * Download artifact
   */
  async downloadArtifact(owner: string, repo: string, artifactId: number) {
    try {
      const url = await (this.octokit as any).rest.actions.downloadArtifact({
        owner,
        repo,
        artifact_id: artifactId,
        archive_format: "zip",
      });

      return { url: (url as any).url };
    } catch (error) {
      console.error("Error downloading artifact:", error);
      throw error;
    }
  }
}
