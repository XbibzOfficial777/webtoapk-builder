// WebToAPK Builder - Main Page
'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Smartphone, 
  Github, 
  Zap, 
  Shield, 
  Palette, 
  Download,
  CheckCircle2,
  Clock,
  Loader2,
  ExternalLink,
  Trash2,
  RefreshCw,
  AlertCircle
} from 'lucide-react';
import { AppConfigForm } from '@/components/build/app-config-form';
import { BuildStatus } from '@/components/build/build-status';
import { toast } from 'sonner';
import { ThemeToggle } from '@/components/theme-toggle';

interface BuildConfig {
  id: string;
  appName: string;
  packageName: string;
  versionName: string;
  versionCode: number;
  websiteUrl: string;
  primaryColor: string;
  createdAt: string;
  builds?: Build[];
}

interface Build {
  id: string;
  status: string;
  downloadUrl: string | null;
  errorMessage: string | null;
  createdAt: string;
  buildConfig?: BuildConfig;
}

export default function HomePage() {
  const [activeTab, setActiveTab] = useState('create');
  const [currentBuildId, setCurrentBuildId] = useState<string | null>(null);
  const [configs, setConfigs] = useState<BuildConfig[]>([]);
  const [builds, setBuilds] = useState<Build[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [githubStatus, setGithubStatus] = useState<{ connected: boolean; username?: string }>({
    connected: false,
  });

  // Fetch configs and builds
  const fetchData = useCallback(async () => {
    try {
      const [configsRes, buildsRes, githubRes] = await Promise.all([
        fetch('/api/configs'),
        fetch('/api/builds'),
        fetch('/api/github/status'),
      ]);

      if (configsRes.ok) {
        const data = await configsRes.json();
        setConfigs(data.configs || []);
      }

      if (buildsRes.ok) {
        const data = await buildsRes.json();
        setBuilds(data.builds || []);
      }

      if (githubRes.ok) {
        const data = await githubRes.json();
        setGithubStatus(data);
      }
    } catch (error) {
      console.error('Failed to fetch data:', error);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleSubmit = useCallback(async (data: {
    appName: string;
    packageName: string;
    versionName: string;
    versionCode: number;
    websiteUrl: string;
    iconUrl?: string;
    primaryColor: string;
    orientation: string;
    enableCache: boolean;
    enableZoom: boolean;
    showSplash: boolean;
    splashText?: string;
  }) => {
    setIsLoading(true);
    try {
      // Create config
      const configRes = await fetch('/api/configs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!configRes.ok) {
        const error = await configRes.json();
        throw new Error(error.error || 'Failed to create configuration');
      }

      const { config } = await configRes.json();

      // Start build
      const buildRes = await fetch('/api/builds', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ configId: config.id }),
      });

      if (!buildRes.ok) {
        const error = await buildRes.json();
        throw new Error(error.error || 'Failed to start build');
      }

      const { build } = await buildRes.json();
      setCurrentBuildId(build.id);
      setActiveTab('status');
      toast.success('Build started!');
      
      // Refresh data
      fetchData();
    } catch (error) {
      console.error('Build error:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to start build');
    } finally {
      setIsLoading(false);
    }
  }, [fetchData]);

  const handleReset = useCallback(() => {
    setCurrentBuildId(null);
    setActiveTab('create');
    fetchData();
  }, [fetchData]);

  const handleDeleteBuild = useCallback(async (buildId: string) => {
    try {
      const res = await fetch(`/api/builds/${buildId}`, {
        method: 'DELETE',
      });
      
      if (res.ok) {
        toast.success('Build deleted');
        fetchData();
      }
    } catch (error) {
      toast.error('Failed to delete build');
    }
  }, [fetchData]);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <Badge className="bg-emerald-500">Completed</Badge>;
      case 'failed':
        return <Badge variant="destructive">Failed</Badge>;
      case 'building':
      case 'pending':
        return <Badge variant="secondary" className="animate-pulse">In Progress</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-background via-background to-emerald-500/5">
      {/* Header */}
      <header className="border-b bg-background/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 shadow-lg shadow-emerald-500/20">
                <Smartphone className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
                  WebToAPK Builder
                </h1>
                <p className="text-xs text-muted-foreground">Convert website to Android app</p>
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              {/* GitHub Status */}
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-muted">
                <Github className="w-4 h-4" />
                {githubStatus.connected ? (
                  <span className="text-xs font-medium text-emerald-500">
                    @{githubStatus.username}
                  </span>
                ) : (
                  <span className="text-xs text-muted-foreground">Connecting...</span>
                )}
              </div>
              
              <ThemeToggle />
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 container mx-auto px-4 py-8">
        <AnimatePresence mode="wait">
          {currentBuildId ? (
            <motion.div
              key="build-status"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="max-w-4xl mx-auto"
            >
              <BuildStatus 
                buildId={currentBuildId} 
                onReset={handleReset}
              />
            </motion.div>
          ) : (
            <motion.div
              key="main-tabs"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
                <TabsList className="grid w-full max-w-md mx-auto grid-cols-2">
                  <TabsTrigger value="create" className="gap-2">
                    <Zap className="w-4 h-4" />
                    Create App
                  </TabsTrigger>
                  <TabsTrigger value="history" className="gap-2">
                    <Clock className="w-4 h-4" />
                    History
                  </TabsTrigger>
                </TabsList>

                {/* Create Tab */}
                <TabsContent value="create" className="space-y-8">
                  {/* Features Cards */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-4xl mx-auto">
                    {[
                      { icon: Zap, title: 'Fast Build', desc: 'Automated GitHub Actions pipeline' },
                      { icon: Shield, title: 'Secure', desc: 'Your code stays in your GitHub' },
                      { icon: Palette, title: 'Customizable', desc: 'Icon, colors, and features' },
                    ].map((feature, i) => (
                      <Card key={i} className="bg-gradient-to-br from-background to-muted/50">
                        <CardContent className="pt-6">
                          <div className="flex items-center gap-3">
                            <div className="p-2 rounded-lg bg-emerald-500/10">
                              <feature.icon className="w-5 h-5 text-emerald-500" />
                            </div>
                            <div>
                              <h3 className="font-semibold">{feature.title}</h3>
                              <p className="text-xs text-muted-foreground">{feature.desc}</p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>

                  {/* Config Form */}
                  <AppConfigForm onSubmit={handleSubmit} isLoading={isLoading} />
                </TabsContent>

                {/* History Tab */}
                <TabsContent value="history" className="space-y-4">
                  <Card>
                    <CardHeader>
                      <CardTitle>Build History</CardTitle>
                      <CardDescription>Your recent APK builds</CardDescription>
                    </CardHeader>
                    <CardContent>
                      {builds.length === 0 ? (
                        <div className="text-center py-12 text-muted-foreground">
                          <Clock className="w-12 h-12 mx-auto mb-4 opacity-50" />
                          <p>No builds yet</p>
                          <p className="text-sm">Create your first APK to see it here</p>
                        </div>
                      ) : (
                        <div className="space-y-3">
                          {builds.map((build) => (
                            <div
                              key={build.id}
                              className="flex items-center justify-between p-4 rounded-lg border bg-gradient-to-r from-background to-muted/30 hover:shadow-md transition-shadow"
                            >
                              <div className="flex items-center gap-4">
                                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                                  build.status === 'completed' 
                                    ? 'bg-emerald-500/10 text-emerald-500'
                                    : build.status === 'failed'
                                      ? 'bg-red-500/10 text-red-500'
                                      : 'bg-yellow-500/10 text-yellow-500'
                                }`}>
                                  {build.status === 'completed' ? (
                                    <CheckCircle2 className="w-5 h-5" />
                                  ) : build.status === 'failed' ? (
                                    <AlertCircle className="w-5 h-5" />
                                  ) : (
                                    <Loader2 className="w-5 h-5 animate-spin" />
                                  )}
                                </div>
                                <div>
                                  <h4 className="font-medium">
                                    {build.buildConfig?.appName || 'Unknown App'}
                                  </h4>
                                  <p className="text-sm text-muted-foreground">
                                    {build.buildConfig?.packageName}
                                  </p>
                                  <p className="text-xs text-muted-foreground">
                                    {new Date(build.createdAt).toLocaleString()}
                                  </p>
                                </div>
                              </div>
                              
                              <div className="flex items-center gap-3">
                                {getStatusBadge(build.status)}
                                
                                {build.downloadUrl && (
                                  <Button size="sm" asChild className="bg-emerald-500 hover:bg-emerald-600">
                                    <a href={build.downloadUrl} target="_blank" rel="noopener noreferrer">
                                      <Download className="w-4 h-4 mr-1" />
                                      Download
                                    </a>
                                  </Button>
                                )}
                                
                                <Button 
                                  size="sm" 
                                  variant="ghost"
                                  onClick={() => {
                                    setCurrentBuildId(build.id);
                                    setActiveTab('status');
                                  }}
                                >
                                  <RefreshCw className="w-4 h-4" />
                                </Button>
                                
                                <Button 
                                  size="sm" 
                                  variant="ghost"
                                  className="text-red-500 hover:text-red-600 hover:bg-red-500/10"
                                  onClick={() => handleDeleteBuild(build.id)}
                                >
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Footer */}
      <footer className="border-t bg-background/80 backdrop-blur-sm mt-auto">
        <div className="container mx-auto px-4 py-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <span>Powered by</span>
              <a 
                href="https://github.com/features/actions" 
                target="_blank" 
                rel="noopener noreferrer"
                className="flex items-center gap-1 hover:text-foreground transition-colors"
              >
                <Github className="w-4 h-4" />
                GitHub Actions
              </a>
            </div>
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <span>Built with Next.js & TypeScript</span>
              <Badge variant="outline" className="text-xs">
                v1.0.0
              </Badge>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
