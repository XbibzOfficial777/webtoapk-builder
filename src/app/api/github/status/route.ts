import { NextResponse } from 'next/server';
import { getGitHubService } from '@/lib/github';

export async function GET() {
  try {
    const github = await getGitHubService();
    
    // Test GitHub API connection
    const user = await github.fetchAPI('/user');
    
    return NextResponse.json({ 
      connected: true,
      username: (user as { login: string }).login,
    });
  } catch (error) {
    console.error('GitHub connection error:', error);
    return NextResponse.json({ 
      connected: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}
