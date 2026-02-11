# Web-to-APK Builder - Setup Guide

## Overview

Web-to-APK Builder is a fully automated platform for converting websites into native Android APK files using GitHub Actions. It provides a complete end-to-end solution with real-time monitoring, artifact management, and seamless GitHub integration.

## Features

- **Automated APK Building**: Convert any website to APK with a single click
- **GitHub Integration**: Seamless GitHub OAuth and repository management
- **Real-time Monitoring**: Watch builds progress in real-time with live logs
- **Artifact Management**: Automatic APK download link generation
- **Custom Configuration**: Set app name, icon, version, package ID, and more
- **Build History**: Track all past builds with detailed logs
- **Error Handling**: Comprehensive error messages and debugging information

## Getting Started

### 1. GitHub OAuth Setup

1. Go to https://github.com/settings/developers
2. Click "New OAuth App"
3. Fill in the form:
   - **Application name**: Web-to-APK Builder
   - **Homepage URL**: https://your-domain.com
   - **Authorization callback URL**: https://your-domain.com/api/github/callback
4. Copy the Client ID and Client Secret
5. Add them to your environment variables:
   ```
   GITHUB_CLIENT_ID=your_client_id
   GITHUB_CLIENT_SECRET=your_client_secret
   ```

### 2. Database Setup

The application uses MySQL/TiDB for data storage. Ensure your DATABASE_URL is configured:

```
DATABASE_URL=mysql://user:password@host:3306/webtoapk_builder
```

### 3. Running the Application

```bash
# Install dependencies
pnpm install

# Push database schema
pnpm db:push

# Start development server
pnpm dev

# Run tests
pnpm test
```

## Architecture

### Frontend
- React 19 with TypeScript
- Tailwind CSS 4 for styling
- tRPC for type-safe API calls
- Real-time UI updates

### Backend
- Express.js server
- tRPC for RPC procedures
- Drizzle ORM for database
- GitHub API integration via Octokit

### Database Schema

The application uses the following tables:

**users**: User authentication and profile information
**github_tokens**: GitHub OAuth tokens and connection details
**build_configurations**: APK build configurations with app metadata
**builds**: Build history and status tracking
**build_logs**: Detailed build logs for debugging
**workflow_configs**: GitHub Actions workflow configurations
**build_notifications**: Build notification tracking

## API Endpoints

### GitHub Integration

The GitHub integration module provides OAuth authentication and repository management:

- `POST /api/trpc/github.handleCallback` - OAuth callback handler
- `GET /api/trpc/github.getToken` - Retrieve stored GitHub token
- `POST /api/trpc/github.createRepository` - Create new GitHub repository
- `POST /api/trpc/github.pushWorkflow` - Push workflow file to repository
- `GET /api/trpc/github.getWorkflowRuns` - Fetch workflow run history

### Build Management

The build management module handles APK build operations:

- `POST /api/trpc/builds.trigger` - Trigger new APK build
- `GET /api/trpc/builds.history` - Retrieve build history
- `GET /api/trpc/builds.get` - Get specific build details
- `POST /api/trpc/builds.updateStatus` - Update build status
- `GET /api/trpc/builds.getLogs` - Retrieve build logs

### Configuration Management

The configuration module manages APK build settings:

- `POST /api/trpc/configurations.create` - Create new configuration
- `GET /api/trpc/configurations.list` - List all configurations
- `GET /api/trpc/configurations.get` - Get specific configuration
- `POST /api/trpc/configurations.update` - Update configuration

## Deployment

The application is configured for deployment on Manus platform with automatic GitHub Actions integration.

### GitHub Actions Workflow

The generated workflow includes these steps:

1. Checkout code
2. Setup Node.js and Android environment
3. Create Capacitor project
4. Build APK
5. Upload artifacts
6. Create GitHub release

## Troubleshooting

### Build Failures

Check the build logs in the UI for detailed error messages. Verify the target URL is accessible and ensure GitHub Actions has proper permissions.

### GitHub Connection Issues

Verify GitHub OAuth credentials are correct and check that the callback URL matches your domain. Ensure GitHub token has required scopes: repo, workflow, user:email.

### Database Issues

Verify DATABASE_URL is correct and run `pnpm db:push` to ensure schema is up to date. Check database connection permissions.

## Support

For issues or questions, please refer to the documentation or check the build logs for detailed error information.
