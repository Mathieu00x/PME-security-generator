export interface HIBPBreach {
  name: string;
  date: string;
  dataClasses: string[];
}

export interface HIBPResult {
  compromisedCount: number;
  breaches: HIBPBreach[];
  error?: string;
}

export async function checkHIBP(domain: string): Promise<HIBPResult> {
  const apiKey = process.env.HIBP_API_KEY;
  if (!apiKey) {
    return { compromisedCount: 0, breaches: [], error: "API non configurée" };
  }

  try {
    const res = await fetch(
      `https://haveibeenpwned.com/api/v3/breacheddomain/${encodeURIComponent(domain)}`,
      {
        headers: {
          "hibp-api-key": apiKey,
          "User-Agent": "SecurePilot-Scanner/1.0",
        },
      }
    );

    if (res.status === 404) return { compromisedCount: 0, breaches: [] };
    if (!res.ok) return { compromisedCount: 0, breaches: [], error: "HIBP check failed" };

    const data = (await res.json()) as Record<string, string[]>;
    const allBreaches = Object.values(data).flat();
    const uniqueBreaches = Array.from(new Set(allBreaches));

    return {
      compromisedCount: Object.keys(data).length,
      breaches: uniqueBreaches.map((name) => ({
        name,
        date: "Inconnue",
        dataClasses: [],
      })),
    };
  } catch {
    return { compromisedCount: 0, breaches: [], error: "HIBP check failed" };
  }
}
