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
  ListChecks,
  Scale,
  ShieldCheck,
  Map,
  FileBarChart,
  LucideIcon,
} from "lucide-react";
import { Logo } from "@/components/ui/Logo";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/utils/cn";
import { useLanguage } from "@/contexts/LanguageContext";
import toast from "react-hot-toast";

// Grouped so the sidebar reads as the product's own Assess → Remediate →
// Deliver mental model instead of one long flat list — this is purely a
// navigation/IA change, no new routes and no design-system changes.
const SECTION_OVERVIEW = [{ href: "/dashboard", key: "dash.nav.dashboard", icon: LayoutDashboard }];

const SECTION_GOVERN = [
  { href: "/policies", key: "dash.nav.policies", icon: FileText },
  { href: "/generate", key: "dash.nav.generate", icon: PlusCircle },
  { href: "/frameworks", key: "dash.nav.frameworks", icon: BookOpen },
  { href: "/audit-evidence", key: "dash.nav.auditEvidence", icon: ClipboardCheck },
];

const SECTION_MANAGE = [
  { href: "/clients", key: "dash.nav.clients", icon: Building2 },
  { href: "/settings", key: "dash.nav.settings", icon: Settings },
];

// Client-scoped nav link: href depends on the active client, and may carry a
// numeric or percentage badge. Doesn't fit the generic flat-item shape (every
// other entry is a static href with no badge) — same special-case precedent
// as Logout below.
function ClientScopedNavLink({
  activeClientId,
  pathname,
  hrefSuffix,
  label,
  icon: Icon,
  badge,
  disabledTitle,
}: {
  activeClientId: string | null;
  pathname: string;
  hrefSuffix: string;
  label: string;
  icon: LucideIcon;
  badge?: string | number | null;
  disabledTitle: string;
}) {
  if (!activeClientId) {
    return (
      <span
        className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-gray-300 cursor-not-allowed"
        title={disabledTitle}
      >
        <Icon size={18} className="text-gray-300" />
        {label}
      </span>
    );
  }

  const href = `/clients/${activeClientId}${hrefSuffix}`;
  const active = pathname.startsWith(href);

  return (
    <Link
      href={href}
      className={cn(
        "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
        active ? "bg-blue-50 text-blue-600" : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
      )}
    >
      <Icon size={18} className={active ? "text-blue-600" : "text-gray-400"} />
      {label}
      {badge != null && (
        <span className="ml-auto bg-red-100 text-red-600 text-[11px] font-semibold px-1.5 py-0.5 rounded-full">{badge}</span>
      )}
    </Link>
  );
}

function StaticNavLink({ href, label, icon: Icon, pathname }: { href: string; label: string; icon: LucideIcon; pathname: string }) {
  const active = pathname === href || (href !== "/dashboard" && pathname.startsWith(href));
  return (
    <Link
      href={href}
      className={cn(
        "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
        active ? "bg-blue-50 text-blue-600" : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
      )}
    >
      <Icon size={18} className={active ? "text-blue-600" : "text-gray-400"} />
      {label}
    </Link>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="px-3 pt-4 pb-1 text-[11px] font-semibold text-gray-400 uppercase tracking-wide first:pt-1">
      {children}
    </p>
  );
}

export function Sidebar({
  activeClientId,
  openTaskCount = 0,
  loi25Score = null,
  pipedaScore = null,
}: {
  activeClientId: string | null;
  openTaskCount?: number;
  loi25Score?: number | null;
  pipedaScore?: number | null;
}) {
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

      <nav className="flex-1 p-3 flex flex-col gap-0.5 overflow-y-auto">
        <SectionLabel>{t("dash.nav.section.overview")}</SectionLabel>
        {SECTION_OVERVIEW.map(({ href, key, icon }) => (
          <StaticNavLink key={href} href={href} label={t(key)} icon={icon} pathname={pathname} />
        ))}

        <SectionLabel>{t("dash.nav.section.assess")}</SectionLabel>
        <StaticNavLink href="/scan" label={t("dash.nav.scan")} icon={Radar} pathname={pathname} />
        <StaticNavLink href="/security-score" label={t("dash.nav.securityScore")} icon={Shield} pathname={pathname} />
        <ClientScopedNavLink
          activeClientId={activeClientId}
          pathname={pathname}
          hrefSuffix="/loi25"
          label={t("dash.nav.loi25")}
          icon={Scale}
          badge={loi25Score !== null ? `${loi25Score}%` : null}
          disabledTitle={t("dash.nav.tasksSelectClient")}
        />
        <ClientScopedNavLink
          activeClientId={activeClientId}
          pathname={pathname}
          hrefSuffix="/pipeda"
          label={t("dash.nav.pipeda")}
          icon={ShieldCheck}
          badge={pipedaScore !== null ? `${pipedaScore}%` : null}
          disabledTitle={t("dash.nav.tasksSelectClient")}
        />

        <SectionLabel>{t("dash.nav.section.remediate")}</SectionLabel>
        <ClientScopedNavLink
          activeClientId={activeClientId}
          pathname={pathname}
          hrefSuffix="/tasks"
          label={t("dash.nav.tasks")}
          icon={ListChecks}
          badge={openTaskCount > 0 ? openTaskCount : null}
          disabledTitle={t("dash.nav.tasksSelectClient")}
        />
        <ClientScopedNavLink
          activeClientId={activeClientId}
          pathname={pathname}
          hrefSuffix="/roadmap"
          label={t("dash.nav.roadmap")}
          icon={Map}
          disabledTitle={t("dash.nav.tasksSelectClient")}
        />

        <SectionLabel>{t("dash.nav.section.govern")}</SectionLabel>
        {SECTION_GOVERN.map(({ href, key, icon }) => (
          <StaticNavLink key={href} href={href} label={t(key)} icon={icon} pathname={pathname} />
        ))}

        <SectionLabel>{t("dash.nav.section.report")}</SectionLabel>
        <ClientScopedNavLink
          activeClientId={activeClientId}
          pathname={pathname}
          hrefSuffix="/report"
          label={t("dash.nav.report")}
          icon={FileBarChart}
          disabledTitle={t("dash.nav.tasksSelectClient")}
        />

        <SectionLabel>{t("dash.nav.section.manage")}</SectionLabel>
        {SECTION_MANAGE.map(({ href, key, icon }) => (
          <StaticNavLink key={href} href={href} label={t(key)} icon={icon} pathname={pathname} />
        ))}
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
