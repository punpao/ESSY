/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ["@thai-escrow/ui", "@thai-escrow/core"],
  reactStrictMode: true,
  env: {
    API_BASE_URL: process.env.API_BASE_URL || "http://localhost:4000",
  },
};

module.exports = nextConfig;
