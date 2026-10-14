import createNextIntlPlugin from "next-intl/plugin";
import type { NextConfig } from "next";
import { fileURLToPath } from "url";
import path from "path";

const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts");

const projectRoot = path.dirname(fileURLToPath(import.meta.url));

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // Stray lockfile at ~/package-lock.json was making Turbopack infer the
  // workspace root as the home directory, watching every sibling project
  // under ~/dev/work for file changes and pegging the dev server at 500%+ CPU.
  turbopack: {
    root: projectRoot,
  },
  typescript: {
    ignoreBuildErrors: false,
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "picsum.photos",
        port: "",
        pathname: "/**",
      },
      {
        protocol: "http",
        hostname: "localhost",
        port: "3000",
        pathname: "/uploads/**",
      },
    ],
  },
  output: "standalone",
  transpilePackages: ["motion"],
};

export default withNextIntl(nextConfig);
