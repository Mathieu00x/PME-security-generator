"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Radar, Search } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import toast from "react-hot-toast";

const DOMAIN_RE = /^[a-zA-Z0-9][a-zA-Z0-9-]{0,61}[a-zA-Z0-9]?\.[a-zA-Z]{2,}$/;

const STAGES = [
  "Vérification SSL…",
  "Analyse des fuites…",
  "Scan DNS…",
  "Génération du rapport…",
];

export function ScanForm() {
  const router = useRouter();
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
      setError("Entrez un domaine valide (ex. entreprise.com).");
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
        throw new Error(err.error || "Le diagnostic a échoué.");
      }

      router.refresh();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Quelque chose s'est mal passé.";
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
        <h2 className="text-xl font-bold text-gray-900 mb-2">Diagnostic en cours…</h2>
        <p className="text-gray-500 text-sm">{STAGES[stage]}</p>
        <div className="w-64 h-1.5 bg-gray-100 rounded-full mt-8 overflow-hidden">
          <div
            className="h-full bg-blue-600 rounded-full transition-all duration-1000 ease-out"
            style={{ width: `${((stage + 1) / STAGES.length) * 100}%` }}
          />
        </div>
        <p className="text-xs text-gray-400 mt-3">Ça peut prendre jusqu&apos;à 30 secondes.</p>
      </div>
    );
  }

  return (
    <div className="max-w-lg mx-auto flex flex-col items-center justify-center min-h-[50vh] text-center">
      <div className="w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center mb-6">
        <Radar size={28} className="text-blue-600" />
      </div>
      <h1 className="text-2xl font-bold text-gray-900 mb-2">Diagnostic de surface d&apos;attaque</h1>
      <p className="text-gray-500 text-sm mb-8">
        Analysez la surface d&apos;attaque de votre domaine : certificat SSL, fuites de données, configuration DNS et sous-domaines exposés.
      </p>

      <Card className="w-full text-left">
        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          <label className="text-sm font-medium text-gray-700">Domaine à analyser</label>
          <div className="relative">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={domain}
              onChange={(e) => setDomain(e.target.value)}
              placeholder="entreprise.com"
              className="w-full pl-9 pr-4 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          {error && <p className="text-xs text-red-600">{error}</p>}
          <Button type="submit" disabled={!domain.trim()}>
            Lancer le diagnostic
          </Button>
        </form>
      </Card>
    </div>
  );
}
