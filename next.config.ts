import type { NextConfig } from 'next';
const nextConfig: NextConfig = {
  output: 'export',
  images: { loader: 'custom', loaderFile: './lib/image-loader.ts', deviceSizes: [480, 768, 1200, 1600, 2000], imageSizes: [] },
  devIndicators: false,
};
export default nextConfig;
