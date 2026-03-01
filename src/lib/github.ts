import { db } from './db';

const GITHUB_API_BASE = 'https://api.github.com';

interface GitHubRepo {
  name: string;
  full_name: string;
  html_url: string;
  clone_url: string;
}

interface GitHubWorkflowRun {
  id: number;
  status: string;
  conclusion: string | null;
  html_url: string;
  created_at: string;
  updated_at: string;
  artifacts_url: string;
}

interface GitHubArtifact {
  id: number;
  name: string;
  archive_download_url: string;
}

export class GitHubService {
  private token: string;
  private email: string;
  private username: string;

  constructor(token: string, email: string, username: string) {
    this.token = token;
    this.email = email;
    this.username = username;
  }

  private async fetchAPI(endpoint: string, options: RequestInit = {}) {
    const response = await fetch(`${GITHUB_API_BASE}${endpoint}`, {
      ...options,
      headers: {
        'Authorization': `Bearer ${this.token}`,
        'Accept': 'application/vnd.github.v3+json',
        'X-GitHub-Api-Version': '2022-11-28',
        ...options.headers,
      },
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`GitHub API Error: ${response.status} - ${error}`);
    }

    return response.json();
  }

  async createRepository(repoName: string, description: string = 'Web to APK Build'): Promise<GitHubRepo> {
    try {
      const repo = await this.fetchAPI('/user/repos', {
        method: 'POST',
        body: JSON.stringify({
          name: repoName,
          description,
          private: false,
          auto_init: true,
        }),
      });
      return repo;
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      if (errorMessage.includes('422')) {
        // Repo already exists, get it
        return this.getRepository(repoName);
      }
      throw error;
    }
  }

  async getRepository(repoName: string): Promise<GitHubRepo> {
    return this.fetchAPI(`/repos/${this.username}/${repoName}`);
  }

  async createFile(
    repoName: string,
    path: string,
    content: string,
    message: string
  ): Promise<void> {
    const encodedContent = Buffer.from(content).toString('base64');
    
    // Check if file exists
    let sha: string | undefined;
    try {
      const existingFile = await this.fetchAPI(
        `/repos/${this.username}/${repoName}/contents/${path}`
      );
      sha = (existingFile as { sha: string }).sha;
    } catch {
      // File doesn't exist, that's fine
    }

    await this.fetchAPI(`/repos/${this.username}/${repoName}/contents/${path}`, {
      method: 'PUT',
      body: JSON.stringify({
        message,
        content: encodedContent,
        ...(sha && { sha }),
      }),
    });
  }

