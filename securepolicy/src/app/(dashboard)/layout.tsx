import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Sidebar } from "@/components/layout/Sidebar";
import { Topbar } from "@/components/layout/Topbar";
import { ensureComplianceNotifications } from "@/lib/notifications";
import { AppNotification } from "@/types";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  await ensureComplianceNotifications(supabase, user.id);

  const { data: notifications } = await supabase
    .from("notifications")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(20);

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-auto">
        <div className="flex items-center justify-end px-8 py-3 border-b border-gray-100 bg-white">
          <Topbar initialNotifications={(notifications as AppNotification[]) || []} />
        </div>
        <main className="flex-1 p-8">{children}</main>
      </div>
    </div>
  );
}
