import * as tls from "node:tls";

export interface SSLResult {
  grade: string | null;
  daysUntilExpiry: number | null;
  expired: boolean;
  hasSSL: boolean;
  error?: string;
}

// Approximates an SSL Labs-style letter grade from the negotiated TLS
// protocol version and certificate trust status. This is a simpler
// heuristic than SSL Labs' full vulnerability battery (Heartbleed, POODLE,
// etc.), but it's fast, deterministic, and doesn't depend on a third-party
// service — SSL Labs' public API is slow (30-90s+ per fresh scan), heavily
// rate-limited for cloud/serverless source IPs, and its deep TLS probes
// (e.g. ECDHE parameter reuse testing) are known to fail outright against
// modern CDN/edge infrastructure like Vercel's, returning no grade at all.
function gradeFor(protocol: string | null, trusted: boolean, expired: boolean): string {
  if (!trusted || expired) return "F";
  switch (protocol) {
    case "TLSv1.3":
      return "A";
    case "TLSv1.2":
      return "B";
    case "TLSv1.1":
    case "TLSv1":
      return "D";
    default:
      return "C";
  }
}

export function checkSSL(domain: string): Promise<SSLResult> {
  return new Promise((resolve) => {
    let settled = false;
    const finish = (result: SSLResult) => {
      if (settled) return;
      settled = true;
      resolve(result);
    };

    const socket = tls.connect(
      {
        host: domain,
        port: 443,
        servername: domain,
        rejectUnauthorized: false,
        timeout: 8000,
      },
      () => {
        try {
          const cert = socket.getPeerCertificate();
          if (!cert || Object.keys(cert).length === 0) {
            finish({ grade: null, daysUntilExpiry: null, expired: false, hasSSL: false, error: "No SSL certificate found" });
            return;
          }

          const validTo = cert.valid_to ? new Date(cert.valid_to).getTime() : null;
          const daysUntilExpiry = validTo !== null && !Number.isNaN(validTo)
            ? Math.floor((validTo - Date.now()) / (1000 * 60 * 60 * 24))
            : null;
          const expired = daysUntilExpiry !== null && daysUntilExpiry < 0;

          finish({
            grade: gradeFor(socket.getProtocol(), socket.authorized, expired),
            daysUntilExpiry,
            expired,
            hasSSL: true,
          });
        } catch {
          finish({ grade: null, daysUntilExpiry: null, expired: false, hasSSL: false, error: "SSL check failed" });
        } finally {
          socket.end();
        }
      }
    );

    socket.on("error", () => {
      finish({ grade: null, daysUntilExpiry: null, expired: false, hasSSL: false, error: "No SSL certificate found" });
    });

    socket.on("timeout", () => {
      socket.destroy();
      finish({ grade: null, daysUntilExpiry: null, expired: false, hasSSL: false, error: "SSL check timed out" });
    });
  });
}
