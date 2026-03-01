import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";
import { ThemeProvider } from "next-themes";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "WebToAPK Builder - Convert Website to Android App",
  description: "Convert any website into a native Android APK with custom branding, icons, and features. Automated build with GitHub Actions.",
  keywords: ["WebToAPK", "WebView", "Android", "APK", "GitHub Actions", "Next.js", "TypeScript"],
  authors: [{ name: "WebToAPK Team" }],
  icons: {
    icon: "/logo.svg",
  },
  openGraph: {
    title: "WebToAPK Builder",
    description: "Convert website to Android APK automatically",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "WebToAPK Builder",
    description: "Convert website to Android APK automatically",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground`}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          {children}
          <Toaster richColors position="top-right" />
        </ThemeProvider>
      </body>
    </html>
  );
}
