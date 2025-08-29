/** @type {import('next').NextConfig} */
const nextConfig = {
  async rewrites() {
    const target = process.env.NEXT_PUBLIC_API_TARGET;
    if (!target) return [];
    return [
      {
        source: '/api/:path*',
        destination: `${target}/api/:path*`,
      },
    ];
  },
};
export default nextConfig;