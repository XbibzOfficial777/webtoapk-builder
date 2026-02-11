import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Github, CheckCircle, AlertCircle, Plus } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";

export default function GithubConnect() {
  const [showCreateRepo, setShowCreateRepo] = useState(false);
  const [repoName, setRepoName] = useState("");
  const [repoDescription, setRepoDescription] = useState("");
  const [isPrivate, setIsPrivate] = useState(false);

  const githubTokenQuery = trpc.github.getToken.useQuery();
  const getOAuthUrl = trpc.github.getOAuthUrl.useQuery();
  const createRepoMutation = trpc.github.createRepository.useMutation({
    onSuccess: (data) => {
      toast.success(`Repository created: ${data.fullName}`);
      setRepoName("");
      setRepoDescription("");
      setShowCreateRepo(false);
    },
    onError: (error) => {
      toast.error(error.message || "Failed to create repository");
    },
  });

  const handleCreateRepository = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!repoName) {
      toast.error("Repository name is required");
      return;
    }
    createRepoMutation.mutate({
      repoName,
      description: repoDescription,
      isPrivate,
    });
  };

  const handleGithubConnect = () => {
    if (getOAuthUrl.data) {
      window.location.href = getOAuthUrl.data;
    }
  };

  if (githubTokenQuery.isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
      </div>
    );
  }

  const isConnected = githubTokenQuery.data !== null;

  return (
    <div className="space-y-6">
      {/* Connection Status */}
      <Card className="bg-slate-800 border-slate-700">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <Github className="w-5 h-5" />
            GitHub Connection Status
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {isConnected ? (
            <div className="space-y-4">
              <div className="flex items-center gap-3 p-4 bg-green-900/20 border border-green-700/50 rounded-lg">
                <CheckCircle className="w-5 h-5 text-green-500" />
                <div>
                  <p className="text-green-300 font-medium">Connected</p>
                  <p className="text-sm text-green-200">@{githubTokenQuery.data?.username}</p>
                </div>
              </div>

              <div className="space-y-2">
                <h3 className="text-white font-semibold">Connected Account</h3>
                <div className="bg-slate-700/50 p-3 rounded">
                  <p className="text-slate-300">Username: <span className="text-white">{githubTokenQuery.data?.username}</span></p>
                  <p className="text-slate-300">ID: <span className="text-white font-mono text-sm">{githubTokenQuery.data?.githubId}</span></p>
                </div>
              </div>

              <Button
                variant="outline"
                className="w-full border-slate-600 text-slate-300 hover:bg-slate-700"
                onClick={() => window.location.reload()}
              >
                Refresh Connection
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center gap-3 p-4 bg-yellow-900/20 border border-yellow-700/50 rounded-lg">
                <AlertCircle className="w-5 h-5 text-yellow-500" />
                <div>
                  <p className="text-yellow-300 font-medium">Not Connected</p>
                  <p className="text-sm text-yellow-200">Connect your GitHub account to enable automated builds</p>
                </div>
              </div>

              <Button
                onClick={handleGithubConnect}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white"
              >
                <Github className="w-4 h-4 mr-2" />
                Connect GitHub Account
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Repository Management */}
      {isConnected && (
        <Card className="bg-slate-800 border-slate-700">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-white">Repository Management</CardTitle>
                <CardDescription className="text-slate-400">
                  Create and manage GitHub repositories for your builds
                </CardDescription>
              </div>
              <Button
                size="sm"
                onClick={() => setShowCreateRepo(!showCreateRepo)}
                className="bg-green-600 hover:bg-green-700 text-white"
              >
                <Plus className="w-4 h-4 mr-2" />
                New Repository
              </Button>
            </div>
          </CardHeader>

          {showCreateRepo && (
            <CardContent className="border-t border-slate-700 pt-6">
              <form onSubmit={handleCreateRepository} className="space-y-4">
                <div>
                  <Label htmlFor="repoName" className="text-slate-300">
                    Repository Name *
                  </Label>
                  <Input
                    id="repoName"
                    placeholder="e.g., my-awesome-app"
                    value={repoName}
                    onChange={(e) => setRepoName(e.target.value)}
                    className="bg-slate-700 border-slate-600 text-white placeholder-slate-500"
                  />
                  <p className="text-xs text-slate-500 mt-1">
                    Only lowercase letters, numbers, and hyphens allowed
                  </p>
                </div>

                <div>
                  <Label htmlFor="repoDescription" className="text-slate-300">
                    Description
                  </Label>
                  <Input
                    id="repoDescription"
                    placeholder="Repository description"
                    value={repoDescription}
                    onChange={(e) => setRepoDescription(e.target.value)}
                    className="bg-slate-700 border-slate-600 text-white placeholder-slate-500"
                  />
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="isPrivate"
                    checked={isPrivate}
                    onChange={(e) => setIsPrivate(e.target.checked)}
                    className="w-4 h-4 rounded border-slate-600 bg-slate-700"
                  />
                  <Label htmlFor="isPrivate" className="text-slate-300 cursor-pointer">
                    Make repository private
                  </Label>
                </div>

                <div className="flex gap-2 pt-4">
                  <Button
                    type="submit"
                    disabled={createRepoMutation.isPending}
                    className="flex-1 bg-green-600 hover:bg-green-700 text-white"
                  >
                    {createRepoMutation.isPending ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Creating...
                      </>
                    ) : (
                      "Create Repository"
                    )}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setShowCreateRepo(false)}
                    className="border-slate-600 text-slate-300 hover:bg-slate-700"
                  >
                    Cancel
                  </Button>
                </div>
              </form>
            </CardContent>
          )}
        </Card>
      )}

      {/* Permissions Info */}
      <Card className="bg-slate-800 border-slate-700">
        <CardHeader>
          <CardTitle className="text-white text-sm">Required Permissions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 text-sm text-slate-400">
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-slate-300 border-slate-600">repo</Badge>
              <span>Full control of repositories</span>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-slate-300 border-slate-600">workflow</Badge>
              <span>GitHub Actions workflow management</span>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-slate-300 border-slate-600">user:email</Badge>
              <span>Access to email address</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
