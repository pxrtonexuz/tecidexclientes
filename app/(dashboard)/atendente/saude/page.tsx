import { getAgentConfig } from "@/app/actions/agente";
import { getSaudeMetrics } from "@/app/actions/inteligencia";
import { requireTenantSession } from "@/lib/auth";
import { SaudeClient } from "@/components/atendente/saude-client";

export default async function SaudePage() {
  const [config, metrics, { tenant }] = await Promise.all([
    getAgentConfig(),
    getSaudeMetrics(),
    requireTenantSession(),
  ]);

  return (
    <SaudeClient
      initialConfig={config}
      companyName={tenant.company_name}
      completude={metrics.completude}
    />
  );
}
