export function RiskGauge({ score }: { score: number }) {
  const color = score >= 70 ? "#22c55e" : score >= 40 ? "#f59e0b" : "#ef4444";
  const label = score >= 70 ? "Risque FAIBLE" : score >= 40 ? "Risque MOYEN" : "Risque ÉLEVÉ";
  const r = 56;
  const circumference = 2 * Math.PI * r;
  const offset = circumference - (score / 100) * circumference;

  return (
    <div className="flex flex-col items-center">
      <svg width="140" height="140" viewBox="0 0 140 140">
        <circle cx="70" cy="70" r={r} fill="none" stroke="#f1f5f9" strokeWidth="12" />
        <circle
          cx="70" cy="70" r={r} fill="none"
          stroke={color} strokeWidth="12"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          transform="rotate(-90 70 70)"
          style={{ transition: "stroke-dashoffset 1s ease" }}
        />
        <text x="70" y="65" textAnchor="middle" fill="#0f172a" fontSize="28" fontWeight="700">{score}</text>
        <text x="70" y="83" textAnchor="middle" fill="#94a3b8" fontSize="12">/100</text>
      </svg>
      <span style={{ color }} className="text-sm font-semibold mt-1">{label}</span>
    </div>
  );
}
