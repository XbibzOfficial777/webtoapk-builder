import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, Package, Zap, Github, Plus, Settings } from "lucide-react";
import { getLoginUrl } from "@/const";
import { useEffect, useState } from "react";
import ConfigurationForm from "@/pages/ConfigurationForm";
import BuildDashboard from "@/pages/BuildDashboard";
import BuildHistory from "@/pages/BuildHistory";
import GithubConnect from "@/pages/GithubConnect";

export default function Home() {
  const { user, loading, isAuthenticated, logout } = useAuth();
  const [activeTab, setActiveTab] = useState("dashboard");
  const [showNewConfig, setShowNewConfig] = useState(false);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-blue-500 mx-auto mb-4" />
          <p className="text-slate-300">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
        <div className="max-w-2xl mx-auto px-4 text-center">
          <div className="mb-8">
            <div className="flex justify-center mb-6">
              <div className="p-4 bg-blue-500/10 rounded-2xl border border-blue-500/20">
                <Package className="w-16 h-16 text-blue-400" />
              </div>
            </div>
            <h1 className="text-4xl font-bold text-white mb-3">Web-to-APK Builder</h1>
            <p className="text-xl text-slate-300 mb-8">
              Convert your website into a native Android APK with automated GitHub Actions integration
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            <Card className="bg-slate-800/50 border-slate-700">
              <CardHeader>
                <Zap className="w-8 h-8 text-yellow-400 mb-2" />
                <CardTitle className="text-white">Automated Builds</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-slate-300 text-sm">Fully automated APK building with GitHub Actions</p>
              </CardContent>
            </Card>

            <Card className="bg-slate-800/50 border-slate-700">
              <CardHeader>
                <Github className="w-8 h-8 text-purple-400 mb-2" />
                <CardTitle className="text-white">GitHub Integration</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-slate-300 text-sm">Seamless GitHub repository and workflow management</p>
              </CardContent>
            </Card>

            <Card className="bg-slate-800/50 border-slate-700">
              <CardHeader>
                <Package className="w-8 h-8 text-green-400 mb-2" />
                <CardTitle className="text-white">Easy Configuration</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-slate-300 text-sm">Simple UI for app name, icon, version, and more</p>
              </CardContent>
            </Card>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              size="lg"
              className="bg-blue-600 hover:bg-blue-700 text-white"
              onClick={() => window.location.href = getLoginUrl()}
            >
              Sign In with Manus
            </Button>
          </div>

          <div className="mt-12 p-6 bg-slate-800/30 rounded-lg border border-slate-700">
            <h3 className="text-white font-semibold mb-4">How it works:</h3>
            <ol className="text-left text-slate-300 space-y-2">
              <li className="flex items-start">
                <span className="text-blue-400 font-bold mr-3">1.</span>
                <span>Sign in and connect your GitHub account</span>
              </li>
              <li className="flex items-start">
                <span className="text-blue-400 font-bold mr-3">2.</span>
                <span>Configure your app (name, icon, URL, version)</span>
              </li>
              <li className="flex items-start">
                <span className="text-blue-400 font-bold mr-3">3.</span>
                <span>Trigger a build and watch real-time progress</span>
              </li>
              <li className="flex items-start">
                <span className="text-blue-400 font-bold mr-3">4.</span>
                <span>Download your APK when build completes</span>
              </li>
            </ol>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Header */}
      <div className="border-b border-slate-700 bg-slate-800/50 backdrop-blur">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-500/10 rounded-lg border border-blue-500/20">
              <Package className="w-6 h-6 text-blue-400" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">Web-to-APK Builder</h1>
              <p className="text-sm text-slate-400">Automated APK Building Platform</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right">
              <p className="text-sm text-slate-300">{user?.name || user?.email}</p>
              <p className="text-xs text-slate-500">Welcome back</p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={logout}
              className="border-slate-600 text-slate-300 hover:bg-slate-700"
            >
              Logout
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-4 bg-slate-800 border border-slate-700">
            <TabsTrigger value="dashboard" className="text-slate-300 data-[state=active]:text-white">
              Dashboard
            </TabsTrigger>
            <TabsTrigger value="builds" className="text-slate-300 data-[state=active]:text-white">
              Builds
            </TabsTrigger>
            <TabsTrigger value="settings" className="text-slate-300 data-[state=active]:text-white">
              Settings
            </TabsTrigger>
            <TabsTrigger value="github" className="text-slate-300 data-[state=active]:text-white">
              GitHub
            </TabsTrigger>
          </TabsList>

          {/* Dashboard Tab */}
          <TabsContent value="dashboard" className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-white">Dashboard</h2>
                <p className="text-slate-400">Manage your APK build configurations</p>
              </div>
              <Button
                onClick={() => setShowNewConfig(!showNewConfig)}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                <Plus className="w-4 h-4 mr-2" />
                New Configuration
              </Button>
            </div>

            {showNewConfig && (
              <Card className="bg-slate-800 border-slate-700">
                <CardHeader>
                  <CardTitle className="text-white">Create New Configuration</CardTitle>
                  <CardDescription className="text-slate-400">
                    Set up a new APK build configuration
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ConfigurationForm onSuccess={() => setShowNewConfig(false)} />
                </CardContent>
              </Card>
            )}

            <BuildDashboard />
          </TabsContent>

          {/* Builds Tab */}
          <TabsContent value="builds" className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold text-white">Build History</h2>
              <p className="text-slate-400">View all your past builds and their status</p>
            </div>
            <BuildHistory />
          </TabsContent>

          {/* Settings Tab */}
          <TabsContent value="settings" className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold text-white">Settings</h2>
              <p className="text-slate-400">Manage your application settings</p>
            </div>
            <Card className="bg-slate-800 border-slate-700">
              <CardHeader>
                <CardTitle className="text-white">Account Settings</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-slate-300">Email</label>
                  <p className="text-slate-400">{user?.email}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-slate-300">Name</label>
                  <p className="text-slate-400">{user?.name}</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* GitHub Tab */}
          <TabsContent value="github" className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold text-white">GitHub Integration</h2>
              <p className="text-slate-400">Connect and manage your GitHub account</p>
            </div>
            <GithubConnect />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
