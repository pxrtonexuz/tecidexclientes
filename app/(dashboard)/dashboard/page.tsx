import { getLeads } from "@/app/actions/leads";
import { getAgentConfig } from "@/app/actions/agente";
import { DashboardClient } from "@/components/dashboard/dashboard-client";

export default async function DashboardPage() {
  const [leads, agentConfig] = await Promise.all([getLeads(), getAgentConfig()]);

  const totalLeads = leads.length;
  const pedidosConfirmados = leads.filter((l) => l.status === "pedido_confirmado").length;
  const faturamento = leads
    .filter((l) => l.status === "pedido_confirmado" && l.valor)
    .reduce((acc, l) => acc + (l.valor ?? 0), 0);
  const ticketMedio = pedidosConfirmados > 0 ? faturamento / pedidosConfirmados : 0;
  const taxaConversao = totalLeads > 0 ? (pedidosConfirmados / totalLeads) * 100 : 0;

  return (
    <DashboardClient
      agentAtivo={agentConfig?.ativo ?? true}
      totalLeads={totalLeads}
      pedidosConfirmados={pedidosConfirmados}
      faturamento={faturamento}
      ticketMedio={ticketMedio}
      taxaConversao={taxaConversao}
    />
  );
}
