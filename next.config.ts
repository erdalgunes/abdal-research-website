import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // We'll use next-mdx-remote for MDX rendering instead
  pageExtensions: ['js', 'jsx', 'ts', 'tsx', 'md', 'mdx'],
};

export default nextConfig;
