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
    <div className="tec-page space-y-7">
      <section
        className="overflow-hidden rounded-[22px] border border-white/10 p-8 shadow-[0_28px_80px_rgba(0,0,0,0.32)]"
        style={{
          background:
            "linear-gradient(120deg, rgba(13,18,28,0.96) 0%, rgba(13,18,28,0.92) 48%, rgba(22,163,95,0.28) 100%)",
        }}
      >
        <div className="grid gap-7 xl:grid-cols-[minmax(0,1fr)_minmax(520px,0.68fr)]">
          <div>
            <div className="mb-4 flex items-center gap-2 text-sm font-semibold capitalize text-[#34d582]">
              <Sparkles className="h-4 w-4" />
              {todayLabel}
            </div>
            <h1 className="max-w-4xl text-5xl font-bold leading-[1.02] text-foreground lg:text-6xl 2xl:text-7xl">
              Bom dia, Tecidex. <span className="text-[#8df0b8]">Tudo sob controle.</span>
            </h1>
            <p className="mt-5 max-w-3xl text-lg leading-8 text-muted-foreground">
              Uma visao rapida do atendimento, funil comercial e resultados que mostram o pulso da operacao.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3 self-center">
            {[
              ["Leads no periodo", totalLeads],
              ["Pedidos", pedidosConfirmados],
              ["Conversao", `${taxaConversao.toFixed(1)}%`],
              ["Faturamento", faturamento > 0 ? `R$ ${faturamento.toLocaleString("pt-BR")}` : "R$ 0"],
            ].map(([label, value]) => (
              <div key={label} className="rounded-xl border border-white/10 bg-white/[0.045] p-4">
                <p className="text-sm text-muted-foreground">{label}</p>
                <p className="mt-3 text-2xl font-bold text-foreground">{value}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <span className="flex h-5 w-5 items-center justify-center rounded-full border border-[#34d582]/50 text-[#34d582]">
            <span className="h-1.5 w-1.5 rounded-full bg-[#34d582]" />
          </span>
          <p className="text-base font-medium text-muted-foreground">Inicio operacional da Tecidex</p>
        </div>
        <PeriodFilter onChange={setPeriod} />
      </div>

      <section className="grid grid-cols-1 gap-4 xl:grid-cols-4">
        <div
          className="glass-card flex min-h-[168px] flex-col justify-between p-6 text-white"
          style={{
            background: "linear-gradient(135deg, #1fb96e 0%, #12884f 52%, #0a5f38 100%)",
            borderColor: "rgba(141, 240, 184, 0.26)",
          }}
        >
          <div className="flex items-start justify-between">
            <p className="text-lg font-semibold">Comercial do mes</p>
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/12">
              <MessageSquare className="h-5 w-5" />
            </div>
          </div>
          <div>
            <p className="text-4xl font-bold">{pedidosConfirmados}</p>
            <p className="mt-2 text-sm font-semibold text-white/90">pedidos confirmados</p>
          </div>
          <p className="text-sm font-medium text-white/90">{totalLeads} leads no periodo</p>
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
          <div className="flex flex-wrap items-center justify-between gap-4 px-6 py-5" style={{ borderBottom: "1px solid rgba(255, 255, 255, 0.075)" }}>
            <div>
              <p className="tec-section-title text-[#34d582]">Comercial</p>
              <h3 className="mt-1 text-2xl font-bold text-foreground">Performance do periodo</h3>
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
                  style={metric === item ? { background: "#16a35f", boxShadow: "0 0 16px rgba(52, 213, 130, 0.20)" } : undefined}
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
                    <stop offset="5%" stopColor="#34d582" stopOpacity={0.28} />
                    <stop offset="95%" stopColor="#34d582" stopOpacity={0} />
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
                    border: "1px solid rgba(52, 213, 130, 0.24)",
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
                  stroke="#34d582"
                  strokeWidth={2}
                  fill="url(#tecidexGrad)"
                  dot={false}
                  activeDot={{ r: 4, fill: "#34d582", stroke: "rgba(52, 213, 130, 0.3)", strokeWidth: 4 }}
                  style={{ filter: "drop-shadow(0 0 6px rgba(52, 213, 130, 0.5))" }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="tec-panel p-6">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#34d582]/10 text-[#34d582]">
              <Activity className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-foreground">Agente IA</h3>
              <p className="text-sm text-muted-foreground">Estado da operacao comercial</p>
            </div>
          </div>
          <div className="mt-6 rounded-xl border border-white/10 bg-white/[0.035] p-4">
            <p className="text-sm text-muted-foreground">Status</p>
            <div className="mt-3 flex items-center justify-between">
              <p className={cn("text-2xl font-bold", agentAtivo ? "text-[#34d582]" : "text-red-400")}>
                {agentAtivo ? "Ativo" : "Inativo"}
              </p>
              <span
                className={cn("h-3 w-3 rounded-full", agentAtivo && "animate-pulse")}
                style={{
                  background: agentAtivo ? "#34d582" : "#ef4444",
                  boxShadow: agentAtivo ? "0 0 18px rgba(52, 213, 130, 0.55)" : "none",
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
