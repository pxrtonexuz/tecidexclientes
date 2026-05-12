import { getLeads } from "@/app/actions/leads";
import { getAgentConfig } from "@/app/actions/agente";
import { DashboardClient } from "@/components/dashboard/dashboard-client";

export default async function DashboardPage() {
  const [leads, agentConfig] = await Promise.all([getLeads(), getAgentConfig()]);

  return (
    <DashboardClient
      agentAtivo={agentConfig?.ativo ?? false}
      leads={leads}
    />
  );
}
