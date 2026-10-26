"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { track } from "@vercel/analytics";
import { Search, Lock } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { getT, Lang } from "@/lib/i18n";

const DOMAIN_RE = /^[a-zA-Z0-9][a-zA-Z0-9-]{0,61}[a-zA-Z0-9]?\.[a-zA-Z]{2,}$/;

interface PublicScanSummary {
  domain: string;
  preliminaryScore: number;
  findingsCount: number;
  criticalCount: number;
}

// The one genuinely interactive piece on an otherwise fully static
// marketing page — a free, unauthenticated scan teaser. Server-side
// protections (SSRF guard reuse, IP-HMAC rate limiting, honeypot) live in
// /api/public-scan and src/lib/publicScanProtection.ts; this component only
// renders the form and the partial result.
export function PublicScanForm({ lang }: { lang: Lang }) {
  const t = getT(lang);
  const router = useRouter();
  const [domain, setDomain] = useState("");
  const [website, setWebsite] = useState(""); // honeypot — see the hidden input below
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<PublicScanSummary | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const trimmed = domain.trim().toLowerCase().replace(/^https?:\/\//, "").replace(/\/.*$/, "");
    if (!DOMAIN_RE.test(trimmed)) {
      setError(t("publicScan.invalidDomain"));
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/public-scan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        // "website" is the honeypot — must actually carry whatever the
        // field holds (bots that auto-fill every input will have put
        // something in it) for the server-side check to mean anything;
        // previously this always sent "" regardless of the field's real
        // value, silently defeating the whole mechanism.
        body: JSON.stringify({ domain: trimmed, website }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || t("publicScan.genericError"));
      setResult(data);
      track("public_scan_completed", { domain: trimmed });
    } catch (err) {
      setError(err instanceof Error ? err.message : t("publicScan.genericError"));
    } finally {
      setLoading(false);
    }
  }

  function handleSignupClick() {
    track("public_scan_signup_click", { domain: result?.domain ?? "" });
    router.push(`/register?domain=${encodeURIComponent(result?.domain ?? "")}`);
  }

  if (result) {
    return (
      <div className="max-w-md mx-auto bg-white rounded-2xl border border-gray-100 shadow-xl p-6 text-left">
        <div className="flex items-center justify-between mb-4">
          <span className="text-sm font-semibold text-gray-900">{result.domain}</span>
          <span className="text-[10px] font-semibold uppercase tracking-wide text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">
            {t("publicScan.preliminaryLabel")}
          </span>
        </div>
        <div className="mb-4">
          <div className="flex items-baseline gap-1.5 mb-1.5">
            <span className="text-3xl font-extrabold text-gray-900">{result.preliminaryScore}</span>
            <span className="text-sm text-gray-400">/100</span>
          </div>
          <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full ${result.preliminaryScore >= 70 ? "bg-green-500" : result.preliminaryScore >= 40 ? "bg-orange-400" : "bg-red-500"}`}
              style={{ width: `${result.preliminaryScore}%` }}
            />
          </div>
        </div>
        <p className="text-sm text-gray-700 font-medium mb-1">
          {t("publicScan.findingsLine", { count: result.findingsCount, critical: result.criticalCount })}
        </p>
        <div className="flex flex-col gap-1.5 my-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-3.5 bg-gray-100 rounded blur-[2px]" style={{ width: `${90 - i * 12}%` }} />
          ))}
        </div>
        <div className="flex items-center gap-1.5 text-xs text-gray-400 mb-4">
          <Lock size={11} />
          {t("publicScan.blurredNote")}
        </div>
        <Button onClick={handleSignupClick} className="w-full">
          {t("publicScan.signupCta")}
        </Button>
        <button
          onClick={() => setResult(null)}
          className="w-full text-center text-xs text-gray-400 hover:text-gray-600 mt-3"
        >
          {t("publicScan.scanAnother")}
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="max-w-md mx-auto bg-white rounded-2xl border border-gray-100 shadow-xl p-6 text-left">
      <label className="text-sm font-medium text-gray-700 mb-2 block">{t("publicScan.label")}</label>
      <div className="relative mb-1">
        <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          type="text"
          value={domain}
          onChange={(e) => setDomain(e.target.value)}
          placeholder={t("publicScan.placeholder")}
          className="w-full pl-9 pr-4 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>
      {/* Honeypot: hidden from sighted users via CSS (not type="hidden",
          which some bots skip filling) and from screen readers via
          aria-hidden + tabIndex=-1, autoComplete="off" to avoid password
          managers touching it. */}
      <input
        type="text"
        name="website"
        value={website}
        onChange={(e) => setWebsite(e.target.value)}
        tabIndex={-1}
        autoComplete="off"
        aria-hidden="true"
        className="absolute opacity-0 pointer-events-none -left-[9999px]"
      />
      {error && <p className="text-xs text-red-600 mt-2">{error}</p>}
      <Button type="submit" loading={loading} disabled={!domain.trim()} className="w-full mt-3">
        {t("publicScan.cta")}
      </Button>
      <p className="text-xs text-gray-400 mt-3 text-center">{t("publicScan.sourceNote")}</p>
    </form>
  );
}
