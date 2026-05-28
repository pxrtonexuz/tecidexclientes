"use client";

import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import { createClient } from "@supabase/supabase-js";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { toast } from "sonner";
import {
  Bot,
  Calendar,
  CircleDollarSign,
  Clock,
  MessageSquare,
  Pause,
  Play,
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

const statusLabels = {
  em_atendimento: "Em atendimento",
  montando_pedido: "Montando pedido",
  pedido_fechado: "Pedido fechado",
  venda_concluida: "Venda concluida",
  sem_resposta: "Sem resposta",
  perdido: "Perdido",
} as const;

type LeadStatus = keyof typeof statusLabels;

const conversaStatusStyles: Record<ConversaStatus, string> = {
  ativa: "bg-[#39d98a]/15 text-[#39d98a] border-[#39d98a]/20",
  pausada: "bg-yellow-500/15 text-yellow-400 border-yellow-500/20",
  concluida: "bg-muted text-muted-foreground border-border",
};

const leadStatusStyles: Record<LeadStatus, React.CSSProperties> = {
  em_atendimento: { background: "rgba(56, 189, 248, 0.12)", color: "#38bdf8" },
  montando_pedido: { background: "rgba(129, 140, 248, 0.12)", color: "#818cf8" },
  pedido_fechado: { background: "rgba(57, 217, 138, 0.12)", color: "#39d98a" },
  venda_concluida: { background: "rgba(57, 217, 138, 0.15)", color: "#39d98a" },
  sem_resposta: { background: "rgba(245, 158, 11, 0.12)", color: "#f59e0b" },
  perdido: { background: "rgba(239, 68, 68, 0.12)", color: "#ef4444" },
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
  lead?: LeadRow;
  conversa?: LocalConversa;
};

type Props = {
  initialLeads: LeadRow[];
  initialConversas: ConversaData[];
  tenantUrl: string;
  tenantAnonKey: string;
};

export function CrmChatClient({ initialLeads, initialConversas, tenantUrl, tenantAnonKey }: Props) {
  const [leads, setLeads] = useState(initialLeads);
  const [conversas, setConversas] = useState<LocalConversa[]>(
    initialConversas.map((c) => ({ ...c, status: c.status as ConversaStatus }))
  );
  const [activeId, setActiveId] = useState<string>("");
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"all" | "with-chat" | "without-lead">("all");
  const [realtimeOk, setRealtimeOk] = useState(false);
  const [pausing, setPausing] = useState<string | null>(null);
  const [, startTransition] = useTransition();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const contacts = useMemo<CrmContact[]>(() => {
    const usedConversations = new Set<string>();
    const leadContacts = leads.map((lead) => {
      const conversa = conversas.find((c) => leadMatchesConversation(lead, c));
      if (conversa) usedConversations.add(conversa.session_id);
      return {
        id: lead.id,
        title: lead.nome,
        phone: lead.telefone ?? "",
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
        conversa,
      }));

    return [...leadContacts, ...conversationOnly].sort((a, b) => {
      const aHasChat = a.conversa ? 1 : 0;
      const bHasChat = b.conversa ? 1 : 0;
      return bHasChat - aHasChat;
    });
  }, [leads, conversas]);

  const filteredContacts = useMemo(() => {
    const needle = search.trim().toLowerCase();
    return contacts.filter((contact) => {
      const matchesSearch =
        !needle ||
        contact.title.toLowerCase().includes(needle) ||
        onlyDigits(contact.phone).includes(onlyDigits(needle));
      const matchesFilter =
        filter === "all" ||
        (filter === "with-chat" && contact.conversa) ||
        (filter === "without-lead" && !contact.lead);
      return matchesSearch && matchesFilter;
    });
  }, [contacts, filter, search]);

  const active = contacts.find((contact) => contact.id === activeId) ?? filteredContacts[0];
  const activeLead = active?.lead;
  const activeConversa = active?.conversa;

  useEffect(() => {
    if (!activeId && filteredContacts[0]) setActiveId(filteredContacts[0].id);
  }, [activeId, filteredContacts]);

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
            const existing = prev.find((c) => c.session_id === row.session_id);
            if (existing) {
              return prev.map((c) =>
                c.session_id === row.session_id
                  ? {
                      ...c,
                      status: c.status === "concluida" ? "concluida" : "ativa",
                      lastMessage: new Date().toISOString(),
                      messages: [...c.messages, msg],
                    }
                  : c
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

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [active?.id, activeConversa?.messages.length]);

  function patchLead(id: string, patch: Partial<LeadRow>) {
    setLeads((prev) => prev.map((lead) => (lead.id === id ? { ...lead, ...patch } : lead)));
  }

  function handleStatusChange(value: string | null) {
    if (!activeLead || !value) return;
    const previous = activeLead.status;
    patchLead(activeLead.id, { status: value });
    startTransition(async () => {
      const res = await updateLeadStatus(activeLead.id, value);
      if (res.error) {
        patchLead(activeLead.id, { status: previous });
        toast.error(res.error);
      }
    });
  }

  function handleModeloBlur(value: string) {
    if (!activeLead || value === (activeLead.modelo ?? "")) return;
    const previous = activeLead.modelo;
    patchLead(activeLead.id, { modelo: value });
    startTransition(async () => {
      const res = await updateLeadModelo(activeLead.id, value);
      if (res.error) {
        patchLead(activeLead.id, { modelo: previous });
        toast.error(res.error);
      }
    });
  }

  function handleValorBlur(value: string) {
    if (!activeLead) return;
    const num = parseFloat(value.replace(/[^\d.,]/g, "").replace(",", "."));
    const next = Number.isNaN(num) ? null : num;
    if (next === activeLead.valor) return;
    const previous = activeLead.valor;
    patchLead(activeLead.id, { valor: next });
    startTransition(async () => {
      const res = await updateLeadValor(activeLead.id, next);
      if (res.error) {
        patchLead(activeLead.id, { valor: previous });
        toast.error(res.error);
      }
    });
  }

  function handleNotesBlur(value: string) {
    if (!activeLead || value === (activeLead.observacoes ?? "")) return;
    const previous = activeLead.observacoes;
    patchLead(activeLead.id, { observacoes: value });
    startTransition(async () => {
      const res = await updateLeadObservacoes(activeLead.id, value);
      if (res.error) {
        patchLead(activeLead.id, { observacoes: previous });
        toast.error(res.error);
      }
    });
  }

  async function togglePause() {
    if (!activeConversa) return;
    const pausando = activeConversa.status !== "pausada";
    const previousStatus = activeConversa.status;
    setPausing(activeConversa.session_id);
    setConversas((prev) =>
      prev.map((conv) =>
        conv.session_id === activeConversa.session_id
          ? { ...conv, status: pausando ? "pausada" : "ativa", pausedAt: pausando ? new Date() : undefined }
          : conv
      )
    );

    try {
      if (pausando) await pausarConversaIA(activeConversa.session_id);
      else await reativarConversaIA(activeConversa.session_id);
    } catch {
      setConversas((prev) =>
        prev.map((conv) =>
          conv.session_id === activeConversa.session_id ? { ...conv, status: previousStatus } : conv
        )
      );
      toast.error("Falha ao atualizar o atendimento da IA.");
    } finally {
      setPausing(null);
    }
  }

  return (
    <div className="grid min-h-[calc(100vh-13rem)] grid-cols-1 overflow-hidden rounded-2xl border border-white/10 bg-white/[0.035] lg:grid-cols-[320px_minmax(0,1fr)_340px]">
      <aside className="flex min-h-[22rem] flex-col border-b border-white/10 bg-white/[0.025] lg:border-b-0 lg:border-r">
        <div className="space-y-3 border-b border-white/10 p-3">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Buscar cliente ou telefone..."
              className="h-9 border-white/10 bg-white/[0.045] pl-9"
            />
          </div>
          <div className="grid grid-cols-3 gap-1 rounded-xl border border-white/10 bg-white/[0.04] p-1">
            {[
              ["all", "Todos"],
              ["with-chat", "Com chat"],
              ["without-lead", "Sem lead"],
            ].map(([value, label]) => (
              <button
                key={value}
                onClick={() => setFilter(value as typeof filter)}
                className={cn(
                  "h-7 rounded-lg text-xs font-medium transition-colors",
                  filter === value ? "bg-primary text-white" : "text-muted-foreground hover:text-foreground"
                )}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        <ScrollArea className="flex-1">
          {filteredContacts.map((contact) => (
            <button
              key={contact.id}
              onClick={() => setActiveId(contact.id)}
              className="w-full border-b border-white/[0.075] px-4 py-3 text-left transition-colors hover:bg-white/[0.045]"
              style={active?.id === contact.id ? { background: "rgba(255, 255, 255, 0.075)" } : undefined}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-foreground">{contact.title}</p>
                  <p className="mt-0.5 truncate text-xs text-muted-foreground">{contact.phone || "Sem telefone"}</p>
                </div>
                {contact.conversa ? (
                  <Badge className={cn("shrink-0 border text-[10px]", conversaStatusStyles[contact.conversa.status])}>
                    {contact.conversa.status}
                  </Badge>
                ) : (
                  <Badge className="shrink-0 border border-border bg-muted text-[10px] text-muted-foreground">
                    sem chat
                  </Badge>
                )}
              </div>
              <div className="mt-2 flex items-center justify-between gap-2 text-xs text-muted-foreground">
                <span className="truncate">
                  {contact.lead?.modelo || contact.conversa?.messages.at(-1)?.text || "Sem historico"}
                </span>
                <span className="shrink-0">{formatLastMessage(contact.conversa)}</span>
              </div>
            </button>
          ))}
          {filteredContacts.length === 0 && (
            <div className="p-6 text-center text-sm text-muted-foreground">Nenhum contato encontrado.</div>
          )}
        </ScrollArea>
      </aside>

      <section className="flex min-h-[32rem] flex-col">
        <header className="flex items-center justify-between gap-3 border-b border-white/10 bg-white/[0.025] px-5 py-3">
          <div className="min-w-0">
            <p className="truncate font-semibold text-foreground">{active?.title ?? "Selecione um contato"}</p>
            <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
              <span className="flex items-center gap-1">
                <User className="h-3 w-3" />
                {activeLead ? "Lead vinculado" : "Sem lead vinculado"}
              </span>
              <span className="flex items-center gap-1">
                <MessageSquare className="h-3 w-3" />
                {activeConversa ? `${activeConversa.messages.length} mensagens` : "Sem conversa"}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-1.5 text-xs">
            <Wifi className={cn("h-3.5 w-3.5", realtimeOk ? "text-[#39d98a]" : "text-muted-foreground")} />
            <span className={realtimeOk ? "text-[#39d98a]" : "text-muted-foreground"}>
              {realtimeOk ? "Ao vivo" : "Conectando"}
            </span>
          </div>
        </header>

        <ScrollArea className="flex-1 px-5 py-4">
          {activeConversa ? (
            <div className="mx-auto max-w-3xl space-y-4">
              {activeConversa.messages.map((message) => (
                <div
                  key={message.id}
                  className={cn("flex gap-3", message.from === "cliente" ? "flex-row" : "flex-row-reverse")}
                >
                  <div
                    className={cn(
                      "flex h-8 w-8 shrink-0 items-center justify-center rounded-full",
                      message.from === "cliente" ? "bg-muted" : "bg-primary/15"
                    )}
                  >
                    {message.from === "cliente" ? (
                      <User className="h-4 w-4 text-muted-foreground" />
                    ) : (
                      <Bot className="h-4 w-4 text-primary" />
                    )}
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
                          : { background: "#0f6b3f", color: "#fff", borderRadius: "18px 18px 4px 18px" }
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
              Este lead ainda nao possui conversa vinculada pelo telefone.
            </div>
          )}
        </ScrollArea>
      </section>

      <aside className="border-t border-white/10 bg-white/[0.025] p-4 lg:border-l lg:border-t-0">
        {active ? (
          <div className="space-y-5">
            <div className="rounded-xl border border-white/10 bg-white/[0.04] p-4">
              <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Resumo comercial</p>
              <div className="mt-4 grid grid-cols-2 gap-3">
                <div>
                  <p className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Calendar className="h-3 w-3" /> Entrada
                  </p>
                  <p className="mt-1 text-sm font-medium text-foreground">
                    {activeLead ? format(new Date(activeLead.created_at), "dd/MM/yyyy", { locale: ptBR }) : "--"}
                  </p>
                </div>
                <div>
                  <p className="flex items-center gap-1 text-xs text-muted-foreground">
                    <CircleDollarSign className="h-3 w-3" /> Valor
                  </p>
                  <p className="mt-1 text-sm font-medium text-foreground">{moneyLabel(activeLead?.valor)}</p>
                </div>
                <div className="col-span-2">
                  <p className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Clock className="h-3 w-3" /> Ultima mensagem
                  </p>
                  <p className="mt-1 text-sm font-medium text-foreground">{formatLastMessage(activeConversa)}</p>
                </div>
              </div>
            </div>

            {activeLead ? (
              <div className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-muted-foreground">Status do lead</label>
                  <Select value={activeLead.status} onValueChange={handleStatusChange}>
                    <SelectTrigger
                      className="h-9 border-white/10"
                      style={leadStatusStyles[activeLead.status as LeadStatus]}
                    >
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="border-border bg-popover">
                      {(Object.keys(statusLabels) as LeadStatus[]).map((status) => (
                        <SelectItem key={status} value={status}>
                          {statusLabels[status]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-muted-foreground">Modelo/interesse</label>
                  <Input
                    key={`${activeLead.id}:modelo`}
                    defaultValue={activeLead.modelo ?? ""}
                    onBlur={(event) => handleModeloBlur(event.target.value)}
                    className="h-9 border-white/10 bg-white/[0.045]"
                    placeholder="Modelo..."
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-muted-foreground">Valor do pedido</label>
                  <Input
                    key={`${activeLead.id}:valor`}
                    defaultValue={activeLead.valor != null ? String(activeLead.valor) : ""}
                    onBlur={(event) => handleValorBlur(event.target.value)}
                    className="h-9 border-white/10 bg-white/[0.045]"
                    placeholder="R$ 0,00"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-muted-foreground">Observacoes internas</label>
                  <Textarea
                    key={`${activeLead.id}:obs`}
                    defaultValue={activeLead.observacoes ?? ""}
                    onBlur={(event) => handleNotesBlur(event.target.value)}
                    className="min-h-24 resize-none border-white/10 bg-white/[0.045]"
                    placeholder="Notas da equipe..."
                  />
                </div>
              </div>
            ) : (
              <div className="rounded-xl border border-yellow-500/20 bg-yellow-500/10 p-4 text-sm text-yellow-100">
                Esta conversa ainda nao esta vinculada a um lead. O vinculo automatico acontece quando o telefone do lead
                bate com o telefone da conversa.
              </div>
            )}

            {activeConversa && (
              <Button
                onClick={togglePause}
                disabled={pausing === activeConversa.session_id || activeConversa.status === "concluida"}
                variant={activeConversa.status === "pausada" ? "default" : "outline"}
                className="w-full gap-2"
              >
                {pausing === activeConversa.session_id ? (
                  "Aguarde..."
                ) : activeConversa.status === "pausada" ? (
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
          </div>
        ) : (
          <div className="flex h-full items-center justify-center text-sm text-muted-foreground">Selecione um contato.</div>
        )}
      </aside>
    </div>
  );
}
