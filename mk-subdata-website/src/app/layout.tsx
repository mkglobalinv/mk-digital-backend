import type { Metadata } from "next";
import "./globals.css";
import AndroidAppBanner from "@/components/AndroidAppBanner";

export const metadata: Metadata = {
  title: "9JASUB | Data • Airtime • Bills • VTU Solutions",
  description: "Start your own VTU business for ₦5,000. Buy cheap data, airtime, and pay bills instantly with 9JASUB.",
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
      </body>
    </html>
  );
}
