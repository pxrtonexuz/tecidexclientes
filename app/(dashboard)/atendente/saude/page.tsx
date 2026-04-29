import { getAgentConfig } from "@/app/actions/agente";
import { SaudeClient } from "@/components/atendente/saude-client";

export default async function SaudePage() {
  const config = await getAgentConfig();
  return <SaudeClient initialConfig={config} />;
}
