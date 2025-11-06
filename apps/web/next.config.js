/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: false,
  async rewrites() {
    return [
      // proxy every /api/* request to the backend on 4000
      { source: '/api/:path*', destination: 'http://localhost:4000/:path*' },
      // optional direct mounts for existing paths
      { source: '/videos', destination: 'http://localhost:4000/videos' },
      { source: '/videos/:path*', destination: 'http://localhost:4000/videos/:path*' },
      { source: '/health', destination: 'http://localhost:4000/health' },
    ];
  },
};
module.exports = nextConfig;
