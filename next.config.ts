import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  allowedDevOrigins: [
    "192.168.70.165",
    "local-ip.co",
  ],
};

export default nextConfig;
