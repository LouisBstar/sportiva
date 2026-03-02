import type { Metadata, Viewport } from "next";
import "./globals.css";
import BottomNav from "@/components/navigation/BottomNav";

export const metadata: Metadata = {
  title: {
    default: "Sportiva",
    template: "%s | Sportiva",
  },
  description: "Tracking nutritionnel et sportif",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Sportiva",
  },
  formatDetection: {
    telephone: false,
  },
};

export const viewport: Viewport = {
  themeColor: "#1A73E8",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fr">
      <head>
        <link rel="apple-touch-icon" href="/icons/icon-192x192.png" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="mobile-web-app-capable" content="yes" />
      </head>
      <body>
        <main className="min-h-screen safe-bottom">
          {children}
        </main>
        <BottomNav />
      </body>
    </html>
  );
}
