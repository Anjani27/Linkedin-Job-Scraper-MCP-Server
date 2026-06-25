import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["playwright"],
  experimental: {
    serverActions: {
      bodySizeLimit: "5mb",
    },
  },
};

export default nextConfig;
