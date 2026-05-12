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

type Props = {
  initialConfig: AgentConfigRow | null;
  companyName: string;
  completude: number;
};

export function SaudeClient({ initialConfig, companyName, completude }: Props) {
  const [config, setConfig] = useState(initialConfig);
  const [toggling, setToggling] = useState(false);
  const [, startTransition] = useTransition();

  const agentActive = config?.ativo ?? false;
  const ultimaAtividade = config?.ultima_atividade ? new Date(config.ultima_atividade) : null;

  const healthComponents = [
    {
      label: "Taxa de resposta (< 1 min, últimas 24h)",
      score: 0,
      maxScore: 30,
      detail: "Monitoramento em desenvolvimento — requer log de timestamps por mensagem",
    },
    {
      label: "Taxa de erro (conversas sem erro, últimas 24h)",
      score: 0,
      maxScore: 30,
      detail: "Monitoramento em desenvolvimento — requer log de erros no agente",
    },
    {
      label: "Uptime (últimas 24h)",
      score: 0,
      maxScore: 25,
      detail: "Monitoramento em desenvolvimento — requer infraestrutura de heartbeat",
    },
    {
      label: "Completude do fluxo (chegaram ao fechamento)",
      score: Math.round((completude / 100) * 15),
      maxScore: 15,
      detail: `${completude.toFixed(1)}% dos leads chegaram ao pedido fechado ou venda concluída`,
    },
  ];

  function handleToggle() {
    if (!config) return;
    const novoAtivo = !agentActive;
    setConfig((prev) => (prev ? { ...prev, ativo: novoAtivo } : prev));
    setToggling(true);
    startTransition(() => {
      toggleAgentAtivo(config.id, novoAtivo).finally(() => setToggling(false));
    });
  }

  return (
    <div className="space-y-6">
      <div
        className="p-6 rounded-[16px]"
        style={{
          background: "rgba(255, 255, 255, 0.045)",
          backdropFilter: "blur(22px) saturate(160%)",
          WebkitBackdropFilter: "blur(22px) saturate(160%)",
          border: "1px solid rgba(255, 255, 255, 0.12)",
          boxShadow: "0 8px 32px rgba(0, 0, 0, 0.3)",
        }}
      >
        <div className="flex items-start gap-4 flex-wrap">
          <div className="w-16 h-16 rounded-2xl bg-primary/15 flex items-center justify-center shrink-0">
            <Bot className="w-8 h-8 text-primary" />
          </div>
          <div className="flex-1 space-y-1">
            <div className="flex items-center gap-3 flex-wrap">
              <h2 className="text-lg font-bold text-foreground">{companyName} — Agente de IA</h2>
              <Badge
                className={cn(
                  "text-xs border",
                  agentActive
                    ? "bg-[#39d98a]/15 text-[#39d98a] border-[#39d98a]/20"
                    : "bg-red-500/15 text-red-400 border-red-500/20"
                )}
              >
                <span
                  className={cn(
                    "w-1.5 h-1.5 rounded-full mr-1.5 inline-block",
                    agentActive ? "bg-[#39d98a] animate-pulse" : "bg-red-400"
                  )}
                />
                {agentActive ? "Ativo" : "Inativo"}
              </Badge>
            </div>
            <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
              <div className="flex items-center gap-1.5">
                <Activity className="w-3.5 h-3.5" />
                <span>
                  Completude do fluxo:{" "}
                  <span className="text-foreground font-medium">{completude.toFixed(1)}%</span>
                </span>
              </div>
              {ultimaAtividade && (
                <div className="flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5" />
                  <span>
                    Última atividade:{" "}
                    <span className="text-foreground font-medium">
                      {format(ultimaAtividade, "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                    </span>
                  </span>
                </div>
              )}
            </div>
          </div>
          <Button
            onClick={handleToggle}
            disabled={toggling || !config}
            variant={agentActive ? "destructive" : "default"}
            className={cn("gap-2 cursor-pointer shrink-0", !agentActive && "bg-[#0f6b3f] hover:bg-[#15834f]")}
          >
            <Power className="w-4 h-4" />
            {toggling ? "Aguarde..." : agentActive ? "Desligar" : "Ligar"}
          </Button>
        </div>
        {!agentActive && config && (
          <div className="mt-4 text-sm text-yellow-400 bg-yellow-500/10 border border-yellow-500/20 rounded-lg px-4 py-3">
            Agente desligado — novos atendimentos estão pausados. Conversas em andamento continuam até o próximo handoff.
          </div>
        )}
        {!config && (
          <div className="mt-4 text-sm text-muted-foreground bg-muted/10 border border-border rounded-lg px-4 py-3">
            Configuração do agente não encontrada no banco de dados.
          </div>
        )}
      </div>

      <div className="space-y-2">
        <HealthGauge score={Math.round(completude)} components={healthComponents} />
        <p className="text-xs text-muted-foreground text-center">
          Score baseado apenas em completude de fluxo — demais métricas em desenvolvimento
        </p>
      </div>
    </div>
  );
}
