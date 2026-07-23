"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Building2, ChevronDown, Plus } from "lucide-react";
import { Client } from "@/types";
import { useLanguage } from "@/contexts/LanguageContext";
import toast from "react-hot-toast";

export function ClientSwitcher({
  clients,
  activeClientId,
}: {
  clients: Client[];
  activeClientId: string | null;
}) {
  const router = useRouter();
  const { t } = useLanguage();
  const [open, setOpen] = useState(false);
  const [switching, setSwitching] = useState(false);
  const activeClient = clients.find((c) => c.id === activeClientId);

  async function handleSwitch(clientId: string) {
    if (clientId === activeClientId) {
      setOpen(false);
      return;
    }
    setSwitching(true);
    try {
      const res = await fetch("/api/clients/switch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ clientId }),
      });
      if (!res.ok) throw new Error();
      setOpen(false);
      router.refresh();
    } catch {
      toast.error("Failed to switch client.");
    } finally {
      setSwitching(false);
    }
  }

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        disabled={switching}
        className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors text-sm font-medium text-gray-700 max-w-[220px]"
      >
        <Building2 size={14} className="text-gray-400 flex-shrink-0" />
        <span className="truncate">{activeClient?.name || t("dash.client.select")}</span>
        <ChevronDown size={13} className="text-gray-400 flex-shrink-0" />
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute left-0 top-10 w-64 bg-white border border-gray-100 rounded-xl shadow-lg z-20 overflow-hidden">
            <div className="max-h-72 overflow-y-auto py-1">
              {clients.map((c) => (
                <button
                  key={c.id}
                  onClick={() => handleSwitch(c.id)}
                  className={`flex items-center w-full text-left px-3 py-2 text-sm hover:bg-gray-50 transition-colors ${
                    c.id === activeClientId ? "text-blue-600 font-medium bg-blue-50" : "text-gray-700"
                  }`}
                >
                  {c.name}
                </button>
              ))}
            </div>
            <div className="border-t border-gray-100">
              <button
                onClick={() => {
                  setOpen(false);
                  router.push("/clients");
                }}
                className="flex items-center gap-2 w-full text-left px-3 py-2.5 text-sm text-blue-600 font-medium hover:bg-blue-50 transition-colors"
              >
                <Plus size={14} /> {t("dash.client.manage")}
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
