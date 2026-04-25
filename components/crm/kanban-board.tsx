"use client";

import { useState } from "react";
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
  type DragStartEvent,
  type DragEndEvent,
} from "@dnd-kit/core";
import { SortableContext, useSortable, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { User, MessageSquare, Calendar } from "lucide-react";

export type KanbanStatus =
  | "em_atendimento"
  | "handoff_feito"
  | "pedido_confirmado"
  | "sem_resposta"
  | "perdido";

export type Lead = {
  id: string;
  name: string;
  model: string;
  lastContact: Date;
  status: KanbanStatus;
  value?: number;
};

const columns: { id: KanbanStatus; label: string; color: string; bg: string }[] = [
  { id: "em_atendimento", label: "Em atendimento", color: "text-blue-400", bg: "bg-blue-500/10 border-blue-500/20" },
  { id: "handoff_feito", label: "Handoff feito", color: "text-indigo-400", bg: "bg-indigo-500/10 border-indigo-500/20" },
  { id: "pedido_confirmado", label: "Pedido confirmado", color: "text-emerald-400", bg: "bg-emerald-500/10 border-emerald-500/20" },
  { id: "sem_resposta", label: "Sem resposta", color: "text-yellow-400", bg: "bg-yellow-500/10 border-yellow-500/20" },
  { id: "perdido", label: "Perdido", color: "text-red-400", bg: "bg-red-500/10 border-red-500/20" },
];

const mockLeads: Lead[] = [
  { id: "1", name: "Ana Souza", model: "Polo Feminina", lastContact: new Date(2025, 3, 22), status: "em_atendimento" },
  { id: "2", name: "Bruno Lima", model: "Regata Premium", lastContact: new Date(2025, 3, 21), status: "em_atendimento" },
  { id: "3", name: "Carla Dias", model: "Camiseta Básica", lastContact: new Date(2025, 3, 20), status: "handoff_feito" },
  { id: "4", name: "Diego Melo", model: "Polo Masculina", lastContact: new Date(2025, 3, 19), status: "pedido_confirmado", value: 2400 },
  { id: "5", name: "Eva Torres", model: "Camiseta Dry Fit", lastContact: new Date(2025, 3, 18), status: "sem_resposta" },
  { id: "6", name: "Felipe Neto", model: "Polo Feminina", lastContact: new Date(2025, 3, 17), status: "perdido" },
  { id: "7", name: "Gabi Alves", model: "Regata Premium", lastContact: new Date(2025, 3, 22), status: "em_atendimento" },
];

function LeadCard({ lead, isDragging }: { lead: Lead; isDragging?: boolean }) {
  return (
    <div
      className={cn(
        "bg-card border border-border rounded-lg p-3 space-y-2.5 cursor-grab active:cursor-grabbing select-none",
        "hover:border-border/80 transition-colors",
        isDragging && "opacity-50 rotate-1 shadow-2xl"
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <div className="w-7 h-7 rounded-full bg-muted flex items-center justify-center shrink-0">
            <User className="w-3.5 h-3.5 text-muted-foreground" />
          </div>
          <p className="text-sm font-medium text-foreground truncate">{lead.name}</p>
        </div>
        {lead.value && (
          <span className="text-xs font-semibold text-emerald-400 shrink-0">
            R$ {lead.value.toLocaleString("pt-BR")}
          </span>
        )}
      </div>
      <div className="flex items-center gap-1.5">
        <MessageSquare className="w-3 h-3 text-muted-foreground shrink-0" />
        <span className="text-xs text-muted-foreground truncate">{lead.model}</span>
      </div>
      <div className="flex items-center gap-1.5">
        <Calendar className="w-3 h-3 text-muted-foreground shrink-0" />
        <span className="text-xs text-muted-foreground">
          {format(lead.lastContact, "dd 'de' MMM", { locale: ptBR })}
        </span>
      </div>
    </div>
  );
}

function SortableLeadCard({ lead }: { lead: Lead }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: lead.id,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      <LeadCard lead={lead} isDragging={isDragging} />
    </div>
  );
}

export function KanbanBoard() {
  const [leads, setLeads] = useState<Lead[]>(mockLeads);
  const [activeId, setActiveId] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } })
  );

  const activeLead = leads.find((l) => l.id === activeId);

  function onDragStart({ active }: DragStartEvent) {
    setActiveId(active.id as string);
  }

  function onDragEnd({ active, over }: DragEndEvent) {
    setActiveId(null);
    if (!over) return;

    const overId = over.id as string;
    const targetColumn = columns.find((c) => c.id === overId);
    const targetStatus = targetColumn
      ? targetColumn.id
      : leads.find((l) => l.id === overId)?.status;

    if (!targetStatus) return;

    setLeads((prev) =>
      prev.map((l) =>
        l.id === active.id
          ? { ...l, status: targetStatus as KanbanStatus }
          : l
      )
    );
    // TODO: persist timestamp to Supabase: UPDATE leads SET status = targetStatus, status_updated_at = NOW() WHERE id = active.id
  }

  return (
    <DndContext sensors={sensors} onDragStart={onDragStart} onDragEnd={onDragEnd}>
      <div className="flex gap-4 overflow-x-auto pb-4">
        {columns.map((col) => {
          const colLeads = leads.filter((l) => l.status === col.id);
          return (
            <div key={col.id} className="flex flex-col shrink-0 w-64">
              {/* Column header */}
              <div className={cn("flex items-center justify-between px-3 py-2 rounded-t-lg border-t border-x mb-0", col.bg)}>
                <span className={cn("text-xs font-semibold", col.color)}>{col.label}</span>
                <span className={cn("text-xs font-bold px-1.5 py-0.5 rounded-full bg-card", col.color)}>
                  {colLeads.length}
                </span>
              </div>
              {/* Drop zone */}
              <SortableContext
                id={col.id}
                items={colLeads.map((l) => l.id)}
                strategy={verticalListSortingStrategy}
              >
                <div
                  className="flex-1 min-h-48 bg-muted/30 border border-t-0 border-border rounded-b-lg p-2 space-y-2"
                >
                  {colLeads.map((lead) => (
                    <SortableLeadCard key={lead.id} lead={lead} />
                  ))}
                  {colLeads.length === 0 && (
                    <div className="h-24 flex items-center justify-center text-xs text-muted-foreground border-2 border-dashed border-border rounded-lg">
                      Solte aqui
                    </div>
                  )}
                </div>
              </SortableContext>
            </div>
          );
        })}
      </div>

      <DragOverlay>
        {activeLead && <LeadCard lead={activeLead} />}
      </DragOverlay>
    </DndContext>
  );
}
