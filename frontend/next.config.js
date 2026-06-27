//@ts-check

// eslint-disable-next-line @typescript-eslint/no-var-requires
const { composePlugins, withNx } = require("@nx/next");

const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:8080';

/**
 * @type {import('@nx/next/plugins/with-nx').WithNxOptions}
 **/
const nextConfig = {
  nx: {},
  async rewrites() {
    return [
      {
        // If the frontend requests /v1/auth/login, route it smoothly to /api/v1/auth/login
        source: '/v1/:path*',
        destination: `${BACKEND_URL}/api/v1/:path*`,
      },
      {
        source: '/api/deliveries/:path*',
        destination: `${BACKEND_URL}/api/deliveries/:path*`,
      },
      {
        // Fallback catch-all for standard API paths
        source: '/api/v1/:path*',
        destination: `${BACKEND_URL}/api/v1/:path*`,
      },
    ];
  },
};

const plugins = [
  withNx,
];

module.exports = composePlugins(...plugins)(nextConfig);
