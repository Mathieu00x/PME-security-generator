import { fetchSafely } from "./headers";
import { UnsafeTargetError } from "./ssrfGuard";

export type FingerprintConfidence = "high" | "medium";
export type TechnologyCategory = "cms" | "ecommerce" | "web_server" | "language_runtime" | "js_framework";

export interface TechnologyObservation {
  technology: string;
  category: TechnologyCategory;
  // Only ever set when a signal explicitly states a version (a generator
  // meta tag, a "Server: nginx/1.18.0" header, etc.) — never inferred from
  // the technology alone. Absence of a version is not evidence of an old
  // or vulnerable one; it just means this scan found no explicit statement
  // of it.
  version: string | null;
  confidence: FingerprintConfidence;
  evidence: string;
}

export interface FingerprintResult {
  technologies: TechnologyObservation[];
  error?: string;
}

function push(
  list: TechnologyObservation[],
  technology: string,
  category: TechnologyCategory,
  confidence: FingerprintConfidence,
  evidence: string,
  version: string | null = null
) {
  // One observation per technology per scan — a "high" from the meta tag
  // shouldn't be downgraded or duplicated by a later "medium" path-based
  // signal for the same technology.
  if (list.some((t) => t.technology === technology)) return;
  list.push({ technology, category, version, confidence, evidence });
}

function fromMetaGenerator(body: string, list: TechnologyObservation[]) {
  const match = body.match(/<meta\s+name=["']generator["']\s+content=["']([^"']+)["']/i);
  if (!match) return;
  const content = match[1];

  const wp = content.match(/wordpress\s*([\d.]+)?/i);
  if (wp) return push(list, "WordPress", "cms", "high", "meta generator tag", wp[1] ?? null);

  const joomla = content.match(/joomla!?\s*([\d.]+)?/i);
  if (joomla) return push(list, "Joomla", "cms", "high", "meta generator tag", joomla[1] ?? null);

  const drupal = content.match(/drupal\s*([\d.]+)?/i);
  if (drupal) return push(list, "Drupal", "cms", "high", "meta generator tag", drupal[1] ?? null);

  // Generator tag present but not one of the above — still real evidence,
  // just not a technology we specifically classify.
  push(list, content.trim(), "cms", "high", "meta generator tag");
}

const BODY_PATTERNS: { technology: string; category: TechnologyCategory; pattern: RegExp; confidence: FingerprintConfidence; evidence: string }[] = [
  { technology: "WordPress", category: "cms", pattern: /\/wp-content\/|\/wp-includes\/|\/wp-json\//, confidence: "medium", evidence: "wp-content/wp-includes path reference" },
  { technology: "Drupal", category: "cms", pattern: /Drupal\.settings|\/sites\/default\/files\//, confidence: "medium", evidence: "Drupal.settings / sites/default path reference" },
  { technology: "Shopify", category: "ecommerce", pattern: /cdn\.shopify\.com|Shopify\.theme/, confidence: "high", evidence: "Shopify CDN reference" },
  { technology: "Wix", category: "cms", pattern: /wixstatic\.com|data-wix-meta/, confidence: "high", evidence: "Wix asset/attribute reference" },
  { technology: "Squarespace", category: "cms", pattern: /squarespace-cdn\.com|data-sqs-/, confidence: "high", evidence: "Squarespace CDN/attribute reference" },
  { technology: "Webflow", category: "cms", pattern: /data-wf-site|webflow\.com\/weglot/, confidence: "high", evidence: "Webflow site attribute" },
  // __NEXT_DATA__ only appears under the (older) Pages Router — App Router
  // apps (confirmed live against nextjs.org's and securepilot.ca's own
  // homepages, both App Router) never emit it, only the generic
  // "_next/static" asset path, which both routers share.
  { technology: "Next.js", category: "js_framework", pattern: /__NEXT_DATA__/, confidence: "high", evidence: "__NEXT_DATA__ script" },
  { technology: "Next.js", category: "js_framework", pattern: /_next\/static\//, confidence: "medium", evidence: "_next/static asset path" },
  { technology: "Nuxt", category: "js_framework", pattern: /__NUXT__/, confidence: "high", evidence: "__NUXT__ script" },
  { technology: "Angular", category: "js_framework", pattern: /ng-version="([\d.]+)"/, confidence: "high", evidence: "ng-version attribute" },
  { technology: "React", category: "js_framework", pattern: /data-reactroot|data-reactid/, confidence: "medium", evidence: "React root attribute" },
  { technology: "Vue.js", category: "js_framework", pattern: /data-v-[0-9a-f]{8}/, confidence: "medium", evidence: "Vue scoped-style attribute" },
];

function fromBodyPatterns(body: string, list: TechnologyObservation[]) {
  for (const { technology, category, pattern, confidence, evidence } of BODY_PATTERNS) {
    const match = body.match(pattern);
    if (!match) continue;
    // Only Angular's pattern captures a version group today — everything
    // else here has no reliable inline version signal, so it stays null.
    const version = technology === "Angular" ? match[1] ?? null : null;
    push(list, technology, category, confidence, evidence, version);
  }
}

function fromHeaders(headers: Record<string, string | string[] | undefined>, list: TechnologyObservation[]) {
  const get = (name: string) => {
    const v = headers[name];
    return Array.isArray(v) ? v[0] : v;
  };

  const server = get("server");
  if (server) {
    const [, name, version] = server.match(/^([a-zA-Z-]+)\/?([\d.]+)?/) ?? [];
    if (name) push(list, name, "web_server", "high", "Server header", version ?? null);
  }

  const poweredBy = get("x-powered-by");
  if (poweredBy) {
    const [, name, version] = poweredBy.match(/^([a-zA-Z.\s]+?)\/?([\d.]+)?$/) ?? [];
    if (name) push(list, name.trim(), "language_runtime", "high", "X-Powered-By header", version ?? null);
  }

  const setCookie = headers["set-cookie"];
  const cookies = Array.isArray(setCookie) ? setCookie.join(";") : setCookie ?? "";
  if (/\bPHPSESSID\b/.test(cookies)) push(list, "PHP", "language_runtime", "medium", "PHPSESSID cookie");
  if (/\bJSESSIONID\b/.test(cookies)) push(list, "Java", "language_runtime", "medium", "JSESSIONID cookie");
  if (/\blaravel_session\b/.test(cookies)) push(list, "Laravel", "cms", "high", "laravel_session cookie");
  if (/\bconnect\.sid\b/.test(cookies)) push(list, "Express (Node.js)", "language_runtime", "medium", "connect.sid cookie");
  if (/\bASP\.NET_SessionId\b/i.test(cookies)) push(list, "ASP.NET", "language_runtime", "medium", "ASP.NET_SessionId cookie");
  if (/\bwordpress_logged_in|wp-settings-/.test(cookies)) push(list, "WordPress", "cms", "high", "WordPress session cookie");
}

export async function checkFingerprint(domain: string): Promise<FingerprintResult> {
  try {
    const { headers, body } = await fetchSafely(domain);
    const technologies: TechnologyObservation[] = [];

    fromHeaders(headers, technologies);
    fromMetaGenerator(body, technologies);
    fromBodyPatterns(body, technologies);

    return { technologies };
  } catch (err) {
    const message = err instanceof UnsafeTargetError ? err.message : "Fingerprint check failed";
    return { technologies: [], error: message };
  }
}
