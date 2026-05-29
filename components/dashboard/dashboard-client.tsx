"use client";

import { useMemo, useState } from "react";
import { PeriodFilter, type Period } from "@/components/dashboard/period-filter";
import { StatCard } from "@/components/dashboard/stat-card";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Activity, DollarSign, MessageSquare, ShoppingCart, Sparkles } from "lucide-react";
import { eachDayOfInterval, endOfMonth, format, startOfMonth } from "date-fns";
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
    label: "Este mes",
    from: startOfMonth(new Date()),
    to: endOfMonth(new Date()),
  });
  const [metric, setMetric] = useState<ChartMetric>("atendimentos");

  const cfg = metricConfig[metric];

  const periodLeads = useMemo(
    () =>
      leads.filter((lead) => {
        const date = new Date(lead.created_at);
        return date >= period.from && date <= period.to;
      }),
    [leads, period]
  );

  const totalLeads = periodLeads.length;
  const pedidosConfirmados = periodLeads.filter((lead) => CLOSED_STATUSES.includes(lead.status)).length;
  const faturamento = periodLeads
    .filter((lead) => CLOSED_STATUSES.includes(lead.status) && lead.valor)
    .reduce((acc, lead) => acc + (lead.valor ?? 0), 0);
  const ticketMedio = pedidosConfirmados > 0 ? faturamento / pedidosConfirmados : 0;
  const taxaConversao = totalLeads > 0 ? (pedidosConfirmados / totalLeads) * 100 : 0;

  const chartData = useMemo(() => {
    const days = eachDayOfInterval({ start: period.from, end: period.to });
    return days.map((day) => {
      const dayStr = format(day, "yyyy-MM-dd");
      const dayLeads = leads.filter((lead) => format(new Date(lead.created_at), "yyyy-MM-dd") === dayStr);
      const dayOrders = dayLeads.filter((lead) => CLOSED_STATUSES.includes(lead.status));
      const dayRevenue = dayOrders.reduce((acc, lead) => acc + (lead.valor ?? 0), 0);
      return {
        date: format(day, "dd/MM", { locale: ptBR }),
        atendimentos: dayLeads.length,
        pedidos: dayOrders.length,
        faturamento: dayRevenue,
      };
    });
  }, [leads, period]);

  const chartXInterval = Math.max(0, Math.floor(chartData.length / 7) - 1);
  const todayLabel = format(new Date(), "EEEE, dd 'de' MMMM", { locale: ptBR });

  return (
    <div className="tec-page space-y-5">
      <section
        className="overflow-hidden rounded-xl border border-white/10 px-5 py-5 shadow-[0_24px_70px_rgba(0,0,0,0.34)]"
        style={{
          background:
            "radial-gradient(circle at 92% 40%, rgba(16,185,129,0.18), transparent 24rem), linear-gradient(135deg, rgba(13,16,31,0.96), rgba(7,10,18,0.96))",
        }}
      >
        <div className="grid items-center gap-5 xl:grid-cols-[minmax(0,1fr)_520px]">
          <div>
            <div className="mb-3 flex items-center gap-2 text-xs font-semibold capitalize text-[#6ee7b7]">
              <Sparkles className="h-3.5 w-3.5" />
              {todayLabel}
            </div>
            <h1 className="max-w-4xl text-[1.875rem] font-semibold leading-[1.1] text-foreground lg:text-4xl">
              Bom dia, Tecidex. <span className="text-[#6ee7b7]">Tudo sob controle.</span>
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground">
              Uma visao rapida do atendimento, funil comercial e resultados que mostram o pulso da operacao.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {[
              ["Leads no periodo", totalLeads],
              ["Pedidos", pedidosConfirmados],
              ["Conversao", `${taxaConversao.toFixed(1)}%`],
              ["Faturamento", faturamento > 0 ? `R$ ${faturamento.toLocaleString("pt-BR")}` : "R$ 0"],
            ].map(([label, value]) => (
              <div key={label} className="min-h-[82px] rounded-xl border border-white/10 bg-white/[0.045] px-3 py-2.5">
                <p className="text-[11px] font-medium text-muted-foreground">{label}</p>
                <p className="mt-3 text-lg font-semibold text-foreground">{value}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <span className="flex h-5 w-5 items-center justify-center rounded-full border border-[#10b981]/50 text-[#10b981]">
            <span className="h-1.5 w-1.5 rounded-full bg-[#10b981]" />
          </span>
          <p className="text-sm font-medium text-muted-foreground">Inicio operacional da Tecidex</p>
        </div>
        <PeriodFilter onChange={setPeriod} />
      </div>

      <section className="grid grid-cols-1 gap-4 xl:grid-cols-4">
        <div
          className="glass-card flex min-h-[140px] flex-col justify-between p-4 text-white"
          style={{
            background: "linear-gradient(135deg, #10b981 0%, #047857 100%)",
            borderColor: "rgba(110, 231, 183, 0.22)",
            boxShadow: "0 18px 48px rgba(16, 185, 129, 0.22)",
          }}
        >
          <div className="flex items-start justify-between">
            <p className="text-sm font-semibold leading-tight">Comercial do mes</p>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/10">
              <MessageSquare className="h-5 w-5" />
            </div>
          </div>
          <div>
            <p className="text-2xl font-bold leading-none">{pedidosConfirmados}</p>
            <p className="mt-1 text-sm font-semibold text-white/85">pedidos confirmados</p>
          </div>
          <p className="text-sm font-medium text-white/80">{totalLeads} leads no periodo</p>
        </div>

        <StatCard
          title="Financeiro do mes"
          value={faturamento > 0 ? `R$ ${faturamento.toLocaleString("pt-BR")}` : "R$ 0"}
          icon={<DollarSign className="w-4 h-4" />}
        />
        <StatCard title="Operacao atual" value={totalLeads} suffix="leads ativos" icon={<Activity className="w-4 h-4" />} />
        <StatCard
          title="Ticket medio"
          value={ticketMedio > 0 ? `R$ ${ticketMedio.toLocaleString("pt-BR", { maximumFractionDigits: 0 })}` : "R$ 0"}
          icon={<ShoppingCart className="w-4 h-4" />}
        />
      </section>

      <section className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
        <div className="tec-panel overflow-hidden">
          <div className="flex flex-wrap items-center justify-between gap-4 px-4 py-4" style={{ borderBottom: "1px solid rgba(35, 39, 57, 0.72)" }}>
            <div>
              <p className="tec-section-title text-[#6ee7b7]">Comercial</p>
              <h3 className="mt-1 text-lg font-semibold text-foreground">Performance do periodo</h3>
            </div>
            <div className="flex gap-1 rounded-xl border border-white/10 bg-white/[0.035] p-1">
              {(Object.keys(metricConfig) as ChartMetric[]).map((item) => (
                <button
                  key={item}
                  onClick={() => setMetric(item)}
                  className={cn(
                    "rounded-lg px-3 py-1.5 text-xs font-medium transition-all duration-180 cursor-pointer",
                    metric === item ? "text-white" : "text-muted-foreground hover:text-foreground"
                  )}
                  style={metric === item ? { background: "rgba(16, 185, 129, 0.14)", color: "#6ee7b7" } : undefined}
                >
                  {metricConfig[item].label}
                </button>
              ))}
            </div>
          </div>
          <div className="p-5">
            <ResponsiveContainer width="100%" height={280}>
              <AreaChart data={chartData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                <defs>
                  <linearGradient id="tecidexGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.32} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255, 255, 255, 0.085)" vertical={false} />
                <XAxis dataKey="date" tick={{ fontSize: 11, fill: "rgba(150, 163, 173, 0.82)" }} tickLine={false} axisLine={false} interval={chartXInterval} />
                <YAxis
                  tick={{ fontSize: 11, fill: "rgba(150, 163, 173, 0.82)" }}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(value) => (cfg.prefix ? `R$${(Number(value) / 1000).toFixed(0)}k` : String(value))}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "rgba(10, 14, 22, 0.94)",
                    border: "1px solid rgba(16, 185, 129, 0.24)",
                    borderRadius: "12px",
                    fontSize: 12,
                    backdropFilter: "blur(20px)",
                  }}
                  labelStyle={{ color: "rgba(150, 163, 173, 0.82)" }}
                  formatter={(value) => {
                    const parsed = Number(value);
                    return cfg.prefix ? [`R$ ${parsed.toLocaleString("pt-BR")}`, cfg.label] : [parsed, cfg.label];
                  }}
                />
                <Area
                  type="monotone"
                  dataKey={metric}
                  stroke="#10b981"
                  strokeWidth={2}
                  fill="url(#tecidexGrad)"
                  dot={false}
                  activeDot={{ r: 4, fill: "#10b981", stroke: "rgba(16, 185, 129, 0.3)", strokeWidth: 4 }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="tec-panel p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#10b981]/10 text-[#6ee7b7]">
              <Activity className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-foreground">Agente IA</h3>
              <p className="text-sm text-muted-foreground">Estado da operacao comercial</p>
            </div>
          </div>
          <div className="mt-6 rounded-xl border border-white/10 bg-white/[0.035] p-4">
            <p className="text-sm text-muted-foreground">Status</p>
            <div className="mt-3 flex items-center justify-between">
              <p className={cn("text-2xl font-bold", agentAtivo ? "text-[#6ee7b7]" : "text-red-400")}>
                {agentAtivo ? "Ativo" : "Inativo"}
              </p>
              <span
                className={cn("h-3 w-3 rounded-full", agentAtivo && "animate-pulse")}
                style={{
                  background: agentAtivo ? "#10b981" : "#ef4444",
                  boxShadow: agentAtivo ? "0 0 18px rgba(16, 185, 129, 0.38)" : "none",
                }}
              />
            </div>
          </div>
          <div className="mt-4 space-y-3">
            <div className="flex items-center justify-between rounded-xl border border-white/10 bg-white/[0.035] px-4 py-3">
              <span className="text-sm text-muted-foreground">Taxa de conversao</span>
              <span className="font-bold text-foreground">{taxaConversao.toFixed(1)}%</span>
            </div>
            <div className="flex items-center justify-between rounded-xl border border-white/10 bg-white/[0.035] px-4 py-3">
              <span className="text-sm text-muted-foreground">Pedidos confirmados</span>
              <span className="font-bold text-foreground">{pedidosConfirmados}</span>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
