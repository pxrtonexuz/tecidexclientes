"use client";

import { cn } from "@/lib/utils";

type ScoreComponent = {
  label: string;
  score: number;
  maxScore: number;
  detail: string;
};

function GaugeSvg({ score }: { score: number }) {
  const radius = 80;
  const cx = 100;
  const cy = 100;
  // Semi-circle: from 180° to 0° (left to right, bottom arc)
  const startAngle = Math.PI; // 180°
  const endAngle = 0;         // 0°
  const totalArc = Math.PI;   // 180°

  function polarToXY(angle: number) {
    return {
      x: cx + radius * Math.cos(angle),
      y: cy + radius * Math.sin(angle),
    };
  }

  const bgStart = polarToXY(startAngle);
  const bgEnd = polarToXY(endAngle);

  const scoreAngle = startAngle - (score / 100) * totalArc;
  const scoreEnd = polarToXY(scoreAngle);
  const largeArc = score > 50 ? 1 : 0;
  const scorePath = `M ${bgStart.x} ${bgStart.y} A ${radius} ${radius} 0 ${largeArc} 1 ${scoreEnd.x} ${scoreEnd.y}`;

  const color = score <= 40 ? "#ef4444" : score <= 70 ? "#eab308" : "#22c55e";

  // Needle
  const needleAngle = startAngle - (score / 100) * totalArc;
  const needleTip = polarToXY(needleAngle);

  return (
    <svg viewBox="0 0 200 110" className="w-48 h-auto">
      {/* Track zones */}
      <path
        d={`M ${polarToXY(startAngle).x} ${polarToXY(startAngle).y} A ${radius} ${radius} 0 0 1 ${polarToXY(startAngle - 0.4 * totalArc).x} ${polarToXY(startAngle - 0.4 * totalArc).y}`}
        fill="none" stroke="#ef4444" strokeWidth="12" strokeLinecap="round" opacity="0.2"
      />
      <path
        d={`M ${polarToXY(startAngle - 0.4 * totalArc).x} ${polarToXY(startAngle - 0.4 * totalArc).y} A ${radius} ${radius} 0 0 1 ${polarToXY(startAngle - 0.7 * totalArc).x} ${polarToXY(startAngle - 0.7 * totalArc).y}`}
        fill="none" stroke="#eab308" strokeWidth="12" strokeLinecap="round" opacity="0.2"
      />
      <path
        d={`M ${polarToXY(startAngle - 0.7 * totalArc).x} ${polarToXY(startAngle - 0.7 * totalArc).y} A ${radius} ${radius} 0 0 1 ${bgEnd.x} ${bgEnd.y}`}
        fill="none" stroke="#22c55e" strokeWidth="12" strokeLinecap="round" opacity="0.2"
      />
      {/* Score arc */}
      {score > 0 && (
        <path d={scorePath} fill="none" stroke={color} strokeWidth="12" strokeLinecap="round" />
      )}
      {/* Needle */}
      <line x1={cx} y1={cy} x2={needleTip.x} y2={needleTip.y} stroke={color} strokeWidth="3" strokeLinecap="round" />
      <circle cx={cx} cy={cy} r="6" fill={color} />
      {/* Score text */}
      <text x={cx} y={cy + 22} textAnchor="middle" className="fill-foreground" fontSize="24" fontWeight="700" fill="white">
        {score}
      </text>
      <text x={cx} y={cy + 36} textAnchor="middle" fontSize="9" fill="rgba(255,255,255,0.5)">
        /100
      </text>
    </svg>
  );
}

export function HealthGauge({ score, components }: { score: number; components: ScoreComponent[] }) {
  const status = score <= 40 ? { label: "Crítico", color: "text-red-400" } : score <= 70 ? { label: "Atenção", color: "text-yellow-400" } : { label: "Saudável", color: "text-[#39d98a]" };

  return (
    <div className="tec-panel p-6 space-y-6">
      <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Termômetro de Saúde</h3>
      <div className="flex flex-col sm:flex-row items-center gap-8">
        <div className="flex flex-col items-center gap-2">
          <GaugeSvg score={score} />
          <p className={cn("text-sm font-semibold", status.color)}>{status.label}</p>
        </div>
        <div className="flex-1 space-y-3 w-full">
          {components.map((c) => {
            const pct = (c.score / c.maxScore) * 100;
            const barColor = pct <= 40 ? "bg-red-500" : pct <= 70 ? "bg-yellow-500" : "bg-[#39d98a]";
            return (
              <div key={c.label} className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">{c.label}</span>
                  <span className="font-medium text-foreground">{c.score}/{c.maxScore}pts</span>
                </div>
                <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                  <div
                    className={cn("h-full rounded-full transition-all duration-500", barColor)}
                    style={{ width: `${pct}%` }}
                  />
                </div>
                <p className="text-xs text-muted-foreground">{c.detail}</p>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
