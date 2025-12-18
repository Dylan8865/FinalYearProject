/** @type {import('next').NextConfig} */
const nextConfig = {
  devIndicators: false,
  allowedDevOrigins: ["192.168.1.81", "localhost:3004"],
  experimental: {
    globalNotFound: true,
  },
};

export default nextConfig;
