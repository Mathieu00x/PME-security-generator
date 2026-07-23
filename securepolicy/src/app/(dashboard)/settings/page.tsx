"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { User, Bell, Lock, AlertTriangle, Plug, Palette, CreditCard, Lock as LockIcon } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { createClient } from "@/lib/supabase/client";
import { getEntitlements, Entitlements } from "@/lib/entitlements";
import { AccountSettings, ConfluenceIntegrationConfig, NotionIntegrationConfig } from "@/types";
import { useLanguage } from "@/contexts/LanguageContext";
import toast from "react-hot-toast";

type Tab = "profile" | "plan" | "branding" | "notifications" | "password" | "integrations" | "danger";

const TABS: { key: Tab; labelKey: string; icon: React.ReactNode }[] = [
  { key: "profile", labelKey: "settings.tab.profile", icon: <User size={16} /> },
  { key: "plan", labelKey: "settings.tab.plan", icon: <CreditCard size={16} /> },
  { key: "branding", labelKey: "settings.tab.branding", icon: <Palette size={16} /> },
  { key: "notifications", labelKey: "settings.tab.notifications", icon: <Bell size={16} /> },
  { key: "password", labelKey: "settings.tab.password", icon: <Lock size={16} /> },
  { key: "integrations", labelKey: "settings.tab.integrations", icon: <Plug size={16} /> },
  { key: "danger", labelKey: "settings.tab.danger", icon: <AlertTriangle size={16} /> },
];

function UpsellNotice({ feature }: { feature: "branding" | "confluence_notion" }) {
  const { t } = useLanguage();
  return (
    <div className="flex items-start gap-3 p-4 bg-blue-50 border border-blue-100 rounded-xl">
      <LockIcon size={16} className="text-blue-600 flex-shrink-0 mt-0.5" />
      <div>
        <p className="text-sm font-medium text-blue-900">
          {t("settings.upsell.proFeature", { feature: t(`plan.feature.${feature}`) })}
        </p>
        <p className="text-xs text-blue-700 mt-0.5 mb-3">{t("settings.upsell.upgrade")}</p>
        <Link href="/choose-plan">
          <Button size="sm">{t("settings.upsell.viewPlans")}</Button>
        </Link>
      </div>
    </div>
  );
}

