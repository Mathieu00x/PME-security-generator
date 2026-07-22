"use client";
import { useState } from "react";
import Link from "next/link";
import { FileText, Eye, Download, Pencil, Trash2, MoreHorizontal, Search } from "lucide-react";
import { Branding, Policy } from "@/types";
import { createClient } from "@/lib/supabase/client";
import toast from "react-hot-toast";
import { DownloadPDFButton } from "@/components/policies/DownloadPDFButton";

const STATUS_STYLE: Record<string, string> = {
  completed: "bg-green-100 text-green-700",
  draft: "bg-yellow-100 text-yellow-700",
};

export function PoliciesClient({ initialPolicies, branding }: { initialPolicies: Policy[]; branding?: Branding }) {
  const [policies, setPolicies] = useState<Policy[]>(initialPolicies);
  const [search, setSearch] = useState("");
  const [openMenu, setOpenMenu] = useState<string | null>(null);
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState("");

  const filtered = policies.filter((p) =>
    p.title.toLowerCase().includes(search.toLowerCase())
  );

  async function handleDelete(id: string) {
    if (!confirm("Delete this policy? This cannot be undone.")) return;
    const supabase = createClient();
    const { error } = await supabase.from("policies").delete().eq("id", id);
    if (error) {
      toast.error("Failed to delete.");
    } else {
      setPolicies((prev) => prev.filter((p) => p.id !== id));
      toast.success("Policy deleted.");
    }
    setOpenMenu(null);
  }

  async function handleRename(id: string) {
    if (!renameValue.trim()) return;
    const supabase = createClient();
    const { error } = await supabase
      .from("policies")
      .update({ title: renameValue })
      .eq("id", id);
    if (error) {
      toast.error("Failed to rename.");
    } else {
      setPolicies((prev) =>
        prev.map((p) => (p.id === id ? { ...p, title: renameValue } : p))
      );
      toast.success("Renamed.");
    }
    setRenamingId(null);
    setRenameValue("");
  }

  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm">
      {/* Search bar */}
      <div className="px-6 py-4 border-b border-gray-100">
        <div className="relative">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search policies…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      {/* Table header */}
      <div className="grid grid-cols-12 px-6 py-3 text-xs font-medium text-gray-400 uppercase tracking-wide border-b border-gray-50">
        <span className="col-span-5">Policy Name</span>
        <span className="col-span-2">Status</span>
        <span className="col-span-3">Last Updated</span>
        <span className="col-span-2 text-right">Actions</span>
      </div>

      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <FileText size={36} className="text-gray-200 mb-3" />
          <p className="text-sm text-gray-400">
            {search ? "No policies match your search." : "No policies yet."}
          </p>
        </div>
      ) : (
        <div className="divide-y divide-gray-50">
          {filtered.map((policy) => (
            <div
              key={policy.id}
              className="grid grid-cols-12 items-center px-6 py-4 hover:bg-gray-50"
            >
              <div className="col-span-5 flex items-center gap-3">
                <div className="w-8 h-8 bg-blue-50 rounded-lg flex items-center justify-center flex-shrink-0">
                  <FileText size={15} className="text-blue-600" />
                </div>
                <div>
                  {renamingId === policy.id ? (
                    <form
                      onSubmit={(e) => {
                        e.preventDefault();
                        handleRename(policy.id);
                      }}
                      className="flex gap-2"
                    >
                      <input
                        autoFocus
                        value={renameValue}
                        onChange={(e) => setRenameValue(e.target.value)}
                        className="text-sm px-2 py-0.5 border border-blue-400 rounded focus:outline-none"
                      />
                      <button type="submit" className="text-xs text-blue-600 font-medium">Save</button>
                      <button type="button" onClick={() => setRenamingId(null)} className="text-xs text-gray-400">Cancel</button>
                    </form>
                  ) : (
                    <p className="text-sm font-medium text-gray-900">{policy.title}</p>
                  )}
                  <p className="text-xs text-gray-400">Version {policy.version}</p>
                </div>
              </div>

              <div className="col-span-2">
                <span className={`text-xs px-2.5 py-1 rounded-full font-medium capitalize ${STATUS_STYLE[policy.status] || "bg-gray-100 text-gray-500"}`}>
                  {policy.status}
                </span>
              </div>

              <div className="col-span-3 text-sm text-gray-500">
                {new Date(policy.updated_at).toLocaleDateString("en-CA")}
              </div>

              <div className="col-span-2 flex items-center justify-end gap-2 relative">
                <Link href={`/policies/${policy.id}`}>
                  <button className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
                    <Eye size={15} />
                  </button>
                </Link>
                <DownloadPDFButton policy={policy} branding={branding} iconOnly />
                <div className="relative">
                  <button
                    onClick={() => setOpenMenu(openMenu === policy.id ? null : policy.id)}
                    className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    <MoreHorizontal size={15} />
                  </button>
                  {openMenu === policy.id && (
                    <div className="absolute right-0 top-8 bg-white border border-gray-100 rounded-lg shadow-lg z-10 w-36 py-1">
                      <button
                        onClick={() => {
                          setRenamingId(policy.id);
                          setRenameValue(policy.title);
                          setOpenMenu(null);
                        }}
                        className="flex items-center gap-2 w-full px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
                      >
                        <Pencil size={13} /> Rename
                      </button>
                      <button
                        onClick={() => handleDelete(policy.id)}
                        className="flex items-center gap-2 w-full px-3 py-2 text-sm text-red-600 hover:bg-red-50"
                      >
                        <Trash2 size={13} /> Delete
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
