import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  typescript: {
    ignoreBuildErrors: true,
  },
  reactStrictMode: false,
  allowedDevOrigins: [
    "preview-chat-05200337-6681-4db4-9e64-b8ae99325756.space.z.ai",
    "*.space.z.ai",
  ],
};

export default nextConfig;
