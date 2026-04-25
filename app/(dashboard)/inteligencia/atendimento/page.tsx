"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatCard } from "@/components/dashboard/stat-card";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line,
} from "recharts";
import { Clock } from "lucide-react";
import { cn } from "@/lib/utils";

const days = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];
const hours = Array.from({ length: 24 }, (_, i) => `${String(i).padStart(2, "0")}h`);

// Heatmap: 7 days × 24 hours — random intensity 0-100
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
  backgroundColor: "oklch(0.11 0 0)",
  border: "1px solid oklch(0.22 0 0)",
  borderRadius: "8px",
  fontSize: 12,
};

function heatColor(value: number) {
  if (value === 0) return "bg-muted/20";
  if (value < 25) return "bg-blue-900/60";
  if (value < 50) return "bg-blue-700/70";
  if (value < 75) return "bg-blue-500/80";
  return "bg-blue-400";
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
      <Card className="bg-card border-border">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold">Mapa de calor — Hora × Dia da semana</CardTitle>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <div className="flex gap-1 min-w-max">
            {/* Day labels */}
            <div className="flex flex-col gap-0.5 pt-6">
              {days.map((d) => (
                <div key={d} className="h-5 w-8 flex items-center text-xs text-muted-foreground">{d}</div>
              ))}
            </div>
            {/* Grid */}
            <div>
              <div className="flex gap-0.5 mb-0.5">
                {hours.map((h) => (
                  <div key={h} className="w-5 text-xs text-muted-foreground text-center" style={{ fontSize: 9 }}>{h}</div>
                ))}
              </div>
              {heatmapData.map((row, di) => (
                <div key={di} className="flex gap-0.5 mb-0.5">
                  {row.map((val, hi) => (
                    <div
                      key={hi}
                      title={`${days[di]} ${hours[hi]}: ${val} atendimentos`}
                      className={cn("w-5 h-5 rounded-sm transition-colors cursor-default", heatColor(val))}
                    />
                  ))}
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Abandono por fase */}
        <Card className="bg-card border-border">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold">Taxa de abandono por fase</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={abandonData} margin={{ left: 0, right: 10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.22 0 0)" />
                <XAxis dataKey="fase" tick={{ fontSize: 11, fill: "oklch(0.635 0 0)" }} tickLine={false} axisLine={false} />
                <YAxis tick={{ fontSize: 11, fill: "oklch(0.635 0 0)" }} tickLine={false} axisLine={false} tickFormatter={(v) => `${v}%`} />
                <Tooltip contentStyle={tooltipStyle} formatter={(v) => [`${Number(v)}%`, "Abandono"]} />
                <Bar dataKey="pct" fill="#f59e0b" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Tempo médio ao longo do tempo */}
        <Card className="bg-card border-border">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold">Tempo médio de resposta (segundos)</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={responseTimeData} margin={{ left: 0, right: 10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.22 0 0)" />
                <XAxis dataKey="dia" tick={{ fontSize: 11, fill: "oklch(0.635 0 0)" }} tickLine={false} axisLine={false} interval={4} />
                <YAxis tick={{ fontSize: 11, fill: "oklch(0.635 0 0)" }} tickLine={false} axisLine={false} />
                <Tooltip contentStyle={tooltipStyle} formatter={(v) => [`${Number(v)}s`, "Resposta"]} />
                <Line type="monotone" dataKey="segundos" stroke="#6366f1" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
