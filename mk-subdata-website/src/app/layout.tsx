import type { Metadata, Viewport } from "next";
import "./globals.css";
import PwaInstallBanner from "@/components/PwaInstallBanner";
import GoogleAnalytics from "@/components/GoogleAnalytics";
import MetaPixel from "@/components/MetaPixel";

export const metadata: Metadata = {
  metadataBase: new URL("https://9jasub.com"),
  title: "9JASUB | Data • Airtime • Bills • VTU Solutions",
  description: "Start your own VTU business for ₦5,000. Buy cheap data, airtime, and pay bills instantly with 9JASUB.",
  robots: {
    index: true,
    follow: true,
  },
  openGraph: {
    siteName: "9JASUB",
    type: "website",
    locale: "en_NG",
    title: "9JASUB | Data • Airtime • Bills • VTU Solutions",
    description: "Start your own VTU business for ₦5,000. Buy cheap data, airtime, and pay bills instantly with 9JASUB.",
    url: "https://9jasub.com",
  },
  // manifest.json is served dynamically by server.js (per-tenant branding for
  // reseller subdomains, 9JASUB branding here on the main marketing domain) --
  // this is what lets the browser treat this page as installable, which
  // PwaInstallBanner below depends on.
  manifest: "/manifest.json",
  icons: {
    icon: "/logo.jpg",
    apple: "/logo.jpg",
  },
};

export const viewport: Viewport = {
  themeColor: "#059669",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className="h-full antialiased"
    >
      <body className="min-h-full flex flex-col">
        {children}
        {/* PWA install prompt — only renders once the browser fires beforeinstallprompt */}
        <PwaInstallBanner />
        <GoogleAnalytics />
        <MetaPixel />
      </body>
    </html>
  );
}
