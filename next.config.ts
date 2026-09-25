import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  typedRoutes: true,
  // PDF reports read the fonts and logo from disk, so ship them with the server functions.
  outputFileTracingIncludes: {
    "/api/**/*": ["./assets/fonts/**/*", "./public/absolute-mind-logo.png"],
  },
};

export default nextConfig;
