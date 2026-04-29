"use client";

import { useState, useRef, useEffect } from "react";
import { createClient } from "@supabase/supabase-js";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Pause, Play, User, Bot, Clock, Wifi, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { pausarConversaIA, reativarConversaIA } from "@/app/actions/agente";
import type { ConversaData } from "@/app/actions/agente";

type ConversaStatus = "ativa" | "pausada" | "concluida";
type LocalConversa = Omit<ConversaData, "status"> & { status: ConversaStatus; pausedAt?: Date };

type RawHistoryRow = {
  id: number;
  session_id: string;
  message: { type: "human" | "ai"; content: string };
};

const statusColors: Record<ConversaStatus, string> = {
  ativa: "bg-emerald-500/15 text-emerald-400 border-emerald-500/20",
  pausada: "bg-yellow-500/15 text-yellow-400 border-yellow-500/20",
  concluida: "bg-muted text-muted-foreground border-border",
};

type Props = {
  initialConversas: ConversaData[];
  tenantUrl: string;
  tenantAnonKey: string;
};

export function ChatClient({ initialConversas, tenantUrl, tenantAnonKey }: Props) {
  const [conversas, setConversas] = useState<LocalConversa[]>(
    initialConversas.map((c) => ({ ...c, status: c.status as ConversaStatus }))
  );
  const [activeId, setActiveId] = useState(initialConversas[0]?.session_id ?? "");
  const [filter, setFilter] = useState<ConversaStatus | "all">("all");
  const [realtimeOk, setRealtimeOk] = useState(false);
  const [pausing, setPausing] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Supabase Realtime — escuta novos INSERT em n8n_chat_histories
  useEffect(() => {
    const db = createClient(tenantUrl, tenantAnonKey);

    const channel = db
      .channel("chat-realtime")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "n8n_chat_histories" },
        (payload) => {
          const row = payload.new as RawHistoryRow;
          const msg = {
            id: String(row.id),
            from: (row.message.type === "human" ? "cliente" : "agente") as "cliente" | "agente",
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
            // Nova conversa
            return [
              {
                session_id: row.session_id,
                clientName: row.session_id,
                status: "ativa",
                lastMessage: new Date().toISOString(),
                messages: [msg],
              },
              ...prev,
            ];
          });

          // Scroll automático se for a conversa ativa
          if (row.session_id === activeId) {
            setTimeout(() => {
              messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
            }, 50);
          }
        }
      )
      .subscribe((status) => {
        setRealtimeOk(status === "SUBSCRIBED");
      });

    return () => { db.removeChannel(channel); };
  }, [tenantUrl, tenantAnonKey, activeId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [activeId]);

  const active = conversas.find((c) => c.session_id === activeId);
  const filtered = conversas.filter((c) => filter === "all" || c.status === filter);

  async function togglePause(session_id: string) {
    const conversa = conversas.find((c) => c.session_id === session_id);
    if (!conversa) return;

    const pausando = conversa.status !== "pausada";
    setPausing(session_id);

    setConversas((prev) =>
      prev.map((c) => {
        if (c.session_id !== session_id) return c;
        const newStatus: ConversaStatus = pausando ? "pausada" : "ativa";
        return { ...c, status: newStatus, pausedAt: pausando ? new Date() : undefined };
      })
    );

    try {
      if (pausando) {
        await pausarConversaIA(session_id);
      } else {
        await reativarConversaIA(session_id);
      }
    } finally {
      setPausing(null);
    }
  }

  function isLongPaused(conv: LocalConversa) {
    if (conv.status !== "pausada" || !conv.pausedAt) return false;
    return Date.now() - conv.pausedAt.getTime() >= 2 * 60 * 60 * 1000;
  }

  if (conversas.length === 0) {
    return (
      <div className="flex h-[calc(100vh-12rem)] items-center justify-center rounded-xl border border-border text-muted-foreground">
        Nenhuma conversa encontrada.
      </div>
    );
  }

  return (
    <div className="flex h-[calc(100vh-12rem)] gap-0 rounded-xl border border-border overflow-hidden">
      {/* Sidebar */}
      <div className="w-72 shrink-0 flex flex-col border-r border-border bg-card">
        {/* Status realtime */}
        <div className="flex items-center justify-between px-4 py-2 border-b border-border bg-muted/30">
          <span className="text-xs text-muted-foreground">{conversas.length} conversas</span>
          <div className="flex items-center gap-1.5">
            <Wifi className={cn("w-3 h-3", realtimeOk ? "text-emerald-400" : "text-muted-foreground")} />
            <span className={cn("text-xs", realtimeOk ? "text-emerald-400" : "text-muted-foreground")}>
              {realtimeOk ? "Ao vivo" : "Conectando..."}
            </span>
          </div>
        </div>

        {/* Filter tabs */}
        <div className="flex border-b border-border p-2 gap-1">
          {(["all", "ativa", "pausada", "concluida"] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={cn(
                "flex-1 text-xs py-1.5 rounded-md font-medium cursor-pointer transition-colors",
                filter === f
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted"
              )}
            >
              {f === "all" ? "Todas" : f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>

        {/* List */}
        <ScrollArea className="flex-1">
          {filtered.map((conv) => (
            <button
              key={conv.session_id}
              onClick={() => setActiveId(conv.session_id)}
              className={cn(
                "w-full text-left px-4 py-3 border-b border-border cursor-pointer transition-colors hover:bg-muted/50",
                activeId === conv.session_id && "bg-muted/70",
                isLongPaused(conv) && "border-l-2 border-l-yellow-500"
              )}
            >
              <div className="flex items-center justify-between gap-2 mb-1">
                <span className="text-sm font-medium text-foreground truncate">{conv.clientName}</span>
                <Badge className={cn("text-xs border shrink-0", statusColors[conv.status])}>
                  {conv.status}
                </Badge>
              </div>
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <Clock className="w-3 h-3" />
                {format(new Date(conv.lastMessage), "dd/MM HH:mm", { locale: ptBR })}
                {isLongPaused(conv) && (
                  <span className="ml-1 text-yellow-400 font-medium">• Pausada +2h</span>
                )}
              </div>
              <p className="text-xs text-muted-foreground mt-0.5 truncate">
                {conv.messages.length} mensagens
              </p>
            </button>
          ))}
        </ScrollArea>
      </div>

      {/* Chat area */}
      {active ? (
        <div className="flex-1 flex flex-col">
          <div className="flex items-center justify-between px-5 py-3 border-b border-border bg-card">
            <div>
              <p className="font-semibold text-foreground">{active.clientName}</p>
              <Badge className={cn("text-xs border", statusColors[active.status])}>
                {active.status}
              </Badge>
            </div>
            {active.status !== "concluida" && (
              <Button
                size="sm"
                variant={active.status === "pausada" ? "default" : "outline"}
                disabled={pausing === active.session_id}
                className={cn(
                  "gap-2 cursor-pointer",
                  active.status !== "pausada" && "border-border text-muted-foreground hover:text-foreground"
                )}
                onClick={() => togglePause(active.session_id)}
              >
                {pausing === active.session_id ? (
                  <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Aguarde...</>
                ) : active.status === "pausada" ? (
                  <><Play className="w-3.5 h-3.5" /> Retomar agente</>
                ) : (
                  <><Pause className="w-3.5 h-3.5" /> Pausar agente</>
                )}
              </Button>
            )}
          </div>

          <ScrollArea className="flex-1 px-5 py-4">
            <div className="space-y-4 max-w-2xl mx-auto">
              {active.messages.map((msg) => (
                <div
                  key={msg.id}
                  className={cn("flex gap-3", msg.from === "cliente" ? "flex-row" : "flex-row-reverse")}
                >
                  <div className={cn(
                    "w-8 h-8 rounded-full flex items-center justify-center shrink-0",
                    msg.from === "cliente" ? "bg-muted" : "bg-primary/15"
                  )}>
                    {msg.from === "cliente"
                      ? <User className="w-4 h-4 text-muted-foreground" />
                      : <Bot className="w-4 h-4 text-primary" />}
                  </div>
                  <div className={cn("max-w-xs lg:max-w-md", msg.from === "agente" && "items-end flex flex-col")}>
                    <div className={cn(
                      "rounded-2xl px-4 py-2.5 text-sm",
                      msg.from === "cliente"
                        ? "bg-muted text-foreground rounded-tl-sm"
                        : "bg-primary text-primary-foreground rounded-tr-sm"
                    )}>
                      {msg.text}
                    </div>
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>
          </ScrollArea>
        </div>
      ) : (
        <div className="flex-1 flex items-center justify-center text-muted-foreground">
          Selecione uma conversa
        </div>
      )}
    </div>
  );
}
