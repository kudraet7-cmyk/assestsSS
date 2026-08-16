import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // legacy-game/ and docs/ are static artefacts, not part of the build
  outputFileTracingExcludes: { "*": ["./legacy-game/**", "./docs/**"] },
};

export default nextConfig;
