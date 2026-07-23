import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Sidebar } from "@/components/layout/Sidebar";
import { Topbar } from "@/components/layout/Topbar";
import { ClientSwitcher } from "@/components/layout/ClientSwitcher";
import { ensureComplianceNotifications } from "@/lib/notifications";
import { getActiveClientId } from "@/lib/activeClient";
import { AppNotification, Client } from "@/types";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  // Every account must have an active plan before touching the app —
  // without one, this redirects to the mandatory plan-selection screen.
  const { data: subscription } = await supabase
    .from("subscriptions")
    .select("id")
    .eq("user_id", user.id)
    .eq("status", "active")
    .maybeSingle();

  if (!subscription) redirect("/choose-plan");

  await ensureComplianceNotifications(supabase, user.id);

  const [{ data: notifications }, { data: clients }, activeClientId] = await Promise.all([
    supabase.from("notifications").select("*").order("created_at", { ascending: false }).limit(20),
    supabase.from("clients").select("*").eq("user_id", user.id).order("created_at", { ascending: true }),
    getActiveClientId(supabase, user.id),
  ]);

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-auto">
        <div className="flex items-center justify-between px-8 py-3 border-b border-gray-100 bg-white">
          <ClientSwitcher clients={(clients as Client[]) || []} activeClientId={activeClientId} />
          <Topbar initialNotifications={(notifications as AppNotification[]) || []} />
        </div>
        <main className="flex-1 p-8">{children}</main>
      </div>
    </div>
  );
}
