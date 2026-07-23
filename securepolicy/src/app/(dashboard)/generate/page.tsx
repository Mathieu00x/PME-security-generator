"use client";
import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ChevronRight, ChevronLeft, Lock, HardDrive, AlertTriangle, Monitor, Wifi, Sparkles, ClipboardCheck, Radar } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { AttackSurfaceReport, PolicyType } from "@/types";
import { POLICY_QUESTIONS, GENERATION_REASONS } from "@/lib/prompts";
import { createClient } from "@/lib/supabase/client";
import { useLanguage } from "@/contexts/LanguageContext";
import toast from "react-hot-toast";

const POLICY_TYPES: {
  type: PolicyType;
  labelKey: string;
  descKey: string;
  icon: React.ReactNode;
}[] = [
  { type: "password", labelKey: "scan.policy.password.label", descKey: "generate.policy.password.desc", icon: <Lock size={22} /> },
  { type: "backup", labelKey: "scan.policy.backup.label", descKey: "generate.policy.backup.desc", icon: <HardDrive size={22} /> },
  { type: "incident-response", labelKey: "scan.policy.incidentResponse.label", descKey: "generate.policy.incidentResponse.desc", icon: <AlertTriangle size={22} /> },
  { type: "acceptable-use", labelKey: "scan.policy.acceptableUse.label", descKey: "generate.policy.acceptableUse.desc", icon: <Monitor size={22} /> },
  { type: "remote-work", labelKey: "scan.policy.remoteWork.label", descKey: "generate.policy.remoteWork.desc", icon: <Wifi size={22} /> },
];

export default function GeneratePage() {
  return (
    <Suspense fallback={null}>
      <GeneratePageInner />
    </Suspense>
  );
}

const KNOWN_POLICY_TYPES: PolicyType[] = ["password", "backup", "incident-response", "acceptable-use", "remote-work"];

