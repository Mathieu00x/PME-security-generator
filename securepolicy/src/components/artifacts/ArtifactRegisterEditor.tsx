"use client";

import { useState } from "react";
import { Plus, Trash2, Save } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { createClient } from "@/lib/supabase/client";
import { ArtifactDefinition } from "@/lib/artifacts";
import { ArtifactRow, Branding } from "@/types";
import { DownloadRegisterPDFButton } from "@/components/artifacts/DownloadRegisterPDFButton";
import toast from "react-hot-toast";

function emptyRow(definition: ArtifactDefinition): ArtifactRow {
  const row: ArtifactRow = { id: crypto.randomUUID() };
  definition.columns.forEach((c) => {
    row[c.key] = "";
  });
  return row;
}

export function ArtifactRegisterEditor({
  definition,
  initialItems,
  companyName,
  branding,
}: {
  definition: ArtifactDefinition;
  initialItems: ArtifactRow[];
  companyName: string;
  branding?: Branding;
}) {
  const [rows, setRows] = useState<ArtifactRow[]>(initialItems);
  const [dirty, setDirty] = useState(false);
  const [saving, setSaving] = useState(false);

  function updateCell(rowId: string, key: string, value: string) {
    setRows((prev) => prev.map((r) => (r.id === rowId ? { ...r, [key]: value } : r)));
    setDirty(true);
  }

  function addRow() {
    setRows((prev) => [...prev, emptyRow(definition)]);
    setDirty(true);
  }

  function removeRow(rowId: string) {
    setRows((prev) => prev.filter((r) => r.id !== rowId));
    setDirty(true);
  }

  async function handleSave() {
    setSaving(true);
    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { error } = await supabase
        .from("audit_artifacts")
        .upsert(
          { user_id: user.id, type: definition.type, items: rows },
          { onConflict: "user_id,type" }
        );

      if (error) throw error;
      setDirty(false);
      toast.success(`${definition.title} saved.`);
    } catch {
      toast.error("Failed to save. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
      <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
        <div>
          <h3 className="text-sm font-semibold text-gray-900">{definition.title}</h3>
          <p className="text-xs text-gray-400 mt-0.5">{definition.description}</p>
        </div>
        <div className="flex items-center gap-2">
          {dirty && <span className="text-xs text-amber-600">Unsaved changes</span>}
          <DownloadRegisterPDFButton definition={definition} rows={rows} companyName={companyName} branding={branding} />
          <Button variant="outline" size="sm" onClick={addRow}>
            <Plus size={14} /> Add Row
          </Button>
          <Button size="sm" onClick={handleSave} disabled={!dirty || saving}>
            <Save size={14} /> {saving ? "Saving…" : "Save"}
          </Button>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100 bg-gray-50">
              {definition.columns.map((col) => (
                <th key={col.key} className="text-left px-4 py-2 text-xs font-medium text-gray-400 uppercase tracking-wide whitespace-nowrap">
                  {col.label}
                </th>
              ))}
              <th className="w-10" />
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {rows.length === 0 ? (
              <tr>
                <td colSpan={definition.columns.length + 1} className="px-4 py-8 text-center text-sm text-gray-400">
                  No entries yet. Click &quot;Add Row&quot; to start building this register.
                </td>
              </tr>
            ) : (
              rows.map((row) => (
                <tr key={row.id}>
                  {definition.columns.map((col) => (
                    <td key={col.key} className="px-4 py-1.5 min-w-[140px]">
                      {col.type === "select" ? (
                        <select
                          value={row[col.key] || ""}
                          onChange={(e) => updateCell(row.id, col.key, e.target.value)}
                          className="w-full px-2 py-1.5 text-sm border border-transparent hover:border-gray-200 focus:border-blue-400 rounded-md focus:outline-none bg-transparent"
                        >
                          <option value="">—</option>
                          {col.options?.map((opt) => (
                            <option key={opt} value={opt}>{opt}</option>
                          ))}
                        </select>
                      ) : (
                        <input
                          type={col.type === "date" ? "date" : "text"}
                          value={row[col.key] || ""}
                          onChange={(e) => updateCell(row.id, col.key, e.target.value)}
                          className="w-full px-2 py-1.5 text-sm border border-transparent hover:border-gray-200 focus:border-blue-400 rounded-md focus:outline-none"
                        />
                      )}
                    </td>
                  ))}
                  <td className="px-2">
                    <button
                      onClick={() => removeRow(row.id)}
                      className="p-1.5 text-gray-300 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    >
                      <Trash2 size={14} />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
