/** @type {import('next').NextConfig} */
const nextConfig = {};

const withSerwist = require("@serwist/next").default;

module.exports = withSerwist({
  swSrc: "app/sw.ts",
  swDest: "public/sw.js",
  // Disable in development to avoid caching issues
  disable: process.env.NODE_ENV === "development",
})(nextConfig);
