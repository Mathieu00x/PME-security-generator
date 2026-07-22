"use client";
import { useState, useEffect } from "react";
import { Building2, Shield, Palette } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Card } from "@/components/ui/Card";
import { createClient } from "@/lib/supabase/client";
import { CompanyProfile } from "@/types";
import toast from "react-hot-toast";

const INDUSTRIES = [
  { value: "accounting", label: "Accounting" },
  { value: "construction", label: "Construction" },
  { value: "consulting", label: "Consulting" },
  { value: "education", label: "Education" },
  { value: "finance", label: "Finance" },
  { value: "healthcare", label: "Healthcare" },
  { value: "hospitality", label: "Hospitality" },
  { value: "it-web", label: "IT / Web Agency" },
  { value: "legal", label: "Legal" },
  { value: "manufacturing", label: "Manufacturing" },
  { value: "real-estate", label: "Real Estate" },
  { value: "retail", label: "Retail" },
  { value: "other", label: "Other" },
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
  { value: "none", label: "None" },
  { value: "microsoft-365", label: "Microsoft 365" },
  { value: "google-workspace", label: "Google Workspace" },
  { value: "aws", label: "AWS" },
  { value: "azure", label: "Microsoft Azure" },
  { value: "mixed", label: "Mixed / Multiple" },
];

type Tab = "company" | "security" | "branding";

export default function CompanyProfilePage() {
  const [tab, setTab] = useState<Tab>("company");
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [profile, setProfile] = useState<Partial<CompanyProfile>>({
    company_name: "",
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
    brand_name: "",
    brand_color: "#2563EB",
    brand_logo_url: "",
  });

  useEffect(() => {
    async function loadProfile() {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      const { data } = await supabase
        .from("company_profiles")
        .select("*")
        .eq("user_id", user!.id)
        .single();
      if (data) setProfile((prev) => ({ ...prev, ...data, brand_color: data.brand_color || prev.brand_color }));
      setFetching(false);
    }
    loadProfile();
  }, []);

  async function handleSave() {
    setLoading(true);
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    const { error } = await supabase
      .from("company_profiles")
      .upsert({ ...profile, user_id: user!.id }, { onConflict: "user_id" });

    if (error) {
      toast.error("Failed to save profile.");
    } else {
      toast.success("Profile saved!");
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

  if (fetching) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Company Profile</h1>
        <p className="text-gray-500 text-sm mt-1">Tell us about your business.</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 rounded-lg p-1 mb-6 w-fit">
        {(["company", "security", "branding"] as Tab[]).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              tab === t ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"
            }`}
          >
            {t === "company" && <Building2 size={15} />}
            {t === "security" && <Shield size={15} />}
            {t === "branding" && <Palette size={15} />}
            {t === "company" ? "Company Information" : t === "security" ? "Security Information" : "Branding"}
          </button>
        ))}
      </div>

      <Card>
        {tab === "company" ? (
          <div className="flex flex-col gap-4">
            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Company Name"
                placeholder="Bluewave Construction Inc."
                value={profile.company_name || ""}
                onChange={(e) => setProfile((p) => ({ ...p, company_name: e.target.value }))}
              />
              <Input
                label="Website (optional)"
                placeholder="www.example.com"
                value={profile.website || ""}
                onChange={(e) => setProfile((p) => ({ ...p, website: e.target.value }))}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Select
                label="Industry"
                options={INDUSTRIES}
                value={profile.industry || ""}
                placeholder="Select industry"
                onChange={(e) => setProfile((p) => ({ ...p, industry: e.target.value }))}
              />
              <Select
                label="Number of Employees"
                options={EMPLOYEE_RANGES}
                value={profile.employee_count || ""}
                placeholder="Select range"
                onChange={(e) => setProfile((p) => ({ ...p, employee_count: e.target.value }))}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Phone"
                placeholder="(514) 555-1234"
                value={profile.phone || ""}
                onChange={(e) => setProfile((p) => ({ ...p, phone: e.target.value }))}
              />
              <Input
                label="Email"
                type="email"
                placeholder="info@company.com"
                value={profile.email || ""}
                onChange={(e) => setProfile((p) => ({ ...p, email: e.target.value }))}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Select
                label="Country"
                options={[
                  { value: "Canada", label: "Canada" },
                  { value: "United States", label: "United States" },
                ]}
                value={profile.country || "Canada"}
                onChange={(e) => setProfile((p) => ({ ...p, country: e.target.value }))}
              />
              <Input
                label="Province / State"
                placeholder="Quebec"
                value={profile.province || ""}
                onChange={(e) => setProfile((p) => ({ ...p, province: e.target.value }))}
              />
            </div>
          </div>
        ) : tab === "security" ? (
          <div className="flex flex-col">
            <Select
              label="Cloud Services"
              options={CLOUD_SERVICES}
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
            <Toggle field="remote_work" label="Remote Work" />
            <Toggle field="uses_microsoft_365" label="Microsoft 365" />
            <Toggle field="uses_google_workspace" label="Google Workspace" />
            <Toggle field="mfa_enabled" label="MFA Enabled" />
            <Toggle field="has_backups" label="Backups in place" />
            <Toggle field="has_it_department" label="IT Department / External MSP" />
            <Toggle field="uses_personal_devices" label="Employees use personal devices" />
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            <p className="text-xs text-gray-500 -mt-1">
              White-label your exported policies with your own agency branding instead of SecurePilot&apos;s (Agency plan).
            </p>
            <Input
              label="Brand Name"
              placeholder="Bluewave Security Consulting"
              hint="Shown on PDF and Word cover pages instead of SecurePilot's default branding."
              value={profile.brand_name || ""}
              onChange={(e) => setProfile((p) => ({ ...p, brand_name: e.target.value }))}
            />
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1.5 block">Primary Color</label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={profile.brand_color || "#2563EB"}
                  onChange={(e) => setProfile((p) => ({ ...p, brand_color: e.target.value }))}
                  className="w-10 h-10 rounded-lg border border-gray-200 cursor-pointer"
                />
                <Input
                  value={profile.brand_color || "#2563EB"}
                  onChange={(e) => setProfile((p) => ({ ...p, brand_color: e.target.value }))}
                  className="w-32"
                />
              </div>
            </div>
            <Input
              label="Logo URL (optional)"
              placeholder="https://yourdomain.com/logo.png"
              hint="A hosted image URL — square logos work best."
              value={profile.brand_logo_url || ""}
              onChange={(e) => setProfile((p) => ({ ...p, brand_logo_url: e.target.value }))}
            />
            {profile.brand_logo_url && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={profile.brand_logo_url}
                alt="Brand logo preview"
                className="h-12 object-contain"
              />
            )}
          </div>
        )}

        <div className="flex justify-end mt-6 pt-4 border-t border-gray-100">
          <Button onClick={handleSave} loading={loading}>
            Save Changes
          </Button>
        </div>
      </Card>
    </div>
  );
}
