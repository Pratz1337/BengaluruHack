/** @type {import('next').NextConfig} */
const nextConfig = {
    output: 'standalone',
    env: {
        NEXT_PUBLIC_API_URL: process.env.API_URL,
        NEXT_PUBLIC_VOICE_URL: process.env.VOICE_URL,
      }
};

export default nextConfig;