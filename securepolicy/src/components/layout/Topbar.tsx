"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Bell, AlertTriangle, RefreshCw, CheckCheck } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { AppNotification } from "@/types";

const TYPE_ICON: Record<string, React.ReactNode> = {
  framework_outdated: <RefreshCw size={14} className="text-amber-600" />,
  gap_risk: <AlertTriangle size={14} className="text-red-500" />,
};

function timeAgo(iso: string): string {
  const diffMs = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

export function Topbar({ initialNotifications }: { initialNotifications: AppNotification[] }) {
  const router = useRouter();
  const [notifications, setNotifications] = useState(initialNotifications);
  const [open, setOpen] = useState(false);
  const unreadCount = notifications.filter((n) => !n.read).length;

  async function markRead(ids: string[]) {
    setNotifications((prev) => prev.map((n) => (ids.includes(n.id) ? { ...n, read: true } : n)));
    const supabase = createClient();
    await supabase.from("notifications").update({ read: true }).in("id", ids);
  }

  async function handleNotificationClick(n: AppNotification) {
    if (!n.read) await markRead([n.id]);
    setOpen(false);
    if (n.link) router.push(n.link);
  }

  async function handleMarkAllRead() {
    const unreadIds = notifications.filter((n) => !n.read).map((n) => n.id);
    if (unreadIds.length) await markRead(unreadIds);
  }

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        className="relative p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
      >
        <Bell size={18} />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full ring-2 ring-white" />
        )}
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-11 w-80 bg-white border border-gray-100 rounded-xl shadow-lg z-20 overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
              <p className="text-sm font-semibold text-gray-900">Notifications</p>
              {unreadCount > 0 && (
                <button
                  onClick={handleMarkAllRead}
                  className="flex items-center gap-1 text-xs text-blue-600 hover:underline"
                >
                  <CheckCheck size={12} /> Mark all read
                </button>
              )}
            </div>

            <div className="max-h-96 overflow-y-auto">
              {notifications.length === 0 ? (
                <p className="text-sm text-gray-400 text-center py-8">You&apos;re all caught up.</p>
              ) : (
                notifications.map((n) => (
                  <button
                    key={n.id}
                    onClick={() => handleNotificationClick(n)}
                    className={`flex items-start gap-2.5 w-full text-left px-4 py-3 border-b border-gray-50 hover:bg-gray-50 transition-colors ${
                      !n.read ? "bg-blue-50/50" : ""
                    }`}
                  >
                    <div className="mt-0.5 flex-shrink-0">{TYPE_ICON[n.type] || <Bell size={14} className="text-gray-400" />}</div>
                    <div className="min-w-0 flex-1">
                      <p className={`text-xs leading-snug ${!n.read ? "font-semibold text-gray-900" : "text-gray-600"}`}>
                        {n.title}
                      </p>
                      {n.body && <p className="text-xs text-gray-400 mt-0.5">{n.body}</p>}
                      <p className="text-[10px] text-gray-300 mt-1">{timeAgo(n.created_at)}</p>
                    </div>
                    {!n.read && <span className="w-1.5 h-1.5 rounded-full bg-blue-600 flex-shrink-0 mt-1.5" />}
                  </button>
                ))
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
