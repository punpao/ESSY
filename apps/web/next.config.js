/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ["@essy/core", "@essy/payment"],
};

module.exports = nextConfig;
