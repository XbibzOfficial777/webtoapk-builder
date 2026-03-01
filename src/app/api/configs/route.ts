import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { z } from 'zod';

const configSchema = z.object({
  appName: z.string().min(1, 'App name is required').max(50),
  packageName: z.string().regex(/^[a-z][a-z0-9_]*(\.[a-z][a-z0-9_]*)+$/, 'Invalid package name (e.g., com.example.myapp)'),
  versionName: z.string().regex(/^\d+\.\d+\.\d+$/, 'Version must be in format x.x.x'),
  versionCode: z.number().int().min(1),
  websiteUrl: z.string().url('Must be a valid URL'),
  iconUrl: z.string().url().optional().or(z.literal('')),
  primaryColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Invalid color format'),
  orientation: z.enum(['portrait', 'landscape', 'unspecified']),
  enableCache: z.boolean(),
  enableZoom: z.boolean(),
  showSplash: z.boolean(),
  splashText: z.string().max(100).optional(),
});

export async function GET() {
  try {
    const configs = await db.buildConfig.findMany({
      include: {
        builds: {
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
      },
      orderBy: { createdAt: 'desc' },
    });
    
    return NextResponse.json({ configs });
  } catch (error) {
    console.error('Error fetching configs:', error);
    return NextResponse.json(
      { error: 'Failed to fetch configurations' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validated = configSchema.parse(body);
    
    const config = await db.buildConfig.create({
      data: {
        appName: validated.appName,
        packageName: validated.packageName,
        versionName: validated.versionName,
        versionCode: validated.versionCode,
        websiteUrl: validated.websiteUrl,
        iconUrl: validated.iconUrl || null,
        primaryColor: validated.primaryColor,
        orientation: validated.orientation,
        enableCache: validated.enableCache,
        enableZoom: validated.enableZoom,
        showSplash: validated.showSplash,
        splashText: validated.splashText || null,
      },
    });
    
    return NextResponse.json({ config }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.errors },
        { status: 400 }
      );
    }
    console.error('Error creating config:', error);
    return NextResponse.json(
      { error: 'Failed to create configuration' },
      { status: 500 }
    );
  }
}
