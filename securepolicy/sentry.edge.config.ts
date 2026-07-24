// This file configures the initialization of Sentry for edge runtime
// (middleware, edge routes). https://docs.sentry.io/platforms/javascript/guides/nextjs/

import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  tracesSampleRate: process.env.NODE_ENV === "production" ? 0.2 : 1.0,
  debug: false,
});
