/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // 允许加载 PDF 文件
  webpack: (config) => {
    config.resolve.alias.canvas = false;
    return config;
  },
  // 优化字体加载，避免构建时网络问题
  optimizeFonts: true,
  // 如果网络不可用，允许构建继续
  experimental: {
    optimizePackageImports: ['lucide-react'],
  },
}

module.exports = nextConfig