  async createWorkflowFile(repoName: string, config: {
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
  }): Promise<void> {
    // Build workflow content with proper escaping for GitHub Actions syntax
    const workflowContent = `name: Build APK

on:
  push:
    branches: [main]
  workflow_dispatch:

jobs:
  build:
    runs-on: ubuntu-latest
    
    steps:
    - name: Checkout code
      uses: actions/checkout@v4

    - name: Set up JDK 17
      uses: actions/setup-java@v4
      with:
        java-version: '17'
        distribution: 'temurin'

    - name: Setup Android SDK
      uses: android-actions/setup-android@v3

    - name: Create Android Project
      run: |
        mkdir -p app/src/main/java/com/webtoapk
        mkdir -p app/src/main/res/values
        mkdir -p app/src/main/res/drawable
        mkdir -p app/src/main/res/mipmap-hdpi
        mkdir -p app/src/main/res/mipmap-mdpi
        mkdir -p app/src/main/res/mipmap-xhdpi
        mkdir -p app/src/main/res/mipmap-xxhdpi
        mkdir -p app/src/main/res/mipmap-xxxhdpi
        mkdir -p app/src/main/assets

    - name: Create AndroidManifest.xml
      run: |
        cat > app/src/main/AndroidManifest.xml << 'MANIFEST_EOF'
        <?xml version="1.0" encoding="utf-8"?>
        <manifest xmlns:android="http://schemas.android.com/apk/res/android"
            package="${config.packageName}">
            
            <uses-permission android:name="android.permission.INTERNET" />
            <uses-permission android:name="android.permission.ACCESS_NETWORK_STATE" />
            <uses-permission android:name="android.permission.ACCESS_WIFI_STATE" />
            
            <application
                android:allowBackup="true"
                android:icon="@mipmap/ic_launcher"
                android:label="${config.appName}"
                android:roundIcon="@mipmap/ic_launcher_round"
                android:supportsRtl="true"
                android:theme="@style/AppTheme"
                android:usesCleartextTraffic="true"
                android:hardwareAccelerated="true">
                
                <activity
                    android:name=".MainActivity"
                    android:exported="true"
                    android:screenOrientation="${config.orientation === 'portrait' ? 'portrait' : config.orientation === 'landscape' ? 'landscape' : 'unspecified'}"
                    android:configChanges="orientation|screenSize|keyboardHidden"
                    android:windowSoftInputMode="adjustResize">
                    <intent-filter>
                        <action android:name="android.intent.action.MAIN" />
                        <category android:name="android.intent.category.LAUNCHER" />
                    </intent-filter>
                </activity>
                ${config.showSplash ? `
                <activity
                    android:name=".SplashActivity"
                    android:exported="true"
                    android:theme="@style/SplashTheme">
                    <intent-filter>
                        <action android:name="android.intent.action.MAIN" />
                        <category android:name="android.intent.category.LAUNCHER" />
                    </intent-filter>
                </activity>
                ` : ''}
            </application>
        </manifest>
        MANIFEST_EOF

    - name: Create build.gradle
      run: |
        cat > app/build.gradle << 'GRADLE_EOF'
        plugins {
            id 'com.android.application'
        }
        
        android {
            namespace "${config.packageName}"
            compileSdk 34
            
            defaultConfig {
                applicationId "${config.packageName}"
                minSdk 24
                targetSdk 34
                versionCode ${config.versionCode}
                versionName "${config.versionName}"
            }
            
            buildTypes {
                release {
                    minifyEnabled false
                    proguardFiles getDefaultProguardFile('proguard-android-optimize.txt'), 'proguard-rules.pro'
                }
            }
            
            compileOptions {
                sourceCompatibility JavaVersion.VERSION_17
                targetCompatibility JavaVersion.VERSION_17
            }
        }
        
        dependencies {
            implementation 'androidx.appcompat:appcompat:1.6.1'
            implementation 'androidx.webkit:webkit:1.8.0'
            implementation 'com.google.android.material:material:1.11.0'
            implementation 'androidx.constraintlayout:constraintlayout:2.1.4'
        }
        GRADLE_EOF

    - name: Create project build.gradle
      run: |
        cat > build.gradle << 'PROJECT_EOF'
        plugins {
            id 'com.android.application' version '8.2.0' apply false
        }
        PROJECT_EOF

    - name: Create settings.gradle
      run: |
        cat > settings.gradle << 'SETTINGS_EOF'
        pluginManagement {
            repositories {
                google()
                mavenCentral()
                gradlePluginPortal()
            }
        }
        dependencyResolutionManagement {
            repositoriesMode.set(RepositoriesMode.FAIL_ON_PROJECT_REPOS)
            repositories {
                google()
                mavenCentral()
            }
        }
        rootProject.name = "${config.appName.replace(/[^a-zA-Z0-9]/g, '')}"
        include ':app'
        SETTINGS_EOF

    - name: Create MainActivity.java
      run: |
        cat > app/src/main/java/com/webtoapk/MainActivity.java << 'JAVA_EOF'
        package ${config.packageName};
        
        import android.app.Activity;
        import android.content.Context;
        import android.content.Intent;
        import android.graphics.Bitmap;
        import android.net.ConnectivityManager;
        import android.net.NetworkInfo;
        import android.os.Bundle;
        import android.view.View;
        import android.view.WindowManager;
        import android.webkit.CookieManager;
        import android.webkit.WebChromeClient;
        import android.webkit.WebResourceError;
        import android.webkit.WebResourceRequest;
        import android.webkit.WebSettings;
        import android.webkit.WebView;
        import android.webkit.WebViewClient;
        import android.widget.FrameLayout;
        import android.widget.ProgressBar;
        import android.widget.Toast;
        
        public class MainActivity extends Activity {
            private WebView webView;
            private ProgressBar progressBar;
            private static final String URL = "${config.websiteUrl}";
            
            @Override
            protected void onCreate(Bundle savedInstanceState) {
                super.onCreate(savedInstanceState);
                
                FrameLayout layout = new FrameLayout(this);
                webView = new WebView(this);
                progressBar = new ProgressBar(this, null, android.R.attr.progressBarStyleHorizontal);
                progressBar.setLayoutParams(new FrameLayout.LayoutParams(
                    FrameLayout.LayoutParams.MATCH_PARENT,
                    20
                ));
                
                layout.addView(webView, new FrameLayout.LayoutParams(
                    FrameLayout.LayoutParams.MATCH_PARENT,
                    FrameLayout.LayoutParams.MATCH_PARENT
                ));
                layout.addView(progressBar);
                
                setContentView(layout);
                
                setupWebView();
                
                if (isNetworkAvailable()) {
                    webView.loadUrl(URL);
                } else {
                    Toast.makeText(this, "No internet connection", Toast.LENGTH_LONG).show();
                }
            }
            
            private void setupWebView() {
                WebSettings settings = webView.getSettings();
                settings.setJavaScriptEnabled(true);
                settings.setDomStorageEnabled(true);
                ${config.enableCache ? 'settings.setCacheMode(WebSettings.LOAD_DEFAULT);' : 'settings.setCacheMode(WebSettings.LOAD_NO_CACHE);'}
                settings.setLoadWithOverviewMode(true);
                settings.setUseWideViewPort(true);
                ${config.enableZoom ? 'settings.setBuiltInZoomControls(true); settings.setDisplayZoomControls(false);' : 'settings.setBuiltInZoomControls(false);'}
                settings.setSupportZoom(${config.enableZoom ? 'true' : 'false'});
                settings.setAllowFileAccess(true);
                settings.setJavaScriptCanOpenWindowsAutomatically(true);
                settings.setMediaPlaybackRequiresUserGesture(false);
                
                webView.setScrollBarStyle(WebView.SCROLLBARS_INSIDE_OVERLAY);
                webView.setOverScrollMode(WebView.OVER_SCROLL_NEVER);
                
                CookieManager cookieManager = CookieManager.getInstance();
                cookieManager.setAcceptCookie(true);
                cookieManager.setAcceptThirdPartyCookies(webView, true);
                
                webView.setWebViewClient(new WebViewClient() {
                    @Override
                    public void onPageStarted(WebView view, String url, Bitmap favicon) {
                        super.onPageStarted(view, url, favicon);
                        progressBar.setVisibility(View.VISIBLE);
                    }
                    
                    @Override
                    public void onPageFinished(WebView view, String url) {
                        super.onPageFinished(view, url);
                        progressBar.setVisibility(View.GONE);
                    }
                    
                    @Override
                    public void onReceivedError(WebView view, WebResourceRequest request, WebResourceError error) {
                        super.onReceivedError(view, request, error);
                        if (!request.isForMainFrame()) return;
                        Toast.makeText(MainActivity.this, "Error loading page", Toast.LENGTH_SHORT).show();
                    }
                });
                
                webView.setWebChromeClient(new WebChromeClient() {
                    @Override
                    public void onProgressChanged(WebView view, int newProgress) {
                        progressBar.setProgress(newProgress);
                        if (newProgress == 100) {
                            progressBar.setVisibility(View.GONE);
                        }
                    }
                });
            }
            
            private boolean isNetworkAvailable() {
                ConnectivityManager cm = (ConnectivityManager) getSystemService(Context.CONNECTIVITY_SERVICE);
                NetworkInfo ni = cm.getActiveNetworkInfo();
                return ni != null && ni.isConnected();
            }
            
            @Override
            public void onBackPressed() {
                if (webView.canGoBack()) {
                    webView.goBack();
                } else {
                    super.onBackPressed();
                }
            }
        }
        JAVA_EOF

    - name: Create SplashActivity.java
      if: \${{ ${config.showSplash} }}
      run: |
        cat > app/src/main/java/com/webtoapk/SplashActivity.java << 'SPLASH_EOF'
        package ${config.packageName};
        
        import android.app.Activity;
        import android.content.Intent;
        import android.os.Bundle;
        import android.os.Handler;
        import android.view.View;
        import android.widget.LinearLayout;
        import android.widget.TextView;
        import android.graphics.Color;
        
        public class SplashActivity extends Activity {
            @Override
            protected void onCreate(Bundle savedInstanceState) {
                super.onCreate(savedInstanceState);
                
                LinearLayout layout = new LinearLayout(this);
                layout.setOrientation(LinearLayout.VERTICAL);
                layout.setGravity(android.view.Gravity.CENTER);
                layout.setBackgroundColor(Color.parseColor("${config.primaryColor}"));
                
                TextView appName = new TextView(this);
                appName.setText("${config.splashText || config.appName}");
                appName.setTextSize(28);
                appName.setTextColor(Color.WHITE);
                appName.setPadding(0, 0, 0, 50);
                
                layout.addView(appName);
                setContentView(layout);
                
                new Handler().postDelayed(() -> {
                    startActivity(new Intent(SplashActivity.this, MainActivity.class));
                    finish();
                }, 2000);
            }
        }
        SPLASH_EOF

    - name: Create styles.xml
      run: |
        cat > app/src/main/res/values/styles.xml << 'STYLES_EOF'
        <?xml version="1.0" encoding="utf-8"?>
        <resources>
            <style name="AppTheme" parent="Theme.MaterialComponents.Light.NoActionBar">
                <item name="colorPrimary">${config.primaryColor}</item>
                <item name="colorPrimaryDark">${config.primaryColor}</item>
                <item name="colorAccent">${config.primaryColor}</item>
            </style>
            ${config.showSplash ? `
            <style name="SplashTheme" parent="Theme.MaterialComponents.Light.NoActionBar">
                <item name="android:windowBackground">${config.primaryColor}</item>
                <item name="android:statusBarColor">${config.primaryColor}</item>
            </style>
            ` : ''}
        </resources>
        STYLES_EOF

    - name: Create colors.xml
      run: |
        cat > app/src/main/res/values/colors.xml << 'COLORS_EOF'
        <?xml version="1.0" encoding="utf-8"?>
        <resources>
            <color name="colorPrimary">${config.primaryColor}</color>
            <color name="colorPrimaryDark">${config.primaryColor}</color>
            <color name="colorAccent">${config.primaryColor}</color>
        </resources>
        COLORS_EOF

    - name: Create proguard-rules.pro
      run: |
        cat > app/proguard-rules.pro << 'PROGUARD_EOF'
        -keepattributes *Annotation*
        -keepattributes SourceFile,LineNumberTable
        -keep public class * extends android.app.Activity
        -keep public class * extends android.app.Service
        -keep public class * extends android.view.View
        -keep class * extends android.webkit.WebViewClient
        -keepclassmembers class * {
            @android.webkit.JavascriptInterface <methods>;
        }
        PROGUARD_EOF

    - name: Create gradle.properties
      run: |
        cat > gradle.properties << 'PROPS_EOF'
        org.gradle.jvmargs=-Xmx2048m -Dfile.encoding=UTF-8
        android.useAndroidX=true
        android.enableJetifier=true
        PROPS_EOF

    - name: Create local.properties
      run: |
        echo "sdk.dir=$ANDROID_HOME" > local.properties

    - name: Download and set app icon
      if: \${{ ${config.iconUrl ? 'true' : 'false'} }}
      run: |
        curl -L -o icon.png "${config.iconUrl}" || true
        if [ -f icon.png ]; then
          for size in 48 72 96 144 192; do
            convert icon.png -resize "\${size}x\${size}" app/src/main/res/mipmap-*/ic_launcher.png 2>/dev/null || true
          done
        fi
      continue-on-error: true

    - name: Create default icon
      run: |
        cat > app/src/main/res/drawable/ic_launcher_foreground.xml << 'ICON_EOF'
        <?xml version="1.0" encoding="utf-8"?>
        <vector xmlns:android="http://schemas.android.com/apk/res/android"
            android:width="108dp"
            android:height="108dp"
            android:viewportWidth="108"
            android:viewportHeight="108">
            <path
                android:fillColor="${config.primaryColor}"
                android:pathData="M54,54m-40,0a40,40 0,1 1,80 0a40,40 0,1 1,-80 0"/>
        </vector>
        ICON_EOF

    - name: Grant execute permission for gradlew
      run: chmod +x gradlew || true

    - name: Build Debug APK
      run: |
        ./gradlew assembleDebug --no-daemon --stacktrace 2>&1 | tee build_log.txt || {
          echo "BUILD FAILED"
          cat build_log.txt
          exit 1
        }

    - name: Upload APK as artifact
      uses: actions/upload-artifact@v4
      if: success()
      with:
        name: app-debug
        path: app/build/outputs/apk/debug/*.apk

    - name: Create Release
      if: success()
      uses: softprops/action-gh-release@v1
      with:
        tag_name: v${config.versionName}-\${{ github.run_number }}
        name: ${config.appName} v${config.versionName}
        files: app/build/outputs/apk/debug/*.apk
        body: |
          ## ${config.appName} v${config.versionName}
          
          **Package:** ${config.packageName}
          **Website:** ${config.websiteUrl}
          
          Built automatically by WebToAPK Builder
      env:
        GITHUB_TOKEN: \${{ secrets.GITHUB_TOKEN }}

    - name: Upload build logs on failure
      if: failure()
      uses: actions/upload-artifact@v4
      with:
        name: build-logs
        path: build_log.txt
`;

    await this.createFile(repoName, '.github/workflows/build-apk.yml', workflowContent, 'Add APK build workflow');
  }

