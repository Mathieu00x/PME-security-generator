"use client";
import { useState } from "react";
import { ExternalLink, Loader2 } from "lucide-react";
import { IntegrationProvider } from "@/types";
import { useLanguage } from "@/contexts/LanguageContext";
import toast from "react-hot-toast";

const PROVIDER_LABELS: Record<IntegrationProvider, string> = {
  notion: "Notion",
  confluence: "Confluence",
};

export function ExportToWorkspaceButton({
  policyId,
  provider,
}: {
  policyId: string;
  provider: IntegrationProvider;
}) {
  const { t } = useLanguage();
  const [loading, setLoading] = useState(false);

  async function handleExport() {
    setLoading(true);
    try {
      const res = await fetch(`/api/integrations/${provider}/export`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ policyId }),
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || t("exportWorkspace.exportFailed", { provider: PROVIDER_LABELS[provider] }));
      }

      toast.success(
        (toastInstance) => (
          <span>
            {t("exportWorkspace.exported", { provider: PROVIDER_LABELS[provider] })}{" "}
            <a
              href={data.url}
              target="_blank"
              rel="noopener noreferrer"
              className="underline font-medium"
              onClick={() => toast.dismiss(toastInstance.id)}
            >
              {t("exportWorkspace.openPage")}
            </a>
          </span>
        ),
        { duration: 8000 }
      );
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : t("exportWorkspace.genericError");
      toast.error(message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      onClick={handleExport}
      disabled={loading}
      className="inline-flex items-center gap-2 px-3 py-1.5 border border-gray-200 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed bg-white"
    >
      {loading ? <Loader2 size={14} className="animate-spin" /> : <ExternalLink size={14} />}
      {loading ? t("exportWorkspace.exporting") : t("exportWorkspace.exportTo", { provider: PROVIDER_LABELS[provider] })}
    </button>
  );
}
