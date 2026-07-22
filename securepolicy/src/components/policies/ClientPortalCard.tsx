"use client";

import { useState } from "react";
import { Link2, Copy, Check } from "lucide-react";
import { Card } from "@/components/ui/Card";
import toast from "react-hot-toast";

export function ClientPortalCard({
  policyId,
  initialEnabled,
  initialToken,
}: {
  policyId: string;
  initialEnabled: boolean;
  initialToken: string | null;
}) {
  const [enabled, setEnabled] = useState(initialEnabled);
  const [token, setToken] = useState(initialToken);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  const shareUrl = token && typeof window !== "undefined" ? `${window.location.origin}/share/${token}` : "";

  async function handleToggle() {
    setLoading(true);
    try {
      const res = await fetch(`/api/policies/${policyId}/share`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ enabled: !enabled }),
      });
      if (!res.ok) throw new Error();
      const data = await res.json();
      setEnabled(data.share_enabled);
      setToken(data.share_token);
      toast.success(data.share_enabled ? "Client portal link enabled." : "Client portal link disabled.");
    } catch {
      toast.error("Failed to update the client portal link.");
    } finally {
      setLoading(false);
    }
  }

  async function handleCopy() {
    await navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <Card padding="sm">
      <h3 className="text-sm font-semibold text-gray-900 mb-1 flex items-center gap-1.5">
        <Link2 size={14} className="text-blue-500" />
        Client Portal
      </h3>
      <p className="text-xs text-gray-500 leading-relaxed mb-3">
        Share a read-only link so your client can view this policy without an account.
      </p>

      <label className="flex items-center justify-between mb-3 cursor-pointer">
        <span className="text-xs font-medium text-gray-700">
          {enabled ? "Link enabled" : "Link disabled"}
        </span>
        <button
          onClick={handleToggle}
          disabled={loading}
          className={`w-9 h-5 rounded-full relative flex-shrink-0 transition-colors disabled:opacity-50 ${
            enabled ? "bg-blue-600" : "bg-gray-200"
          }`}
        >
          <div
            className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-all ${
              enabled ? "right-0.5" : "left-0.5"
            }`}
          />
        </button>
      </label>

      {enabled && shareUrl && (
        <div className="flex items-center gap-1.5">
          <input
            readOnly
            value={shareUrl}
            className="flex-1 min-w-0 text-xs px-2 py-1.5 border border-gray-200 rounded-md bg-gray-50 text-gray-500 truncate"
          />
          <button
            onClick={handleCopy}
            className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-md transition-colors flex-shrink-0"
            title="Copy link"
          >
            {copied ? <Check size={14} className="text-green-600" /> : <Copy size={14} />}
          </button>
        </div>
      )}
    </Card>
  );
}
