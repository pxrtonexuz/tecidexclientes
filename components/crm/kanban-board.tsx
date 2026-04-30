"use client";

import { useState, useTransition } from "react";
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
import { updateLeadStatus, type LeadRow } from "@/app/actions/leads";

export type KanbanStatus =
  | "em_atendimento"
  | "montando_pedido"
  | "pedido_fechado"
  | "venda_concluida"
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

const columns: {
  id: KanbanStatus;
  label: string;
  accent: string;
  glow: string;
}[] = [
  { id: "em_atendimento",  label: "Em atendimento",  accent: "#38bdf8", glow: "rgba(56, 189, 248, 0.18)" },
  { id: "montando_pedido", label: "Montando pedido", accent: "#818cf8", glow: "rgba(129, 140, 248, 0.18)" },
  { id: "pedido_fechado",  label: "Pedido fechado",  accent: "#10dc8c", glow: "rgba(16, 220, 140, 0.25)" },
  { id: "venda_concluida", label: "Venda concluída", accent: "#10dc8c", glow: "rgba(16, 220, 140, 0.3)" },
  { id: "sem_resposta",    label: "Sem resposta",    accent: "#f59e0b", glow: "rgba(245, 158, 11, 0.18)" },
  { id: "perdido",         label: "Perdido",         accent: "#ef4444", glow: "rgba(239, 68, 68, 0.18)" },
];

function rowToLead(row: LeadRow): Lead {
  return {
    id: row.id,
    name: row.nome,
    model: row.modelo ?? "",
    lastContact: new Date(row.ultima_interacao),
    status: row.status as KanbanStatus,
    value: row.valor ?? undefined,
  };
}

function LeadCard({ lead, isDragging }: { lead: Lead; isDragging?: boolean }) {
  const col = columns.find((c) => c.id === lead.status);

  return (
    <div
      className={cn("p-3 space-y-2.5 cursor-grab active:cursor-grabbing select-none transition-all")}
      style={{
        background: isDragging ? "rgba(5, 150, 105, 0.18)" : "rgba(5, 150, 105, 0.07)",
        backdropFilter: "blur(28px) saturate(160%)",
        WebkitBackdropFilter: "blur(28px) saturate(160%)",
        border: `1px solid ${isDragging ? (col?.glow ?? "rgba(5,150,105,0.35)") : "rgba(5, 150, 105, 0.22)"}`,
        borderRadius: "14px",
        boxShadow: isDragging
          ? `0 20px 60px rgba(0,0,0,0.5), 0 0 30px ${col?.glow ?? "rgba(5,150,105,0.35)"}`
          : "0 4px 16px rgba(0,0,0,0.3), inset 0 1px 0 rgba(16,220,140,0.08)",
        transform: isDragging ? "scale(1.03) rotate(1deg)" : undefined,
        opacity: isDragging ? 0.85 : 1,
      }}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <div
            className="w-7 h-7 rounded-full flex items-center justify-center shrink-0"
            style={{ background: "rgba(5, 150, 105, 0.12)", border: "1px solid rgba(5, 150, 105, 0.2)" }}
          >
            <User className="w-3.5 h-3.5 text-muted-foreground" />
          </div>
          <p className="text-sm font-medium text-foreground truncate">{lead.name}</p>
        </div>
        {lead.value && (
          <span
            className="text-xs font-semibold shrink-0"
            style={{ color: "#10dc8c", textShadow: "0 0 8px rgba(16,220,140,0.4)" }}
          >
            R$ {lead.value.toLocaleString("pt-BR")}
          </span>
        )}
      </div>
      {lead.model && (
        <div className="flex items-center gap-1.5">
          <MessageSquare className="w-3 h-3 text-muted-foreground shrink-0" />
          <span className="text-xs text-muted-foreground truncate">{lead.model}</span>
        </div>
      )}
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
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: lead.id });
  const style = { transform: CSS.Transform.toString(transform), transition };

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      <LeadCard lead={lead} isDragging={isDragging} />
    </div>
  );
}

export function KanbanBoard({ initialLeads }: { initialLeads: LeadRow[] }) {
  const [leads, setLeads] = useState<Lead[]>(initialLeads.map(rowToLead));
  const [activeId, setActiveId] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 8 } }));
  const activeLead = leads.find((l) => l.id === activeId);

  function onDragStart({ active }: DragStartEvent) { setActiveId(active.id as string); }

  function onDragEnd({ active, over }: DragEndEvent) {
    setActiveId(null);
    if (!over) return;
    const overId = over.id as string;
    const targetColumn = columns.find((c) => c.id === overId);
    const targetStatus = targetColumn ? targetColumn.id : leads.find((l) => l.id === overId)?.status;
    if (!targetStatus) return;
    setLeads((prev) =>
      prev.map((l) => l.id === active.id ? { ...l, status: targetStatus as KanbanStatus } : l)
    );
    startTransition(() => { updateLeadStatus(active.id as string, targetStatus); });
  }

  return (
    <DndContext sensors={sensors} onDragStart={onDragStart} onDragEnd={onDragEnd}>
      <div className="flex gap-4 overflow-x-auto pb-4">
        {columns.map((col) => {
          const colLeads = leads.filter((l) => l.status === col.id);
          return (
            <div key={col.id} className="flex flex-col shrink-0 w-64">
              {/* Column header */}
              <div
                className="flex items-center justify-between px-3 py-2.5 rounded-t-[16px]"
                style={{
                  background: "rgba(5, 150, 105, 0.05)",
                  borderTop: `1px solid ${col.glow.replace("0.18", "0.25").replace("0.25", "0.3").replace("0.3", "0.35")}`,
                  borderLeft: "1px solid rgba(5, 150, 105, 0.15)",
                  borderRight: "1px solid rgba(5, 150, 105, 0.15)",
                  borderBottom: "1px solid rgba(5, 150, 105, 0.12)",
                }}
              >
                <span className="text-xs font-semibold" style={{ color: col.accent }}>
                  {col.label}
                </span>
                <span
                  className="text-xs font-bold px-1.5 py-0.5 rounded-full"
                  style={{
                    background: "rgba(5, 150, 105, 0.08)",
                    border: "1px solid rgba(5, 150, 105, 0.20)",
                    color: col.accent,
                  }}
                >
                  {colLeads.length}
                </span>
              </div>

              {/* Column body */}
              <SortableContext
                id={col.id}
                items={colLeads.map((l) => l.id)}
                strategy={verticalListSortingStrategy}
              >
                <div
                  className="flex-1 min-h-48 p-2 space-y-2 rounded-b-[16px]"
                  style={{
                    background: "rgba(5, 150, 105, 0.03)",
                    backdropFilter: "blur(12px)",
                    WebkitBackdropFilter: "blur(12px)",
                    border: "1px solid rgba(5, 150, 105, 0.12)",
                    borderTop: "none",
                    boxShadow: "inset 0 1px 0 rgba(16, 220, 140, 0.04)",
                  }}
                >
                  {colLeads.map((lead) => (
                    <SortableLeadCard key={lead.id} lead={lead} />
                  ))}
                  {colLeads.length === 0 && (
                    <div
                      className="h-24 flex items-center justify-center text-xs text-muted-foreground rounded-xl"
                      style={{
                        border: "2px dashed rgba(5, 150, 105, 0.18)",
                      }}
                    >
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
