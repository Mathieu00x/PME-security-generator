"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Building2, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { createClient } from "@/lib/supabase/client";
import { Client } from "@/types";
import { useLanguage } from "@/contexts/LanguageContext";
import toast from "react-hot-toast";

export function ClientsListClient({
  initialClients,
  clientLimit,
  planName,
}: {
  initialClients: Client[];
  clientLimit: number | null;
  planName: string | null;
}) {
  const router = useRouter();
  const { t, dateLocale } = useLanguage();
  const [clients, setClients] = useState(initialClients);
  const [creating, setCreating] = useState(false);
  const [newName, setNewName] = useState("");
  const [saving, setSaving] = useState(false);

  const atLimit = clientLimit !== null && clients.length >= clientLimit;

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!newName.trim()) return;
    setSaving(true);
    try {
      const res = await fetch("/api/clients", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newName.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || t("clients.createFailed"));

      setClients((prev) => [...prev, data.client]);
      setNewName("");
      setCreating(false);
      toast.success(t("clients.created"));
      router.refresh();
      router.push(`/clients/${data.client.id}`);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : t("clients.genericError");
      toast.error(message);
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm(t("clients.deleteConfirm"))) return;
    const supabase = createClient();
    const { error } = await supabase.from("clients").delete().eq("id", id);
    if (error) {
      toast.error(t("clients.deleteFailed"));
    } else {
      setClients((prev) => prev.filter((c) => c.id !== id));
      toast.success(t("clients.deleted"));
      router.refresh();
    }
  }

  return (
    <div className="max-w-3xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{t("clients.title")}</h1>
          <p className="text-gray-500 text-sm mt-1">
            {clientLimit === null
              ? t("clients.limitUnlimited")
              : t(clientLimit === 1 ? "clients.limitUsed.one" : "clients.limitUsed.other", {
                  count: clients.length,
                  limit: clientLimit,
                  plan: planName ?? "",
                })}
          </p>
        </div>
        <Button onClick={() => setCreating((c) => !c)} disabled={atLimit}>
          <Plus size={16} /> {t("clients.add")}
        </Button>
      </div>

      {atLimit && (
        <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-800">
          {t("clients.limitReached")}{" "}
          <Link href="/choose-plan" className="font-semibold underline">{t("clients.upgrade")}</Link> {t("clients.toAddMore")}
        </div>
      )}

      {creating && (
        <Card className="mb-4">
          <form onSubmit={handleCreate} className="flex items-center gap-2">
            <input
              autoFocus
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder={t("clients.namePlaceholder")}
              className="flex-1 px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <Button type="submit" loading={saving} disabled={!newName.trim()}>
              {t("clients.create")}
            </Button>
          </form>
        </Card>
      )}

      {clients.length === 0 ? (
        <Card className="flex flex-col items-center justify-center py-16 text-center">
          <Building2 size={32} className="text-gray-200 mb-3" />
          <p className="text-sm text-gray-400">{t("clients.empty")}</p>
        </Card>
      ) : (
        <div className="flex flex-col gap-2">
          {clients.map((client) => (
            <Card key={client.id} padding="sm" className="flex items-center justify-between">
              <Link href={`/clients/${client.id}`} className="flex items-center gap-3 flex-1 min-w-0">
                <div className="w-9 h-9 bg-blue-50 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Building2 size={16} className="text-blue-600" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">{client.name}</p>
                  <p className="text-xs text-gray-400">
                    {t("clients.added", { date: new Date(client.created_at).toLocaleDateString(dateLocale) })}
                  </p>
                </div>
              </Link>
              <button
                onClick={() => handleDelete(client.id)}
                className="p-2 text-gray-300 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors flex-shrink-0"
              >
                <Trash2 size={15} />
              </button>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
