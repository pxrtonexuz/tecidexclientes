"use client";

import { StatCard } from "@/components/dashboard/stat-card";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line,
} from "recharts";
import { Clock } from "lucide-react";
import { cn } from "@/lib/utils";

const days = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];
const hours = Array.from({ length: 24 }, (_, i) => `${String(i).padStart(2, "0")}h`);

const heatmapData = Array.from({ length: 7 }, () =>
  Array.from({ length: 24 }, () => Math.floor(Math.random() * 100))
);

const abandonData = [
  { fase: "Apresentação", pct: 8 },
  { fase: "Tecido", pct: 14 },
  { fase: "Atributos", pct: 22 },
  { fase: "Confirmação", pct: 11 },
  { fase: "Handoff", pct: 5 },
];

const responseTimeData = Array.from({ length: 30 }, (_, i) => ({
  dia: `${i + 1}/04`,
  segundos: Math.floor(Math.random() * 60 + 30),
}));

const tooltipStyle = {
  backgroundColor: "rgba(5, 12, 8, 0.92)",
  border: "1px solid rgba(5, 150, 105, 0.30)",
  borderRadius: "12px",
  fontSize: 12,
  backdropFilter: "blur(20px)",
};

const glassCard: React.CSSProperties = {
  background: "rgba(5, 150, 105, 0.06)",
  backdropFilter: "blur(28px) saturate(160%)",
  WebkitBackdropFilter: "blur(28px) saturate(160%)",
  border: "1px solid rgba(5, 150, 105, 0.22)",
  boxShadow: "0 8px 32px rgba(0, 0, 0, 0.3)",
  borderRadius: "22px",
};

const tickStyle = { fontSize: 11, fill: "rgba(160, 210, 185, 0.65)" };
const gridStroke = "rgba(5, 150, 105, 0.12)";

function heatColor(value: number) {
  if (value === 0) return "rgba(5, 150, 105, 0.05)";
  if (value < 25) return "rgba(5, 150, 105, 0.15)";
  if (value < 50) return "rgba(5, 150, 105, 0.30)";
  if (value < 75) return "rgba(16, 220, 140, 0.50)";
  return "rgba(16, 220, 140, 0.80)";
}

export default function AtendimentoPage() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-1 gap-4">
        <StatCard
          title="Tempo médio até handoff"
          value="14 min"
          suffix="média do período"
          icon={<Clock className="w-4 h-4" />}
        />
      </div>

      {/* Heatmap */}
      <div style={glassCard} className="p-5">
        <p className="text-sm font-semibold text-foreground mb-4">Mapa de calor — Hora × Dia da semana</p>
        <div className="overflow-x-auto">
          <div className="flex gap-1 min-w-max">
            <div className="flex flex-col gap-0.5 pt-6">
              {days.map((d) => (
                <div key={d} className="h-5 w-8 flex items-center text-xs" style={{ color: "rgba(160, 210, 185, 0.65)" }}>{d}</div>
              ))}
            </div>
            <div>
              <div className="flex gap-0.5 mb-0.5">
                {hours.map((h) => (
                  <div key={h} className="w-5 text-center" style={{ fontSize: 9, color: "rgba(160, 210, 185, 0.65)" }}>{h}</div>
                ))}
              </div>
              {heatmapData.map((row, di) => (
                <div key={di} className="flex gap-0.5 mb-0.5">
                  {row.map((val, hi) => (
                    <div
                      key={hi}
                      title={`${days[di]} ${hours[hi]}: ${val} atendimentos`}
                      className={cn("w-5 h-5 rounded-sm cursor-default transition-opacity")}
                      style={{ background: heatColor(val), border: "1px solid rgba(5, 150, 105, 0.10)" }}
                    />
                  ))}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Abandono por fase */}
        <div style={glassCard} className="p-5">
          <p className="text-sm font-semibold text-foreground mb-4">Taxa de abandono por fase</p>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={abandonData} margin={{ left: 0, right: 10 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} />
              <XAxis dataKey="fase" tick={tickStyle} tickLine={false} axisLine={false} />
              <YAxis tick={tickStyle} tickLine={false} axisLine={false} tickFormatter={(v) => `${v}%`} />
              <Tooltip contentStyle={tooltipStyle} cursor={{ fill: "rgba(5, 150, 105, 0.08)" }}
                formatter={(v) => [`${Number(v)}%`, "Abandono"]} />
              <Bar dataKey="pct" fill="#f59e0b" radius={[6, 6, 0, 0]}
                style={{ filter: "drop-shadow(0 0 5px rgba(245, 158, 11, 0.4))" }} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Tempo médio de resposta */}
        <div style={glassCard} className="p-5">
          <p className="text-sm font-semibold text-foreground mb-4">Tempo médio de resposta (segundos)</p>
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={responseTimeData} margin={{ left: 0, right: 10 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} />
              <XAxis dataKey="dia" tick={tickStyle} tickLine={false} axisLine={false} interval={4} />
              <YAxis tick={tickStyle} tickLine={false} axisLine={false} />
              <Tooltip contentStyle={tooltipStyle} formatter={(v) => [`${Number(v)}s`, "Resposta"]} />
              <Line type="monotone" dataKey="segundos" stroke="#10dc8c" strokeWidth={2} dot={false}
                activeDot={{ r: 4, fill: "#10dc8c", stroke: "rgba(16, 220, 140, 0.3)", strokeWidth: 4 }}
                style={{ filter: "drop-shadow(0 0 6px rgba(16, 220, 140, 0.5))" }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
