"use client";

import { useState, useMemo } from "react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search } from "lucide-react";
import { cn } from "@/lib/utils";
import type { KanbanStatus, Lead } from "./kanban-board";

const statusLabels: Record<KanbanStatus, string> = {
  em_atendimento: "Em atendimento",
  handoff_feito: "Handoff feito",
  pedido_confirmado: "Pedido confirmado",
  sem_resposta: "Sem resposta",
  perdido: "Perdido",
};

const statusColors: Record<KanbanStatus, string> = {
  em_atendimento: "bg-blue-500/15 text-blue-400 border-blue-500/20",
  handoff_feito: "bg-indigo-500/15 text-indigo-400 border-indigo-500/20",
  pedido_confirmado: "bg-emerald-500/15 text-emerald-400 border-emerald-500/20",
  sem_resposta: "bg-yellow-500/15 text-yellow-400 border-yellow-500/20",
  perdido: "bg-red-500/15 text-red-400 border-red-500/20",
};

type ExtendedLead = Lead & {
  contact: string;
  entryDate: Date;
  orderValue: string;
  notes: string;
};

const mockLeads: ExtendedLead[] = [
  { id: "1", name: "Ana Souza", contact: "(11) 99999-1111", entryDate: new Date(2025, 3, 10), model: "Polo Feminina", status: "em_atendimento", lastContact: new Date(2025, 3, 22), orderValue: "", notes: "" },
  { id: "2", name: "Bruno Lima", contact: "(11) 98888-2222", entryDate: new Date(2025, 3, 12), model: "Regata Premium", status: "em_atendimento", lastContact: new Date(2025, 3, 21), orderValue: "", notes: "Cliente VIP" },
  { id: "3", name: "Carla Dias", contact: "(21) 97777-3333", entryDate: new Date(2025, 3, 8), model: "Camiseta Básica", status: "handoff_feito", lastContact: new Date(2025, 3, 20), orderValue: "R$ 1.800", notes: "" },
  { id: "4", name: "Diego Melo", contact: "(31) 96666-4444", entryDate: new Date(2025, 3, 5), model: "Polo Masculina", status: "pedido_confirmado", lastContact: new Date(2025, 3, 19), orderValue: "R$ 2.400", notes: "Pagamento confirmado" },
  { id: "5", name: "Eva Torres", contact: "(41) 95555-5555", entryDate: new Date(2025, 3, 14), model: "Camiseta Dry Fit", status: "sem_resposta", lastContact: new Date(2025, 3, 18), orderValue: "", notes: "" },
  { id: "6", name: "Felipe Neto", contact: "(51) 94444-6666", entryDate: new Date(2025, 3, 2), model: "Polo Feminina", status: "perdido", lastContact: new Date(2025, 3, 17), orderValue: "", notes: "Não tem interesse" },
  { id: "7", name: "Gabi Alves", contact: "(61) 93333-7777", entryDate: new Date(2025, 3, 16), model: "Regata Premium", status: "em_atendimento", lastContact: new Date(2025, 3, 22), orderValue: "", notes: "" },
];

export function LeadsTable() {
  const [leads, setLeads] = useState(mockLeads);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [filterModel, setFilterModel] = useState<string>("all");

  const models = useMemo(() => Array.from(new Set(mockLeads.map((l) => l.model))), []);

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

  function updateLead(id: string, field: keyof ExtendedLead, value: string) {
    setLeads((prev) =>
      prev.map((l) => (l.id === id ? { ...l, [field]: value } : l))
    );
    // TODO: persist to Supabase: UPDATE leads SET field = value WHERE id = id
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

      {/* Table */}
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
                  <td className="px-4 py-3 text-muted-foreground whitespace-nowrap">{lead.model}</td>
                  <td className="px-4 py-3">
                    <Select
                      value={lead.status}
                      onValueChange={(v) => v && updateLead(lead.id, "status", v)}
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
                      onChange={(e) => updateLead(lead.id, "orderValue", e.target.value)}
                      placeholder="R$ 0,00"
                      className="h-7 text-xs bg-muted border-border w-32"
                    />
                  </td>
                  <td className="px-4 py-3">
                    <Input
                      value={lead.notes}
                      onChange={(e) => updateLead(lead.id, "notes", e.target.value)}
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
