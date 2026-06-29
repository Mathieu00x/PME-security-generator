"use client";
import { useState, useEffect } from "react";
import { User, Bell, Lock, AlertTriangle } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { createClient } from "@/lib/supabase/client";
import toast from "react-hot-toast";

type Tab = "profile" | "notifications" | "password" | "danger";

const TABS: { key: Tab; label: string; icon: React.ReactNode }[] = [
  { key: "profile", label: "Profile", icon: <User size={16} /> },
  { key: "notifications", label: "Notifications", icon: <Bell size={16} /> },
  { key: "password", label: "Password", icon: <Lock size={16} /> },
  { key: "danger", label: "Danger Zone", icon: <AlertTriangle size={16} /> },
];

export default function SettingsPage() {
  const [tab, setTab] = useState<Tab>("profile");
  const [loading, setLoading] = useState(false);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  useEffect(() => {
    async function load() {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setEmail(user.email || "");
        setFirstName(user.user_metadata?.first_name || "");
        setLastName(user.user_metadata?.last_name || "");
      }
    }
    load();
  }, []);

  async function handleSaveProfile() {
    setLoading(true);
    const supabase = createClient();
    const { error } = await supabase.auth.updateUser({
      data: { first_name: firstName, last_name: lastName },
    });
    if (error) toast.error(error.message);
    else toast.success("Profile updated!");
    setLoading(false);
  }

  async function handleChangePassword() {
    if (newPassword !== confirmPassword) {
      toast.error("Passwords do not match.");
      return;
    }
    if (newPassword.length < 8) {
      toast.error("Password must be at least 8 characters.");
      return;
    }
    setLoading(true);
    const supabase = createClient();
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    if (error) toast.error(error.message);
    else {
      toast.success("Password updated!");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    }
    setLoading(false);
  }

  async function handleDeleteAccount() {
    if (!confirm("Are you absolutely sure? This will permanently delete your account and all data. This cannot be undone.")) return;
    toast.error("Please contact support to delete your account.");
  }

  return (
    <div className="max-w-3xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
        <p className="text-gray-500 text-sm mt-1">Manage your account settings and preferences.</p>
      </div>

      <div className="flex gap-6">
        {/* Sidebar nav */}
        <div className="w-44 flex flex-col gap-0.5 flex-shrink-0">
          {TABS.map(({ key, label, icon }) => (
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
              {label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1">
          {tab === "profile" && (
            <Card>
              <h2 className="font-semibold text-gray-900 mb-4">Profile Information</h2>
              <div className="flex flex-col gap-4">
                <div className="grid grid-cols-2 gap-4">
                  <Input
                    label="Full Name"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    placeholder="Pablo"
                  />
                  <Input
                    label="Last Name"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    placeholder="Construction"
                  />
                </div>
                <Input
                  label="Email"
                  type="email"
                  value={email}
                  disabled
                  hint="Email cannot be changed here. Contact support."
                />
                <div className="flex justify-end pt-2">
                  <Button onClick={handleSaveProfile} loading={loading}>
                    Save Changes
                  </Button>
                </div>
              </div>
            </Card>
          )}

          {tab === "notifications" && (
            <Card>
              <h2 className="font-semibold text-gray-900 mb-4">Notifications</h2>
              <div className="flex flex-col gap-3">
                {[
                  { label: "Policy review reminders", desc: "Get notified when a policy is due for review" },
                  { label: "Security score updates", desc: "Get notified when your security score changes" },
                  { label: "New recommendations", desc: "Get notified when new recommendations are available" },
                ].map(({ label, desc }) => (
                  <label key={label} className="flex items-center justify-between py-3 border-b border-gray-50 cursor-pointer">
                    <div>
                      <p className="text-sm font-medium text-gray-800">{label}</p>
                      <p className="text-xs text-gray-400">{desc}</p>
                    </div>
                    <div className="w-10 h-5 bg-blue-600 rounded-full relative flex-shrink-0">
                      <div className="absolute top-0.5 right-0.5 w-4 h-4 bg-white rounded-full shadow" />
                    </div>
                  </label>
                ))}
                <div className="flex justify-end pt-2">
                  <Button>Save Preferences</Button>
                </div>
              </div>
            </Card>
          )}

          {tab === "password" && (
            <Card>
              <h2 className="font-semibold text-gray-900 mb-4">Change Password</h2>
              <div className="flex flex-col gap-4">
                <Input
                  type="password"
                  label="Current Password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="••••••••"
                />
                <Input
                  type="password"
                  label="New Password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="••••••••"
                />
                <Input
                  type="password"
                  label="Confirm New Password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                />
                <div className="flex justify-end pt-2">
                  <Button onClick={handleChangePassword} loading={loading}>
                    Update Password
                  </Button>
                </div>
              </div>
            </Card>
          )}

          {tab === "danger" && (
            <Card>
              <h2 className="font-semibold text-red-600 mb-2">Danger Zone</h2>
              <p className="text-sm text-gray-500 mb-6">
                Once you delete your account, there is no going back. All your data will be permanently erased.
              </p>
              <Button variant="danger" onClick={handleDeleteAccount}>
                Delete Account
              </Button>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
