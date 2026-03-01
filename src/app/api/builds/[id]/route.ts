import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getGitHubService } from '@/lib/github';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    const build = await db.build.findUnique({
      where: { id },
      include: { buildConfig: true },
    });
    
    if (!build) {
      return NextResponse.json(
        { error: 'Build not found' },
        { status: 404 }
      );
    }
    
    // If build is still in progress, fetch latest status from GitHub
    if (build.status === 'building' || build.status === 'pending' || build.status === 'initializing') {
      if (build.githubRunId && build.githubRepoName) {
        try {
          const github = await getGitHubService();
          const run = await github.getWorkflowRun(build.githubRepoName, parseInt(build.githubRunId));
          
          if (run.status === 'completed') {
            const tagName = `v${build.buildConfig.versionName}-1`;
            let downloadUrl = build.downloadUrl;
            
            if (run.conclusion === 'success') {
              try {
                const release = await github.getRelease(build.githubRepoName, tagName);
                if (release.assets && release.assets.length > 0) {
                  downloadUrl = release.assets[0].browser_download_url;
                }
              } catch {
                // Release might not exist
              }
            }
            
            await db.build.update({
              where: { id },
              data: {
                status: run.conclusion === 'success' ? 'completed' : 'failed',
                downloadUrl,
                completedAt: new Date(),
                errorMessage: run.conclusion !== 'success' ? `Build ${run.conclusion}` : null,
              },
            });
            
            build.status = run.conclusion === 'success' ? 'completed' : 'failed';
            build.downloadUrl = downloadUrl;
          }
        } catch (error) {
          console.error('Error fetching GitHub status:', error);
        }
      }
    }
    
    return NextResponse.json({ build });
  } catch (error) {
    console.error('Error fetching build:', error);
    return NextResponse.json(
      { error: 'Failed to fetch build' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    await db.build.delete({
      where: { id },
    });
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting build:', error);
    return NextResponse.json(
      { error: 'Failed to delete build' },
      { status: 500 }
    );
  }
}
