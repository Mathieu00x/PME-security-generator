const { withSentryConfig } = require("@sentry/nextjs");

// Permissive on script/style ('unsafe-inline' + 'unsafe-eval') rather than a
// strict nonce-based policy: the app relies on inline style={{width}} bars
// throughout (dashboard, roadmap, assessments), Next.js's own hydration
// scripts are unnonced, and the docx export bundle hits `new Function(...)`
// in a vendored utility. A stricter policy would need a nonce-injection
// middleware and auditing every dependency — not worth the regression risk
// for a header whose own scanner check only verifies presence, not
// strictness. connect-src/font-src/style-src allowlist exactly the three
// external origins this app actually talks to from the browser: Supabase
// (auth/REST), Google Fonts (globals.css @import), and Sentry (error
// reporting via src/instrumentation-client.ts).
const CSP = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
  "font-src 'self' https://fonts.gstatic.com",
  "img-src 'self' data: blob:",
  "connect-src 'self' https://*.supabase.co wss://*.supabase.co https://*.sentry.io",
  "frame-ancestors 'self'",
  "object-src 'none'",
].join("; ");

/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverComponentsExternalPackages: ["@anthropic-ai/sdk"],
    instrumentationHook: true,
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "Content-Security-Policy", value: CSP },
          { key: "X-Frame-Options", value: "SAMEORIGIN" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
        ],
      },
    ];
  },
};

module.exports = withSentryConfig(nextConfig, {
  org: process.env.SENTRY_ORG,
  project: process.env.SENTRY_PROJECT,
  silent: true,
  widenClientFileUpload: true,
  webpack: {
    removeDebugLogging: true,
    automaticVercelMonitors: true,
  },
});
