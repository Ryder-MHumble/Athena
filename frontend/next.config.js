/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // 允许加载 PDF 文件
  webpack: (config) => {
    config.resolve.alias.canvas = false;
    return config;
  },
}

module.exports = nextConfig

