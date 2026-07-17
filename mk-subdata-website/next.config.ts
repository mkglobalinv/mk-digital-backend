import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Removed Clear-Site-Data header to allow ngrok cookies and static assets to load correctly.
};

export default nextConfig;
