# Web-to-APK Builder 🚀

[![Deploy Web-to-APK Builder](https://github.com/XbibzOfficial777/webtoapk-builder/actions/workflows/deploy.yml/badge.svg)](https://github.com/XbibzOfficial777/webtoapk-builder/actions/workflows/deploy.yml)

A fully automated, production-ready platform for converting websites into native Android APK files using GitHub Actions. Build APKs with zero manual intervention - from repository setup through artifact delivery.

## ✨ Key Features

**Automated End-to-End Workflow**: Create APK builds with a single click. The entire process from configuration to artifact generation is fully automated.

**GitHub Integration**: Seamless GitHub OAuth authentication, automatic repository creation, and GitHub Actions workflow management.

**Real-time Monitoring**: Watch builds progress in real-time with live log streaming, status indicators, and comprehensive error reporting.

**Custom Configuration**: Configure app name, package ID, version, icon, splash screen, and target URL through an intuitive web interface.

**Build Management**: Track complete build history with detailed logs, timestamps, configuration details, and re-build capability.

**Artifact Management**: Automatic APK download link generation with artifact tracking and version management.

**Error Handling**: Comprehensive error detection, detailed error messages, and debugging information for failed builds.

**Notification System**: Toast alerts and email notifications on build completion with download links.

## 🏗️ Architecture

### Frontend Stack
- **React 19** with TypeScript for type-safe UI
- **Tailwind CSS 4** for responsive design
- **tRPC** for end-to-end type-safe API calls
- **Shadcn/UI** components for consistent design
- Real-time UI updates with optimistic rendering

### Backend Stack
- **Express.js** for HTTP server
- **tRPC** for RPC procedures
- **Drizzle ORM** for type-safe database queries
- **Octokit** for GitHub API integration
- **MySQL/TiDB** for data persistence

### Database Schema

**users**: User authentication and profile information with role-based access control

**github_tokens**: GitHub OAuth tokens and connection metadata

**build_configurations**: APK build configurations with app metadata (name, package ID, version, URLs)

**builds**: Build history tracking with status, timestamps, and artifact information

**build_logs**: Detailed build logs for debugging and error analysis

**workflow_configs**: GitHub Actions workflow templates and configurations

**build_notifications**: Build notification tracking and delivery status

## 🚀 Getting Started

### Prerequisites

- Node.js 22+
- pnpm 10+
- MySQL 8+ or TiDB
- GitHub account with OAuth application

### 1. GitHub OAuth Setup

1. Visit https://github.com/settings/developers
2. Create new OAuth App with:
   - **Application name**: Web-to-APK Builder
   - **Homepage URL**: Your deployment domain
   - **Authorization callback URL**: `https://your-domain.com/api/github/callback`
3. Copy Client ID and Client Secret
4. Add to environment variables:
   ```
   GITHUB_CLIENT_ID=your_client_id
   GITHUB_CLIENT_SECRET=your_client_secret
   ```

### 2. Database Setup

Configure your database connection:

```bash
DATABASE_URL=mysql://user:password@host:3306/webtoapk_builder
```

### 3. Installation & Running

```bash
# Install dependencies
pnpm install

# Push database schema
pnpm db:push

# Start development server
pnpm dev

# Run tests
pnpm test

# Build for production
pnpm build

# Start production server
pnpm start
```

The application will be available at `http://localhost:3000`

## 📱 Usage Guide

### Creating Your First APK Build

1. **Connect GitHub**: Click "Connect GitHub Account" and authorize the application
2. **Create Configuration**: Fill in your app details:
   - App Name (e.g., "My Awesome App")
   - Package ID (e.g., "com.example.myapp")
   - Version (e.g., "1.0.0")
   - Target URL (website to convert)
   - App Icon (PNG image)
   - Splash Screen (optional)
3. **Trigger Build**: Click "Build" to start the automated process
4. **Monitor Progress**: Watch real-time logs and build status
5. **Download APK**: Once complete, download your APK file

### Build Configuration Options

| Option | Description | Example |
|--------|-------------|---------|
| App Name | Display name in app store | "My App" |
| Package ID | Unique identifier | "com.example.myapp" |
| Version | App version | "1.0.0" |
| Target URL | Website to convert | "https://example.com" |
| Icon | App icon (512x512) | PNG file |
| Splash Screen | Launch screen | PNG file |

## 🔧 API Reference

### GitHub Integration

**Handle OAuth Callback**
```
POST /api/trpc/github.handleCallback
Body: { code: string }
```

**Get GitHub Token**
```
GET /api/trpc/github.getToken
Response: { username: string, githubId: number } | null
```

**Create Repository**
```
POST /api/trpc/github.createRepository
Body: { repoName: string, description?: string, isPrivate?: boolean }
```

### Build Management

**Trigger Build**
```
POST /api/trpc/builds.trigger
Body: { configurationId: number }
```

**Get Build History**
```
GET /api/trpc/builds.history
Query: { configurationId: number, limit: number }
```

**Get Build Logs**
```
GET /api/trpc/builds.getLogs
Query: { buildId: number }
```

### Configuration Management

**Create Configuration**
```
POST /api/trpc/configurations.create
Body: { appName, packageId, appVersion, targetUrl, ... }
```

**List Configurations**
```
GET /api/trpc/configurations.list
```

**Update Configuration**
```
POST /api/trpc/configurations.update
Body: { id, ...updates }
```

## 🔄 GitHub Actions Workflow

The platform automatically creates GitHub Actions workflows that:

1. **Checkout code** from repository
2. **Setup environment** with Node.js and Android SDK
3. **Install dependencies** via pnpm
4. **Run tests** to ensure quality
5. **Build APK** using Capacitor
6. **Upload artifacts** to GitHub Actions
7. **Create releases** with download links
8. **Send notifications** on completion

### Workflow Triggers

- **Manual trigger**: Via GitHub Actions UI
- **Push to main**: Automatic build on code changes
- **API trigger**: From Web-to-APK Builder interface

## 📊 Build Status Indicators

| Status | Meaning | Action |
|--------|---------|--------|
| Pending | Build queued | Wait for processing |
| Running | Build in progress | View live logs |
| Success | Build completed | Download APK |
| Failed | Build error | Check logs for details |

## 🐛 Troubleshooting

### Build Failures

**Issue**: Build fails with "Target URL unreachable"
- **Solution**: Verify the website is publicly accessible and not blocked by CORS

**Issue**: GitHub Actions permission denied
- **Solution**: Ensure GitHub token has `repo` and `workflow` scopes

**Issue**: APK signing error
- **Solution**: Check that all required signing certificates are configured

### GitHub Connection Issues

**Issue**: "Bad credentials" error
- **Solution**: Verify GitHub OAuth token is valid and not expired

**Issue**: Repository creation fails
- **Solution**: Ensure GitHub account has permission to create repositories

### Database Issues

**Issue**: "Connection refused" error
- **Solution**: Verify DATABASE_URL is correct and database is running

**Issue**: Schema migration fails
- **Solution**: Run `pnpm db:push` to apply pending migrations

## 📝 Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| DATABASE_URL | MySQL connection string | Yes |
| GITHUB_CLIENT_ID | GitHub OAuth Client ID | Yes |
| GITHUB_CLIENT_SECRET | GitHub OAuth Client Secret | Yes |
| JWT_SECRET | Session signing secret | Yes |
| VITE_APP_ID | Manus OAuth App ID | Yes |
| OAUTH_SERVER_URL | OAuth server URL | Yes |
| VITE_OAUTH_PORTAL_URL | OAuth portal URL | Yes |

## 🧪 Testing

```bash
# Run all tests
pnpm test

# Run specific test file
pnpm test -- server/github.test.ts

# Run with coverage
pnpm test -- --coverage

# Watch mode
pnpm test -- --watch
```

## 📦 Deployment

### Manus Platform Deployment

The application is configured for deployment on Manus platform with automatic GitHub Actions integration.

1. Create checkpoint via Manus UI
2. Click "Publish" button
3. Configure custom domain (optional)
4. Application automatically deploys

### Self-Hosted Deployment

```bash
# Build for production
pnpm build

# Start production server
NODE_ENV=production pnpm start
```

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Run tests: `pnpm test`
5. Submit a pull request

## 📄 License

MIT License - see LICENSE file for details

## 🆘 Support

For issues or questions:

1. Check the [troubleshooting guide](#-troubleshooting)
2. Review build logs for detailed error information
3. Check GitHub Issues for known problems
4. Create a new issue with detailed reproduction steps

## 🎯 Roadmap

**Upcoming Features**:
- WebRTC support for real-time communication
- Push notification integration
- Custom splash screen designer
- App store publishing automation
- Multi-language support
- Advanced analytics dashboard

## 👨‍💻 Author

**XbibzOfficial777** - Full-stack developer passionate about automation

## 🙏 Acknowledgments

Built with modern web technologies and best practices for production-grade applications.

---

**Made with ❤️ for the developer community**

[GitHub Repository](https://github.com/XbibzOfficial777/webtoapk-builder) | [Report Issue](https://github.com/XbibzOfficial777/webtoapk-builder/issues) | [Discussions](https://github.com/XbibzOfficial777/webtoapk-builder/discussions)
