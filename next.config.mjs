import withPWAInit from "@ducanh2912/next-pwa";

const withPWA = withPWAInit({
  dest: "public",
  disable: true,
  register: false,
  skipWaiting: true,
});

/** @type {import('next').NextConfig} */
const nextConfig = {
  turbopack: {
    root: "/Users/Asadomu/.gemini/antigravity/scratch/akaal-teeam",
  },
};

export default withPWA(nextConfig);
