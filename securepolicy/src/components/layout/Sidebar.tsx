"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  FileText,
  PlusCircle,
  Building2,
  Shield,
  Settings,
  LogOut,
  BookOpen,
  ClipboardCheck,
  Radar,
} from "lucide-react";
import { Logo } from "@/components/ui/Logo";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/utils/cn";
import { useLanguage } from "@/contexts/LanguageContext";
import toast from "react-hot-toast";

const NAV_ITEMS = [
  { href: "/dashboard", key: "dash.nav.dashboard", icon: LayoutDashboard },
  { href: "/scan", key: "dash.nav.scan", icon: Radar },
  { href: "/policies", key: "dash.nav.policies", icon: FileText },
  { href: "/generate", key: "dash.nav.generate", icon: PlusCircle },
  { href: "/clients", key: "dash.nav.clients", icon: Building2 },
  { href: "/security-score", key: "dash.nav.securityScore", icon: Shield },
  { href: "/audit-evidence", key: "dash.nav.auditEvidence", icon: ClipboardCheck },
  { href: "/frameworks", key: "dash.nav.frameworks", icon: BookOpen },
  { href: "/settings", key: "dash.nav.settings", icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { t } = useLanguage();

  async function handleLogout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    toast.success("Signed out successfully");
    router.push("/login");
    router.refresh();
  }

  return (
    <aside className="w-56 min-h-screen bg-white border-r border-gray-100 flex flex-col">
      <div className="p-5 border-b border-gray-100">
        <Logo />
      </div>

      <nav className="flex-1 p-3 flex flex-col gap-0.5">
        {NAV_ITEMS.map(({ href, key, icon: Icon }) => {
          const active = pathname === href || (href !== "/dashboard" && pathname.startsWith(href));
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
                active
                  ? "bg-blue-50 text-blue-600"
                  : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
              )}
            >
              <Icon size={18} className={active ? "text-blue-600" : "text-gray-400"} />
              {t(key)}
            </Link>
          );
        })}
      </nav>

      <div className="p-3 border-t border-gray-100">
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-50 hover:text-gray-900 transition-colors w-full"
        >
          <LogOut size={18} className="text-gray-400" />
          {t("dash.nav.logout")}
        </button>
      </div>
    </aside>
  );
}
