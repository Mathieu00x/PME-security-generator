export interface SSLResult {
  grade: string | null;
  daysUntilExpiry: number | null;
  expired: boolean;
  hasSSL: boolean;
  error?: string;
}

interface SSLLabsEndpoint {
  ipAddress: string;
  grade?: string;
}

interface SSLLabsAnalyzeResponse {
  status: string;
  endpoints?: SSLLabsEndpoint[];
}

interface SSLLabsEndpointData {
  details?: {
    cert?: {
      notAfter?: number;
    };
  };
}

const USER_AGENT = "SecurePilot-Scanner/1.0";

export async function checkSSL(domain: string): Promise<SSLResult> {
  try {
    const encoded = encodeURIComponent(domain);

    const startRes = await fetch(
      `https://api.ssllabs.com/api/v3/analyze?host=${encoded}&startNew=on&all=done`,
      { headers: { "User-Agent": USER_AGENT } }
    );
    let result = (await startRes.json()) as SSLLabsAnalyzeResponse;

    // SSL Labs is asynchronous — poll until READY or ERROR, capped so we
    // never hang the request indefinitely.
    let attempts = 0;
    while (result.status !== "READY" && result.status !== "ERROR" && attempts < 10) {
      await new Promise((r) => setTimeout(r, 3000));
      const pollRes = await fetch(
        `https://api.ssllabs.com/api/v3/analyze?host=${encoded}&all=done`,
        { headers: { "User-Agent": USER_AGENT } }
      );
      result = (await pollRes.json()) as SSLLabsAnalyzeResponse;
      attempts++;
    }

    if (result.status === "ERROR" || !result.endpoints?.length) {
      return { grade: null, daysUntilExpiry: null, expired: false, hasSSL: false, error: "SSL check failed" };
    }

    const endpoint = result.endpoints[0];
    const grade = endpoint.grade ?? null;

    const certRes = await fetch(
      `https://api.ssllabs.com/api/v3/getEndpointData?host=${encoded}&s=${encodeURIComponent(endpoint.ipAddress)}`,
      { headers: { "User-Agent": USER_AGENT } }
    );
    const certData = (await certRes.json()) as SSLLabsEndpointData;
    const notAfter = certData?.details?.cert?.notAfter;
    const daysUntilExpiry = notAfter
      ? Math.floor((notAfter - Date.now()) / (1000 * 60 * 60 * 24))
      : null;

    return {
      grade,
      daysUntilExpiry,
      expired: daysUntilExpiry !== null && daysUntilExpiry < 0,
      hasSSL: true,
    };
  } catch {
    return { grade: null, daysUntilExpiry: null, expired: false, hasSSL: false, error: "SSL check failed" };
  }
}
