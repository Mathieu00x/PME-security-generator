export interface SubdomainsResult {
  subdomains: string[];
  count: number;
  error?: string;
}

interface CrtShEntry {
  name_value: string;
}

function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) => setTimeout(() => reject(new Error("timeout")), ms)),
  ]);
}

export async function checkSubdomains(domain: string): Promise<SubdomainsResult> {
  try {
    const res = await withTimeout(
      fetch(`https://crt.sh/?q=%.${encodeURIComponent(domain)}&output=json`, {
        headers: { "User-Agent": "SecurePilot-Scanner/1.0" },
      }),
      10000
    );

    if (!res.ok) return { subdomains: [], count: 0, error: "crt.sh check failed" };

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

    return { subdomains: cleaned.slice(0, 50), count: cleaned.length };
  } catch {
    return { subdomains: [], count: 0, error: "Subdomains check failed" };
  }
}
