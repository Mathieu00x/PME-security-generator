export function ScoreSparkline({ scores }: { scores: number[] }) {
  const w = 120;
  const h = 32;
  const pad = 4;

  if (scores.length === 0) return null;

  const points = scores.map((s, i) => {
    const x = scores.length === 1 ? w / 2 : (i / (scores.length - 1)) * (w - pad * 2) + pad;
    const y = h - pad - (Math.max(0, Math.min(100, s)) / 100) * (h - pad * 2);
    return [x, y] as const;
  });

  const path = points.map(([x, y], i) => `${i === 0 ? "M" : "L"}${x.toFixed(1)},${y.toFixed(1)}`).join(" ");
  const [lastX, lastY] = points[points.length - 1];
  const last = scores[scores.length - 1];
  const dotColor = last >= 70 ? "#22c55e" : last >= 40 ? "#f59e0b" : "#ef4444";

  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`}>
      <path d={path} fill="none" stroke="#93c5fd" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
      <circle cx={lastX} cy={lastY} r={4} fill={dotColor} stroke="#ffffff" strokeWidth={2} />
    </svg>
  );
}
