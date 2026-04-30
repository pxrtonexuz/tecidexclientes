"use client";

import { useState, useMemo } from "react";
import { PeriodFilter, type Period } from "@/components/dashboard/period-filter";
import { StatCard } from "@/components/dashboard/stat-card";
import {
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  Area, AreaChart,
} from "recharts";
import { MessageSquare, Activity, ShoppingCart, TrendingUp, DollarSign } from "lucide-react";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, subDays } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";
import type { LeadRow } from "@/app/actions/leads";

type ChartMetric = "atendimentos" | "pedidos" | "faturamento";

const metricConfig: Record<ChartMetric, { label: string; prefix?: string }> = {
  atendimentos: { label: "Atendimentos" },
  pedidos: { label: "Pedidos" },
  faturamento: { label: "Faturamento", prefix: "R$" },
};

const CLOSED_STATUSES = ["pedido_fechado", "venda_concluida"];

type Props = {
  agentAtivo: boolean;
  leads: LeadRow[];
};

export function DashboardClient({ agentAtivo, leads }: Props) {
  const [period, setPeriod] = useState<Period>({
    label: "Este mês",
    from: startOfMonth(new Date()),
    to: endOfMonth(new Date()),
  });
  const [metric, setMetric] = useState<ChartMetric>("atendimentos");

  const cfg = metricConfig[metric];

  // Filter leads by selected period
  const periodLeads = useMemo(
    () => leads.filter((l) => {
      const d = new Date(l.created_at);
      return d >= period.from && d <= period.to;
    }),
    [leads, period]
  );

  const totalLeads = periodLeads.length;
  const pedidosConfirmados = periodLeads.filter((l) => CLOSED_STATUSES.includes(l.status)).length;
  const faturamento = periodLeads
    .filter((l) => CLOSED_STATUSES.includes(l.status) && l.valor)
    .reduce((acc, l) => acc + (l.valor ?? 0), 0);
  const ticketMedio = pedidosConfirmados > 0 ? faturamento / pedidosConfirmados : 0;
  const taxaConversao = totalLeads > 0 ? (pedidosConfirmados / totalLeads) * 100 : 0;

  // Real chart data from last 30 days
  const chartData = useMemo(() => {
    const days = eachDayOfInterval({ start: subDays(new Date(), 29), end: new Date() });
    return days.map((day) => {
      const dayStr = format(day, "yyyy-MM-dd");
      const dayLeads = leads.filter((l) => l.created_at.startsWith(dayStr));
      const dayOrders = dayLeads.filter((l) => CLOSED_STATUSES.includes(l.status));
      const dayRevenue = dayOrders.reduce((acc, l) => acc + (l.valor ?? 0), 0);
      return {
        date: format(day, "dd/MM", { locale: ptBR }),
        atendimentos: dayLeads.length,
        pedidos: dayOrders.length,
        faturamento: dayRevenue,
      };
    });
  }, [leads]);

  return (
    <div className="p-6 space-y-6 min-h-screen">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Dashboard</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Visão geral do desempenho do agente</p>
        </div>
        <PeriodFilter onChange={setPeriod} />
      </div>

      {/* Status do Agente */}
      <section className="space-y-3">
        <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-widest">
          Status do Agente
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div
            className="glass-card p-5 flex items-center gap-4"
            style={{ animationDelay: "0ms" }}
          >
            <div
              className="w-10 h-10 rounded-full flex items-center justify-center shrink-0"
              style={{
                background: agentAtivo ? "rgba(16, 220, 140, 0.12)" : "rgba(239, 68, 68, 0.12)",
                border: `1px solid ${agentAtivo ? "rgba(16, 220, 140, 0.25)" : "rgba(239, 68, 68, 0.25)"}`,
              }}
            >
              <Activity
                className="w-5 h-5"
                style={{ color: agentAtivo ? "#10dc8c" : "#ef4444" }}
              />
            </div>
            <div className="relative z-[1]">
              <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Status</p>
              <p
                className="text-lg font-bold mt-0.5"
                style={
                  agentAtivo
                    ? { color: "#10dc8c", textShadow: "0 0 12px rgba(16, 220, 140, 0.5)" }
                    : { color: "#ef4444" }
                }
              >
                {agentAtivo ? "Ativo" : "Inativo"}
              </p>
            </div>
            <div
              className={cn("ml-auto w-2.5 h-2.5 rounded-full shrink-0", agentAtivo && "animate-pulse")}
              style={{
                background: agentAtivo ? "#10dc8c" : "#ef4444",
                boxShadow: agentAtivo ? "0 0 8px #10dc8c, 0 0 20px rgba(16, 220, 140, 0.4)" : "none",
              }}
            />
          </div>
          <StatCard
            title="Total de leads"
            value={totalLeads}
            icon={<MessageSquare className="w-4 h-4" />}
          />
          <StatCard
            title="Pedidos confirmados"
            value={pedidosConfirmados}
            icon={<ShoppingCart className="w-4 h-4" />}
          />
        </div>
      </section>

      {/* Resultado Comercial */}
      <section className="space-y-3">
        <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-widest">
          Resultado Comercial
          <span className="ml-2 text-xs font-normal normal-case opacity-60">{period.label}</span>
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
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

      {/* Chart */}
      <section>
        <div
          className="rounded-[22px] overflow-hidden"
          style={{
            background: "rgba(5, 150, 105, 0.06)",
            backdropFilter: "blur(28px) saturate(160%)",
            WebkitBackdropFilter: "blur(28px) saturate(160%)",
            border: "1px solid rgba(5, 150, 105, 0.22)",
            boxShadow: "0 8px 32px rgba(0, 0, 0, 0.3)",
          }}
        >
          <div
            className="flex flex-row items-center justify-between px-5 py-4"
            style={{ borderBottom: "1px solid rgba(5, 150, 105, 0.15)" }}
          >
            <h3 className="text-base font-semibold text-foreground">
              Evolução (últimos 30 dias)
            </h3>
            <div className="flex gap-1">
              {(Object.keys(metricConfig) as ChartMetric[]).map((m) => (
                <button
                  key={m}
                  onClick={() => setMetric(m)}
                  className={cn(
                    "px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-180 cursor-pointer",
                    metric === m ? "text-white" : "text-muted-foreground hover:text-foreground"
                  )}
                  style={
                    metric === m
                      ? { background: "#059669", boxShadow: "0 0 16px rgba(5, 150, 105, 0.4)" }
                      : undefined
                  }
                >
                  {metricConfig[m].label}
                </button>
              ))}
            </div>
          </div>
          <div className="p-5">
            <ResponsiveContainer width="100%" height={280}>
              <AreaChart data={chartData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                <defs>
                  <linearGradient id="emeraldGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10dc8c" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="#10dc8c" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(5, 150, 105, 0.12)" vertical={false} />
                <XAxis
                  dataKey="date"
                  tick={{ fontSize: 11, fill: "rgba(160, 210, 185, 0.65)" }}
                  tickLine={false}
                  axisLine={false}
                  interval={4}
                />
                <YAxis
                  tick={{ fontSize: 11, fill: "rgba(160, 210, 185, 0.65)" }}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(v) => cfg.prefix ? `R$${(v / 1000).toFixed(0)}k` : String(v)}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "rgba(5, 12, 8, 0.92)",
                    border: "1px solid rgba(5, 150, 105, 0.30)",
                    borderRadius: "12px",
                    fontSize: 12,
                    backdropFilter: "blur(20px)",
                  }}
                  labelStyle={{ color: "rgba(160, 210, 185, 0.65)" }}
                  formatter={(value) => {
                    const v = Number(value);
                    return cfg.prefix ? [`R$ ${v.toLocaleString("pt-BR")}`, cfg.label] : [v, cfg.label];
                  }}
                />
                <Area
                  type="monotone"
                  dataKey={metric}
                  stroke="#10dc8c"
                  strokeWidth={2}
                  fill="url(#emeraldGrad)"
                  dot={false}
                  activeDot={{ r: 4, fill: "#10dc8c", stroke: "rgba(16, 220, 140, 0.3)", strokeWidth: 4 }}
                  style={{ filter: "drop-shadow(0 0 6px rgba(16, 220, 140, 0.5))" }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </section>
    </div>
  );
}
