export interface DanglingCname {
  subdomain: string;
  target: string;
}

export interface SubdomainsResult {
  subdomains: string[];
  count: number;
  // Takeover candidates found while confirming discovered subdomains are
  // still live: a CNAME pointing at a known claimable-hosting pattern
  // (S3, GitHub Pages, etc.) whose underlying resource appears gone —
  // meaning whoever claims that name on the provider's side can serve
  // content under the client's subdomain. Confirmed either by DNS (some
  // providers, e.g. Azure Websites, genuinely stop resolving once unclaimed)
  // or — for providers whose shared edge keeps resolving regardless, which
  // real-world testing showed is the norm for S3/Heroku/GitHub Pages — by
  // one HTTP GET to the *provider's* own generic error page, never to the
  // client's domain or any system the client operates. That distinction is
  // what keeps this in the passive/no-touch tier rather than the
  // "Authorized Deep Assessment" one: we're reading a page AWS/Heroku/
  // GitHub intentionally serve to the public, not probing anything the
  // client owns.
  danglingCnames: DanglingCname[];
  error?: string;
}

interface CrtShEntry {
  name_value: string;
}

interface GoogleDNSAnswer {
  data: string;
}

interface GoogleDNSResponse {
  Answer?: GoogleDNSAnswer[];
}

function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) => setTimeout(() => reject(new Error("timeout")), ms)),
  ]);
}

async function dnsLookup(name: string, type: string): Promise<string[]> {
  try {
    const res = await withTimeout(
      fetch(`https://dns.google/resolve?name=${encodeURIComponent(name)}&type=${type}`, {
        headers: { "User-Agent": "SecurePilot-Scanner/1.0" },
      }),
      5000
    );
    const data = (await res.json()) as GoogleDNSResponse;
    return (data.Answer ?? []).map((r) => r.data);
  } catch {
    return [];
  }
}

// Deliberately short: every entry here has a *verified* detection path
// below (DNS-only or HTTP signature), tested live against real unclaimed
// names while building this. A longer "common provider" list would look
// more thorough but silently detect nothing for any provider without a
// matching check in DNS_ONLY_SUFFICIENT or SIGNATURE_CHECKS — that's a
// worse failure mode than a short, honest list.
const TAKEOVER_PRONE_PATTERNS = [
  "github.io", "herokuapp.com", "s3.amazonaws.com", "s3-website",
  "azurewebsites.net", "cloudapp.net", "trafficmanager.net", "blob.core.windows.net",
];

// Providers verified (by live lookup while building this) to genuinely stop
// resolving once a name is unclaimed — the DNS-only check above is reliable
// for these, no HTTP needed.
const DNS_ONLY_SUFFICIENT = ["azurewebsites.net", "cloudapp.net", "trafficmanager.net", "blob.core.windows.net"];

// Providers verified to keep resolving at their shared edge regardless of
// claim status — confirmed live against S3/Heroku/GitHub Pages while
// building this (unclaimed names still returned real IPs). For these, the
// only reliable signal is the provider's own public "nothing here" page.
// One GET, short timeout, body match against a well-documented fixed
// string — never treated as a positive on a fetch error or timeout, since
// an unreachable provider page proves nothing either way.
const SIGNATURE_CHECKS: { suffix: string; needle: string }[] = [
  { suffix: "s3.amazonaws.com", needle: "NoSuchBucket" },
  { suffix: "s3-website", needle: "NoSuchBucket" },
  { suffix: "herokuapp.com", needle: "no-such-app" },
  { suffix: "github.io", needle: "There isn't a GitHub Pages site here" },
];

async function matchesTakeoverSignature(target: string): Promise<boolean> {
  const check = SIGNATURE_CHECKS.find((c) => target.endsWith(c.suffix));
  if (!check) return false;
  try {
    const res = await withTimeout(
      fetch(`https://${target}/`, { headers: { "User-Agent": "SecurePilot-Scanner/1.0" } }),
      5000
    );
    const body = await res.text();
    return body.includes(check.needle);
  } catch {
    return false;
  }
}

async function findDanglingCname(subdomain: string): Promise<DanglingCname | null> {
  const cnameRecords = await dnsLookup(subdomain, "CNAME");
  const target = cnameRecords[0]?.replace(/\.$/, "").toLowerCase() ?? null;
  if (!target) return null;
  if (!TAKEOVER_PRONE_PATTERNS.some((pattern) => target.endsWith(pattern))) return null;

  if (DNS_ONLY_SUFFICIENT.some((suffix) => target.endsWith(suffix))) {
    const [a, aaaa] = await Promise.all([dnsLookup(target, "A"), dnsLookup(target, "AAAA")]);
    if (a.length === 0 && aaaa.length === 0) return { subdomain, target };
    return null;
  }

  if (await matchesTakeoverSignature(target)) return { subdomain, target };
  return null;
}

export async function checkSubdomains(domain: string): Promise<SubdomainsResult> {
  try {
    const res = await withTimeout(
      fetch(`https://crt.sh/?q=%.${encodeURIComponent(domain)}&output=json`, {
        headers: { "User-Agent": "SecurePilot-Scanner/1.0" },
      }),
      10000
    );

    if (!res.ok) return { subdomains: [], count: 0, danglingCnames: [], error: "crt.sh check failed" };

    const data = (await res.json()) as CrtShEntry[];
    const raw = data.map((entry) => entry.name_value);

    // Clean up: strip wildcards, dedupe, drop the root domain itself
    const cleaned = Array.from(
      new Set(
        raw
          .join("\n")
          .split("\n")
          .map((s) => s.trim().toLowerCase())
          .filter((s) => s && !s.startsWith("*") && s !== domain && s.endsWith(`.${domain}`))
      )
    );

    const subdomains = cleaned.slice(0, 50);

    // Checked only on the capped slice shown above, not the full
    // (potentially hundreds-long) crt.sh history — this is a per-scan
    // DNS-lookup budget, not a reason to silently miss older entries;
    // the 50-item cap already existed for the displayed list.
    const danglingResults = await Promise.all(subdomains.map(findDanglingCname));
    const danglingCnames = danglingResults.filter((d): d is DanglingCname => d !== null);

    return { subdomains, count: cleaned.length, danglingCnames };
  } catch {
    return { subdomains: [], count: 0, danglingCnames: [], error: "Subdomains check failed" };
  }
}
