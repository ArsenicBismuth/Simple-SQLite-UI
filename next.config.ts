import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Fix for Windows EPERM error when accessing system directories
  experimental: {
    // Disable automatic static optimization to prevent scanning
    forceSwcTransforms: true,
  },
  // Configure webpack to exclude problematic Windows directories
  webpack: (config, { dev }) => {
    // Set watchOptions to exclude Windows system directories
    config.watchOptions = {
      ignored: [
        '**/node_modules/**',
        '**/.git/**',
        '**/Application Data/**',
        '**/AppData/**',
        '**/ProgramData/**',
        '**/System Volume Information/**',
        '**/$Recycle.Bin/**',
        '**/Windows/**',
        '**/Program Files/**',
        '**/Program Files (x86)/**',
      ],
    };
    
    return config;
  },
};

export default nextConfig;
