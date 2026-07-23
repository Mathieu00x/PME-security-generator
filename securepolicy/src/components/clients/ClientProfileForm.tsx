"use client";
import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, Building2, Shield } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Card } from "@/components/ui/Card";
import { createClient } from "@/lib/supabase/client";
import { Client, CompanyProfile } from "@/types";
import { useLanguage } from "@/contexts/LanguageContext";
import toast from "react-hot-toast";

const INDUSTRIES = [
  { value: "accounting", key: "clientProfile.industry.accounting" },
  { value: "construction", key: "clientProfile.industry.construction" },
  { value: "consulting", key: "clientProfile.industry.consulting" },
  { value: "education", key: "clientProfile.industry.education" },
  { value: "finance", key: "clientProfile.industry.finance" },
  { value: "healthcare", key: "clientProfile.industry.healthcare" },
  { value: "hospitality", key: "clientProfile.industry.hospitality" },
  { value: "it-web", key: "clientProfile.industry.itWeb" },
  { value: "legal", key: "clientProfile.industry.legal" },
  { value: "manufacturing", key: "clientProfile.industry.manufacturing" },
  { value: "real-estate", key: "clientProfile.industry.realEstate" },
  { value: "retail", key: "clientProfile.industry.retail" },
  { value: "other", key: "clientProfile.industry.other" },
];

const EMPLOYEE_RANGES = [
  { value: "1-5", label: "1 – 5" },
  { value: "6-10", label: "6 – 10" },
  { value: "11-20", label: "11 – 20" },
  { value: "21-50", label: "21 – 50" },
  { value: "51-100", label: "51 – 100" },
  { value: "100+", label: "100+" },
];

const CLOUD_SERVICES = [
  { value: "none", key: "clientProfile.cloud.none" },
  { value: "microsoft-365", label: "Microsoft 365" },
  { value: "google-workspace", label: "Google Workspace" },
  { value: "aws", label: "AWS" },
  { value: "azure", label: "Microsoft Azure" },
  { value: "mixed", key: "clientProfile.cloud.mixed" },
];

type Tab = "company" | "security";

