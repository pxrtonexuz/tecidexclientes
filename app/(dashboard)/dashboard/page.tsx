"use client";

import { useState } from "react";
import { PeriodFilter, type Period } from "@/components/dashboard/period-filter";
import { StatCard } from "@/components/dashboard/stat-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { MessageSquare, Clock, Activity, ShoppingCart, TrendingUp, DollarSign } from "lucide-react";
import { format, startOfMonth, endOfMonth } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";

type ChartMetric = "atendimentos" | "pedidos" | "faturamento";

// Placeholder data — replace with real Supabase queries
const mockChartData = Array.from({ length: 30 }, (_, i) => ({
  date: format(new Date(2025, 3, i + 1), "dd/MM", { locale: ptBR }),
  atendimentos: Math.floor(Math.random() * 30 + 10),
  pedidos: Math.floor(Math.random() * 15 + 3),
  faturamento: Math.floor(Math.random() * 8000 + 2000),
}));

const metricConfig: Record<ChartMetric, { label: string; color: string; prefix?: string }> = {
  atendimentos: { label: "Atendimentos", color: "#3b82f6" },
  pedidos: { label: "Pedidos", color: "#6366f1" },
  faturamento: { label: "Faturamento", color: "#10b981", prefix: "R$" },
};

export default function DashboardPage() {
  const [period, setPeriod] = useState<Period>({
    label: "Este mês",
    from: startOfMonth(new Date()),
    to: endOfMonth(new Date()),
  });
  const [metric, setMetric] = useState<ChartMetric>("atendimentos");
  const [agentOnline] = useState(true);

  const cfg = metricConfig[metric];

  return (
    <div className="p-6 space-y-6 min-h-screen">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Visão geral do desempenho do agente
          </p>
        </div>
        <PeriodFilter onChange={setPeriod} />
      </div>

      {/* Bloco 1 — Status do Agente */}
      <section className="space-y-3">
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
          Status do Agente
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-card border border-border rounded-xl p-5 flex items-center gap-4">
            <div
              className={cn(
                "w-10 h-10 rounded-full flex items-center justify-center shrink-0",
                agentOnline ? "bg-emerald-500/15" : "bg-destructive/15"
              )}
            >
              <Activity
                className={cn(
                  "w-5 h-5",
                  agentOnline ? "text-emerald-400" : "text-destructive"
                )}
              />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Status</p>
              <p
                className={cn(
                  "text-lg font-semibold",
                  agentOnline ? "text-emerald-400" : "text-destructive"
                )}
              >
                {agentOnline ? "Ativo" : "Inativo"}
              </p>
            </div>
            <div
              className={cn(
                "ml-auto w-2.5 h-2.5 rounded-full shrink-0 animate-pulse",
                agentOnline ? "bg-emerald-400" : "bg-destructive"
              )}
            />
          </div>

          <StatCard
            title="Conversas hoje"
            value={47}
            icon={<MessageSquare className="w-4 h-4" />}
          />
          <StatCard
            title="Tempo médio de resposta"
            value="1m 23s"
            suffix="hoje"
            icon={<Clock className="w-4 h-4" />}
          />
        </div>
      </section>

      {/* Bloco 2 — Resultado Comercial */}
      <section className="space-y-3">
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
          Resultado Comercial
          <span className="ml-2 text-xs font-normal normal-case">{period.label}</span>
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-5 gap-4">
          <StatCard
            title="Total de atendimentos"
            value={312}
            change={8}
            icon={<MessageSquare className="w-4 h-4" />}
          />
          <StatCard
            title="Pedidos fechados"
            value={87}
            change={12}
            icon={<ShoppingCart className="w-4 h-4" />}
          />
          <StatCard
            title="Taxa de conversão"
            value="27.9%"
            change={3}
            icon={<TrendingUp className="w-4 h-4" />}
          />
          <StatCard
            title="Faturamento gerado"
            value="R$ 94.200"
            change={15}
            icon={<DollarSign className="w-4 h-4" />}
          />
          <StatCard
            title="Ticket médio"
            value="R$ 1.083"
            change={2}
            icon={<DollarSign className="w-4 h-4" />}
          />
        </div>
      </section>

      {/* Bloco 3 — Gráfico de Evolução */}
      <section>
        <Card className="bg-card border-border">
          <CardHeader className="flex flex-row items-center justify-between pb-4">
            <CardTitle className="text-base font-semibold">Evolução</CardTitle>
            <div className="flex gap-2">
              {(Object.keys(metricConfig) as ChartMetric[]).map((m) => (
                <Button
                  key={m}
                  variant={metric === m ? "default" : "ghost"}
                  size="sm"
                  className={cn(
                    "text-xs cursor-pointer",
                    metric !== m && "text-muted-foreground hover:text-foreground"
                  )}
                  onClick={() => setMetric(m)}
                >
                  {metricConfig[m].label}
                </Button>
              ))}
            </div>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={280}>
              <LineChart data={mockChartData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.22 0 0)" />
                <XAxis
                  dataKey="date"
                  tick={{ fontSize: 11, fill: "oklch(0.635 0 0)" }}
                  tickLine={false}
                  axisLine={false}
                  interval={4}
                />
                <YAxis
                  tick={{ fontSize: 11, fill: "oklch(0.635 0 0)" }}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(v) =>
                    cfg.prefix ? `${cfg.prefix} ${(v / 1000).toFixed(0)}k` : String(v)
                  }
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "oklch(0.11 0 0)",
                    border: "1px solid oklch(0.22 0 0)",
                    borderRadius: "8px",
                    fontSize: 12,
                  }}
                  labelStyle={{ color: "oklch(0.635 0 0)" }}
                  formatter={(value) => {
                    const v = Number(value);
                    return cfg.prefix
                      ? [`R$ ${v.toLocaleString("pt-BR")}`, cfg.label]
                      : [v, cfg.label];
                  }}
                />
                <Line
                  type="monotone"
                  dataKey={metric}
                  stroke={cfg.color}
                  strokeWidth={2}
                  dot={false}
                  activeDot={{ r: 4, fill: cfg.color }}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
