"use client";

import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import { createClient } from "@supabase/supabase-js";
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useDroppable,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import { SortableContext, useSortable, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { toast } from "sonner";
import {
  ArrowLeft,
  Bot,
  Calendar,
  CheckCircle2,
  CircleDollarSign,
  Clock,
  Info,
  MessageSquare,
  Pause,
  Play,
  QrCode,
  Search,
  User,
  Wifi,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Textarea } from "@/components/ui/textarea";
import {
  updateLeadModelo,
  updateLeadObservacoes,
  updateLeadStatus,
  updateLeadValor,
  type LeadRow,
} from "@/app/actions/leads";
import { pausarConversaIA, reativarConversaIA, type ConversaData } from "@/app/actions/agente";

type ConversaStatus = "ativa" | "pausada" | "concluida";

type RawHistoryRow = {
  id: number;
  session_id: string;
  message: { type: "human" | "ai"; content: string };
};

type LocalMessage = {
  id: string;
  from: "cliente" | "agente";
  text: string;
  at: string | null;
};

type LocalConversa = Omit<ConversaData, "status" | "messages"> & {
  status: ConversaStatus;
  messages: LocalMessage[];
  pausedAt?: Date;
};

const columns = [
  { id: "em_atendimento", label: "Em atendimento", accent: "#38bdf8", glow: "rgba(56, 189, 248, 0.18)" },
  { id: "montando_pedido", label: "Montando pedido", accent: "#818cf8", glow: "rgba(129, 140, 248, 0.18)" },
  { id: "pedido_fechado", label: "Pedido fechado", accent: "#6ee7b7", glow: "rgba(16, 185, 129, 0.25)" },
  { id: "venda_concluida", label: "Venda concluida", accent: "#6ee7b7", glow: "rgba(16, 185, 129, 0.30)" },
  { id: "sem_resposta", label: "Sem resposta", accent: "#f59e0b", glow: "rgba(245, 158, 11, 0.18)" },
  { id: "perdido", label: "Perdido", accent: "#ef4444", glow: "rgba(239, 68, 68, 0.18)" },
] as const;

type LeadStatus = (typeof columns)[number]["id"];

const statusLabels = Object.fromEntries(columns.map((column) => [column.id, column.label])) as Record<LeadStatus, string>;

const conversaStatusStyles: Record<ConversaStatus, string> = {
  ativa: "bg-[#6ee7b7]/15 text-[#6ee7b7] border-[#6ee7b7]/20",
  pausada: "bg-yellow-500/15 text-yellow-400 border-yellow-500/20",
  concluida: "bg-muted text-muted-foreground border-border",
};

function onlyDigits(value: string | null | undefined) {
  return (value ?? "").replace(/\D/g, "");
}

function normalizePhone(value: string | null | undefined) {
  const digits = onlyDigits(value);
  if (digits.startsWith("55")) return digits.slice(2);
  return digits;
}

function sessionPhone(sessionId: string) {
  return normalizePhone(sessionId.split("@")[0]);
}

function formatPhone(sessionId: string) {
  const digits = onlyDigits(sessionId.split("@")[0]);
  if (digits.length === 13 && digits.startsWith("55")) {
    const local = digits.slice(2);
    return `(${local.slice(0, 2)}) ${local.slice(2, 7)}-${local.slice(7)}`;
  }
  if (digits.length === 12 && digits.startsWith("55")) {
    const local = digits.slice(2);
    return `(${local.slice(0, 2)}) ${local.slice(2, 6)}-${local.slice(6)}`;
  }
  return sessionId.split("@")[0];
}

function leadMatchesConversation(lead: LeadRow, conversa: LocalConversa) {
  const leadPhone = normalizePhone(lead.telefone);
  return leadPhone.length > 0 && leadPhone === sessionPhone(conversa.session_id);
}

function isLeadStatus(value: string): value is LeadStatus {
  return columns.some((column) => column.id === value);
}

function safeLeadStatus(value?: string | null): LeadStatus {
  return value && isLeadStatus(value) ? value : "em_atendimento";
}

function formatLastMessage(conv?: LocalConversa) {
  const last = conv?.lastMessage;
  if (!last) return "--";
  const date = new Date(last);
  if (Number.isNaN(date.getTime())) return "--";
  return `${String(date.getDate()).padStart(2, "0")}/${String(date.getMonth() + 1).padStart(2, "0")} ${String(date.getHours()).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}`;
}

function moneyLabel(value: number | null | undefined) {
  if (!value) return "R$ 0";
  return `R$ ${value.toLocaleString("pt-BR")}`;
}

type CrmContact = {
  id: string;
  title: string;
  phone: string;
  stage: LeadStatus;
  lead?: LeadRow;
  conversa?: LocalConversa;
};

type Props = {
  initialLeads: LeadRow[];
  initialConversas: ConversaData[];
  tenantUrl: string;
  tenantAnonKey: string;
};

function ConnectionPanel({ connected, realtimeOk }: { connected: boolean; realtimeOk: boolean }) {
  return (
    <div className="grid gap-4 rounded-2xl border border-white/10 bg-white/[0.035] p-4 md:grid-cols-[180px_minmax(0,1fr)]">
      <div className="flex h-44 items-center justify-center rounded-xl border border-white/10 bg-white/[0.04]">
        {connected ? (
          <div className="flex flex-col items-center gap-2 text-[#6ee7b7]">
            <CheckCircle2 className="h-10 w-10" />
            <span className="text-xs font-semibold uppercase tracking-widest">Conectado</span>
          </div>
        ) : (
          <div className="grid h-32 w-32 grid-cols-5 gap-1 rounded-lg border border-white/10 bg-white p-2">
            {Array.from({ length: 25 }, (_, index) => (
              <div
                key={index}
                className={cn(
                  "rounded-[2px]",
                  [0, 1, 2, 5, 10, 12, 14, 17, 19, 20, 21, 22, 24].includes(index) ? "bg-black" : "bg-transparent"
                )}
              />
            ))}
          </div>
        )}
      </div>
      <div className="flex flex-col justify-center">
        <div className="mb-3 flex items-center gap-2">
          <QrCode className="h-5 w-5 text-[#6ee7b7]" />
          <p className="text-sm font-semibold text-foreground">WhatsApp da operacao</p>
        </div>
        <h2 className="text-xl font-semibold text-foreground">
          {connected ? "Conversas sincronizadas com a plataforma." : "Conecte o WhatsApp para iniciar o CRM Chat."}
        </h2>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
          {connected
            ? "O Kanban abaixo organiza os contatos por etapa comercial. Novas mensagens entram em tempo real quando o canal esta inscrito."
            : "Este bloco ja reserva o lugar do QR Code. Para exibir o QR real, falta plugar o endpoint da instancia WhatsApp/UazAPI ou n8n que retorna status e codigo de conexao."}
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          <Badge className={cn("border", connected ? "border-[#6ee7b7]/20 bg-[#6ee7b7]/15 text-[#6ee7b7]" : "border-yellow-500/20 bg-yellow-500/15 text-yellow-400")}>
            {connected ? "WhatsApp conectado" : "Aguardando QR real"}
          </Badge>
          <Badge className={cn("border", realtimeOk ? "border-[#6ee7b7]/20 bg-[#6ee7b7]/15 text-[#6ee7b7]" : "border-border bg-muted text-muted-foreground")}>
            {realtimeOk ? "Realtime ativo" : "Realtime conectando"}
          </Badge>
        </div>
      </div>
    </div>
  );
}

function ContactInfoSheet({
  contact,
  open,
  onOpenChange,
}: {
  contact?: CrmContact;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const lead = contact?.lead;
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="border-white/10 bg-[#080b13] text-foreground sm:max-w-md">
        <SheetHeader>
          <SheetTitle>{contact?.title ?? "Detalhes do lead"}</SheetTitle>
          <SheetDescription>Informacoes gerais do contato selecionado.</SheetDescription>
        </SheetHeader>
        <div className="space-y-4 px-4 pb-4">
          <div className="rounded-xl border border-white/10 bg-white/[0.04] p-4">
            <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Contato</p>
            <div className="mt-3 space-y-2 text-sm">
              <div className="flex justify-between gap-3">
                <span className="text-muted-foreground">Telefone</span>
                <span className="text-right text-foreground">{contact?.phone || "--"}</span>
              </div>
              <div className="flex justify-between gap-3">
                <span className="text-muted-foreground">Chat</span>
                <span className="text-right text-foreground">{contact?.conversa ? "Vinculado" : "Sem conversa"}</span>
              </div>
              <div className="flex justify-between gap-3">
                <span className="text-muted-foreground">Etapa</span>
                <span className="text-right text-foreground">{contact ? statusLabels[contact.stage] : "--"}</span>
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-white/10 bg-white/[0.04] p-4">
            <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Lead</p>
            {lead ? (
              <div className="mt-3 space-y-2 text-sm">
                <div className="flex justify-between gap-3">
                  <span className="text-muted-foreground">Modelo</span>
                  <span className="text-right text-foreground">{lead.modelo || "--"}</span>
                </div>
                <div className="flex justify-between gap-3">
                  <span className="text-muted-foreground">Valor</span>
                  <span className="text-right text-foreground">{moneyLabel(lead.valor)}</span>
                </div>
                <div className="flex justify-between gap-3">
                  <span className="text-muted-foreground">Entrada</span>
                  <span className="text-right text-foreground">
                    {format(new Date(lead.created_at), "dd/MM/yyyy", { locale: ptBR })}
                  </span>
                </div>
                <div>
                  <span className="text-muted-foreground">Observacoes</span>
                  <p className="mt-1 rounded-lg border border-white/10 bg-white/[0.035] p-3 text-foreground">
                    {lead.observacoes || "Sem observacoes."}
                  </p>
                </div>
              </div>
            ) : (
              <p className="mt-3 text-sm text-muted-foreground">
                Esta conversa ainda nao esta vinculada a um lead. O vinculo automatico acontece pelo telefone.
              </p>
            )}
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}

function ContactCard({
  contact,
  selected,
  dragging,
  onOpen,
  onInfo,
}: {
  contact: CrmContact;
  selected?: boolean;
  dragging?: boolean;
  onOpen: () => void;
  onInfo: () => void;
}) {
  const col = columns.find((column) => column.id === contact.stage) ?? columns[0];
  return (
    <button
      type="button"
      onClick={onOpen}
      className="group w-full select-none rounded-[14px] p-3 text-left transition-all"
      style={{
        background: selected ? "rgba(16, 185, 129, 0.12)" : dragging ? "rgba(255, 255, 255, 0.10)" : "rgba(255, 255, 255, 0.055)",
        border: `1px solid ${selected ? "rgba(16, 185, 129, 0.32)" : "rgba(255, 255, 255, 0.12)"}`,
        boxShadow: dragging ? `0 20px 60px rgba(0,0,0,0.5), 0 0 30px ${col.glow}` : "0 4px 16px rgba(0,0,0,0.28)",
      }}
    >
      <div className="flex items-start justify-between gap-2">
        <button
          type="button"
          onClick={(event) => {
            event.stopPropagation();
            onInfo();
          }}
          className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-white/10 bg-white/[0.055] text-muted-foreground transition-colors hover:text-foreground"
          aria-label="Ver detalhes do lead"
        >
          <Info className="h-3.5 w-3.5" />
        </button>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-foreground">{contact.title}</p>
          <p className="mt-0.5 truncate text-xs text-muted-foreground">{contact.phone || "Sem telefone"}</p>
        </div>
        {contact.conversa && (
          <Badge className={cn("shrink-0 border text-[10px]", conversaStatusStyles[contact.conversa.status])}>
            {contact.conversa.status}
          </Badge>
        )}
      </div>
      <div className="mt-3 space-y-1.5">
        <div className="flex items-center justify-between gap-2 text-xs">
          <span className="truncate text-muted-foreground">{contact.lead?.modelo || contact.conversa?.messages.at(-1)?.text || "Sem historico"}</span>
          <span className="shrink-0 font-medium" style={{ color: col.accent }}>
            {moneyLabel(contact.lead?.valor)}
          </span>
        </div>
        <div className="flex items-center justify-between gap-2 text-xs text-muted-foreground">
          <span>{contact.conversa ? `${contact.conversa.messages.length} msgs` : "Sem chat"}</span>
          <span>{formatLastMessage(contact.conversa)}</span>
        </div>
      </div>
    </button>
  );
}

function SortableContactCard({
  contact,
  selected,
  onOpen,
  onInfo,
}: {
  contact: CrmContact;
  selected?: boolean;
  onOpen: () => void;
  onInfo: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: contact.id });
  return (
    <div ref={setNodeRef} style={{ transform: CSS.Transform.toString(transform), transition }} {...attributes} {...listeners}>
      <ContactCard contact={contact} selected={selected} dragging={isDragging} onOpen={onOpen} onInfo={onInfo} />
    </div>
  );
}

function DroppableColumn({
  column,
  contacts,
  activeId,
  onOpen,
  onInfo,
  compact,
}: {
  column: (typeof columns)[number];
  contacts: CrmContact[];
  activeId?: string;
  onOpen: (id: string) => void;
  onInfo: (contact: CrmContact) => void;
  compact?: boolean;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: column.id });
  return (
    <div className={cn("flex shrink-0 flex-col", compact ? "w-full" : "w-72")}>
      <div
        className="flex items-center justify-between rounded-t-[16px] border border-white/10 px-3 py-2.5"
        style={{ borderTopColor: column.glow, background: "rgba(255, 255, 255, 0.04)" }}
      >
        <span className="text-xs font-semibold" style={{ color: column.accent }}>
          {column.label}
        </span>
        <span className="rounded-full border border-white/10 bg-white/[0.06] px-1.5 py-0.5 text-xs font-bold" style={{ color: column.accent }}>
          {contacts.length}
        </span>
      </div>
      <SortableContext id={column.id} items={contacts.map((contact) => contact.id)} strategy={verticalListSortingStrategy}>
        <div
          ref={setNodeRef}
          className={cn("flex-1 space-y-2 rounded-b-[16px] border border-t-0 border-white/10 p-2", compact ? "max-h-[calc(100vh-19rem)] overflow-y-auto" : "min-h-72")}
          style={{ background: isOver ? "rgba(255, 255, 255, 0.06)" : "rgba(255, 255, 255, 0.025)" }}
        >
          {contacts.map((contact) => (
            <SortableContactCard
              key={contact.id}
              contact={contact}
              selected={activeId === contact.id}
              onOpen={() => onOpen(contact.id)}
              onInfo={() => onInfo(contact)}
            />
          ))}
          {contacts.length === 0 && (
            <div className="flex h-24 items-center justify-center rounded-xl border-2 border-dashed border-white/10 text-xs text-muted-foreground">
              Solte aqui
            </div>
          )}
        </div>
      </SortableContext>
    </div>
  );
}

