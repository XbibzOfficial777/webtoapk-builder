import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Loader2, Play, Trash2, Settings, Download, AlertCircle, CheckCircle, Clock } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";

export default function BuildDashboard() {
  const [selectedConfig, setSelectedConfig] = useState<number | null>(null);

  const configurationsQuery = trpc.configurations.list.useQuery();
  const buildsQuery = trpc.builds.history.useQuery(
    { configurationId: selectedConfig || 0, limit: 10 },
    { enabled: selectedConfig !== null }
  );

  const triggerBuild = trpc.builds.trigger.useMutation({
    onSuccess: () => {
      toast.success("Build triggered successfully!");
      buildsQuery.refetch();
    },
    onError: (error) => {
      toast.error(error.message || "Failed to trigger build");
    },
  });

  const handleTriggerBuild = (configId: number) => {
    triggerBuild.mutate({ configurationId: configId });
  };

  if (configurationsQuery.isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
      </div>
    );
  }

  const configurations = configurationsQuery.data || [];

  if (configurations.length === 0) {
    return (
      <Card className="bg-slate-800 border-slate-700">
        <CardContent className="py-12 text-center">
          <AlertCircle className="w-12 h-12 text-slate-500 mx-auto mb-4" />
          <p className="text-slate-300 mb-4">No configurations yet</p>
          <p className="text-slate-500 text-sm">Create your first APK configuration to get started</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Configurations Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {configurations.map((config) => (
          <Card
            key={config.id}
            className={`bg-slate-800 border-slate-700 cursor-pointer transition ${
              selectedConfig === config.id ? "border-blue-500 ring-1 ring-blue-500" : ""
            }`}
            onClick={() => setSelectedConfig(config.id)}
          >
            <CardHeader>
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="text-white text-lg">{config.appName}</CardTitle>
                  <CardDescription className="text-slate-400 text-sm">{config.packageId}</CardDescription>
                </div>
                <Badge variant="outline" className="text-slate-300 border-slate-600">
                  v{config.appVersion}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="text-sm text-slate-400">
                <p className="truncate">URL: {config.targetUrl}</p>
              </div>

              {config.description && (
                <p className="text-sm text-slate-400 line-clamp-2">{config.description}</p>
              )}

              <div className="flex gap-2 pt-2">
                <Button
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleTriggerBuild(config.id);
                  }}
                  disabled={triggerBuild.isPending}
                  className="flex-1 bg-green-600 hover:bg-green-700 text-white"
                >
                  <Play className="w-4 h-4 mr-1" />
                  Build
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="border-slate-600 text-slate-300 hover:bg-slate-700"
                >
                  <Settings className="w-4 h-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Build History */}
      {selectedConfig && (
        <Card className="bg-slate-800 border-slate-700">
          <CardHeader>
            <CardTitle className="text-white">Build History</CardTitle>
            <CardDescription className="text-slate-400">
              Recent builds for {configurations.find(c => c.id === selectedConfig)?.appName}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {buildsQuery.isLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin text-blue-500" />
              </div>
            ) : (buildsQuery.data || []).length === 0 ? (
              <div className="text-center py-8">
                <Clock className="w-8 h-8 text-slate-500 mx-auto mb-2" />
                <p className="text-slate-400">No builds yet</p>
              </div>
            ) : (
              <div className="space-y-3">
                {(buildsQuery.data || []).map((build) => (
                  <div
                    key={build.id}
                    className="p-4 bg-slate-700/50 rounded-lg border border-slate-600 space-y-3"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        {build.status === "success" && (
                          <CheckCircle className="w-5 h-5 text-green-500" />
                        )}
                        {build.status === "running" && (
                          <Loader2 className="w-5 h-5 text-blue-500 animate-spin" />
                        )}
                        {build.status === "failed" && (
                          <AlertCircle className="w-5 h-5 text-red-500" />
                        )}
                        {build.status === "pending" && (
                          <Clock className="w-5 h-5 text-yellow-500" />
                        )}
                        <div>
                          <p className="text-white font-medium">Build #{build.id}</p>
                          <p className="text-sm text-slate-400">
                            {new Date(build.createdAt).toLocaleString()}
                          </p>
                        </div>
                      </div>
                      <Badge
                        variant={
                          build.status === "success"
                            ? "default"
                            : build.status === "failed"
                            ? "destructive"
                            : "secondary"
                        }
                      >
                        {build.status}
                      </Badge>
                    </div>

                    {build.status === "running" && (
                      <div className="space-y-2">
                        <Progress value={65} className="h-2" />
                        <p className="text-xs text-slate-400">Building...</p>
                      </div>
                    )}

                    {build.status === "success" && build.artifactUrl && (
                  <Button
                    size="sm"
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                    onClick={() => build.artifactUrl && window.open(build.artifactUrl, "_blank")}
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Download APK
                  </Button>
                    )}

                    {build.status === "failed" && build.errorMessage && (
                      <div className="bg-red-900/20 border border-red-700/50 rounded p-2">
                        <p className="text-xs text-red-300 line-clamp-2">{build.errorMessage}</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
