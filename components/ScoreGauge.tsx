"use client";

import { useEffect, useState } from "react";

type Props = {
  score: number;         // 0-100
  size?: number;         // px, défaut 80
  strokeWidth?: number;  // défaut 7
  showLabel?: boolean;   // défaut true
};

function scoreColor(score: number): string {
  if (score >= 80) return "#34A853"; // vert
  if (score >= 60) return "#1A73E8"; // bleu
  return "#9CA3AF";                  // gris
}

export default function ScoreGauge({
  score,
  size = 80,
  strokeWidth = 7,
  showLabel = true,
}: Props) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const r = (size - strokeWidth * 2) / 2;
  const cx = size / 2;
  const cy = size / 2;
  const circ = 2 * Math.PI * r;
  const clamped = Math.min(100, Math.max(0, score));
  // Before mount (SSR): ring vide → dashoffset = circ (invisible)
  // After mount: animate vers la valeur réelle
  const dashOffset = mounted ? circ - (clamped / 100) * circ : circ;
  const color = scoreColor(score);
  const fontSize = Math.max(10, Math.round(size * 0.2));

  return (
    <div
      className="relative flex items-center justify-center"
      style={{ width: size, height: size }}
    >
      <svg
        width={size}
        height={size}
        className="absolute inset-0"
        style={{ transform: "rotate(-90deg)" }}
      >
        {/* Piste grise */}
        <circle
          cx={cx}
          cy={cy}
          r={r}
          fill="none"
          stroke="#E5E7EB"
          strokeWidth={strokeWidth}
        />
        {/* Arc coloré animé */}
        <circle
          cx={cx}
          cy={cy}
          r={r}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circ}
          strokeDashoffset={dashOffset}
          style={{
            transition: "stroke-dashoffset 0.85s cubic-bezier(0.4,0,0.2,1), stroke 0.4s",
          }}
        />
      </svg>
      {showLabel && (
        <span
          className="relative z-10 font-bold tabular-nums leading-none"
          style={{ color, fontSize }}
        >
          {score}%
        </span>
      )}
    </div>
  );
}
