import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Standalone output keeps the option open for Docker deployments.
  output: "standalone",
  // This project lives inside the home directory, which also contains a
  // pnpm-workspace.yaml. Pin the root so Turbopack only scans this app.
  turbopack: {
    root: process.cwd(),
  },
};

export default nextConfig;
