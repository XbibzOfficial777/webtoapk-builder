# Quick Start Guide - Web-to-APK Builder

Get your first APK built in 5 minutes!

## Step 1: Access the Application

Visit your deployed Web-to-APK Builder instance at: `https://your-domain.com`

## Step 2: Connect Your GitHub Account

1. Click the **"Connect GitHub Account"** button
2. Authorize the application to access your GitHub account
3. You'll see your GitHub username once connected

## Step 3: Create a Build Configuration

1. Click **"New Configuration"** or **"Create APK"**
2. Fill in the following details:

| Field | Example | Notes |
|-------|---------|-------|
| App Name | "My Awesome App" | Display name in app store |
| Package ID | "com.example.myapp" | Must be unique, lowercase with dots |
| Version | "1.0.0" | Semantic versioning |
| Target URL | "https://example.com" | Website to convert to APK |
| App Icon | (upload PNG) | Recommended: 512x512 pixels |
| Splash Screen | (upload PNG) | Optional, recommended: 1024x768 |

3. Click **"Save Configuration"**

## Step 4: Trigger Your First Build

1. Find your configuration in the dashboard
2. Click the **"Build"** button (green play icon)
3. The build will start automatically

## Step 5: Monitor Build Progress

1. Watch the **Build Status** section for real-time updates
2. View **Live Logs** to see what's happening
3. Status indicators show: Pending → Running → Success/Failed

## Step 6: Download Your APK

Once the build completes successfully:

1. Click the **"Download APK"** button
2. Your APK file will download to your device
3. You can now install it on any Android device!

## Common Build Configurations

### News Website
```
App Name: Daily News
Package ID: com.dailynews.app
Target URL: https://news.example.com
```

### E-commerce Store
```
App Name: My Store
Package ID: com.mystore.mobile
Target URL: https://store.example.com
```

### Blog/Portfolio
```
App Name: My Portfolio
Package ID: com.portfolio.app
Target URL: https://portfolio.example.com
```

## Troubleshooting Quick Fixes

**Build fails immediately?**
- Check that your target URL is publicly accessible
- Verify the website doesn't require authentication
- Ensure no CORS restrictions block the website

**Can't connect GitHub?**
- Verify your GitHub account has permissions
- Check that OAuth credentials are correct
- Try reconnecting your account

**APK download link not appearing?**
- Wait for build to fully complete (check status)
- Refresh the page
- Check browser console for errors

## Next Steps

After your first successful build:

1. **Create more configurations** for different websites
2. **Share your APK** with others
3. **Monitor build history** to track all builds
4. **Update configurations** as your website changes

## Need Help?

- Check the [full documentation](./README.md)
- Review [setup guide](./SETUP.md)
- Check build logs for detailed error messages
- Visit GitHub Issues for known problems

---

**Happy building! 🚀**
