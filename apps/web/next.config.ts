import type { NextConfig } from "next";

// Next.js 16.2.3 — https://nextjs.org/docs/app/getting-started
const config: NextConfig = {
  transpilePackages: [
    "@dating-app/types",
    "@dating-app/utils",
    "@dating-app/validators",
    "@dating-app/ui-web",
  ],

  images: {
    remotePatterns: [
      { protocol: "https", hostname: "res.cloudinary.com" },
      { protocol: "https", hostname: "lh3.googleusercontent.com" },
    ],
  },

  // PPR and typedRoutes graduate to stable top-level config in Next.js 16.
  // PPR: static shell is served instantly; dynamic holes stream in as ready.
  // Opt individual routes in with: export const experimental_ppr = true
  ppr: "incremental",

  // Catches route param shape mismatches (e.g. [matchId]) at compile time.
  typedRoutes: true,

  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "X-XSS-Protection", value: "1; mode=block" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=(self)",
          },
          {
            key: "Content-Security-Policy",
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-eval' 'unsafe-inline'",
              "style-src 'self' 'unsafe-inline'",
              "img-src 'self' data: https://res.cloudinary.com https://lh3.googleusercontent.com",
              "connect-src 'self' ws: wss: http://localhost:3001 https://localhost:3001",
              "font-src 'self'",
            ].join("; "),
          },
        ],
      },
    ];
  },
};

export default config;
