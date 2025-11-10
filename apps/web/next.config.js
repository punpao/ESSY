/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ["@essy/core", "@essy/payment"],
  output: "standalone",
};

module.exports = nextConfig;