function ChatPanel({
  contact,
  realtimeOk,
}: {
  contact?: CrmContact;
  realtimeOk: boolean;
}) {
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [contact?.id, contact?.conversa?.messages.length]);

  return (
    <section className="flex min-h-[34rem] flex-col overflow-hidden rounded-2xl border border-white/10 bg-white/[0.035]">
      <header className="flex items-center justify-between gap-3 border-b border-white/10 bg-white/[0.025] px-5 py-3">
        <div className="min-w-0">
          <p className="truncate font-semibold text-foreground">{contact?.title ?? "Selecione um contato"}</p>
          <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <User className="h-3 w-3" />
              {contact?.lead ? "Lead vinculado" : "Sem lead vinculado"}
            </span>
            <span className="flex items-center gap-1">
              <MessageSquare className="h-3 w-3" />
              {contact?.conversa ? `${contact.conversa.messages.length} mensagens` : "Sem conversa"}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-1.5 text-xs">
          <Wifi className={cn("h-3.5 w-3.5", realtimeOk ? "text-[#6ee7b7]" : "text-muted-foreground")} />
          <span className={realtimeOk ? "text-[#6ee7b7]" : "text-muted-foreground"}>{realtimeOk ? "Ao vivo" : "Conectando"}</span>
        </div>
      </header>

      <ScrollArea className="flex-1 px-5 py-4">
        {contact?.conversa ? (
          <div className="mx-auto max-w-3xl space-y-4">
            {contact.conversa.messages.map((message) => (
              <div key={message.id} className={cn("flex gap-3", message.from === "cliente" ? "flex-row" : "flex-row-reverse")}>
                <div className={cn("flex h-8 w-8 shrink-0 items-center justify-center rounded-full", message.from === "cliente" ? "bg-muted" : "bg-primary/15")}>
                  {message.from === "cliente" ? <User className="h-4 w-4 text-muted-foreground" /> : <Bot className="h-4 w-4 text-primary" />}
                </div>
                <div className={cn("max-w-[78%]", message.from === "agente" && "flex flex-col items-end")}>
                  <div
                    className="whitespace-pre-wrap px-4 py-2.5 text-sm leading-relaxed"
                    style={
                      message.from === "cliente"
                        ? {
                            background: "rgba(255, 255, 255, 0.075)",
                            border: "1px solid rgba(255, 255, 255, 0.11)",
                            borderRadius: "18px 18px 18px 4px",
                          }
                        : { background: "#10b981", color: "#fff", borderRadius: "18px 18px 4px 18px" }
                    }
                  >
                    {message.text}
                  </div>
                  {message.at && (
                    <p className="mt-1 px-1 text-xs text-muted-foreground">
                      {new Date(message.at).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
                    </p>
                  )}
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>
        ) : (
          <div className="flex h-full min-h-[24rem] items-center justify-center text-center text-sm text-muted-foreground">
            Este contato ainda nao possui conversa vinculada pelo telefone.
          </div>
        )}
      </ScrollArea>
    </section>
  );
}

function ContextPanel({
  contact,
  pausing,
  onPauseToggle,
  onStatusChange,
  onModeloBlur,
  onValorBlur,
  onNotesBlur,
}: {
  contact?: CrmContact;
  pausing: string | null;
  onPauseToggle: () => void;
  onStatusChange: (value: string | null) => void;
  onModeloBlur: (value: string) => void;
  onValorBlur: (value: string) => void;
  onNotesBlur: (value: string) => void;
}) {
  const lead = contact?.lead;
  const conversa = contact?.conversa;
  const col = columns.find((column) => column.id === contact?.stage) ?? columns[0];

  return (
    <aside className="space-y-4 rounded-2xl border border-white/10 bg-white/[0.035] p-4">
      <div className="rounded-xl border border-white/10 bg-white/[0.04] p-4">
        <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Contexto</p>
        <div className="mt-4 grid grid-cols-2 gap-3">
          <div>
            <p className="flex items-center gap-1 text-xs text-muted-foreground">
              <Calendar className="h-3 w-3" /> Entrada
            </p>
            <p className="mt-1 text-sm font-medium text-foreground">
              {lead ? format(new Date(lead.created_at), "dd/MM/yyyy", { locale: ptBR }) : "--"}
            </p>
          </div>
          <div>
            <p className="flex items-center gap-1 text-xs text-muted-foreground">
              <CircleDollarSign className="h-3 w-3" /> Valor
            </p>
            <p className="mt-1 text-sm font-medium text-foreground">{moneyLabel(lead?.valor)}</p>
          </div>
          <div className="col-span-2">
            <p className="flex items-center gap-1 text-xs text-muted-foreground">
              <Clock className="h-3 w-3" /> Ultima mensagem
            </p>
            <p className="mt-1 text-sm font-medium text-foreground">{formatLastMessage(conversa)}</p>
          </div>
        </div>
      </div>

      {lead ? (
        <div className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground">Etapa comercial</label>
            <Select value={contact?.stage} onValueChange={onStatusChange}>
              <SelectTrigger className="h-9 border-white/10" style={{ background: col.glow, color: col.accent }}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="border-border bg-popover">
                {columns.map((column) => (
                  <SelectItem key={column.id} value={column.id}>
                    {column.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground">Modelo/interesse</label>
            <Input key={`${lead.id}:modelo`} defaultValue={lead.modelo ?? ""} onBlur={(event) => onModeloBlur(event.target.value)} className="h-9 border-white/10 bg-white/[0.045]" placeholder="Modelo..." />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground">Valor do pedido</label>
            <Input key={`${lead.id}:valor`} defaultValue={lead.valor != null ? String(lead.valor) : ""} onBlur={(event) => onValorBlur(event.target.value)} className="h-9 border-white/10 bg-white/[0.045]" placeholder="R$ 0,00" />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground">Observacoes internas</label>
            <Textarea key={`${lead.id}:obs`} defaultValue={lead.observacoes ?? ""} onBlur={(event) => onNotesBlur(event.target.value)} className="min-h-24 resize-none border-white/10 bg-white/[0.045]" placeholder="Notas da equipe..." />
          </div>
        </div>
      ) : (
        <div className="rounded-xl border border-yellow-500/20 bg-yellow-500/10 p-4 text-sm text-yellow-100">
          Conversa sem lead vinculado. Cadastre ou ajuste o telefone do lead para unir os dados automaticamente.
        </div>
      )}

      {conversa && (
        <Button
          onClick={onPauseToggle}
          disabled={pausing === conversa.session_id || conversa.status === "concluida"}
          variant={conversa.status === "pausada" ? "default" : "outline"}
          className="w-full gap-2"
        >
          {pausing === conversa.session_id ? (
            "Aguarde..."
          ) : conversa.status === "pausada" ? (
            <>
              <Play className="h-4 w-4" /> Retomar agente
            </>
          ) : (
            <>
              <Pause className="h-4 w-4" /> Pausar agente
            </>
          )}
        </Button>
      )}
    </aside>
  );
}

export function CrmChatClient({ initialLeads, initialConversas, tenantUrl, tenantAnonKey }: Props) {
  const [leads, setLeads] = useState(initialLeads);
  const [conversas, setConversas] = useState<LocalConversa[]>(
    initialConversas.map((conversa) => ({ ...conversa, status: conversa.status as ConversaStatus }))
  );
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [activeDragId, setActiveDragId] = useState<string | null>(null);
  const [infoContact, setInfoContact] = useState<CrmContact | undefined>();
  const [search, setSearch] = useState("");
  const [pausing, setPausing] = useState<string | null>(null);
  const [realtimeOk, setRealtimeOk] = useState(false);
  const [, startTransition] = useTransition();
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 8 } }));

  const contacts = useMemo<CrmContact[]>(() => {
    const usedConversations = new Set<string>();
    const leadContacts = leads.map((lead) => {
      const conversa = conversas.find((item) => leadMatchesConversation(lead, item));
      if (conversa) usedConversations.add(conversa.session_id);
      return {
        id: lead.id,
        title: lead.nome,
        phone: lead.telefone ?? "",
        stage: safeLeadStatus(lead.status),
        lead,
        conversa,
      };
    });

    const conversationOnly = conversas
      .filter((conversa) => !usedConversations.has(conversa.session_id))
      .map((conversa) => ({
        id: `chat:${conversa.session_id}`,
        title: conversa.clientName || formatPhone(conversa.session_id),
        phone: formatPhone(conversa.session_id),
        stage: "em_atendimento" as LeadStatus,
        conversa,
      }));

    return [...leadContacts, ...conversationOnly];
  }, [leads, conversas]);

  const filteredContacts = useMemo(() => {
    const needle = search.trim().toLowerCase();
    const digits = onlyDigits(needle);
    if (!needle) return contacts;
    return contacts.filter(
      (contact) =>
        contact.title.toLowerCase().includes(needle) ||
        onlyDigits(contact.phone).includes(digits) ||
        contact.lead?.modelo?.toLowerCase().includes(needle)
    );
  }, [contacts, search]);

  const selected = contacts.find((contact) => contact.id === selectedId);
  const activeDrag = contacts.find((contact) => contact.id === activeDragId);
  const selectedColumn = columns.find((column) => column.id === selected?.stage) ?? columns[0];
  const selectedColumnContacts = filteredContacts.filter((contact) => contact.stage === selectedColumn.id);
  const connected = conversas.length > 0;

  useEffect(() => {
    const db = createClient(tenantUrl, tenantAnonKey);
    const channel = db
      .channel("crm-chat-realtime")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "n8n_chat_histories" },
        (payload) => {
          const row = payload.new as RawHistoryRow;
          const msg: LocalMessage = {
            id: String(row.id),
            from: row.message.type === "human" ? "cliente" : "agente",
            text: row.message.content ?? "",
            at: new Date().toISOString(),
          };

          setConversas((prev) => {
            const existing = prev.find((conversa) => conversa.session_id === row.session_id);
            if (existing) {
              return prev.map((conversa) =>
                conversa.session_id === row.session_id
                  ? {
                      ...conversa,
                      status: conversa.status === "concluida" ? "concluida" : "ativa",
                      lastMessage: new Date().toISOString(),
                      messages: [...conversa.messages, msg],
                    }
                  : conversa
              );
            }
            return [
              {
                session_id: row.session_id,
                clientName: formatPhone(row.session_id),
                status: "ativa",
                lastMessage: new Date().toISOString(),
                messages: [msg],
              },
              ...prev,
            ];
          });
        }
      )
      .subscribe((status) => setRealtimeOk(status === "SUBSCRIBED"));

    return () => {
      db.removeChannel(channel);
    };
  }, [tenantAnonKey, tenantUrl]);

  function patchLead(id: string, patch: Partial<LeadRow>) {
    setLeads((prev) => prev.map((lead) => (lead.id === id ? { ...lead, ...patch } : lead)));
  }

  function handleStatusChange(value: string | null) {
    if (!selected?.lead || !value || !isLeadStatus(value)) return;
    const previous = selected.lead.status;
    patchLead(selected.lead.id, { status: value });
    startTransition(async () => {
      const res = await updateLeadStatus(selected.lead!.id, value);
      if (res.error) {
        patchLead(selected.lead!.id, { status: previous });
        toast.error(res.error);
      }
    });
  }

  function updateContactStage(contact: CrmContact, stage: LeadStatus) {
    if (!contact.lead) {
      toast.message("Conversa sem lead vinculado", {
        description: "A etapa so e persistida quando existe um lead com telefone correspondente.",
      });
      return;
    }
    const previous = contact.lead.status;
    patchLead(contact.lead.id, { status: stage });
    startTransition(async () => {
      const res = await updateLeadStatus(contact.lead!.id, stage);
      if (res.error) {
        patchLead(contact.lead!.id, { status: previous });
        toast.error(res.error);
      }
    });
  }

  function handleDragStart(event: DragStartEvent) {
    setActiveDragId(String(event.active.id));
  }

  function handleDragEnd(event: DragEndEvent) {
    setActiveDragId(null);
    if (!event.over) return;
    const contact = contacts.find((item) => item.id === String(event.active.id));
    if (!contact) return;
    const overId = String(event.over.id);
    const targetStage = isLeadStatus(overId)
      ? overId
      : contacts.find((item) => item.id === overId)?.stage;
    if (!targetStage || targetStage === contact.stage) return;
    updateContactStage(contact, targetStage);
  }

  function handleModeloBlur(value: string) {
    if (!selected?.lead || value === (selected.lead.modelo ?? "")) return;
    const previous = selected.lead.modelo;
    patchLead(selected.lead.id, { modelo: value });
    startTransition(async () => {
      const res = await updateLeadModelo(selected.lead!.id, value);
      if (res.error) {
        patchLead(selected.lead!.id, { modelo: previous });
        toast.error(res.error);
      }
    });
  }

  function handleValorBlur(value: string) {
    if (!selected?.lead) return;
    const num = parseFloat(value.replace(/[^\d.,]/g, "").replace(",", "."));
    const next = Number.isNaN(num) ? null : num;
    if (next === selected.lead.valor) return;
    const previous = selected.lead.valor;
    patchLead(selected.lead.id, { valor: next });
    startTransition(async () => {
      const res = await updateLeadValor(selected.lead!.id, next);
      if (res.error) {
        patchLead(selected.lead!.id, { valor: previous });
        toast.error(res.error);
      }
    });
  }

  function handleNotesBlur(value: string) {
    if (!selected?.lead || value === (selected.lead.observacoes ?? "")) return;
    const previous = selected.lead.observacoes;
    patchLead(selected.lead.id, { observacoes: value });
    startTransition(async () => {
      const res = await updateLeadObservacoes(selected.lead!.id, value);
      if (res.error) {
        patchLead(selected.lead!.id, { observacoes: previous });
        toast.error(res.error);
      }
    });
  }

  async function togglePause() {
    if (!selected?.conversa) return;
    const pausando = selected.conversa.status !== "pausada";
    const previousStatus = selected.conversa.status;
    setPausing(selected.conversa.session_id);
    setConversas((prev) =>
      prev.map((conversa) =>
        conversa.session_id === selected.conversa!.session_id
          ? { ...conversa, status: pausando ? "pausada" : "ativa", pausedAt: pausando ? new Date() : undefined }
          : conversa
      )
    );

    try {
      if (pausando) await pausarConversaIA(selected.conversa.session_id);
      else await reativarConversaIA(selected.conversa.session_id);
    } catch {
      setConversas((prev) =>
        prev.map((conversa) =>
          conversa.session_id === selected.conversa!.session_id ? { ...conversa, status: previousStatus } : conversa
        )
      );
      toast.error("Falha ao atualizar o atendimento da IA.");
    } finally {
      setPausing(null);
    }
  }

  return (
    <div className="space-y-5">
      <ConnectionPanel connected={connected} realtimeOk={realtimeOk} />

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="relative w-full sm:max-w-sm">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Buscar contato, telefone ou modelo..."
            className="h-9 border-white/10 bg-white/[0.045] pl-9"
          />
        </div>
        {selected && (
          <Button variant="outline" className="gap-2 border-white/10" onClick={() => setSelectedId(null)}>
            <ArrowLeft className="h-4 w-4" />
            Voltar ao Kanban
          </Button>
        )}
      </div>

      <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
        {selected ? (
          <div className="grid gap-4 xl:grid-cols-[300px_minmax(0,1fr)_340px]">
            <DroppableColumn
              column={selectedColumn}
              contacts={selectedColumnContacts}
              activeId={selected.id}
              onOpen={setSelectedId}
              onInfo={setInfoContact}
              compact
            />
            <ChatPanel contact={selected} realtimeOk={realtimeOk} />
            <ContextPanel
              contact={selected}
              pausing={pausing}
              onPauseToggle={togglePause}
              onStatusChange={handleStatusChange}
              onModeloBlur={handleModeloBlur}
              onValorBlur={handleValorBlur}
              onNotesBlur={handleNotesBlur}
            />
          </div>
        ) : (
          <div className="flex gap-4 overflow-x-auto pb-4">
            {columns.map((column) => (
              <DroppableColumn
                key={column.id}
                column={column}
                contacts={filteredContacts.filter((contact) => contact.stage === column.id)}
                onOpen={setSelectedId}
                onInfo={setInfoContact}
              />
            ))}
          </div>
        )}

        <DragOverlay>
          {activeDrag && (
            <ContactCard contact={activeDrag} dragging onOpen={() => undefined} onInfo={() => undefined} />
          )}
        </DragOverlay>
      </DndContext>

      <ContactInfoSheet contact={infoContact} open={!!infoContact} onOpenChange={(open) => !open && setInfoContact(undefined)} />
    </div>
  );
}
