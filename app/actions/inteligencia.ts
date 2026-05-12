"use server";

import { requireTenantSession } from "@/lib/auth";
import { createTenantClient } from "@/lib/supabase/tenant";
import { format, subDays, eachDayOfInterval } from "date-fns";

type LeadSlim = {
  status: string;
  valor: number | null;
  modelo: string | null;
  created_at: string;
};

const CLOSED_STATUSES = ["pedido_fechado", "venda_concluida"];

async function fetchLeads(): Promise<LeadSlim[]> {
  const { tenant } = await requireTenantSession();
  const db = createTenantClient(tenant);
  const { data } = await db
    .from("leads")
    .select("status, valor, modelo, created_at");
  return (data ?? []) as LeadSlim[];
}

// ─── Produto ──────────────────────────────────────────────────────────────────

export type ProdutoData = {
  modelRanking: { nome: string; pedidos: number }[];
};

export async function getProdutoData(): Promise<ProdutoData> {
  const leads = await fetchLeads();
  const closed = leads.filter((l) => CLOSED_STATUSES.includes(l.status));

  const modelMap = new Map<string, number>();
  for (const lead of closed) {
    if (lead.modelo) {
      modelMap.set(lead.modelo, (modelMap.get(lead.modelo) ?? 0) + 1);
    }
  }

  const modelRanking = Array.from(modelMap.entries())
    .map(([nome, pedidos]) => ({ nome, pedidos }))
    .sort((a, b) => b.pedidos - a.pedidos)
    .slice(0, 10);

  return { modelRanking };
}

// ─── Financeiro ───────────────────────────────────────────────────────────────

export type FinanceiroData = {
  faturamentoTotal: number;
  pedidosConfirmados: number;
  faturamentoPorModelo: {
    modelo: string;
    pedidos: number;
    faturamento: number;
    ticket: number;
  }[];
  ticketEvolucao: { dia: string; ticket: number }[];
};

export async function getFinanceiroData(): Promise<FinanceiroData> {
  const leads = await fetchLeads();
  const closed = leads.filter((l) => CLOSED_STATUSES.includes(l.status));
  const withValue = closed.filter((l) => l.valor != null && l.valor > 0);

  const faturamentoTotal = withValue.reduce((acc, l) => acc + (l.valor ?? 0), 0);
  const pedidosConfirmados = closed.length;

  const modelMap = new Map<string, { pedidos: number; faturamento: number }>();
  for (const lead of withValue) {
    if (lead.modelo) {
      const prev = modelMap.get(lead.modelo) ?? { pedidos: 0, faturamento: 0 };
      modelMap.set(lead.modelo, {
        pedidos: prev.pedidos + 1,
        faturamento: prev.faturamento + (lead.valor ?? 0),
      });
    }
  }

  const faturamentoPorModelo = Array.from(modelMap.entries())
    .map(([modelo, d]) => ({
      modelo,
      pedidos: d.pedidos,
      faturamento: d.faturamento,
      ticket: d.pedidos > 0 ? Math.round(d.faturamento / d.pedidos) : 0,
    }))
    .sort((a, b) => b.faturamento - a.faturamento)
    .slice(0, 8);

  const days = eachDayOfInterval({ start: subDays(new Date(), 29), end: new Date() });
  const ticketEvolucao = days.map((day) => {
    const dayStr = format(day, "yyyy-MM-dd");
    const dayLeads = withValue.filter((l) => l.created_at.startsWith(dayStr));
    const fat = dayLeads.reduce((acc, l) => acc + (l.valor ?? 0), 0);
    return {
      dia: format(day, "dd/MM"),
      ticket: dayLeads.length > 0 ? Math.round(fat / dayLeads.length) : 0,
    };
  });

  return { faturamentoTotal, pedidosConfirmados, faturamentoPorModelo, ticketEvolucao };
}

// ─── Atendimento ──────────────────────────────────────────────────────────────

export type AtendimentoData = {
  // heatmap[dia_da_semana 0-6][hora 0-23] = contagem de leads iniciados
  heatmap: number[][];
  totalLeads: number;
  maxValue: number;
};

export async function getAtendimentoData(): Promise<AtendimentoData> {
  const leads = await fetchLeads();

  const heatmap: number[][] = Array.from({ length: 7 }, () => Array(24).fill(0));
  for (const lead of leads) {
    const date = new Date(lead.created_at);
    const day = date.getDay(); // 0 = domingo
    const hour = date.getHours();
    heatmap[day][hour]++;
  }

  const maxValue = Math.max(...heatmap.flat(), 1);

  return { heatmap, totalLeads: leads.length, maxValue };
}

// ─── Saúde ────────────────────────────────────────────────────────────────────

export type SaudeMetrics = {
  completude: number; // % de leads que chegaram ao fechamento
};

export async function getSaudeMetrics(): Promise<SaudeMetrics> {
  const leads = await fetchLeads();
  const total = leads.length;
  const fechados = leads.filter((l) => CLOSED_STATUSES.includes(l.status)).length;
  return {
    completude: total > 0 ? Math.round((fechados / total) * 100) : 0,
  };
}
