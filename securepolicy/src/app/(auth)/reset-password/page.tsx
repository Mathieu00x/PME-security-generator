"use client";
import { useState } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Logo } from "@/components/ui/Logo";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { createClient } from "@/lib/supabase/client";
import { useLanguage } from "@/contexts/LanguageContext";
import toast from "react-hot-toast";

export default function ResetPasswordPage() {
  const { t } = useLanguage();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  async function handleReset(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const supabase = createClient();
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/update-password`,
    });
    if (error) {
      toast.error(error.message);
    } else {
      setSent(true);
    }
    setLoading(false);
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <Logo size="lg" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">{t("auth.reset.title")}</h1>
          <p className="text-gray-500 text-sm mt-1">
            {sent ? t("auth.reset.checkInbox") : t("auth.reset.subtitleDefault")}
          </p>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8">
          {sent ? (
            <div className="text-center">
              <div className="w-14 h-14 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-7 h-7 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>
              <p className="text-sm text-gray-600 mb-1">{t("auth.reset.sentTo", { email })}</p>
              <p className="text-gray-400 text-xs mb-4">{t("auth.checkSpamNote")}</p>
              <Button variant="outline" onClick={() => setSent(false)} className="w-full">
                {t("auth.reset.resend")}
              </Button>
            </div>
          ) : (
            <form onSubmit={handleReset} className="flex flex-col gap-4">
              <Input
                id="email"
                type="email"
                label={t("auth.email")}
                placeholder="name@company.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
              <Button type="submit" loading={loading} size="lg" className="w-full">
                {t("auth.reset.sendLink")}
              </Button>
            </form>
          )}
        </div>

        <Link
          href="/login"
          className="flex items-center justify-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 mt-6"
        >
          <ArrowLeft size={14} />
          {t("auth.backToSignIn")}
        </Link>
      </div>
    </div>
  );
}
