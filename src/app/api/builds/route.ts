import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getGitHubService } from '@/lib/github';

export async function GET() {
  try {
    const builds = await db.build.findMany({
      include: {
        buildConfig: true,
      },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
    
    return NextResponse.json({ builds });
  } catch (error) {
    console.error('Error fetching builds:', error);
    return NextResponse.json(
      { error: 'Failed to fetch builds' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { configId } = body;
    
    const config = await db.buildConfig.findUnique({
      where: { id: configId },
    });
    
    if (!config) {
      return NextResponse.json(
        { error: 'Configuration not found' },
        { status: 404 }
      );
    }
    
    // Create build record
    const build = await db.build.create({
      data: {
        buildConfigId: configId,
        status: 'pending',
      },
    });
    
    // Start build process in background
    startBuildProcess(build.id, config);
    
    return NextResponse.json({ 
      build,
      message: 'Build started successfully'
    }, { status: 201 });
  } catch (error) {
    console.error('Error starting build:', error);
    return NextResponse.json(
      { error: 'Failed to start build' },
      { status: 500 }
    );
  }
}

async function startBuildProcess(buildId: string, config: {
  id: string;
  appName: string;
  packageName: string;
  versionName: string;
  versionCode: number;
  websiteUrl: string;
  iconUrl: string | null;
  primaryColor: string;
  orientation: string;
  enableCache: boolean;
  enableZoom: boolean;
  showSplash: boolean;
  splashText: string | null;
}) {
  const wsPort = 3003;
  
  const updateStatus = async (status: string, progress: number, message: string, logs?: string[], downloadUrl?: string, error?: string) => {
    try {
      await fetch(`http://localhost:${wsPort}/api?XTransformPort=${wsPort}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          event: 'update-build-status',
          data: {
            buildId,
            status,
            progress,
            message,
            logs,
            downloadUrl,
            error,
          },
        }),
      });
    } catch (e) {
      console.error('Failed to update WebSocket status:', e);
    }
  };
  
  try {
    await updateStatus('initializing', 5, 'Initializing build process...');
    
    await db.build.update({
      where: { id: buildId },
      data: { startedAt: new Date() },
    });
    
    const github = await getGitHubService();
    
    await updateStatus('creating_repo', 15, 'Creating GitHub repository...');
    
    // Create unique repo name
    const repoName = `webtoapk-${config.packageName.replace(/\./g, '-').toLowerCase()}-${Date.now()}`;
    
    const repo = await github.createRepository(repoName, `Web to APK: ${config.appName}`);
    
    await db.build.update({
      where: { id: buildId },
      data: { 
        githubRepoName: repoName,
      },
    });
    
    await updateStatus('uploading_files', 30, 'Uploading project files to GitHub...');
    
    // Create workflow file
    await github.createWorkflowFile(repoName, {
      appName: config.appName,
      packageName: config.packageName,
      versionName: config.versionName,
      versionCode: config.versionCode,
      websiteUrl: config.websiteUrl,
      iconUrl: config.iconUrl || undefined,
      primaryColor: config.primaryColor,
      orientation: config.orientation,
      enableCache: config.enableCache,
      enableZoom: config.enableZoom,
      showSplash: config.showSplash,
      splashText: config.splashText || undefined,
    });
    
    await updateStatus('triggering_build', 50, 'Triggering GitHub Actions build...');
    
    // Trigger workflow
    const runId = await github.triggerWorkflow(repoName);
    
    await db.build.update({
      where: { id: buildId },
      data: { 
        githubRunId: runId.toString(),
      },
    });
    
    await updateStatus('building', 60, 'Building APK on GitHub Actions...');
    
    // Poll for build status
    let status = 'in_progress';
    let attempts = 0;
    const maxAttempts = 300; // 25 minutes max
    
    while (status === 'in_progress' || status === 'queued') {
      await new Promise(resolve => setTimeout(resolve, 5000));
      
      const run = await github.getWorkflowRun(repoName, runId);
      status = run.status;
      
      attempts++;
      const progress = 60 + Math.min(attempts * 0.5, 35);
      
      await updateStatus('building', progress, `Building APK... (${status})`);
      
      if (attempts >= maxAttempts) {
        throw new Error('Build timeout - took too long');
      }
    }
    
    if (status === 'completed') {
      const run = await github.getWorkflowRun(repoName, runId);
      
      if (run.conclusion === 'success') {
        await updateStatus('completed', 100, 'Build completed successfully!');
        
        // Get release with APK
        const tagName = `v${config.versionName}-1`;
        let downloadUrl = '';
        
        try {
          const release = await github.getRelease(repoName, tagName);
          if (release.assets && release.assets.length > 0) {
            downloadUrl = release.assets[0].browser_download_url;
          }
        } catch {
          // Release might not exist yet, try to get from artifacts
          const artifacts = await github.getArtifacts(repoName, runId);
          if (artifacts.length > 0) {
            downloadUrl = `https://github.com/${github.username}/${repoName}/actions/runs/${runId}`;
          }
        }
        
        await db.build.update({
          where: { id: buildId },
          data: {
            status: 'completed',
            downloadUrl,
            completedAt: new Date(),
          },
        });
        
        await updateStatus('completed', 100, 'Build completed successfully!', [], downloadUrl);
      } else {
        // Build failed
        const logs = await github.getWorkflowLogs(repoName, runId);
        
        await db.build.update({
          where: { id: buildId },
          data: {
            status: 'failed',
            errorMessage: `Build ${run.conclusion}`,
            logs,
            completedAt: new Date(),
          },
        });
        
        await updateStatus('failed', 100, `Build ${run.conclusion}`, [logs], undefined, `Build ${run.conclusion}`);
      }
    }
  } catch (error) {
    console.error('Build process error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    
    await db.build.update({
      where: { id: buildId },
      data: {
        status: 'failed',
        errorMessage,
        completedAt: new Date(),
      },
    });
    
    await updateStatus('failed', 100, 'Build failed', [], undefined, errorMessage);
  }
}
