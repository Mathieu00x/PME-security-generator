// "found": a matching DKIM record was located under one of the common
// selectors. "not_found": every selector lookup completed successfully with
// no match — DKIM is genuinely absent under those selectors (though a
// custom, un-probed selector could still exist). "unknown": every selector
// lookup itself failed (network/DNS resolution error), so we couldn't
// determine anything — this must not be treated the same as "not_found".
export type DKIMStatus = "found" | "not_found" | "unknown";

export interface DNSResult {
  hasMX: boolean;
  hasSPF: boolean;
  hasDMARC: boolean;
  dkimStatus: DKIMStatus;
  spfRecord: string | null;
  dmarcRecord: string | null;
  dkimSelector: string | null;
  mxRecords: string[];
  error?: string;
}

interface GoogleDNSAnswer {
  data: string;
}

interface GoogleDNSResponse {
  Answer?: GoogleDNSAnswer[];
}

// DKIM has no fixed DNS name — the selector is chosen by whatever sends
// the domain's mail. There's no way to enumerate it, so we probe the
// handful of selectors used by the providers SMBs actually run on.
const DKIM_SELECTORS = ["default", "google", "selector1", "selector2", "k1", "s1"];

async function dnsLookup(name: string, type: string): Promise<string[]> {
  const res = await fetch(
    `https://dns.google/resolve?name=${encodeURIComponent(name)}&type=${type}`,
    { headers: { "User-Agent": "SecurePilot-Scanner/1.0" } }
  );
  const data = (await res.json()) as GoogleDNSResponse;
  return (data.Answer ?? []).map((r) => r.data);
}

async function checkDKIM(domain: string): Promise<{ dkimStatus: DKIMStatus; dkimSelector: string | null }> {
  const results = await Promise.all(
    DKIM_SELECTORS.map(async (selector) => {
      try {
        const records = await dnsLookup(`${selector}._domainkey.${domain}`, "TXT");
        const found = records.some((r) => r.includes("v=DKIM1") || r.includes("p="));
        return { selector, found, failed: false };
      } catch {
        return { selector, found: false, failed: true };
      }
    })
  );

  const match = results.find((r) => r.found);
  if (match) return { dkimStatus: "found", dkimSelector: match.selector };

  const allFailed = results.every((r) => r.failed);
  return { dkimStatus: allFailed ? "unknown" : "not_found", dkimSelector: null };
}

export async function checkDNS(domain: string): Promise<DNSResult> {
  try {
    const [txtRecords, mxRecords, dmarcRecords, dkim] = await Promise.all([
      dnsLookup(domain, "TXT"),
      dnsLookup(domain, "MX"),
      dnsLookup(`_dmarc.${domain}`, "TXT"),
      checkDKIM(domain),
    ]);

    const spfRecord = txtRecords.find((r) => r.includes("v=spf1")) ?? null;
    const dmarcRecord = dmarcRecords.find((r) => r.includes("v=DMARC1")) ?? null;

    return {
      hasMX: mxRecords.length > 0,
      hasSPF: !!spfRecord,
      hasDMARC: !!dmarcRecord,
      dkimStatus: dkim.dkimStatus,
      spfRecord,
      dmarcRecord,
      dkimSelector: dkim.dkimSelector,
      mxRecords,
    };
  } catch {
    return {
      hasMX: false,
      hasSPF: false,
      hasDMARC: false,
      dkimStatus: "unknown",
      spfRecord: null,
      dmarcRecord: null,
      dkimSelector: null,
      mxRecords: [],
      error: "DNS check failed",
    };
  }
}
