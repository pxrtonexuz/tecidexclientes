import { getLeads } from "@/app/actions/leads";
import { getAgentConfig } from "@/app/actions/agente";
import { DashboardClient } from "@/components/dashboard/dashboard-client";
import { requireTenantSession } from "@/lib/auth";

export default async function DashboardPage() {
  const [leads, agentConfig, { user, tenant }] = await Promise.all([
    getLeads(),
    getAgentConfig(),
    requireTenantSession(),
  ]);
  const preferredName =
    typeof user.user_metadata?.preferred_name === "string" && user.user_metadata.preferred_name.trim()
      ? user.user_metadata.preferred_name.trim()
      : tenant.company_name;

  return (
    <DashboardClient
      agentAtivo={agentConfig?.ativo ?? false}
      leads={leads}
      preferredName={preferredName}
    />
  );
}
