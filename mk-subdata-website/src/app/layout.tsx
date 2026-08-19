import type { Metadata } from "next";
import "./globals.css";
import AndroidAppBanner from "@/components/AndroidAppBanner";
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
        {/* Android sticky app download banner — only renders on Android devices */}
        <AndroidAppBanner />
        <GoogleAnalytics />
        <MetaPixel />
      </body>
    </html>
  );
}