export function ClientProfileForm({
  client,
  initialProfile,
}: {
  client: Client;
  initialProfile: CompanyProfile | null;
}) {
  const { t } = useLanguage();
  const industries = INDUSTRIES.map((i) => ({ value: i.value, label: t(i.key) }));
  const cloudServices = CLOUD_SERVICES.map((c) => ({ value: c.value, label: c.key ? t(c.key) : c.label! }));
  const [tab, setTab] = useState<Tab>("company");
  const [loading, setLoading] = useState(false);
  const [profile, setProfile] = useState<Partial<CompanyProfile>>(
    initialProfile || {
      company_name: client.name,
      industry: "",
      employee_count: "",
      country: "Canada",
      province: "",
      phone: "",
      email: "",
      website: "",
      remote_work: false,
      cloud_services: "none",
      uses_microsoft_365: false,
      uses_google_workspace: false,
      mfa_enabled: false,
      has_backups: false,
      has_it_department: false,
      uses_personal_devices: false,
    }
  );

  async function handleSave() {
    setLoading(true);
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    const { error } = await supabase
      .from("company_profiles")
      .upsert({ ...profile, client_id: client.id, user_id: user!.id }, { onConflict: "client_id" });

    if (error) {
      toast.error(t("clientProfile.saveFailed"));
    } else {
      toast.success(t("clientProfile.saved"));
    }
    setLoading(false);
  }

  function Toggle({ field, label }: { field: keyof CompanyProfile; label: string }) {
    return (
      <label className="flex items-center justify-between py-3 border-b border-gray-50 cursor-pointer">
        <span className="text-sm text-gray-700">{label}</span>
        <div
          onClick={() => setProfile((p) => ({ ...p, [field]: !p[field] }))}
          className={`relative w-10 h-5 rounded-full transition-colors ${
            profile[field] ? "bg-blue-600" : "bg-gray-200"
          }`}
        >
          <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${
            profile[field] ? "translate-x-5" : "translate-x-0.5"
          }`} />
        </div>
      </label>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-6">
        <Link href="/clients" className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-900 mb-3">
          <ArrowLeft size={14} /> {t("clientProfile.back")}
        </Link>
        <h1 className="text-2xl font-bold text-gray-900">{client.name}</h1>
        <p className="text-gray-500 text-sm mt-1">{t("clientProfile.subtitle")}</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 rounded-lg p-1 mb-6 w-fit">
        {(["company", "security"] as Tab[]).map((tabKey) => (
          <button
            key={tabKey}
            onClick={() => setTab(tabKey)}
            className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              tab === tabKey ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"
            }`}
          >
            {tabKey === "company" ? <Building2 size={15} /> : <Shield size={15} />}
            {tabKey === "company" ? t("clientProfile.tab.company") : t("clientProfile.tab.security")}
          </button>
        ))}
      </div>

      <Card>
        {tab === "company" ? (
          <div className="flex flex-col gap-4">
            <div className="grid grid-cols-2 gap-4">
              <Input
                label={t("clientProfile.companyName")}
                placeholder="Bluewave Construction Inc."
                value={profile.company_name || ""}
                onChange={(e) => setProfile((p) => ({ ...p, company_name: e.target.value }))}
              />
              <Input
                label={t("clientProfile.website")}
                placeholder="www.example.com"
                value={profile.website || ""}
                onChange={(e) => setProfile((p) => ({ ...p, website: e.target.value }))}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Select
                label={t("clientProfile.industry")}
                options={industries}
                value={profile.industry || ""}
                placeholder={t("clientProfile.selectIndustry")}
                onChange={(e) => setProfile((p) => ({ ...p, industry: e.target.value }))}
              />
              <Select
                label={t("clientProfile.employeeCount")}
                options={EMPLOYEE_RANGES}
                value={profile.employee_count || ""}
                placeholder={t("clientProfile.selectRange")}
                onChange={(e) => setProfile((p) => ({ ...p, employee_count: e.target.value }))}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Input
                label={t("clientProfile.phone")}
                placeholder="(514) 555-1234"
                value={profile.phone || ""}
                onChange={(e) => setProfile((p) => ({ ...p, phone: e.target.value }))}
              />
              <Input
                label={t("clientProfile.email")}
                type="email"
                placeholder="info@company.com"
                value={profile.email || ""}
                onChange={(e) => setProfile((p) => ({ ...p, email: e.target.value }))}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Select
                label={t("clientProfile.country")}
                options={[
                  { value: "Canada", label: t("clientProfile.country.canada") },
                  { value: "United States", label: t("clientProfile.country.us") },
                ]}
                value={profile.country || "Canada"}
                onChange={(e) => setProfile((p) => ({ ...p, country: e.target.value }))}
              />
              <Input
                label={t("clientProfile.province")}
                placeholder="Quebec"
                value={profile.province || ""}
                onChange={(e) => setProfile((p) => ({ ...p, province: e.target.value }))}
              />
            </div>
          </div>
        ) : (
          <div className="flex flex-col">
            <Select
              label={t("clientProfile.cloudServices")}
              options={cloudServices}
              value={profile.cloud_services || "none"}
              onChange={(e) => {
                const val = e.target.value;
                setProfile((p) => ({
                  ...p,
                  cloud_services: val,
                  uses_microsoft_365: val === "microsoft-365" || val === "mixed",
                  uses_google_workspace: val === "google-workspace" || val === "mixed",
                }));
              }}
              className="mb-4"
            />
            <Toggle field="remote_work" label={t("clientProfile.remoteWork")} />
            <Toggle field="uses_microsoft_365" label={t("clientProfile.microsoft365")} />
            <Toggle field="uses_google_workspace" label={t("clientProfile.googleWorkspace")} />
            <Toggle field="mfa_enabled" label={t("clientProfile.mfaEnabled")} />
            <Toggle field="has_backups" label={t("clientProfile.hasBackups")} />
            <Toggle field="has_it_department" label={t("clientProfile.hasItDept")} />
            <Toggle field="uses_personal_devices" label={t("clientProfile.personalDevices")} />
          </div>
        )}

        <div className="flex justify-end mt-6 pt-4 border-t border-gray-100">
          <Button onClick={handleSave} loading={loading}>
            {t("clientProfile.save")}
          </Button>
        </div>
      </Card>
    </div>
  );
}
