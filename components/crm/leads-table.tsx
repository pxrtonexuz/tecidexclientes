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

/* Glass pill styles for status badges */
const statusStyles: Record<KanbanStatus, React.CSSProperties> = {
  em_atendimento:  { background: "rgba(56, 189, 248, 0.12)", border: "1px solid rgba(56, 189, 248, 0.25)", color: "#38bdf8" },
  montando_pedido: { background: "rgba(129, 140, 248, 0.12)", border: "1px solid rgba(129, 140, 248, 0.25)", color: "#818cf8" },
  pedido_fechado:  { background: "rgba(16, 220, 140, 0.12)", border: "1px solid rgba(16, 220, 140, 0.28)", color: "#10dc8c" },
  venda_concluida: { background: "rgba(16, 220, 140, 0.15)", border: "1px solid rgba(16, 220, 140, 0.35)", color: "#10dc8c" },
  sem_resposta:    { background: "rgba(245, 158, 11, 0.12)", border: "1px solid rgba(245, 158, 11, 0.25)", color: "#f59e0b" },
  perdido:         { background: "rgba(239, 68, 68, 0.12)", border: "1px solid rgba(239, 68, 68, 0.25)", color: "#ef4444" },
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
      {/* Filters */}
      <div className="flex gap-3 flex-wrap">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por nome..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
            style={{
              background: "rgba(5, 150, 105, 0.06)",
              border: "1px solid rgba(5, 150, 105, 0.20)",
            }}
          />
        </div>
        <Select value={filterStatus} onValueChange={(v) => setFilterStatus(v ?? "all")}>
          <SelectTrigger
            className="w-48 cursor-pointer"
            style={{ background: "rgba(5, 150, 105, 0.06)", border: "1px solid rgba(5, 150, 105, 0.20)" }}
          >
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent className="bg-popover border-border">
            <SelectItem value="all" className="cursor-pointer">Todos os status</SelectItem>
            {(Object.keys(statusLabels) as KanbanStatus[]).map((s) => (
              <SelectItem key={s} value={s} className="cursor-pointer">{statusLabels[s]}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={filterModel} onValueChange={(v) => setFilterModel(v ?? "all")}>
          <SelectTrigger
            className="w-48 cursor-pointer"
            style={{ background: "rgba(5, 150, 105, 0.06)", border: "1px solid rgba(5, 150, 105, 0.20)" }}
          >
            <SelectValue placeholder="Modelo" />
          </SelectTrigger>
          <SelectContent className="bg-popover border-border">
            <SelectItem value="all" className="cursor-pointer">Todos os modelos</SelectItem>
            {models.map((m) => (
              <SelectItem key={m} value={m} className="cursor-pointer">{m}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <div
        className="rounded-[22px] overflow-hidden"
        style={{
          background: "rgba(5, 150, 105, 0.05)",
          backdropFilter: "blur(28px) saturate(160%)",
          WebkitBackdropFilter: "blur(28px) saturate(160%)",
          border: "1px solid rgba(5, 150, 105, 0.20)",
          boxShadow: "0 8px 32px rgba(0, 0, 0, 0.3), inset 0 1px 0 rgba(16, 220, 140, 0.06)",
        }}
      >
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr
                style={{
                  background: "rgba(5, 150, 105, 0.08)",
                  borderBottom: "1px solid rgba(5, 150, 105, 0.18)",
                }}
              >
                {["Nome", "Contato", "Entrada", "Modelo", "Status", "Valor do Pedido", "Observações"].map((h) => (
                  <th
                    key={h}
                    className="text-left px-4 py-3 whitespace-nowrap"
                    style={{
                      color: "rgba(160, 210, 185, 0.65)",
                      fontSize: "11px",
                      fontWeight: 600,
                      letterSpacing: "0.07em",
                      textTransform: "uppercase",
                    }}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((lead) => (
                <tr
                  key={lead.id}
                  className="last:border-0 transition-colors duration-150"
                  style={{ borderBottom: "1px solid rgba(5, 150, 105, 0.08)" }}
                  onMouseEnter={(e) => {
                    (e.currentTarget as HTMLTableRowElement).style.background = "rgba(5, 150, 105, 0.06)";
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLTableRowElement).style.background = "transparent";
                  }}
                >
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
                      className="h-7 text-xs w-36"
                      style={{ background: "rgba(5, 150, 105, 0.06)", border: "1px solid rgba(5, 150, 105, 0.18)" }}
                    />
                  </td>
                  <td className="px-4 py-3">
                    <Select
                      value={lead.status}
                      onValueChange={(v) => v && handleStatusChange(lead.id, v)}
                    >
                      <SelectTrigger
                        className={cn("h-7 text-xs w-44 cursor-pointer border-0")}
                        style={{
                          ...statusStyles[lead.status],
                          borderRadius: "50px",
                          padding: "4px 12px",
                          backdropFilter: "blur(8px)",
                        }}
                      >
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-popover border-border">
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
                      className="h-7 text-xs w-32"
                      style={{ background: "rgba(5, 150, 105, 0.06)", border: "1px solid rgba(5, 150, 105, 0.18)" }}
                    />
                  </td>
                  <td className="px-4 py-3">
                    <Input
                      value={lead.notes}
                      onChange={(e) => updateLocal(lead.id, { notes: e.target.value })}
                      onBlur={(e) => handleObservacoesBlur(lead.id, e.target.value)}
                      placeholder="Observações..."
                      className="h-7 text-xs"
                      style={{ background: "rgba(5, 150, 105, 0.06)", border: "1px solid rgba(5, 150, 105, 0.18)" }}
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
