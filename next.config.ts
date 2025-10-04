import type { NextConfig } from "next";
import bundleAnalyzer from '@next/bundle-analyzer';

const withBundleAnalyzer = bundleAnalyzer({
  enabled: process.env.ANALYZE === 'true',
});

const nextConfig: NextConfig = {
  // We'll use next-mdx-remote for MDX rendering instead
  pageExtensions: ['js', 'jsx', 'ts', 'tsx', 'md', 'mdx'],

  // Security Headers
  async headers() {
    return [
      {
        // Apply headers to all routes
        source: '/(.*)',
        headers: [
          // Prevent clickjacking attacks
          {
            key: 'X-Frame-Options',
            value: 'DENY'
          },
          // Prevent MIME sniffing attacks
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff'
          },
          // Control referrer information
          {
            key: 'Referrer-Policy',
            value: 'origin-when-cross-origin'
          },
          // Enable DNS prefetching for performance
          {
            key: 'X-DNS-Prefetch-Control',
            value: 'on'
          },
          // Permissions Policy - restrict dangerous features
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=(), interest-cohort=()'
          },
          // HSTS - Force HTTPS (only in production)
          ...(process.env.NODE_ENV === 'production' ? [{
            key: 'Strict-Transport-Security',
            value: 'max-age=31536000; includeSubDomains; preload'
          }] : []),
          // Content Security Policy
          {
            key: 'Content-Security-Policy',
            value: [
              // Default source fallback
              "default-src 'self'",
              
              // Scripts: Allow Next.js, Vercel, and necessary inline scripts
              "script-src 'self' 'unsafe-eval' 'unsafe-inline' https://vercel.live https://*.vercel.app",
              
              // Styles: Allow Tailwind, inline styles, and external fonts
              "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
              
              // Images: Allow self-hosted, data URLs, and common CDNs
              "img-src 'self' data: blob: https:",
              
              // Fonts: Allow Google Fonts and self-hosted
              "font-src 'self' https://fonts.gstatic.com data:",
              
              // Connect: Allow API calls to external services
              "connect-src 'self' https://openrouter.ai https://api.tavily.com https://vercel.live wss://ws.vercel.live",
              
              // Media: Allow self-hosted media
              "media-src 'self'",
              
              // Objects: Disable plugins like Flash
              "object-src 'none'",
              
              // Base URI: Restrict base tag
              "base-uri 'self'",
              
              // Forms: Allow form submissions to self
              "form-action 'self'",
              
              // Frame ancestors: Prevent embedding (same as X-Frame-Options)
              "frame-ancestors 'none'",
              
              // Block mixed content
              "upgrade-insecure-requests"
            ].join('; ')
          },
          // Additional security headers
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block'
          },
          // Prevent Adobe Flash and PDF plugins from loading
          {
            key: 'X-Permitted-Cross-Domain-Policies',
            value: 'none'
          },
          // Reduce attack surface by hiding server information
          {
            key: 'X-Powered-By',
            value: 'Sacred Madness Wiki'
          }
        ]
      },
      {
        // Special headers for API routes
        source: '/api/(.*)',
        headers: [
          // CORS for API routes
          {
            key: 'Access-Control-Allow-Origin',
            value: process.env.NODE_ENV === 'production'
              ? 'https://sacred-madness.vercel.app'
              : 'http://localhost:3000'
          },
          {
            key: 'Access-Control-Allow-Methods',
            value: 'GET, POST, PUT, DELETE, OPTIONS'
          },
          {
            key: 'Access-Control-Allow-Headers',
            value: 'Content-Type, Authorization, X-Requested-With'
          },
          {
            key: 'Access-Control-Max-Age',
            value: '86400' // 24 hours
          },
          // Rate limiting header
          {
            key: 'X-RateLimit-Policy',
            value: 'AI Chat: 20/min, Search: 30/min, Graph: 60/min'
          }
        ]
      }
    ]
  },

  // Additional security configurations
  poweredByHeader: false, // Remove X-Powered-By header
  
  // Enable React strict mode for better development experience
  reactStrictMode: true,
  
  // Optimize images
  images: {
    domains: [], // Add allowed image domains here if needed
    dangerouslyAllowSVG: false, // Disable SVG images for security
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;"
  }
};

export default withBundleAnalyzer(nextConfig);
