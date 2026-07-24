"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Check, Sparkles } from "lucide-react";
import { Logo } from "@/components/ui/Logo";
import { BillingInterval, Plan, Subscription } from "@/types";
import { useLanguage } from "@/contexts/LanguageContext";
import toast from "react-hot-toast";

const PLAN_BASE_INCLUDE_KEYS = ["plan.include.scan", "plan.include.score", "plan.include.aiPolicies", "plan.include.export"];

export function ChoosePlanClient({
  plans,
  currentSubscription,
}: {
  plans: Plan[];
  currentSubscription: Subscription | null;
}) {
  const router = useRouter();
  const { t } = useLanguage();
  const [interval, setInterval] = useState<BillingInterval>("monthly");
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null);

  const now = Date.now();
  // Paid plans (starter, pro, agency) are hidden while Stripe is in test
  // mode during the beta — change this back to show all plans (see git
  // history) once ready to accept real payments.
  const visiblePlans = plans.filter((p) => {
    if (p.id !== "beta") return false;
    return !p.beta_cutoff_at || new Date(p.beta_cutoff_at).getTime() > now;
  });

  async function handleSelect(plan: Plan) {
    setLoadingPlan(plan.id);
    try {
      if (plan.id === "beta") {
        const res = await fetch("/api/subscriptions", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ planId: plan.id, billingInterval: "monthly" }),
        });
        if (!res.ok) {
          const err = await res.json();
          throw new Error(err.error || t("plan.selectFailed"));
        }
        toast.success(t("plan.onPlan", { name: plan.name }));
        router.push("/dashboard");
        router.refresh();
        return;
      }

      const res = await fetch("/api/subscriptions/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ planId: plan.id, billingInterval: interval }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || t("plan.checkoutFailed"));
      }
      const { url } = await res.json();
      window.location.href = url;
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : t("plan.genericError");
      toast.error(message);
      setLoadingPlan(null);
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 py-16 px-6">
      <div className="max-w-5xl mx-auto">
        <div className="flex justify-center mb-8">
          <Logo size="lg" />
        </div>

        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            {currentSubscription ? t("plan.changeTitle") : t("plan.chooseTitle")}
          </h1>
          <p className="text-gray-500">
            {currentSubscription ? t("plan.changeSubtitle") : t("plan.chooseSubtitle")}
          </p>
        </div>

        {visiblePlans.some((p) => p.monthly_price_cents > 0) && (
          <div className="flex items-center justify-center gap-3 mb-10">
            <button
              onClick={() => setInterval("monthly")}
              className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${
                interval === "monthly" ? "bg-gray-900 text-white" : "text-gray-500 hover:text-gray-900"
              }`}
            >
              {t("plan.monthly")}
            </button>
            <button
              onClick={() => setInterval("annual")}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${
                interval === "annual" ? "bg-gray-900 text-white" : "text-gray-500 hover:text-gray-900"
              }`}
            >
              {t("plan.annual")}
              <span className="text-[10px] font-bold bg-green-100 text-green-700 px-1.5 py-0.5 rounded-full">
                {t("plan.twoMonthsFree")}
              </span>
            </button>
          </div>
        )}

        <div className="grid grid-cols-1 max-w-sm mx-auto gap-5">
          {visiblePlans.map((plan) => {
            const isCurrent = currentSubscription?.plan_id === plan.id;
            const isBeta = plan.id === "beta";
            const isPopular = plan.id === "pro";
            const monthlyEquivalent = plan.monthly_price_cents === 0
              ? 0
              : interval === "annual"
              ? plan.annual_price_cents / 12
              : plan.monthly_price_cents;

            return (
              <div
                key={plan.id}
                className={`relative flex flex-col rounded-2xl p-6 border ${
                  isPopular
                    ? "bg-gray-900 border-gray-900 text-white"
                    : isBeta
                    ? "bg-white border-2 border-dashed border-blue-300"
                    : "bg-white border-gray-200"
                }`}
              >
                {isPopular && (
                  <span className="absolute -top-3 left-6 bg-blue-600 text-white text-[10px] font-bold px-2.5 py-1 rounded-full">
                    {t("plan.mostPopular")}
                  </span>
                )}
                {isBeta && (
                  <span className="absolute -top-3 left-6 bg-blue-50 text-blue-700 text-[10px] font-bold px-2.5 py-1 rounded-full flex items-center gap-1">
                    <Sparkles size={10} /> {t("plan.limitedTime")}
                  </span>
                )}

                <p className={`text-sm font-semibold uppercase tracking-wide mb-1 ${isPopular ? "text-blue-300" : "text-gray-500"}`}>
                  {plan.name}
                </p>
                <p className={`text-xs mb-4 ${isPopular ? "text-gray-300" : "text-gray-400"}`}>
                  {t(`plan.tagline.${plan.id}`)}
                </p>

                <div className="mb-1 flex items-end gap-1">
                  <span className="text-3xl font-extrabold">
                    {monthlyEquivalent === 0 ? t("plan.free") : `$${Math.round(monthlyEquivalent / 100)}`}
                  </span>
                  {monthlyEquivalent > 0 && (
                    <span className={`text-sm mb-0.5 ${isPopular ? "text-gray-300" : "text-gray-400"}`}>{t("plan.perMonth")}</span>
                  )}
                </div>
                {!isBeta && interval === "annual" && (
                  <p className={`text-xs mb-4 ${isPopular ? "text-gray-300" : "text-gray-400"}`}>
                    {t("plan.billedPerYear", { amount: (plan.annual_price_cents / 100).toFixed(0) })}
                  </p>
                )}
                {(isBeta || interval === "monthly") && <div className="mb-4" />}

                <p className={`text-xs font-medium mb-3 ${isPopular ? "text-white" : "text-gray-700"}`}>
                  {plan.client_limit === null
                    ? t("plan.unlimitedClients")
                    : t(plan.client_limit === 1 ? "plan.clientCount.one" : "plan.clientCount.other", { count: plan.client_limit })}
                </p>

                <ul className="flex flex-col gap-2 mb-6 flex-1">
                  {PLAN_BASE_INCLUDE_KEYS.map((key) => (
                    <li key={key} className={`flex items-start gap-2 text-xs ${isPopular ? "text-gray-200" : "text-gray-600"}`}>
                      <Check size={13} className={`flex-shrink-0 mt-0.5 ${isPopular ? "text-blue-300" : "text-blue-600"}`} />
                      {t(key)}
                    </li>
                  ))}
                  {plan.features.map((f) => (
                    <li key={f} className={`flex items-start gap-2 text-xs font-medium ${isPopular ? "text-white" : "text-gray-800"}`}>
                      <Check size={13} className={`flex-shrink-0 mt-0.5 ${isPopular ? "text-blue-300" : "text-blue-600"}`} />
                      {t(`plan.feature.${f}`)}
                    </li>
                  ))}
                </ul>

                <button
                  onClick={() => handleSelect(plan)}
                  disabled={loadingPlan !== null || isCurrent}
                  className={`w-full py-2.5 rounded-xl text-sm font-semibold transition-colors disabled:cursor-not-allowed ${
                    isCurrent
                      ? "bg-gray-100 text-gray-400"
                      : isPopular
                      ? "bg-white text-gray-900 hover:bg-gray-100"
                      : "bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-60"
                  }`}
                >
                  {isCurrent ? t("plan.current") : loadingPlan === plan.id ? t("plan.saving") : isBeta ? t("plan.joinBeta") : t("plan.choose", { name: plan.name })}
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
