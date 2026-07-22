export interface DNSResult {
  hasMX: boolean;
  hasSPF: boolean;
  hasDMARC: boolean;
  spfRecord: string | null;
  dmarcRecord: string | null;
  mxRecords: string[];
  error?: string;
}

interface GoogleDNSAnswer {
  data: string;
}

interface GoogleDNSResponse {
  Answer?: GoogleDNSAnswer[];
}

async function dnsLookup(name: string, type: string): Promise<string[]> {
  const res = await fetch(
    `https://dns.google/resolve?name=${encodeURIComponent(name)}&type=${type}`,
    { headers: { "User-Agent": "SecurePilot-Scanner/1.0" } }
  );
  const data = (await res.json()) as GoogleDNSResponse;
  return (data.Answer ?? []).map((r) => r.data);
}

export async function checkDNS(domain: string): Promise<DNSResult> {
  try {
    const [txtRecords, mxRecords, dmarcRecords] = await Promise.all([
      dnsLookup(domain, "TXT"),
      dnsLookup(domain, "MX"),
      dnsLookup(`_dmarc.${domain}`, "TXT"),
    ]);

    const spfRecord = txtRecords.find((r) => r.includes("v=spf1")) ?? null;
    const dmarcRecord = dmarcRecords.find((r) => r.includes("v=DMARC1")) ?? null;

    return {
      hasMX: mxRecords.length > 0,
      hasSPF: !!spfRecord,
      hasDMARC: !!dmarcRecord,
      spfRecord,
      dmarcRecord,
      mxRecords,
    };
  } catch {
    return {
      hasMX: false,
      hasSPF: false,
      hasDMARC: false,
      spfRecord: null,
      dmarcRecord: null,
      mxRecords: [],
      error: "DNS check failed",
    };
  }
}