  async triggerWorkflow(repoName: string): Promise<number> {
    await this.fetchAPI(
      `/repos/${this.username}/${repoName}/actions/workflows/build-apk.yml/dispatches`,
      {
        method: 'POST',
        body: JSON.stringify({
          ref: 'main',
        }),
      }
    );

    // Get the latest workflow run
    await new Promise(resolve => setTimeout(resolve, 2000));
    const runs = await this.fetchAPI(
      `/repos/${this.username}/${repoName}/actions/workflows/build-apk.yml/runs?per_page=1`
    );
    
    return (runs as { workflow_runs: { id: number }[] }).workflow_runs[0]?.id;
  }

  async getWorkflowRun(repoName: string, runId: number): Promise<GitHubWorkflowRun> {
    return this.fetchAPI(`/repos/${this.username}/${repoName}/actions/runs/${runId}`);
  }

  async getWorkflowLogs(repoName: string, runId: number): Promise<string> {
    try {
      const response = await fetch(
        `${GITHUB_API_BASE}/repos/${this.username}/${repoName}/actions/runs/${runId}/logs`,
        {
          headers: {
            'Authorization': `Bearer ${this.token}`,
            'Accept': 'application/vnd.github.v3+json',
          },
        }
      );
      
      if (response.ok) {
        return await response.text();
      }
      return 'Could not fetch logs';
    } catch {
      return 'Error fetching logs';
    }
  }