function GeneratePageInner() {
  const { t } = useLanguage();
  const router = useRouter();
  const searchParams = useSearchParams();
  const regenerateId = searchParams.get("regenerate");
  const typeParam = searchParams.get("type");
  const fromScan = searchParams.get("from") === "scan";
  const scanId = searchParams.get("scanId");
  const prefilledType = !regenerateId && typeParam && KNOWN_POLICY_TYPES.includes(typeParam as PolicyType)
    ? (typeParam as PolicyType)
    : null;

  const [step, setStep] = useState<"select" | "why" | "questionnaire" | "generating" | "loading">(
    regenerateId ? "loading" : prefilledType ? "why" : "select"
  );
  const [policyId, setPolicyId] = useState<string | null>(null);
  const [selectedType, setSelectedType] = useState<PolicyType | null>(prefilledType);
  const [generationReason, setGenerationReason] = useState<string>("");
  const [currentQ, setCurrentQ] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [generating, setGenerating] = useState(false);

  const questions = selectedType ? POLICY_QUESTIONS[selectedType] : [];
  const progress = questions.length > 0 ? ((currentQ) / questions.length) * 100 : 0;

  useEffect(() => {
    if (!regenerateId) return;

    async function loadForRegeneration(id: string) {
      const supabase = createClient();
      const { data: policy } = await supabase
        .from("policies")
        .select("id, type, answers, generation_reason")
        .eq("id", id)
        .single();

      if (!policy) {
        toast.error(t("generate.policyNotFound"));
        setStep("select");
        return;
      }

      setPolicyId(policy.id);
      setSelectedType(policy.type as PolicyType);
      setAnswers((policy.answers as Record<string, string>) || {});
      setGenerationReason(policy.generation_reason || "internal");
      setCurrentQ(0);
      setStep("questionnaire");
    }

    loadForRegeneration(regenerateId);
  }, [regenerateId]);

  // Coming from a scan: prefill a few questionnaire answers that the scan
  // findings already answer, so the user doesn't have to re-state them.
  useEffect(() => {
    if (!scanId || !prefilledType) return;

    async function loadFromScan(id: string, type: PolicyType) {
      const supabase = createClient();
      const { data: report } = await supabase
        .from("attack_surface_reports")
        .select("*")
        .eq("id", id)
        .single();

      if (!report) return;
      const scan = report as AttackSurfaceReport;
      const prefill: Record<string, string> = {};

      if (scan.emails_compromis.compromisedCount > 0) {
        if (type === "password") prefill.mfa_required = "No";
        if (type === "incident-response") prefill.previous_incidents = "Yes";
      }
      if ((!scan.ssl.hasSSL || scan.ssl.expired) && type === "remote-work") {
        prefill.vpn = "No";
      }

      if (Object.keys(prefill).length > 0) {
        setAnswers((prev) => ({ ...prefill, ...prev }));
      }
    }

    loadFromScan(scanId, prefilledType);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scanId, prefilledType]);

  function handleSelectType(type: PolicyType) {
    setSelectedType(type);
    setStep("why");
    setCurrentQ(0);
    setAnswers({});
    setGenerationReason("");
  }

  function handleAnswer(value: string) {
    if (!selectedType) return;
    const q = questions[currentQ];
    setAnswers((prev) => ({ ...prev, [q.id]: value }));
  }

  function handleNext() {
    if (currentQ < questions.length - 1) {
      setCurrentQ((c) => c + 1);
    } else {
      handleGenerate();
    }
  }

  async function handleGenerate() {
    if (!selectedType) return;
    setGenerating(true);
    setStep("generating");

    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ policyType: selectedType, answers, generationReason, policyId, scanId }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || t("generate.generationFailed"));
      }

      const { policyId: newPolicyId } = await res.json();
      router.push(`/policies/${newPolicyId}`);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : t("generate.genericError");
      toast.error(message);
      setStep("questionnaire");
      setGenerating(false);
    }
  }

  if (step === "loading") {
    return (
      <div className="max-w-lg mx-auto flex flex-col items-center justify-center min-h-[60vh] text-center">
        <div className="w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center mb-6">
          <Sparkles size={28} className="text-blue-600 animate-pulse" />
        </div>
        <h2 className="text-xl font-bold text-gray-900 mb-2">{t("generate.loadingPolicy")}</h2>
      </div>
    );
  }

  if (step === "generating") {
    return (
      <div className="max-w-lg mx-auto flex flex-col items-center justify-center min-h-[60vh] text-center">
        <div className="w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center mb-6">
          <Sparkles size={28} className="text-blue-600 animate-pulse" />
        </div>
        <h2 className="text-xl font-bold text-gray-900 mb-2">{t("generate.generatingTitle")}</h2>
        <p className="text-gray-500 text-sm">
          {t("generate.generatingDesc", {
            type: t(POLICY_TYPES.find((p) => p.type === selectedType)?.labelKey ?? "").toLowerCase(),
          })}
        </p>
        <div className="w-48 h-1.5 bg-gray-100 rounded-full mt-8 overflow-hidden">
          <div className="h-full bg-blue-600 rounded-full animate-[loading_2s_ease-in-out_infinite]" style={{ width: "60%" }} />
        </div>
        <p className="text-xs text-gray-400 mt-3">{t("generate.generatingTime")}</p>
      </div>
    );
  }

  const scanBanner = fromScan && (
    <div className="flex items-start gap-2.5 mb-4 p-3 bg-blue-50 border border-blue-100 rounded-lg">
      <Radar size={15} className="text-blue-600 flex-shrink-0 mt-0.5" />
      <p className="text-xs text-blue-800">{t("generate.scanBanner")}</p>
    </div>
  );

  if (step === "why" && selectedType) {
    const selectedLabel = t(POLICY_TYPES.find((p) => p.type === selectedType)?.labelKey ?? "");
    return (
      <div className="max-w-xl mx-auto">
        {scanBanner}
        <Card>
          <div className="flex items-center gap-2 mb-1">
            <ClipboardCheck size={16} className="text-blue-600" />
            <p className="text-xs font-medium text-blue-600 uppercase tracking-wide">
              {selectedLabel}
            </p>
          </div>
          <h2 className="text-lg font-semibold text-gray-900 mb-2">{t("generate.why.title")}</h2>
          <p className="text-sm text-gray-500 mb-6">{t("generate.why.subtitle")}</p>

          <div className="flex flex-col gap-2">
            {GENERATION_REASONS.map((r) => (
              <label
                key={r.value}
                className={`flex items-center gap-3 p-3.5 rounded-lg border cursor-pointer transition-colors ${
                  generationReason === r.value
                    ? "border-blue-600 bg-blue-50"
                    : "border-gray-200 hover:border-gray-300 hover:bg-gray-50"
                }`}
              >
                <input
                  type="radio"
                  name="generationReason"
                  value={r.value}
                  checked={generationReason === r.value}
                  onChange={() => setGenerationReason(r.value)}
                  className="accent-blue-600"
                />
                <span className="text-sm text-gray-800">{t(r.labelKey)}</span>
              </label>
            ))}
          </div>

          <div className="flex items-center justify-between mt-8">
            <Button variant="outline" onClick={() => setStep("select")}>
              <ChevronLeft size={16} />
              {t("generate.back")}
            </Button>
            <Button onClick={() => setStep("questionnaire")} disabled={!generationReason}>
              {t("generate.continue")} <ChevronRight size={16} />
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  if (step === "questionnaire" && selectedType) {
    const q = questions[currentQ];
    const currentAnswer = answers[q.id] || "";

    return (
      <div className="max-w-xl mx-auto">
        {scanBanner}
        <div className="mb-6">
          <div className="flex items-center justify-between text-xs text-gray-500 mb-2">
            <span>{t("generate.stepOf", { current: currentQ + 1, total: questions.length })}</span>
            <span>{Math.round(progress)}%</span>
          </div>
          <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-blue-600 rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        <Card>
          <p className="text-xs font-medium text-blue-600 uppercase tracking-wide mb-3">
            {t(POLICY_TYPES.find((p) => p.type === selectedType)?.labelKey ?? "")}
          </p>
          <h2 className="text-lg font-semibold text-gray-900 mb-6">{q.question}</h2>

          {(q.type === "radio" || q.type === "select") && q.options && (
            <div className="flex flex-col gap-2">
              {q.options.map((opt) => (
                <label
                  key={opt}
                  className={`flex items-center gap-3 p-3.5 rounded-lg border cursor-pointer transition-colors ${
                    currentAnswer === opt
                      ? "border-blue-600 bg-blue-50"
                      : "border-gray-200 hover:border-gray-300 hover:bg-gray-50"
                  }`}
                >
                  <input
                    type="radio"
                    name={q.id}
                    value={opt}
                    checked={currentAnswer === opt}
                    onChange={() => handleAnswer(opt)}
                    className="accent-blue-600"
                  />
                  <span className="text-sm text-gray-800">{opt}</span>
                </label>
              ))}
            </div>
          )}

          {q.type === "text" && (
            <input
              type="text"
              value={currentAnswer}
              onChange={(e) => handleAnswer(e.target.value)}
              placeholder={t("generate.answerPlaceholder")}
              className="w-full px-3 py-2.5 text-sm rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          )}

          <div className="flex items-center justify-between mt-8">
            <Button
              variant="outline"
              onClick={() => {
                if (currentQ === 0) {
                  setStep("why");
                } else {
                  setCurrentQ((c) => c - 1);
                }
              }}
            >
              <ChevronLeft size={16} />
              {t("generate.back")}
            </Button>
            <Button onClick={handleNext} disabled={!currentAnswer}>
              {currentQ < questions.length - 1 ? (
                <>{t("generate.next")} <ChevronRight size={16} /></>
              ) : (
                <>{policyId ? t("generate.regenerate") : t("generate.generate")} <Sparkles size={16} /></>
              )}
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">{t("generate.pageTitle")}</h1>
        <p className="text-gray-500 text-sm mt-1">{t("generate.pageSubtitle")}</p>
      </div>

      <div className="grid grid-cols-1 gap-3">
        {POLICY_TYPES.map(({ type, labelKey, descKey, icon }) => (
          <button
            key={type}
            onClick={() => handleSelectType(type)}
            className="flex items-center justify-between p-5 bg-white rounded-xl border border-gray-100 shadow-sm hover:border-blue-200 hover:shadow-md transition-all text-left group"
          >
            <div className="flex items-center gap-4">
              <div className="w-11 h-11 bg-blue-50 rounded-xl flex items-center justify-center text-blue-600 group-hover:bg-blue-100 transition-colors">
                {icon}
              </div>
              <div>
                <p className="font-semibold text-gray-900">{t(labelKey)}</p>
                <p className="text-sm text-gray-500 mt-0.5">{t(descKey)}</p>
              </div>
            </div>
            <ChevronRight size={18} className="text-gray-300 group-hover:text-blue-400 transition-colors" />
          </button>
        ))}
      </div>
    </div>
  );
}
