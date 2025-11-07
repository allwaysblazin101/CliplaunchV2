/** @type {import('next').NextConfig} */
const nextConfig = {
  async rewrites() {
    return [
      { source: '/auth/:path*',   destination: 'http://localhost:4000/auth/:path*' },
      { source: '/videos/:path*', destination: 'http://localhost:4000/videos/:path*' },
    ];
  },
};
module.exports = nextConfig;
