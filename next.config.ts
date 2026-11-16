import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async redirects() {
    return [
      { source: "/admin/products", destination: "/admin/catalog/products", permanent: true },
      { source: "/admin/products/new", destination: "/admin/catalog/products/new", permanent: true },
      { source: "/admin/products/:id/edit", destination: "/admin/catalog/products/:id", permanent: true },
    ];
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "*.public.blob.vercel-storage.com",
      },
    ],
  },
};

export default nextConfig;
