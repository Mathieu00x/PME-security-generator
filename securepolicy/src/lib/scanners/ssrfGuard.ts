import * as dns from "node:dns/promises";
import type { LookupAddress } from "node:dns";
import * as net from "node:net";

// Shared SSRF / DNS-rebinding guard for scanners that connect directly to a
// user-supplied domain (ssl.ts, headers.ts). The domain format regex in
// scan/route.ts only checks that the string *looks* like a hostname — it
// does nothing to stop a hostname that legitimately resolves to a private,
// loopback, link-local, or cloud metadata address (e.g. any of the many
// public wildcard-DNS services like *.nip.io that resolve to whatever IP
// is embedded in the name itself, e.g. 169.254.169.254.nip.io).
//
// The fix has two parts:
// 1. Resolve the hostname ourselves and reject unsafe IPs before connecting.
// 2. Connect to that exact validated IP (not the hostname) so there's no
//    gap between validation and connection for a rebinding DNS server to
//    exploit by answering differently on the second lookup.

export class UnsafeTargetError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "UnsafeTargetError";
  }
}

function isUnsafeIPv4(ip: string): boolean {
  const parts = ip.split(".").map(Number);
  if (parts.length !== 4 || parts.some((p) => Number.isNaN(p) || p < 0 || p > 255)) return true;
  const [a, b] = parts;

  if (a === 0) return true; // 0.0.0.0/8
  if (a === 10) return true; // 10.0.0.0/8
  if (a === 100 && b >= 64 && b <= 127) return true; // 100.64.0.0/10 (CGNAT)
  if (a === 127) return true; // 127.0.0.0/8 (loopback)
  if (a === 169 && b === 254) return true; // 169.254.0.0/16 (link-local + cloud metadata)
  if (a === 172 && b >= 16 && b <= 31) return true; // 172.16.0.0/12
  if (a === 192 && b === 0 && parts[2] === 0) return true; // 192.0.0.0/24
  if (a === 192 && b === 0 && parts[2] === 2) return true; // 192.0.2.0/24 (TEST-NET-1)
  if (a === 192 && b === 168) return true; // 192.168.0.0/16
  if (a === 198 && (b === 18 || b === 19)) return true; // 198.18.0.0/15 (benchmarking)
  if (a === 198 && b === 51 && parts[2] === 100) return true; // 198.51.100.0/24 (TEST-NET-2)
  if (a === 203 && b === 0 && parts[2] === 113) return true; // 203.0.113.0/24 (TEST-NET-3)
  if (a >= 224) return true; // 224.0.0.0/4 multicast + 240.0.0.0/4 reserved + broadcast

  return false;
}

function isUnsafeIPv6(ip: string): boolean {
  const lower = ip.toLowerCase();

  if (lower === "::1" || lower === "::") return true; // loopback / unspecified
  if (lower.startsWith("fe80:") || lower.startsWith("fe8") || lower.startsWith("fe9") || lower.startsWith("fea") || lower.startsWith("feb")) return true; // fe80::/10 link-local
  if (/^f[c-d][0-9a-f]{2}:/.test(lower)) return true; // fc00::/7 unique local
  if (lower.startsWith("ff")) return true; // ff00::/8 multicast

  // IPv4-mapped (::ffff:a.b.c.d) or IPv4-compatible (::a.b.c.d) — check the embedded IPv4.
  const mapped = lower.match(/::ffff:(\d+\.\d+\.\d+\.\d+)$/) || lower.match(/^::(\d+\.\d+\.\d+\.\d+)$/);
  if (mapped) return isUnsafeIPv4(mapped[1]);

  return false;
}

export function isUnsafeIp(ip: string): boolean {
  if (net.isIPv4(ip)) return isUnsafeIPv4(ip);
  if (net.isIPv6(ip)) return isUnsafeIPv6(ip);
  return true; // not a recognizable IP at all — treat as unsafe
}

/**
 * Resolves `hostname` and returns a single validated, safe-to-connect-to IP.
 * Throws UnsafeTargetError if resolution fails or every resolved address is
 * private/reserved. Callers should connect directly to the returned IP
 * (passing the original hostname only as TLS SNI / the HTTP Host header),
 * not re-resolve the hostname themselves.
 */
export async function resolveSafeIp(hostname: string): Promise<{ ip: string; family: 4 | 6 }> {
  let addresses: LookupAddress[];
  try {
    addresses = await dns.lookup(hostname, { all: true, verbatim: true });
  } catch {
    throw new UnsafeTargetError("DNS resolution failed");
  }

  const safe = addresses.find((a) => !isUnsafeIp(a.address));
  if (!safe) throw new UnsafeTargetError("Domain resolves only to a private, loopback, or reserved address");

  return { ip: safe.address, family: safe.family as 4 | 6 };
}
