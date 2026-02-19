/** @type {import('next').NextConfig} */
const backendUrl = process.env.BACKEND_URL || 'http://localhost:8081';

const nextConfig = {
  output: 'standalone',
  async rewrites() {
    return {
      fallback: [
        {
          source: '/api/:path*',
          destination: `${backendUrl}/api/:path*`,
        },
        {
          source: '/ws/:path*',
          destination: `${backendUrl}/ws/:path*`,
        },
        {
          source: '/oauth2/:path*',
          destination: `${backendUrl}/oauth2/:path*`,
        },
        {
          source: '/login/oauth2/:path*',
          destination: `${backendUrl}/login/oauth2/:path*`,
        },
        {
          source: '/uploads/:path*',
          destination: `${backendUrl}/uploads/:path*`,
        },
      ],
    };
  },
};

export default nextConfig;
