"use client";

import { useState, useMemo, useTransition } from "react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search } from "lucide-react";
import { cn } from "@/lib/utils";
import type { KanbanStatus } from "./kanban-board";
import {
  updateLeadStatus,
  updateLeadModelo,
  updateLeadValor,
  updateLeadObservacoes,
  type LeadRow,
} from "@/app/actions/leads";

const statusLabels: Record<KanbanStatus, string> = {
  em_atendimento:  "Em atendimento",
  montando_pedido: "Montando pedido",
  pedido_fechado:  "Pedido fechado",
  venda_concluida: "Venda concluída",
  sem_resposta:    "Sem resposta",
  perdido:         "Perdido",
};

const statusColors: Record<KanbanStatus, string> = {
  em_atendimento:  "bg-blue-500/15 text-blue-400 border-blue-500/20",
  montando_pedido: "bg-indigo-500/15 text-indigo-400 border-indigo-500/20",
  pedido_fechado:  "bg-emerald-500/15 text-emerald-400 border-emerald-500/20",
  venda_concluida: "bg-teal-500/15 text-teal-400 border-teal-500/20",
  sem_resposta:    "bg-yellow-500/15 text-yellow-400 border-yellow-500/20",
  perdido:         "bg-red-500/15 text-red-400 border-red-500/20",
};

type DisplayLead = {
  id: string;
  name: string;
  contact: string;
  entryDate: Date;
  model: string;
  status: KanbanStatus;
  lastContact: Date;
  orderValue: string;
  notes: string;
};

function rowToDisplay(row: LeadRow): DisplayLead {
  return {
    id: row.id,
    name: row.nome,
    contact: row.telefone ?? "",
    entryDate: new Date(row.created_at),
    model: row.modelo ?? "",
    status: row.status as KanbanStatus,
    lastContact: new Date(row.ultima_interacao),
    orderValue: row.valor != null ? String(row.valor) : "",
    notes: row.observacoes ?? "",
  };
}

export function LeadsTable({ initialLeads }: { initialLeads: LeadRow[] }) {
  const [leads, setLeads] = useState<DisplayLead[]>(initialLeads.map(rowToDisplay));
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [filterModel, setFilterModel] = useState<string>("all");
  const [, startTransition] = useTransition();

  const models = useMemo(
    () => Array.from(new Set(leads.map((l) => l.model).filter(Boolean))),
    [leads]
  );

  const filtered = useMemo(
    () =>
      leads.filter((l) => {
        const matchSearch = l.name.toLowerCase().includes(search.toLowerCase());
        const matchStatus = filterStatus === "all" || l.status === filterStatus;
        const matchModel = filterModel === "all" || l.model === filterModel;
        return matchSearch && matchStatus && matchModel;
      }),
    [leads, search, filterStatus, filterModel]
  );

  function updateLocal(id: string, patch: Partial<DisplayLead>) {
    setLeads((prev) => prev.map((l) => (l.id === id ? { ...l, ...patch } : l)));
  }

  function handleStatusChange(id: string, value: string) {
    updateLocal(id, { status: value as KanbanStatus });
    startTransition(() => { updateLeadStatus(id, value); });
  }

  function handleModeloChange(id: string, value: string) {
    updateLocal(id, { model: value });
    startTransition(() => { updateLeadModelo(id, value); });
  }

  function handleValorBlur(id: string, raw: string) {
    const num = parseFloat(raw.replace(/[^\d.,]/g, "").replace(",", "."));
    startTransition(() => { updateLeadValor(id, isNaN(num) ? null : num); });
  }

  function handleObservacoesBlur(id: string, value: string) {
    startTransition(() => { updateLeadObservacoes(id, value); });
  }

  return (
    <div className="space-y-4">
      <div className="flex gap-3 flex-wrap">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por nome..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 bg-muted border-border"
          />
        </div>
        <Select value={filterStatus} onValueChange={(v) => setFilterStatus(v ?? "all")}>
          <SelectTrigger className="w-48 bg-muted border-border cursor-pointer">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent className="bg-card border-border">
            <SelectItem value="all" className="cursor-pointer">Todos os status</SelectItem>
            {(Object.keys(statusLabels) as KanbanStatus[]).map((s) => (
              <SelectItem key={s} value={s} className="cursor-pointer">{statusLabels[s]}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={filterModel} onValueChange={(v) => setFilterModel(v ?? "all")}>
          <SelectTrigger className="w-48 bg-muted border-border cursor-pointer">
            <SelectValue placeholder="Modelo" />
          </SelectTrigger>
          <SelectContent className="bg-card border-border">
            <SelectItem value="all" className="cursor-pointer">Todos os modelos</SelectItem>
            {models.map((m) => (
              <SelectItem key={m} value={m} className="cursor-pointer">{m}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="rounded-xl border border-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-muted/50 border-b border-border">
                <th className="text-left px-4 py-3 font-medium text-muted-foreground whitespace-nowrap">Nome</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground whitespace-nowrap">Contato</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground whitespace-nowrap">Entrada</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground whitespace-nowrap">Modelo</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground whitespace-nowrap">Status</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground whitespace-nowrap">Valor do Pedido</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground whitespace-nowrap min-w-48">Observações</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((lead) => (
                <tr key={lead.id} className="border-b border-border last:border-0 hover:bg-muted/30 transition-colors">
                  <td className="px-4 py-3 font-medium text-foreground whitespace-nowrap">{lead.name}</td>
                  <td className="px-4 py-3 text-muted-foreground whitespace-nowrap">{lead.contact}</td>
                  <td className="px-4 py-3 text-muted-foreground whitespace-nowrap">
                    {format(lead.entryDate, "dd/MM/yyyy", { locale: ptBR })}
                  </td>
                  <td className="px-4 py-3">
                    <Input
                      value={lead.model}
                      onChange={(e) => updateLocal(lead.id, { model: e.target.value })}
                      onBlur={(e) => handleModeloChange(lead.id, e.target.value)}
                      placeholder="Modelo..."
                      className="h-7 text-xs bg-muted border-border w-36"
                    />
                  </td>
                  <td className="px-4 py-3">
                    <Select
                      value={lead.status}
                      onValueChange={(v) => v && handleStatusChange(lead.id, v)}
                    >
                      <SelectTrigger className={cn("h-7 text-xs w-44 border cursor-pointer", statusColors[lead.status])}>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-card border-border">
                        {(Object.keys(statusLabels) as KanbanStatus[]).map((s) => (
                          <SelectItem key={s} value={s} className="text-xs cursor-pointer">
                            {statusLabels[s]}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </td>
                  <td className="px-4 py-3">
                    <Input
                      value={lead.orderValue}
                      onChange={(e) => updateLocal(lead.id, { orderValue: e.target.value })}
                      onBlur={(e) => handleValorBlur(lead.id, e.target.value)}
                      placeholder="R$ 0,00"
                      className="h-7 text-xs bg-muted border-border w-32"
                    />
                  </td>
                  <td className="px-4 py-3">
                    <Input
                      value={lead.notes}
                      onChange={(e) => updateLocal(lead.id, { notes: e.target.value })}
                      onBlur={(e) => handleObservacoesBlur(lead.id, e.target.value)}
                      placeholder="Observações..."
                      className="h-7 text-xs bg-muted border-border"
                    />
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center text-muted-foreground">
                    Nenhum lead encontrado.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
