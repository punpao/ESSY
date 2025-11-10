/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    appDir: true
  },
  transpilePackages: ["@escrow/ui", "@escrow/core", "@escrow/payment"],
  output: "standalone"
};

module.exports = nextConfig;
