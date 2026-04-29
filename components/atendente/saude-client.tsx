"use client";

import { useState, useTransition } from "react";
import { HealthGauge } from "@/components/atendente/health-gauge";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Power, Activity, Clock, Bot } from "lucide-react";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { toggleAgentAtivo, type AgentConfigRow } from "@/app/actions/agente";

const healthComponents = [
  { label: "Taxa de resposta (< 1 min, últimas 24h)", score: 27, maxScore: 30, detail: "90% das mensagens respondidas em < 1 min" },
  { label: "Taxa de erro (conversas sem erro, últimas 24h)", score: 24, maxScore: 30, detail: "80% das conversas sem erro registrado" },
  { label: "Uptime (últimas 24h)", score: 22, maxScore: 25, detail: "88% do tempo ativo" },
  { label: "Completude do fluxo (chegaram ao handoff)", score: 10, maxScore: 15, detail: "67% das conversas chegaram ao handoff" },
];

const totalScore = healthComponents.reduce((acc, c) => acc + c.score, 0);

export function SaudeClient({ initialConfig }: { initialConfig: AgentConfigRow | null }) {
  const [config, setConfig] = useState(initialConfig);
  const [toggling, setToggling] = useState(false);
  const [, startTransition] = useTransition();

  const agentActive = config?.ativo ?? true;
  const ultimaAtividade = config?.ultima_atividade ? new Date(config.ultima_atividade) : new Date();

  function handleToggle() {
    if (!config) return;
    const novoAtivo = !agentActive;
    setConfig((prev) => prev ? { ...prev, ativo: novoAtivo } : prev);
    setToggling(true);
    startTransition(() => {
      toggleAgentAtivo(config.id, novoAtivo).finally(() => setToggling(false));
    });
  }

  return (
    <div className="space-y-6">
      <div className="bg-card border border-border rounded-xl p-6">
        <div className="flex items-start gap-4 flex-wrap">
          <div className="w-16 h-16 rounded-2xl bg-primary/15 flex items-center justify-center shrink-0">
            <Bot className="w-8 h-8 text-primary" />
          </div>
          <div className="flex-1 space-y-1">
            <div className="flex items-center gap-3 flex-wrap">
              <h2 className="text-lg font-bold text-foreground">Nexuz AI Agent</h2>
              <Badge
                className={cn(
                  "text-xs border",
                  agentActive
                    ? "bg-emerald-500/15 text-emerald-400 border-emerald-500/20"
                    : "bg-red-500/15 text-red-400 border-red-500/20"
                )}
              >
                <span className={cn("w-1.5 h-1.5 rounded-full mr-1.5 inline-block", agentActive ? "bg-emerald-400 animate-pulse" : "bg-red-400")} />
                {agentActive ? "Ativo" : "Inativo"}
              </Badge>
            </div>
            <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
              <div className="flex items-center gap-1.5">
                <Activity className="w-3.5 h-3.5" />
                <span>Uptime do mês: <span className="text-foreground font-medium">94.2%</span></span>
              </div>
              <div className="flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5" />
                <span>
                  Última atividade:{" "}
                  <span className="text-foreground font-medium">
                    {format(ultimaAtividade, "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                  </span>
                </span>
              </div>
            </div>
          </div>
          <Button
            onClick={handleToggle}
            disabled={toggling}
            variant={agentActive ? "destructive" : "default"}
            className={cn("gap-2 cursor-pointer shrink-0", !agentActive && "bg-emerald-600 hover:bg-emerald-700")}
          >
            <Power className="w-4 h-4" />
            {toggling ? "Aguarde..." : agentActive ? "Desligar" : "Ligar"}
          </Button>
        </div>
        {!agentActive && (
          <div className="mt-4 text-sm text-yellow-400 bg-yellow-500/10 border border-yellow-500/20 rounded-lg px-4 py-3">
            Agente desligado — novos atendimentos estão pausados. Conversas em andamento continuam até o próximo handoff.
          </div>
        )}
      </div>

      <HealthGauge score={totalScore} components={healthComponents} />
    </div>
  );
}
