/**
 * GitHub Actions Workflow Generator
 * Generates YAML workflow files for automated APK building
 */

export interface WorkflowConfig {
  packageId: string;
  appName: string;
  appVersion: string;
  targetUrl: string;
  iconUrl?: string;
  splashUrl?: string;
}

export function generateApkBuildWorkflow(config: WorkflowConfig): string {
  return `name: Build APK

on:
  workflow_dispatch:
    inputs:
      version:
        description: 'App Version'
        required: false
        default: '${config.appVersion}'

permissions:
  contents: read
  actions: read

jobs:
  build:
    runs-on: ubuntu-latest
    
    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '18'

      - name: Install dependencies
        run: npm install -g @capacitor/cli @capacitor/core cordova-res

      - name: Create Capacitor project
        run: |
          mkdir -p build-workspace
          cd build-workspace
          npx @capacitor/cli@latest create --appName="${config.appName}" --appId="${config.packageId}" --webDir="www"

      - name: Configure Capacitor
        run: |
          cd build-workspace
          cat > capacitor.config.json <<EOF
          {
            "appId": "${config.packageId}",
            "appName": "${config.appName}",
            "webDir": "www",
            "server": {
              "url": "${config.targetUrl}",
              "cleartext": true
            },
            "plugins": {
              "SplashScreen": {
                "launchShowDuration": 0
              }
            }
          }
          EOF

      - name: Create web content
        run: |
          cd build-workspace
          mkdir -p www
          cat > www/index.html <<EOF
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1">
            <title>${config.appName}</title>
            <script src="capacitor.js"></script>
            <style>
              * { margin: 0; padding: 0; }
              body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; }
              iframe { width: 100%; height: 100vh; border: none; }
            </style>
          </head>
          <body>
            <iframe src="${config.targetUrl}" allow="camera; microphone; geolocation; payment"></iframe>
            <script src="main.js"></script>
          </body>
          </html>
          EOF

      - name: Create main.js
        run: |
          cd build-workspace
          cat > www/main.js <<EOF
          import { App } from '@capacitor/app';
          import { StatusBar, Style } from '@capacitor/status-bar';
          
          // Handle back button
          App.addListener('backButton', async () => {
            // Handle back navigation
          });
          
          // Set status bar
          StatusBar.setStyle({ style: Style.Dark });
          EOF

      - name: Setup Android environment
        run: |
          echo "ANDROID_HOME=/opt/android-sdk" >> \$GITHUB_ENV
          echo "JAVA_HOME=/usr/lib/jvm/java-17-openjdk-amd64" >> \$GITHUB_ENV

      - name: Add Android platform
        run: |
          cd build-workspace
          npx @capacitor/cli@latest add android

      - name: Build Android APK
        run: |
          cd build-workspace/android
          chmod +x gradlew
          ./gradlew assembleRelease

      - name: Upload APK artifact
        uses: actions/upload-artifact@v4
        with:
          name: app-release
          path: build-workspace/android/app/build/outputs/apk/release/app-release.apk
          retention-days: 30

      - name: Create Release
        if: success()
        uses: actions/create-release@v1
        env:
          GITHUB_TOKEN: \${{ secrets.GITHUB_TOKEN }}
        with:
          tag_name: v\${{ github.run_number }}
          release_name: Release v\${{ github.run_number }}
          body: |
            APK Build Successful
            - App: ${config.appName}
            - Version: ${config.appVersion}
            - Package: ${config.packageId}
          draft: false
          prerelease: false

      - name: Upload Release Asset
        if: success()
        uses: actions/upload-release-asset@v1
        env:
          GITHUB_TOKEN: \${{ secrets.GITHUB_TOKEN }}
        with:
          upload_url: \${{ steps.create_release.outputs.upload_url }}
          asset_path: ./build-workspace/android/app/build/outputs/apk/release/app-release.apk
          asset_name: \${{ env.APP_NAME }}-v\${{ env.APP_VERSION }}.apk
          asset_content_type: application/vnd.android.package-archive
`;
}

export function generateSimpleWebViewWorkflow(config: WorkflowConfig): string {
  return `name: Build WebView APK

on:
  workflow_dispatch:

jobs:
  build:
    runs-on: ubuntu-latest
    
    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Setup Java
        uses: actions/setup-java@v4
        with:
          distribution: 'temurin'
          java-version: '17'

      - name: Setup Android SDK
        uses: android-actions/setup-android@v3

      - name: Create WebView APK project
        run: |
          mkdir -p webview-app
          cd webview-app
          
          # Create Android project structure
          mkdir -p app/src/main/{java/com/example/webview,res/{layout,values,drawable,mipmap}}
          mkdir -p app/src/main/AndroidManifest.xml

      - name: Build APK
        run: |
          cd webview-app
          # Build process here

      - name: Upload Artifact
        uses: actions/upload-artifact@v4
        with:
          name: webview-apk
          path: webview-app/app/build/outputs/apk/release/
`;
}

export function generateAdvancedWorkflow(config: WorkflowConfig): string {
  return `name: Advanced APK Build

on:
  workflow_dispatch:
    inputs:
      build_type:
        description: 'Build Type'
        required: true
        default: 'release'
        type: choice
        options:
          - debug
          - release

env:
  PACKAGE_ID: ${config.packageId}
  APP_NAME: ${config.appName}
  APP_VERSION: ${config.appVersion}
  TARGET_URL: ${config.targetUrl}

jobs:
  build:
    runs-on: ubuntu-latest
    
    steps:
      - uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '18'
          cache: 'npm'

      - name: Setup Java
        uses: actions/setup-java@v4
        with:
          distribution: 'temurin'
          java-version: '17'
          cache: 'gradle'

      - name: Setup Android SDK
        uses: android-actions/setup-android@v3
        with:
          api-level: 34
          ndk-version: '26.1.10909125'

      - name: Create Capacitor Project
        run: |
          npx @capacitor/cli@latest create \\
            --appName="\${{ env.APP_NAME }}" \\
            --appId="\${{ env.PACKAGE_ID }}" \\
            --webDir="www"

      - name: Configure App
        run: |
          cat > capacitor.config.json <<EOF
          {
            "appId": "\${{ env.PACKAGE_ID }}",
            "appName": "\${{ env.APP_NAME }}",
            "webDir": "www",
            "server": {
              "url": "\${{ env.TARGET_URL }}",
              "cleartext": true
            },
            "android": {
              "minWebViewVersion": 90
            }
          }
          EOF

      - name: Add Android Platform
        run: npx @capacitor/cli@latest add android

      - name: Build Android
        run: |
          cd android
          chmod +x gradlew
          ./gradlew assembleRelease

      - name: Sign APK
        if: \${{ github.event.inputs.build_type == 'release' }}
        run: |
          # APK signing configuration
          echo "APK signing step"

      - name: Upload Artifacts
        uses: actions/upload-artifact@v4
        with:
          name: apk-build-\${{ github.run_number }}
          path: android/app/build/outputs/apk/release/
          retention-days: 30

      - name: Create GitHub Release
        if: success()
        uses: softprops/action-gh-release@v1
        with:
          files: android/app/build/outputs/apk/release/*.apk
          tag_name: v\${{ github.run_number }}
          body: |
            ## APK Build Report
            - **App**: \${{ env.APP_NAME }}
            - **Version**: \${{ env.APP_VERSION }}
            - **Package ID**: \${{ env.PACKAGE_ID }}
            - **Build Type**: \${{ github.event.inputs.build_type }}
            - **Build Number**: \${{ github.run_number }}
            - **Timestamp**: \${{ github.event.head_commit.timestamp }}
`;
}
