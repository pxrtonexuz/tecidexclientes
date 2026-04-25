"use client";

import { useState, useRef, useEffect } from "react";
import { format, differenceInHours } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Pause, Play, User, Bot, Clock } from "lucide-react";
import { cn } from "@/lib/utils";

type ConversationStatus = "ativa" | "pausada" | "concluida";

type Message = {
  id: string;
  from: "cliente" | "agente";
  text: string;
  at: Date;
};

type Conversation = {
  id: string;
  clientName: string;
  status: ConversationStatus;
  phase: string;
  lastMessage: Date;
  pausedAt?: Date;
  messages: Message[];
};

const mockConversations: Conversation[] = [
  {
    id: "1", clientName: "Ana Souza", status: "ativa", phase: "Apresentação de modelos",
    lastMessage: new Date(2025, 3, 24, 14, 35),
    messages: [
      { id: "m1", from: "cliente", text: "Oi, quero fazer uma camiseta personalizada pra empresa", at: new Date(2025, 3, 24, 14, 30) },
      { id: "m2", from: "agente", text: "Olá! Que ótimo! Temos várias opções incríveis. Você prefere polo, regata ou camiseta básica?", at: new Date(2025, 3, 24, 14, 31) },
      { id: "m3", from: "cliente", text: "Polo seria melhor pra uniformes de empresa", at: new Date(2025, 3, 24, 14, 33) },
      { id: "m4", from: "agente", text: "Perfeito! Temos a Polo Feminina e a Polo Masculina. Qual o perfil do seu time?", at: new Date(2025, 3, 24, 14, 35) },
    ],
  },
  {
    id: "2", clientName: "Bruno Lima", status: "pausada", phase: "Seleção de tecido",
    lastMessage: new Date(2025, 3, 24, 12, 10),
    pausedAt: new Date(2025, 3, 24, 12, 10),
    messages: [
      { id: "m5", from: "cliente", text: "Qual tecido é melhor pra usar no calor?", at: new Date(2025, 3, 24, 12, 5) },
      { id: "m6", from: "agente", text: "Para o calor recomendo o Dry Fit — é leve, fresco e seca rápido!", at: new Date(2025, 3, 24, 12, 7) },
      { id: "m7", from: "cliente", text: "Tem foto do tecido?", at: new Date(2025, 3, 24, 12, 10) },
    ],
  },
  {
    id: "3", clientName: "Carla Dias", status: "concluida", phase: "Handoff concluído",
    lastMessage: new Date(2025, 3, 23, 16, 0),
    messages: [
      { id: "m8", from: "agente", text: "Ótimo! Vou transferir você para um de nossos consultores para finalizar o pedido.", at: new Date(2025, 3, 23, 16, 0) },
    ],
  },
];

const statusColors: Record<ConversationStatus, string> = {
  ativa: "bg-emerald-500/15 text-emerald-400 border-emerald-500/20",
  pausada: "bg-yellow-500/15 text-yellow-400 border-yellow-500/20",
  concluida: "bg-muted text-muted-foreground border-border",
};

export default function ChatPage() {
  const [conversations, setConversations] = useState(mockConversations);
  const [activeId, setActiveId] = useState("1");
  const [filter, setFilter] = useState<ConversationStatus | "all">("all");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const active = conversations.find((c) => c.id === activeId);

  const filtered = conversations.filter((c) =>
    filter === "all" || c.status === filter
  );

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [activeId]);

  function togglePause(id: string) {
    setConversations((prev) =>
      prev.map((c) => {
        if (c.id !== id) return c;
        const newStatus: ConversationStatus = c.status === "pausada" ? "ativa" : "pausada";
        return {
          ...c,
          status: newStatus,
          pausedAt: newStatus === "pausada" ? new Date() : undefined,
        };
        // TODO: UPDATE conversas SET agente_pausado = true/false, pausa_timestamp = NOW() WHERE id = id
      })
    );
  }

  function isLongPaused(conv: Conversation) {
    return conv.status === "pausada" && conv.pausedAt && differenceInHours(new Date(), conv.pausedAt) >= 2;
  }

  return (
    <div className="flex h-[calc(100vh-12rem)] gap-0 rounded-xl border border-border overflow-hidden">
      {/* Sidebar */}
      <div className="w-72 shrink-0 flex flex-col border-r border-border bg-card">
        {/* Filter tabs */}
        <div className="flex border-b border-border p-2 gap-1">
          {(["all", "ativa", "pausada", "concluida"] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={cn(
                "flex-1 text-xs py-1.5 rounded-md font-medium cursor-pointer transition-colors",
                filter === f ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground hover:bg-muted"
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
              key={conv.id}
              onClick={() => setActiveId(conv.id)}
              className={cn(
                "w-full text-left px-4 py-3 border-b border-border cursor-pointer transition-colors",
                "hover:bg-muted/50",
                activeId === conv.id && "bg-muted/70",
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
                {format(conv.lastMessage, "HH:mm", { locale: ptBR })}
                {isLongPaused(conv) && (
                  <span className="ml-1 text-yellow-400 font-medium">• Pausada +2h</span>
                )}
              </div>
              <p className="text-xs text-muted-foreground mt-0.5 truncate">{conv.phase}</p>
            </button>
          ))}
        </ScrollArea>
      </div>

      {/* Chat area */}
      {active ? (
        <div className="flex-1 flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between px-5 py-3 border-b border-border bg-card">
            <div>
              <p className="font-semibold text-foreground">{active.clientName}</p>
              <div className="flex items-center gap-2">
                <Badge className={cn("text-xs border", statusColors[active.status])}>
                  {active.status}
                </Badge>
                <span className="text-xs text-muted-foreground">Fase: {active.phase}</span>
              </div>
            </div>
            {active.status !== "concluida" && (
              <Button
                size="sm"
                variant={active.status === "pausada" ? "default" : "outline"}
                className={cn(
                  "gap-2 cursor-pointer",
                  active.status !== "pausada" && "border-border text-muted-foreground hover:text-foreground"
                )}
                onClick={() => togglePause(active.id)}
              >
                {active.status === "pausada" ? (
                  <><Play className="w-3.5 h-3.5" /> Retomar agente</>
                ) : (
                  <><Pause className="w-3.5 h-3.5" /> Pausar agente</>
                )}
              </Button>
            )}
          </div>

          {/* Messages */}
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
                      : <Bot className="w-4 h-4 text-primary" />
                    }
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
                    <span className="text-xs text-muted-foreground mt-1 px-1">
                      {format(msg.at, "HH:mm", { locale: ptBR })}
                    </span>
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
