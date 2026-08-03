import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Keep the first release conservative. Add remote image hosts only when a real
  // integration requires them so uploaded personal data is not sent accidentally.
  reactStrictMode: true,
};

export default nextConfig;
