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

export async function checkSecurityHeaders(domain: string): Promise<SecurityHeadersResult> {
  try {
    const res = await fetch(`https://${domain}`, {
      method: "GET",
      redirect: "follow",
      headers: { "User-Agent": "SecurePilot-Scanner/1.0" },
      signal: AbortSignal.timeout(8000),
    });

    const h = res.headers;
    const csp = h.get("content-security-policy");

    const hasHSTS = h.has("strict-transport-security");
    const hasCSP = !!csp;
    // A restrictive frame-ancestors CSP directive supersedes X-Frame-Options
    // for clickjacking protection, so either one counts.
    const hasXFrameOptions = h.has("x-frame-options") || !!csp?.includes("frame-ancestors");
    const hasXContentTypeOptions = h.get("x-content-type-options")?.toLowerCase() === "nosniff";
    const hasReferrerPolicy = h.has("referrer-policy");
    const hasPermissionsPolicy = h.has("permissions-policy");

    const missingCount = [hasHSTS, hasCSP, hasXFrameOptions, hasXContentTypeOptions, hasReferrerPolicy, hasPermissionsPolicy]
      .filter((present) => !present).length;

    return { hasHSTS, hasCSP, hasXFrameOptions, hasXContentTypeOptions, hasReferrerPolicy, hasPermissionsPolicy, missingCount };
  } catch {
    return { ...ALL_MISSING, error: "Security headers check failed" };
  }
}
