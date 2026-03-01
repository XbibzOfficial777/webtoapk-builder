# WebToAPK Builder 🚀

A powerful web application that converts any website into a native Android APK with custom branding, icons, and features. Built with Next.js, TypeScript, and automated with GitHub Actions.

![Next.js](https://img.shields.io/badge/Next.js-16-black?style=flat-square&logo=next.js)
![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?style=flat-square&logo=typescript)
![GitHub Actions](https://img.shields.io/badge/GitHub%20Actions-Automated-green?style=flat-square&logo=github-actions)

## ✨ Features

- **🎨 Custom Branding**: Configure app name, icon, colors, and splash screen
- **📱 WebView App**: Convert any website into a native Android app
- **⚙️ Configurable Options**: Cache, zoom, orientation, and more
- **🔄 Automated Builds**: GitHub Actions handles the entire build process
- **📊 Real-time Status**: Monitor build progress with live updates
- **📥 Easy Download**: Direct download links for completed APKs
- **📝 Full Logs**: Detailed error logs for debugging failed builds

## 🛠️ Tech Stack

- **Frontend**: Next.js 16, React 19, TypeScript, Tailwind CSS
- **UI Components**: shadcn/ui with custom emerald theme
- **Database**: Prisma ORM with SQLite
- **Automation**: GitHub Actions for APK builds
- **Real-time**: Polling-based status updates

## 🚀 Getting Started

### Prerequisites

- Node.js 18+
- GitHub account with Personal Access Token
- Git

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/YOUR_USERNAME/webtoapk-builder.git
   cd webtoapk-builder
   ```

2. **Install dependencies**
   ```bash
   bun install
   ```

3. **Set up environment variables**
   Create a `.env` file with:
   ```env
   DATABASE_URL=file:./db/custom.db
   GITHUB_TOKEN=your_github_token
   GITHUB_EMAIL=your_email
   GITHUB_USERNAME=your_username
   ```

4. **Initialize database**
   ```bash
   bun run db:push
   ```

5. **Start development server**
   ```bash
   bun run dev
   ```

6. **Open in browser**
   Navigate to `http://localhost:3000`

## 🔧 Configuration Options

| Option | Description | Default |
|--------|-------------|---------|
| App Name | Display name on device | "My WebView App" |
| Package Name | Unique Android identifier | com.example.myapp |
| Version | App version (x.x.x) | 1.0.0 |
| Website URL | URL to load in WebView | Required |
| Icon URL | Custom app icon | Default icon |
| Primary Color | Theme color | #10b981 |
| Orientation | Screen orientation | Portrait |
| Cache | Enable web caching | Enabled |
| Zoom | Allow zoom in WebView | Disabled |
| Splash Screen | Show launch screen | Enabled |

## 🔄 Build Process

1. **Configuration** → Fill in app details
2. **Repository Creation** → GitHub repo created automatically
3. **File Upload** → Project files pushed to GitHub
4. **GitHub Actions** → Build triggered automatically
5. **APK Generation** → Android app compiled
6. **Download Ready** → APK available for download

## 📱 APK Features

The generated APK includes:
- Native Android WebView
- Internet permission
- Network state detection
- Progress indicator
- Error handling
- Back button navigation
- Cookie support
- JavaScript enabled
- DOM storage enabled

## 🔐 Security

- GitHub tokens are stored securely in the database
- Environment variables are never committed to git
- Each build creates a new isolated repository
- Personal access tokens can be revoked anytime

## 📝 License

MIT License - Feel free to use and modify!

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

---

Built with ❤️ using Next.js and GitHub Actions