export default function SettingsPage() {
  const { t } = useLanguage();
  const [tab, setTab] = useState<Tab>("profile");
  const [loading, setLoading] = useState(false);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [entitlements, setEntitlements] = useState<Entitlements | null>(null);

  const [brandName, setBrandName] = useState("");
  const [brandColor, setBrandColor] = useState("#2563EB");
  const [brandLogoUrl, setBrandLogoUrl] = useState("");
  const [brandSaving, setBrandSaving] = useState(false);

  const [notionToken, setNotionToken] = useState("");
  const [notionParentPageId, setNotionParentPageId] = useState("");
  const [notionSaving, setNotionSaving] = useState(false);

  const [confluenceBaseUrl, setConfluenceBaseUrl] = useState("");
  const [confluenceEmail, setConfluenceEmail] = useState("");
  const [confluenceApiToken, setConfluenceApiToken] = useState("");
  const [confluenceSpaceKey, setConfluenceSpaceKey] = useState("");
  const [confluenceSaving, setConfluenceSaving] = useState(false);

  useEffect(() => {
    async function load() {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      setEmail(user.email || "");
      setFirstName(user.user_metadata?.first_name || "");
      setLastName(user.user_metadata?.last_name || "");

      const ent = await getEntitlements(supabase, user.id);
      setEntitlements(ent);

      const { data: accountSettings } = await supabase
        .from("account_settings")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();
      if (accountSettings) {
        const s = accountSettings as AccountSettings;
        setBrandName(s.brand_name || "");
        setBrandColor(s.brand_color || "#2563EB");
        setBrandLogoUrl(s.brand_logo_url || "");
      }

      const { data: integrations } = await supabase.from("integrations").select("*");
      integrations?.forEach((row) => {
        if (row.provider === "notion") {
          const cfg = row.config as NotionIntegrationConfig;
          setNotionToken(cfg.token || "");
          setNotionParentPageId(cfg.parentPageId || "");
        }
        if (row.provider === "confluence") {
          const cfg = row.config as ConfluenceIntegrationConfig;
          setConfluenceBaseUrl(cfg.baseUrl || "");
          setConfluenceEmail(cfg.email || "");
          setConfluenceApiToken(cfg.apiToken || "");
          setConfluenceSpaceKey(cfg.spaceKey || "");
        }
      });
    }
    load();
  }, []);

  async function handleSaveBranding() {
    setBrandSaving(true);
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    const { error } = await supabase.from("account_settings").upsert(
      {
        user_id: user!.id,
        brand_name: brandName,
        brand_color: brandColor,
        brand_logo_url: brandLogoUrl,
      },
      { onConflict: "user_id" }
    );
    if (error) toast.error(t("settings.branding.saveFailed"));
    else toast.success(t("settings.branding.saved"));
    setBrandSaving(false);
  }

  async function handleSaveNotion() {
    setNotionSaving(true);
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    const { error } = await supabase.from("integrations").upsert(
      {
        user_id: user!.id,
        provider: "notion",
        config: { token: notionToken, parentPageId: notionParentPageId },
      },
      { onConflict: "user_id,provider" }
    );
    if (error) toast.error(t("settings.notion.saveFailed"));
    else toast.success(t("settings.notion.saved"));
    setNotionSaving(false);
  }

  async function handleSaveConfluence() {
    setConfluenceSaving(true);
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    const { error } = await supabase.from("integrations").upsert(
      {
        user_id: user!.id,
        provider: "confluence",
        config: {
          baseUrl: confluenceBaseUrl,
          email: confluenceEmail,
          apiToken: confluenceApiToken,
          spaceKey: confluenceSpaceKey,
        },
      },
      { onConflict: "user_id,provider" }
    );
    if (error) toast.error(t("settings.confluence.saveFailed"));
    else toast.success(t("settings.confluence.saved"));
    setConfluenceSaving(false);
  }

  async function handleSaveProfile() {
    setLoading(true);
    const supabase = createClient();
    const { error } = await supabase.auth.updateUser({
      data: { first_name: firstName, last_name: lastName },
    });
    if (error) toast.error(error.message);
    else toast.success(t("settings.profile.updated"));
    setLoading(false);
  }

  async function handleChangePassword() {
    if (newPassword !== confirmPassword) {
      toast.error(t("settings.password.mismatch"));
      return;
    }
    if (newPassword.length < 8) {
      toast.error(t("settings.password.tooShort"));
      return;
    }
    setLoading(true);
    const supabase = createClient();
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    if (error) toast.error(error.message);
    else {
      toast.success(t("settings.password.updated"));
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    }
    setLoading(false);
  }

  async function handleDeleteAccount() {
    if (!confirm(t("settings.danger.confirm"))) return;
    toast.error(t("settings.danger.contactSupport"));
  }

  return (
    <div className="max-w-3xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">{t("settings.title")}</h1>
        <p className="text-gray-500 text-sm mt-1">{t("settings.subtitle")}</p>
      </div>

      <div className="flex gap-6">
        {/* Sidebar nav */}
        <div className="w-44 flex flex-col gap-0.5 flex-shrink-0">
          {TABS.map(({ key, labelKey, icon }) => (
            <button
              key={key}
              onClick={() => setTab(key)}
              className={`flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors text-left ${
                tab === key
                  ? "bg-blue-50 text-blue-600"
                  : "text-gray-600 hover:bg-gray-50"
              }`}
            >
              <span className={tab === key ? "text-blue-600" : "text-gray-400"}>{icon}</span>
              {t(labelKey)}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1">
          {tab === "profile" && (
            <Card>
              <h2 className="font-semibold text-gray-900 mb-4">{t("settings.profile.title")}</h2>
              <div className="flex flex-col gap-4">
                <div className="grid grid-cols-2 gap-4">
                  <Input
                    label={t("settings.profile.fullName")}
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    placeholder="Pablo"
                  />
                  <Input
                    label={t("settings.profile.lastName")}
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    placeholder="Construction"
                  />
                </div>
                <Input
                  label={t("settings.profile.email")}
                  type="email"
                  value={email}
                  disabled
                  hint={t("settings.profile.emailHint")}
                />
                <div className="flex justify-end pt-2">
                  <Button onClick={handleSaveProfile} loading={loading}>
                    {t("settings.saveChanges")}
                  </Button>
                </div>
              </div>
            </Card>
          )}

          {tab === "plan" && (
            <Card>
              <h2 className="font-semibold text-gray-900 mb-4">{t("settings.plan.title")}</h2>
              {entitlements?.plan ? (
                <div className="flex flex-col gap-4">
                  <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                    <div>
                      <p className="text-sm font-semibold text-gray-900">{t("settings.plan.name", { name: entitlements.plan.name })}</p>
                      <p className="text-xs text-gray-500 mt-0.5 capitalize">
                        {entitlements.subscription?.billing_interval} billing ·{" "}
                        {entitlements.plan.monthly_price_cents === 0
                          ? t("settings.plan.free")
                          : entitlements.subscription?.billing_interval === "annual"
                          ? t("settings.plan.perYear", { amount: (entitlements.plan.annual_price_cents / 100).toFixed(0) })
                          : t("settings.plan.perMonth", { amount: (entitlements.plan.monthly_price_cents / 100).toFixed(0) })}
                      </p>
                    </div>
                    <Link href="/choose-plan">
                      <Button variant="outline" size="sm">{t("settings.plan.change")}</Button>
                    </Link>
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">{t("settings.plan.includedFeatures")}</p>
                    <ul className="flex flex-col gap-1.5">
                      {entitlements.plan.features.length === 0 && (
                        <li className="text-xs text-gray-400">{t("settings.plan.coreOnly")}</li>
                      )}
                      {entitlements.plan.features.map((f) => (
                        <li key={f} className="text-xs text-gray-700">✓ {t(`plan.feature.${f}`)}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              ) : (
                <p className="text-sm text-gray-400">{t("settings.plan.loading")}</p>
              )}
            </Card>
          )}

          {tab === "branding" && (
            <Card>
              <h2 className="font-semibold text-gray-900 mb-1">{t("settings.branding.title")}</h2>
              <p className="text-xs text-gray-500 mb-4">{t("settings.branding.desc")}</p>
              {entitlements && !entitlements.hasFeature("branding") ? (
                <UpsellNotice feature="branding" />
              ) : (
                <div className="flex flex-col gap-4">
                  <Input
                    label={t("settings.branding.name")}
                    placeholder="Bluewave Security Consulting"
                    hint={t("settings.branding.nameHint")}
                    value={brandName}
                    onChange={(e) => setBrandName(e.target.value)}
                  />
                  <div>
                    <label className="text-sm font-medium text-gray-700 mb-1.5 block">{t("settings.branding.color")}</label>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={brandColor}
                        onChange={(e) => setBrandColor(e.target.value)}
                        className="w-10 h-10 rounded-lg border border-gray-200 cursor-pointer"
                      />
                      <Input value={brandColor} onChange={(e) => setBrandColor(e.target.value)} className="w-32" />
                    </div>
                  </div>
                  <Input
                    label={t("settings.branding.logoUrl")}
                    placeholder="https://yourdomain.com/logo.png"
                    hint={t("settings.branding.logoHint")}
                    value={brandLogoUrl}
                    onChange={(e) => setBrandLogoUrl(e.target.value)}
                  />
                  {brandLogoUrl && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={brandLogoUrl} alt={t("settings.branding.logoPreviewAlt")} className="h-12 object-contain" />
                  )}
                  <div className="flex justify-end pt-2">
                    <Button onClick={handleSaveBranding} loading={brandSaving}>
                      {t("settings.branding.save")}
                    </Button>
                  </div>
                </div>
              )}
            </Card>
          )}

          {tab === "notifications" && (
            <Card>
              <h2 className="font-semibold text-gray-900 mb-4">{t("settings.notifications.title")}</h2>
              <div className="flex flex-col gap-3">
                {[
                  { labelKey: "settings.notifications.reviewReminders", descKey: "settings.notifications.reviewRemindersDesc" },
                  { labelKey: "settings.notifications.scoreUpdates", descKey: "settings.notifications.scoreUpdatesDesc" },
                  { labelKey: "settings.notifications.newRecs", descKey: "settings.notifications.newRecsDesc" },
                ].map(({ labelKey, descKey }) => (
                  <label key={labelKey} className="flex items-center justify-between py-3 border-b border-gray-50 cursor-pointer">
                    <div>
                      <p className="text-sm font-medium text-gray-800">{t(labelKey)}</p>
                      <p className="text-xs text-gray-400">{t(descKey)}</p>
                    </div>
                    <div className="w-10 h-5 bg-blue-600 rounded-full relative flex-shrink-0">
                      <div className="absolute top-0.5 right-0.5 w-4 h-4 bg-white rounded-full shadow" />
                    </div>
                  </label>
                ))}
                <div className="flex justify-end pt-2">
                  <Button>{t("settings.notifications.savePrefs")}</Button>
                </div>
              </div>
            </Card>
          )}

          {tab === "password" && (
            <Card>
              <h2 className="font-semibold text-gray-900 mb-4">{t("settings.password.title")}</h2>
              <div className="flex flex-col gap-4">
                <Input
                  type="password"
                  label={t("settings.password.current")}
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="••••••••"
                />
                <Input
                  type="password"
                  label={t("settings.password.new")}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="••••••••"
                />
                <Input
                  type="password"
                  label={t("settings.password.confirm")}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                />
                <div className="flex justify-end pt-2">
                  <Button onClick={handleChangePassword} loading={loading}>
                    {t("settings.password.update")}
                  </Button>
                </div>
              </div>
            </Card>
          )}

          {tab === "integrations" && entitlements && !entitlements.hasFeature("confluence_notion") && (
            <Card>
              <h2 className="font-semibold text-gray-900 mb-1">{t("settings.integrations.title")}</h2>
              <p className="text-xs text-gray-500 mb-4">{t("settings.integrations.desc")}</p>
              <UpsellNotice feature="confluence_notion" />
            </Card>
          )}

          {tab === "integrations" && entitlements?.hasFeature("confluence_notion") && (
            <div className="flex flex-col gap-6">
              <Card>
                <h2 className="font-semibold text-gray-900 mb-1">{t("settings.notion.title")}</h2>
                <p className="text-xs text-gray-500 mb-4">
                  {t("settings.notion.desc", { link: "notion.so/my-integrations" })}
                </p>
                <div className="flex flex-col gap-4">
                  <Input
                    label={t("settings.notion.token")}
                    type="password"
                    value={notionToken}
                    onChange={(e) => setNotionToken(e.target.value)}
                    placeholder="secret_..."
                  />
                  <Input
                    label={t("settings.notion.parentPageId")}
                    value={notionParentPageId}
                    onChange={(e) => setNotionParentPageId(e.target.value)}
                    placeholder="e.g. 1a2b3c4d5e6f..."
                    hint={t("settings.notion.parentPageIdHint")}
                  />
                  <div className="flex justify-end pt-2">
                    <Button onClick={handleSaveNotion} loading={notionSaving}>
                      {t("settings.notion.save")}
                    </Button>
                  </div>
                </div>
              </Card>

              <Card>
                <h2 className="font-semibold text-gray-900 mb-1">{t("settings.confluence.title")}</h2>
                <p className="text-xs text-gray-500 mb-4">
                  {t("settings.confluence.desc", { link: "id.atlassian.com/manage-profile/security/api-tokens" })}
                </p>
                <div className="flex flex-col gap-4">
                  <Input
                    label={t("settings.confluence.siteUrl")}
                    value={confluenceBaseUrl}
                    onChange={(e) => setConfluenceBaseUrl(e.target.value)}
                    placeholder="https://yourcompany.atlassian.net"
                  />
                  <Input
                    label={t("settings.confluence.accountEmail")}
                    type="email"
                    value={confluenceEmail}
                    onChange={(e) => setConfluenceEmail(e.target.value)}
                    placeholder="you@yourcompany.com"
                  />
                  <Input
                    label={t("settings.confluence.apiToken")}
                    type="password"
                    value={confluenceApiToken}
                    onChange={(e) => setConfluenceApiToken(e.target.value)}
                    placeholder="••••••••"
                  />
                  <Input
                    label={t("settings.confluence.spaceKey")}
                    value={confluenceSpaceKey}
                    onChange={(e) => setConfluenceSpaceKey(e.target.value)}
                    placeholder="e.g. SEC"
                  />
                  <div className="flex justify-end pt-2">
                    <Button onClick={handleSaveConfluence} loading={confluenceSaving}>
                      {t("settings.confluence.save")}
                    </Button>
                  </div>
                </div>
              </Card>
            </div>
          )}

          {tab === "danger" && (
            <Card>
              <h2 className="font-semibold text-red-600 mb-2">{t("settings.danger.title")}</h2>
              <p className="text-sm text-gray-500 mb-6">{t("settings.danger.desc")}</p>
              <Button variant="danger" onClick={handleDeleteAccount}>
                {t("settings.danger.delete")}
              </Button>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
