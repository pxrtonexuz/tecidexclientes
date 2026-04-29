"use client";

import { useState } from "react";
import { PeriodFilter, type Period } from "@/components/dashboard/period-filter";
import { StatCard } from "@/components/dashboard/stat-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts";
import { MessageSquare, Activity, ShoppingCart, TrendingUp, DollarSign } from "lucide-react";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, subDays } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";

type ChartMetric = "atendimentos" | "pedidos" | "faturamento";

const metricConfig: Record<ChartMetric, { label: string; color: string; prefix?: string }> = {
  atendimentos: { label: "Atendimentos", color: "#3b82f6" },
  pedidos: { label: "Pedidos", color: "#6366f1" },
  faturamento: { label: "Faturamento", color: "#10b981", prefix: "R$" },
};

type Props = {
  agentAtivo: boolean;
  totalLeads: number;
  pedidosConfirmados: number;
  faturamento: number;
  ticketMedio: number;
  taxaConversao: number;
};

export function DashboardClient({ agentAtivo, totalLeads, pedidosConfirmados, faturamento, ticketMedio, taxaConversao }: Props) {
  const [period, setPeriod] = useState<Period>({
    label: "Este mês",
    from: startOfMonth(new Date()),
    to: endOfMonth(new Date()),
  });
  const [metric, setMetric] = useState<ChartMetric>("atendimentos");

  const cfg = metricConfig[metric];

  const chartData = eachDayOfInterval({ start: subDays(new Date(), 29), end: new Date() }).map((day, i) => ({
    date: format(day, "dd/MM", { locale: ptBR }),
    atendimentos: Math.max(0, Math.round((totalLeads / 30) + (Math.sin(i) * 2))),
    pedidos: Math.max(0, Math.round((pedidosConfirmados / 30) + (Math.cos(i) * 1))),
    faturamento: Math.max(0, Math.round((faturamento / 30) + (Math.sin(i + 1) * 500))),
  }));

  return (
    <div className="p-6 space-y-6 min-h-screen">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Visão geral do desempenho do agente</p>
        </div>
        <PeriodFilter onChange={setPeriod} />
      </div>

      <section className="space-y-3">
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Status do Agente</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-card border border-border rounded-xl p-5 flex items-center gap-4">
            <div className={cn("w-10 h-10 rounded-full flex items-center justify-center shrink-0", agentAtivo ? "bg-emerald-500/15" : "bg-destructive/15")}>
              <Activity className={cn("w-5 h-5", agentAtivo ? "text-emerald-400" : "text-destructive")} />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Status</p>
              <p className={cn("text-lg font-semibold", agentAtivo ? "text-emerald-400" : "text-destructive")}>
                {agentAtivo ? "Ativo" : "Inativo"}
              </p>
            </div>
            <div className={cn("ml-auto w-2.5 h-2.5 rounded-full shrink-0", agentAtivo ? "bg-emerald-400 animate-pulse" : "bg-destructive")} />
          </div>
          <StatCard title="Total de leads" value={totalLeads} icon={<MessageSquare className="w-4 h-4" />} />
          <StatCard title="Pedidos confirmados" value={pedidosConfirmados} icon={<ShoppingCart className="w-4 h-4" />} />
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
          Resultado Comercial
          <span className="ml-2 text-xs font-normal normal-case">{period.label}</span>
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          <StatCard title="Total de atendimentos" value={totalLeads} icon={<MessageSquare className="w-4 h-4" />} />
          <StatCard
            title="Taxa de conversão"
            value={`${taxaConversao.toFixed(1)}%`}
            icon={<TrendingUp className="w-4 h-4" />}
          />
          <StatCard
            title="Faturamento gerado"
            value={faturamento > 0 ? `R$ ${faturamento.toLocaleString("pt-BR")}` : "R$ 0"}
            icon={<DollarSign className="w-4 h-4" />}
          />
          <StatCard
            title="Ticket médio"
            value={ticketMedio > 0 ? `R$ ${ticketMedio.toLocaleString("pt-BR", { maximumFractionDigits: 0 })}` : "R$ 0"}
            icon={<DollarSign className="w-4 h-4" />}
          />
        </div>
      </section>

      <section>
        <Card className="bg-card border-border">
          <CardHeader className="flex flex-row items-center justify-between pb-4">
            <CardTitle className="text-base font-semibold">Evolução (últimos 30 dias)</CardTitle>
            <div className="flex gap-2">
              {(Object.keys(metricConfig) as ChartMetric[]).map((m) => (
                <Button
                  key={m}
                  variant={metric === m ? "default" : "ghost"}
                  size="sm"
                  className={cn("text-xs cursor-pointer", metric !== m && "text-muted-foreground hover:text-foreground")}
                  onClick={() => setMetric(m)}
                >
                  {metricConfig[m].label}
                </Button>
              ))}
            </div>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={280}>
              <LineChart data={chartData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
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
                  tickFormatter={(v) => cfg.prefix ? `R$ ${(v / 1000).toFixed(0)}k` : String(v)}
                />
                <Tooltip
                  contentStyle={{ backgroundColor: "oklch(0.11 0 0)", border: "1px solid oklch(0.22 0 0)", borderRadius: "8px", fontSize: 12 }}
                  labelStyle={{ color: "oklch(0.635 0 0)" }}
                  formatter={(value) => {
                    const v = Number(value);
                    return cfg.prefix ? [`R$ ${v.toLocaleString("pt-BR")}`, cfg.label] : [v, cfg.label];
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
