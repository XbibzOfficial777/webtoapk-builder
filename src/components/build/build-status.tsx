'use client';

import { useEffect, useState, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  CheckCircle2, 
  XCircle, 
  Loader2, 
  Download, 
  AlertCircle,
  Github,
  RefreshCw,
  Copy,
  Check
} from 'lucide-react';
import { toast } from 'sonner';

interface BuildStatusData {
  status: string;
  progress: number;
  message: string;
  logs?: string[];
  downloadUrl?: string;
  error?: string;
}

interface BuildStatusProps {
  buildId: string;
  initialStatus?: string;
  onReset?: () => void;
}

export function BuildStatus({ buildId, initialStatus, onReset }: BuildStatusProps) {
  const [status, setStatus] = useState<BuildStatusData>({
    status: initialStatus || 'pending',
    progress: 0,
    message: 'Initializing...',
  });
  const [copied, setCopied] = useState(false);

  // Poll for status updates
  useEffect(() => {
    const pollInterval = setInterval(async () => {
      try {
        const response = await fetch(`/api/builds/${buildId}`);
        const data = await response.json();
        
        if (data.build) {
          setStatus(prev => ({
            ...prev,
            status: data.build.status,
            downloadUrl: data.build.downloadUrl || prev.downloadUrl,
            error: data.build.errorMessage || prev.error,
            logs: data.build.logs ? [data.build.logs] : prev.logs,
          }));

          // Show notification on status change
          if (data.build.status === 'completed' && status.status !== 'completed') {
            toast.success('Build Berhasil! 🎉', {
              description: 'Your APK is ready for download.',
              duration: 10000,
            });
          } else if (data.build.status === 'failed' && status.status !== 'failed') {
            toast.error('Build Failed', {
              description: data.build.errorMessage || 'An error occurred during build.',
              duration: 10000,
            });
          }
        }
      } catch (error) {
        console.error('Poll error:', error);
      }
    }, 3000);

    return () => clearInterval(pollInterval);
  }, [buildId, status.status]);

  const getStatusIcon = () => {
    switch (status.status) {
      case 'completed':
        return <CheckCircle2 className="w-6 h-6 text-emerald-500" />;
      case 'failed':
        return <XCircle className="w-6 h-6 text-red-500" />;
      case 'pending':
      case 'initializing':
      case 'creating_repo':
      case 'uploading_files':
      case 'triggering_build':
      case 'building':
        return <Loader2 className="w-6 h-6 text-emerald-500 animate-spin" />;
      default:
        return <AlertCircle className="w-6 h-6 text-yellow-500" />;
    }
  };

  const getStatusColor = () => {
    switch (status.status) {
      case 'completed':
        return 'text-emerald-500';
      case 'failed':
        return 'text-red-500';
      default:
        return 'text-emerald-500';
    }
  };

  const getStatusText = () => {
    switch (status.status) {
      case 'completed':
        return 'Build Berhasil!';
      case 'failed':
        return 'Build Gagal';
      case 'pending':
        return 'Menunggu...';
      case 'initializing':
        return 'Menginisialisasi...';
      case 'creating_repo':
        return 'Membuat Repository...';
      case 'uploading_files':
        return 'Mengupload Files...';
      case 'triggering_build':
        return 'Memulai Build...';
      case 'building':
        return 'Membangun APK...';
      default:
        return status.message;
    }
  };

  const getProgressValue = () => {
    switch (status.status) {
      case 'completed':
        return 100;
      case 'failed':
        return 100;
      case 'pending':
        return 5;
      case 'initializing':
        return 10;
      case 'creating_repo':
        return 25;
      case 'uploading_files':
        return 40;
      case 'triggering_build':
        return 50;
      case 'building':
        return 75;
      default:
        return status.progress;
    }
  };

  const copyDownloadUrl = useCallback(() => {
    if (status.downloadUrl) {
      navigator.clipboard.writeText(status.downloadUrl);
      setCopied(true);
      toast.success('URL disalin ke clipboard!');
      setTimeout(() => setCopied(false), 2000);
    }
  }, [status.downloadUrl]);

  return (
    <div className="w-full max-w-3xl mx-auto space-y-6">
      {/* Main Status Card */}
      <Card className={`border-2 ${
        status.status === 'completed' 
          ? 'border-emerald-500/50 bg-emerald-500/5' 
          : status.status === 'failed' 
            ? 'border-red-500/50 bg-red-500/5'
            : 'border-emerald-500/20'
      }`}>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {getStatusIcon()}
              <div>
                <CardTitle className={getStatusColor()}>
                  {getStatusText()}
                </CardTitle>
                <CardDescription>Build ID: {buildId.slice(0, 8)}...</CardDescription>
              </div>
            </div>
            <Badge 
              variant={status.status === 'completed' ? 'default' : 'secondary'}
              className={status.status === 'completed' ? 'bg-emerald-500' : ''}
            >
              {status.status}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Progress Bar */}
          {status.status !== 'completed' && status.status !== 'failed' && (
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">{status.message}</span>
                <span className="font-medium">{getProgressValue()}%</span>
              </div>
              <Progress 
                value={getProgressValue()} 
                className="h-2 bg-emerald-100 dark:bg-emerald-900/30"
              />
            </div>
          )}

          {/* Download Section - Success */}
          {status.status === 'completed' && status.downloadUrl && (
            <div className="space-y-4">
              <div className="p-4 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
                <div className="flex items-center gap-2 mb-2">
                  <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                  <span className="font-medium text-emerald-600 dark:text-emerald-400">
                    APK siap didownload!
                  </span>
                </div>
                <p className="text-sm text-muted-foreground mb-3">
                  Klik tombol di bawah untuk mengunduh APK atau salin link download.
                </p>
                <div className="flex flex-wrap gap-2">
                  <Button 
                    asChild
                    className="bg-emerald-500 hover:bg-emerald-600"
                  >
                    <a href={status.downloadUrl} target="_blank" rel="noopener noreferrer">
                      <Download className="w-4 h-4 mr-2" />
                      Download APK
                    </a>
                  </Button>
                  <Button variant="outline" onClick={copyDownloadUrl}>
                    {copied ? (
                      <>
                        <Check className="w-4 h-4 mr-2" />
                        Disalin!
                      </>
                    ) : (
                      <>
                        <Copy className="w-4 h-4 mr-2" />
                        Salin URL
                      </>
                    )}
                  </Button>
                </div>
              </div>
              
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Github className="w-4 h-4" />
                <span>Repository:</span>
                <code className="px-2 py-0.5 rounded bg-muted text-xs">
                  {status.downloadUrl.split('/')[4]}/{status.downloadUrl.split('/')[5]}
                </code>
              </div>
            </div>
          )}

          {/* Error Section - Failed */}
          {status.status === 'failed' && (
            <div className="space-y-4">
              <div className="p-4 rounded-lg bg-red-500/10 border border-red-500/20">
                <div className="flex items-center gap-2 mb-2">
                  <XCircle className="w-5 h-5 text-red-500" />
                  <span className="font-medium text-red-600 dark:text-red-400">
                    Build Error
                  </span>
                </div>
                <p className="text-sm text-muted-foreground">
                  {status.error || 'Terjadi kesalahan saat membangun APK.'}
                </p>
              </div>

              {/* Logs */}
              {status.logs && status.logs.length > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Build Logs</span>
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => {
                        navigator.clipboard.writeText(status.logs?.join('\n') || '');
                        toast.success('Logs disalin!');
                      }}
                    >
                      <Copy className="w-3 h-3 mr-1" />
                      Copy Logs
                    </Button>
                  </div>
                  <ScrollArea className="h-64 rounded-lg border bg-black">
                    <pre className="p-4 text-xs text-green-400 font-mono whitespace-pre-wrap">
                      {status.logs.join('\n')}
                    </pre>
                  </ScrollArea>
                </div>
              )}
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-2 pt-2">
            {(status.status === 'completed' || status.status === 'failed') && onReset && (
              <Button onClick={onReset} variant="outline" className="flex-1">
                <RefreshCw className="w-4 h-4 mr-2" />
                Build Baru
              </Button>
            )}
            {status.downloadUrl && (
              <Button asChild variant="outline">
                <a 
                  href={`https://github.com/${status.downloadUrl.split('/')[3]}/${status.downloadUrl.split('/')[4]}`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <Github className="w-4 h-4 mr-2" />
                  View on GitHub
                </a>
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Build Steps Timeline */}
      {status.status !== 'completed' && status.status !== 'failed' && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Build Progress</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {[
                { key: 'initializing', label: 'Initialize', desc: 'Setting up build environment' },
                { key: 'creating_repo', label: 'Create Repository', desc: 'Creating GitHub repository' },
                { key: 'uploading_files', label: 'Upload Files', desc: 'Uploading project files' },
                { key: 'triggering_build', label: 'Trigger Build', desc: 'Starting GitHub Actions' },
                { key: 'building', label: 'Build APK', desc: 'Compiling Android application' },
              ].map((step, index) => {
                const statusOrder = ['pending', 'initializing', 'creating_repo', 'uploading_files', 'triggering_build', 'building', 'completed'];
                const currentIndex = statusOrder.indexOf(status.status);
                const stepIndex = statusOrder.indexOf(step.key);
                const isCompleted = currentIndex > stepIndex || status.status === 'completed';
                const isCurrent = status.status === step.key;

                return (
                  <div 
                    key={step.key}
                    className={`flex items-center gap-3 p-2 rounded-lg transition-colors ${
                      isCurrent ? 'bg-emerald-500/10' : ''
                    }`}
                  >
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                      isCompleted 
                        ? 'bg-emerald-500 text-white' 
                        : isCurrent 
                          ? 'bg-emerald-500/20 text-emerald-500 border-2 border-emerald-500'
                          : 'bg-muted text-muted-foreground'
                    }`}>
                      {isCompleted ? (
                        <CheckCircle2 className="w-4 h-4" />
                      ) : (
                        <span className="text-xs font-medium">{index + 1}</span>
                      )}
                    </div>
                    <div className="flex-1">
                      <p className={`font-medium text-sm ${isCurrent ? 'text-emerald-500' : ''}`}>
                        {step.label}
                      </p>
                      <p className="text-xs text-muted-foreground">{step.desc}</p>
                    </div>
                    {isCurrent && (
                      <Loader2 className="w-4 h-4 text-emerald-500 animate-spin" />
                    )}
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