  async getArtifacts(repoName: string, runId: number): Promise<GitHubArtifact[]> {
    const result = await this.fetchAPI(
      `/repos/${this.username}/${repoName}/actions/runs/${runId}/artifacts`
    );
    return (result as { artifacts: GitHubArtifact[] }).artifacts;
  }

  async getRelease(repoName: string, tagName: string): Promise<{
    assets: { name: string; browser_download_url: string }[];
    html_url: string;
  }> {
    return this.fetchAPI(`/repos/${this.username}/${repoName}/releases/tags/${tagName}`);
  }
}

export async function getGitHubService(): Promise<GitHubService> {
  const tokenData = await db.gitHubToken.findFirst({
    where: { isActive: true },
  });

  if (!tokenData) {
    // Create default token from environment if no token exists in database
    const token = process.env.GITHUB_TOKEN;
    const email = process.env.GITHUB_EMAIL || '';
    const username = process.env.GITHUB_USERNAME || '';
    
    if (!token) {
      throw new Error('GitHub token not configured. Please set GITHUB_TOKEN environment variable.');
    }
    
    const newToken = await db.gitHubToken.create({
      data: {
        token,
        email,
        username,
      },
    });
    return new GitHubService(newToken.token, newToken.email, newToken.username);
  }

  return new GitHubService(tokenData.token, tokenData.email, tokenData.username);
}
