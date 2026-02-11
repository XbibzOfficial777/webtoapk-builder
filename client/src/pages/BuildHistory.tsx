import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Download, Eye, Trash2, CheckCircle, AlertCircle, Clock } from "lucide-react";
import { trpc } from "@/lib/trpc";

export default function BuildHistory() {
  const [selectedConfigId, setSelectedConfigId] = useState<string>("");
  const [selectedBuildId, setSelectedBuildId] = useState<number | null>(null);

  const configurationsQuery = trpc.configurations.list.useQuery();
  const buildsQuery = trpc.builds.history.useQuery(
    { configurationId: parseInt(selectedConfigId) || 0, limit: 50 },
    { enabled: selectedConfigId !== "" }
  );

  const logsQuery = trpc.builds.getLogs.useQuery(
    { buildId: selectedBuildId || 0 },
    { enabled: selectedBuildId !== null }
  );

  const configurations = configurationsQuery.data || [];

  return (
    <div className="space-y-6">
      {/* Filter */}
      <Card className="bg-slate-800 border-slate-700">
        <CardHeader>
          <CardTitle className="text-white">Filter Builds</CardTitle>
        </CardHeader>
        <CardContent>
          <Select value={selectedConfigId} onValueChange={setSelectedConfigId}>
            <SelectTrigger className="bg-slate-700 border-slate-600 text-white">
              <SelectValue placeholder="Select a configuration" />
            </SelectTrigger>
            <SelectContent className="bg-slate-700 border-slate-600">
              {configurations.map((config) => (
                <SelectItem key={config.id} value={config.id.toString()}>
                  {config.appName} ({config.packageId})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {/* Builds List */}
      {selectedConfigId && (
        <Card className="bg-slate-800 border-slate-700">
          <CardHeader>
            <CardTitle className="text-white">Build History</CardTitle>
            <CardDescription className="text-slate-400">
              All builds for {configurations.find(c => c.id === parseInt(selectedConfigId))?.appName}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {buildsQuery.isLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
              </div>
            ) : (buildsQuery.data || []).length === 0 ? (
              <div className="text-center py-12">
                <Clock className="w-12 h-12 text-slate-500 mx-auto mb-4" />
                <p className="text-slate-400">No builds found</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="border-b border-slate-700">
                    <tr>
                      <th className="text-left py-3 px-4 text-slate-300 font-semibold">Build ID</th>
                      <th className="text-left py-3 px-4 text-slate-300 font-semibold">Status</th>
                      <th className="text-left py-3 px-4 text-slate-300 font-semibold">Created</th>
                      <th className="text-left py-3 px-4 text-slate-300 font-semibold">Duration</th>
                      <th className="text-left py-3 px-4 text-slate-300 font-semibold">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(buildsQuery.data || []).map((build) => {
                      const duration = build.completedAt
                        ? new Date(build.completedAt).getTime() - new Date(build.startedAt || build.createdAt).getTime()
                        : null;
                      const durationStr = duration
                        ? `${Math.floor(duration / 1000)}s`
                        : "In progress";

                      return (
                        <tr
                          key={build.id}
                          className="border-b border-slate-700 hover:bg-slate-700/30 transition"
                        >
                          <td className="py-3 px-4 text-white font-medium">#{build.id}</td>
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-2">
                              {build.status === "success" && (
                                <>
                                  <CheckCircle className="w-4 h-4 text-green-500" />
                                  <Badge className="bg-green-900 text-green-200">Success</Badge>
                                </>
                              )}
                              {build.status === "running" && (
                                <>
                                  <Loader2 className="w-4 h-4 text-blue-500 animate-spin" />
                                  <Badge className="bg-blue-900 text-blue-200">Running</Badge>
                                </>
                              )}
                              {build.status === "failed" && (
                                <>
                                  <AlertCircle className="w-4 h-4 text-red-500" />
                                  <Badge className="bg-red-900 text-red-200">Failed</Badge>
                                </>
                              )}
                              {build.status === "pending" && (
                                <>
                                  <Clock className="w-4 h-4 text-yellow-500" />
                                  <Badge className="bg-yellow-900 text-yellow-200">Pending</Badge>
                                </>
                              )}
                            </div>
                          </td>
                          <td className="py-3 px-4 text-slate-400 text-xs">
                            {new Date(build.createdAt).toLocaleString()}
                          </td>
                          <td className="py-3 px-4 text-slate-400">{durationStr}</td>
                          <td className="py-3 px-4">
                            <div className="flex gap-2">
                              <Button
                                size="sm"
                                variant="outline"
                                className="border-slate-600 text-slate-300 hover:bg-slate-700"
                                onClick={() => setSelectedBuildId(build.id)}
                              >
                                <Eye className="w-4 h-4" />
                              </Button>
                              {build.status === "success" && build.artifactUrl && (
                  <Button
                    size="sm"
                    className="bg-blue-600 hover:bg-blue-700 text-white"
                    onClick={() => build.artifactUrl && window.open(build.artifactUrl, "_blank")}
                  >
                                  <Download className="w-4 h-4" />
                                </Button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Build Logs */}
      {selectedBuildId && (
        <Card className="bg-slate-800 border-slate-700">
          <CardHeader>
            <CardTitle className="text-white">Build Logs</CardTitle>
            <CardDescription className="text-slate-400">
              Detailed logs for build #{selectedBuildId}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {logsQuery.isLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin text-blue-500" />
              </div>
            ) : (logsQuery.data || []).length === 0 ? (
              <div className="text-center py-8">
                <p className="text-slate-400">No logs available</p>
              </div>
            ) : (
              <div className="bg-slate-900 rounded-lg p-4 font-mono text-sm max-h-96 overflow-y-auto">
                {(logsQuery.data || []).map((log, idx) => (
                  <div
                    key={idx}
                    className={`py-1 ${
                      log.logType === "error"
                        ? "text-red-400"
                        : log.logType === "warning"
                        ? "text-yellow-400"
                        : log.logType === "info"
                        ? "text-blue-400"
                        : "text-slate-300"
                    }`}
                  >
                    <span className="text-slate-600">[{log.logType}]</span> {log.logContent}
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
