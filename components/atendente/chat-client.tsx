"use client";

import { useState, useRef, useEffect } from "react";
import { createClient } from "@supabase/supabase-js";
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
  ativa: "bg-[#39d98a]/15 text-[#39d98a] border-[#39d98a]/20",
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

  // Ref para o activeId — evita recriar o canal Realtime ao trocar de conversa
  const activeIdRef = useRef(activeId);
  useEffect(() => {
    activeIdRef.current = activeId;
  }, [activeId]);

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
            return [
              {
                session_id: row.session_id,
                clientName: row.session_id.split("@")[0],
                status: "ativa" as ConversaStatus,
                lastMessage: new Date().toISOString(),
                messages: [msg],
              },
              ...prev,
            ];
          });

          if (row.session_id === activeIdRef.current) {
            setTimeout(() => {
              messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
            }, 50);
          }
        }
      )
      .subscribe((status) => {
        setRealtimeOk(status === "SUBSCRIBED");
      });

    return () => {
      db.removeChannel(channel);
    };
  }, [tenantUrl, tenantAnonKey]); // activeId removido — usa ref para não recriar canal

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

  function formatLastMessage(conv: LocalConversa): string {
    if (conv.lastMessage) {
      try {
        const d = new Date(conv.lastMessage);
        return `${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")} ${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
      } catch {
        return "—";
      }
    }
    return "—";
  }

  const glassPanel: React.CSSProperties = {
    background: "rgba(255, 255, 255, 0.045)",
    backdropFilter: "blur(22px) saturate(160%)",
    WebkitBackdropFilter: "blur(22px) saturate(160%)",
    border: "1px solid rgba(255, 255, 255, 0.12)",
    boxShadow: "0 8px 32px rgba(0, 0, 0, 0.3)",
  };

  if (conversas.length === 0) {
    return (
      <div
        className="flex h-[calc(100vh-12rem)] items-center justify-center rounded-[16px] text-muted-foreground"
        style={glassPanel}
      >
        Nenhuma conversa encontrada.
      </div>
    );
  }

  return (
    <div className="flex h-[calc(100vh-12rem)] gap-0 rounded-[16px] overflow-hidden" style={glassPanel}>
      {/* Sidebar */}
      <div
        className="w-72 shrink-0 flex flex-col"
        style={{ borderRight: "1px solid rgba(255, 255, 255, 0.10)", background: "rgba(255, 255, 255, 0.035)" }}
      >
        {/* Status realtime */}
        <div
          className="flex items-center justify-between px-4 py-2"
          style={{ borderBottom: "1px solid rgba(255, 255, 255, 0.09)", background: "rgba(255, 255, 255, 0.045)" }}
        >
          <span className="text-xs text-muted-foreground">{conversas.length} conversas</span>
          <div className="flex items-center gap-1.5">
            <Wifi className={cn("w-3 h-3", realtimeOk ? "text-[#39d98a]" : "text-muted-foreground")} />
            <span className={cn("text-xs", realtimeOk ? "text-[#39d98a]" : "text-muted-foreground")}>
              {realtimeOk ? "Ao vivo" : "Conectando..."}
            </span>
          </div>
        </div>

        {/* Filter tabs */}
        <div className="flex p-2 gap-1" style={{ borderBottom: "1px solid rgba(255, 255, 255, 0.09)" }}>
          {(["all", "ativa", "pausada", "concluida"] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={cn(
                "flex-1 text-xs py-1.5 rounded-[8px] font-medium cursor-pointer transition-all duration-180",
                filter === f ? "text-white" : "text-muted-foreground hover:text-foreground"
              )}
              style={filter === f ? { background: "#0f6b3f", boxShadow: "0 0 10px rgba(57,217,138,0.20)" } : undefined}
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
                "w-full text-left px-4 py-3 cursor-pointer transition-colors",
                isLongPaused(conv) && "border-l-2 border-l-yellow-500"
              )}
              style={{
                borderBottom: "1px solid rgba(255, 255, 255, 0.075)",
                background: activeId === conv.session_id ? "rgba(255, 255, 255, 0.085)" : undefined,
              }}
              onMouseEnter={(e) => {
                if (activeId !== conv.session_id)
                  (e.currentTarget as HTMLButtonElement).style.background = "rgba(255, 255, 255, 0.055)";
              }}
              onMouseLeave={(e) => {
                if (activeId !== conv.session_id)
                  (e.currentTarget as HTMLButtonElement).style.background = "transparent";
              }}
            >
              <div className="flex items-center justify-between gap-2 mb-1">
                <span className="text-sm font-medium text-foreground truncate">{conv.clientName}</span>
                <Badge className={cn("text-xs border shrink-0", statusColors[conv.status])}>
                  {conv.status}
                </Badge>
              </div>
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <Clock className="w-3 h-3" />
                {formatLastMessage(conv)}
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
          <div
            className="flex items-center justify-between px-5 py-3"
            style={{ borderBottom: "1px solid rgba(255, 255, 255, 0.09)", background: "rgba(255, 255, 255, 0.035)" }}
          >
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
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" /> Aguarde...
                  </>
                ) : active.status === "pausada" ? (
                  <>
                    <Play className="w-3.5 h-3.5" /> Retomar agente
                  </>
                ) : (
                  <>
                    <Pause className="w-3.5 h-3.5" /> Pausar agente
                  </>
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
                  <div
                    className={cn(
                      "w-8 h-8 rounded-full flex items-center justify-center shrink-0",
                      msg.from === "cliente" ? "bg-muted" : "bg-primary/15"
                    )}
                  >
                    {msg.from === "cliente" ? (
                      <User className="w-4 h-4 text-muted-foreground" />
                    ) : (
                      <Bot className="w-4 h-4 text-primary" />
                    )}
                  </div>
                  <div className={cn("max-w-xs lg:max-w-md", msg.from === "agente" && "items-end flex flex-col")}>
                    <div
                      className="px-4 py-2.5 text-sm"
                      style={
                        msg.from === "cliente"
                          ? {
                              background: "rgba(255, 255, 255, 0.075)",
                              border: "1px solid rgba(255, 255, 255, 0.11)",
                              color: "var(--foreground)",
                              borderRadius: "18px 18px 18px 4px",
                            }
                          : { background: "#0f6b3f", color: "#fff", borderRadius: "18px 18px 4px 18px" }
                      }
                    >
                      {msg.text}
                    </div>
                    {msg.at && (
                      <p className="text-xs text-muted-foreground mt-1 px-1">
                        {new Date(msg.at).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
                      </p>
                    )}
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
