/** @type {import('next').NextConfig} */
const nextConfig = {
  // This tells Next.js to compile your local packages
  transpilePackages: ['@dispatchiq/api-client', '@dispatchiq/types'],
  
  async rewrites() {
    return [
      {
        source: '/v1/:path*',
        destination: 'http://localhost:8080/api/v1/:path*',
      },
      {
        source: '/api/:path*',
        destination: 'http://localhost:8080/api/:path*',
      },
    ];
  },
};

module.exports = nextConfig;