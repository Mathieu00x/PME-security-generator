"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronRight, ChevronLeft, Lock, HardDrive, AlertTriangle, Monitor, Wifi, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { PolicyType } from "@/types";
import { POLICY_QUESTIONS } from "@/lib/prompts";
import toast from "react-hot-toast";

const POLICY_TYPES: {
  type: PolicyType;
  label: string;
  description: string;
  icon: React.ReactNode;
}[] = [
  { type: "password", label: "Password Policy", description: "Create a strong password policy for your team.", icon: <Lock size={22} /> },
  { type: "backup", label: "Backup Policy", description: "Define your data backup rules and recovery objectives.", icon: <HardDrive size={22} /> },
  { type: "incident-response", label: "Incident Response Plan", description: "Prepare your team for security incidents.", icon: <AlertTriangle size={22} /> },
  { type: "acceptable-use", label: "Acceptable Use Policy", description: "Set the rules for acceptable technology usage.", icon: <Monitor size={22} /> },
  { type: "remote-work", label: "Remote Work Policy", description: "Secure your remote workforce effectively.", icon: <Wifi size={22} /> },
];

export default function GeneratePage() {
  const router = useRouter();
  const [step, setStep] = useState<"select" | "questionnaire" | "generating">("select");
  const [selectedType, setSelectedType] = useState<PolicyType | null>(null);
  const [currentQ, setCurrentQ] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [generating, setGenerating] = useState(false);

  const questions = selectedType ? POLICY_QUESTIONS[selectedType] : [];
  const progress = questions.length > 0 ? ((currentQ) / questions.length) * 100 : 0;

  function handleSelectType(type: PolicyType) {
    setSelectedType(type);
    setStep("questionnaire");
    setCurrentQ(0);
    setAnswers({});
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
        body: JSON.stringify({ policyType: selectedType, answers }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Generation failed");
      }

      const { policyId } = await res.json();
      router.push(`/policies/${policyId}`);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Something went wrong.";
      toast.error(message);
      setStep("questionnaire");
      setGenerating(false);
    }
  }

  if (step === "generating") {
    return (
      <div className="max-w-lg mx-auto flex flex-col items-center justify-center min-h-[60vh] text-center">
        <div className="w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center mb-6">
          <Sparkles size={28} className="text-blue-600 animate-pulse" />
        </div>
        <h2 className="text-xl font-bold text-gray-900 mb-2">Generating your policy…</h2>
        <p className="text-gray-500 text-sm">
          Our AI is crafting a professional{" "}
          {POLICY_TYPES.find((p) => p.type === selectedType)?.label.toLowerCase()} tailored to your business.
        </p>
        <div className="w-48 h-1.5 bg-gray-100 rounded-full mt-8 overflow-hidden">
          <div className="h-full bg-blue-600 rounded-full animate-[loading_2s_ease-in-out_infinite]" style={{ width: "60%" }} />
        </div>
        <p className="text-xs text-gray-400 mt-3">This usually takes 15–30 seconds</p>
      </div>
    );
  }

  if (step === "questionnaire" && selectedType) {
    const q = questions[currentQ];
    const currentAnswer = answers[q.id] || "";

    return (
      <div className="max-w-xl mx-auto">
        <div className="mb-6">
          <div className="flex items-center justify-between text-xs text-gray-500 mb-2">
            <span>Step {currentQ + 1} of {questions.length}</span>
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
            {POLICY_TYPES.find((p) => p.type === selectedType)?.label}
          </p>
          <h2 className="text-lg font-semibold text-gray-900 mb-6">{q.question}</h2>

          {q.type === "radio" && q.options && (
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

          {q.type === "select" && q.options && (
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
              placeholder="Type your answer…"
              className="w-full px-3 py-2.5 text-sm rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          )}

          <div className="flex items-center justify-between mt-8">
            <Button
              variant="outline"
              onClick={() => {
                if (currentQ === 0) {
                  setStep("select");
                } else {
                  setCurrentQ((c) => c - 1);
                }
              }}
            >
              <ChevronLeft size={16} />
              Back
            </Button>
            <Button onClick={handleNext} disabled={!currentAnswer}>
              {currentQ < questions.length - 1 ? (
                <>Next <ChevronRight size={16} /></>
              ) : (
                <>Generate <Sparkles size={16} /></>
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
        <h1 className="text-2xl font-bold text-gray-900">Generate Policy</h1>
        <p className="text-gray-500 text-sm mt-1">Choose the type of policy you want to generate.</p>
      </div>

      <div className="grid grid-cols-1 gap-3">
        {POLICY_TYPES.map(({ type, label, description, icon }) => (
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
                <p className="font-semibold text-gray-900">{label}</p>
                <p className="text-sm text-gray-500 mt-0.5">{description}</p>
              </div>
            </div>
            <ChevronRight size={18} className="text-gray-300 group-hover:text-blue-400 transition-colors" />
          </button>
        ))}
      </div>
    </div>
  );
}
