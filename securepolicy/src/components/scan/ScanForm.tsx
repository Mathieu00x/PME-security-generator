"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Radar, Search } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { useLanguage } from "@/contexts/LanguageContext";
import toast from "react-hot-toast";

const DOMAIN_RE = /^[a-zA-Z0-9][a-zA-Z0-9-]{0,61}[a-zA-Z0-9]?\.[a-zA-Z]{2,}$/;

export function ScanForm() {
  const router = useRouter();
  const { t } = useLanguage();
  const STAGES = [t("scan.stage1"), t("scan.stage2"), t("scan.stage3"), t("scan.stage4")];
  const [domain, setDomain] = useState("");
  const [scanning, setScanning] = useState(false);
  const [stage, setStage] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    const trimmed = domain.trim().toLowerCase().replace(/^https?:\/\//, "").replace(/\/.*$/, "");
    if (!DOMAIN_RE.test(trimmed)) {
      setError(t("scan.invalidDomain"));
      return;
    }

    setScanning(true);
    setStage(0);
    intervalRef.current = setInterval(() => {
      setStage((s) => Math.min(s + 1, STAGES.length - 1));
    }, 6000);

    try {
      const res = await fetch("/api/scan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ domain: trimmed }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || t("scan.failed"));
      }

      router.refresh();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : t("scan.genericError");
      setError(message);
      toast.error(message);
    } finally {
      if (intervalRef.current) clearInterval(intervalRef.current);
      setScanning(false);
    }
  }

  if (scanning) {
    return (
      <div className="max-w-lg mx-auto flex flex-col items-center justify-center min-h-[50vh] text-center">
        <div className="w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center mb-6">
          <Radar size={28} className="text-blue-600 animate-pulse" />
        </div>
        <h2 className="text-xl font-bold text-gray-900 mb-2">{t("scan.scanningTitle")}</h2>
        <p className="text-gray-500 text-sm">{STAGES[stage]}</p>
        <div className="w-64 h-1.5 bg-gray-100 rounded-full mt-8 overflow-hidden">
          <div
            className="h-full bg-blue-600 rounded-full transition-all duration-1000 ease-out"
            style={{ width: `${((stage + 1) / STAGES.length) * 100}%` }}
          />
        </div>
        <p className="text-xs text-gray-400 mt-3">{t("scan.scanningNote")}</p>
      </div>
    );
  }

  return (
    <div className="max-w-lg mx-auto flex flex-col items-center justify-center min-h-[50vh] text-center">
      <div className="w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center mb-6">
        <Radar size={28} className="text-blue-600" />
      </div>
      <h1 className="text-2xl font-bold text-gray-900 mb-2">{t("scan.title")}</h1>
      <p className="text-gray-500 text-sm mb-8">{t("scan.subtitle")}</p>

      <Card className="w-full text-left">
        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          <label className="text-sm font-medium text-gray-700">{t("scan.domainLabel")}</label>
          <div className="relative">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={domain}
              onChange={(e) => setDomain(e.target.value)}
              placeholder={t("scan.domainPlaceholder")}
              className="w-full pl-9 pr-4 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          {error && <p className="text-xs text-red-600">{error}</p>}
          <Button type="submit" disabled={!domain.trim()}>
            {t("scan.launch")}
          </Button>
        </form>
      </Card>
    </div>
  );
}
