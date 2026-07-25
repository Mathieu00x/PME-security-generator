// This file configures the initialization of Sentry on the client (browser).
// https://docs.sentry.io/platforms/javascript/guides/nextjs/

import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,

  // Lower in production to control volume/cost; 1.0 = trace every transaction.
  tracesSampleRate: process.env.NODE_ENV === "production" ? 0.2 : 1.0,

  // Session replay is off by default here to keep this a pure error/perf
  // monitor — enable if you later want to watch user sessions that errored.
  replaysSessionSampleRate: 0,
  replaysOnErrorSampleRate: 0,

  debug: false,

  // Well-known browser-extension noise, not app bugs — these come from
  // extensions' own internal messaging (password managers, grammar
  // checkers, etc.) failing to reach a DOM node/tab that's since changed,
  // and are not actionable from our code. See:
  // https://docs.sentry.io/platforms/javascript/configuration/filtering/#decluttering-sentry
  ignoreErrors: [
    "Object Not Found Matching Id",
    "Non-Error promise rejection captured",
    "ResizeObserver loop limit exceeded",
    "ResizeObserver loop completed with undelivered notifications",
  ],
});
