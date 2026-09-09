import * as https from "node:https";
import { resolveSafeIp, UnsafeTargetError } from "./ssrfGuard";

export interface SecurityHeadersResult {
  hasHSTS: boolean;
  hasCSP: boolean;
  hasXFrameOptions: boolean;
  hasXContentTypeOptions: boolean;
  hasReferrerPolicy: boolean;
  hasPermissionsPolicy: boolean;
  missingCount: number;
  error?: string;
}

const ALL_MISSING: Omit<SecurityHeadersResult, "error"> = {
  hasHSTS: false,
  hasCSP: false,
  hasXFrameOptions: false,
  hasXContentTypeOptions: false,
  hasReferrerPolicy: false,
  hasPermissionsPolicy: false,
  missingCount: 6,
};

const REDIRECT_STATUSES = new Set([301, 302, 303, 307, 308]);

function requestOnce(hostname: string, ip: string): Promise<{ status: number; headers: Record<string, string | string[] | undefined> }> {
  return new Promise((resolve, reject) => {
    const req = https.request(
      {
        host: ip,
        port: 443,
        servername: hostname,
        path: "/",
        method: "GET",
        headers: { Host: hostname, "User-Agent": "SecurePilot-Scanner/1.0" },
        rejectUnauthorized: false,
        timeout: 8000,
      },
      (res) => {
        resolve({ status: res.statusCode ?? 0, headers: res.headers });
        res.resume(); // discard body, we only need headers
      }
    );
    req.on("timeout", () => req.destroy(new Error("timeout")));
    req.on("error", reject);
    req.end();
  });
}

/**
 * Fetches response headers for `domain`, resolving and validating the IP
 * ourselves before every connection (including redirect hops) instead of
 * trusting fetch's built-in redirect: "follow" — which would happily
 * connect to whatever a redirect Location points at, including a private
 * or internal address (see ssrfGuard.ts).
 */
async function fetchHeadersSafely(domain: string, maxRedirects = 5) {
  let target = domain;

  for (let i = 0; i <= maxRedirects; i++) {
    const { ip } = await resolveSafeIp(target);
    const { status, headers } = await requestOnce(target, ip);

    if (REDIRECT_STATUSES.has(status) && headers.location && i < maxRedirects) {
      const next = new URL(headers.location as string, `https://${target}`);
      if (next.protocol !== "https:") break; // don't follow to a non-https target
      target = next.hostname;
      continue;
    }

    return headers;
  }

  throw new Error("Too many redirects");
}

export async function checkSecurityHeaders(domain: string): Promise<SecurityHeadersResult> {
  try {
    const h = await fetchHeadersSafely(domain);

    const get = (name: string) => {
      const v = h[name];
      return Array.isArray(v) ? v[0] : v;
    };
    const has = (name: string) => get(name) !== undefined;

    const csp = get("content-security-policy");

    const hasHSTS = has("strict-transport-security");
    const hasCSP = !!csp;
    // A restrictive frame-ancestors CSP directive supersedes X-Frame-Options
    // for clickjacking protection, so either one counts.
    const hasXFrameOptions = has("x-frame-options") || !!csp?.includes("frame-ancestors");
    const hasXContentTypeOptions = get("x-content-type-options")?.toLowerCase() === "nosniff";
    const hasReferrerPolicy = has("referrer-policy");
    const hasPermissionsPolicy = has("permissions-policy");

    const missingCount = [hasHSTS, hasCSP, hasXFrameOptions, hasXContentTypeOptions, hasReferrerPolicy, hasPermissionsPolicy]
      .filter((present) => !present).length;

    return { hasHSTS, hasCSP, hasXFrameOptions, hasXContentTypeOptions, hasReferrerPolicy, hasPermissionsPolicy, missingCount };
  } catch (err) {
    const message = err instanceof UnsafeTargetError ? err.message : "Security headers check failed";
    return { ...ALL_MISSING, error: message };
  }
}
