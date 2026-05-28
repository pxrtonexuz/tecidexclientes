import { getChatConversations } from "@/app/actions/agente";
import { getLeads } from "@/app/actions/leads";
import { CrmChatClient } from "@/components/crm/crm-chat-client";
import { requireTenantSession } from "@/lib/auth";

export default async function CrmConversasPage() {
  const [leads, conversas, { tenant }] = await Promise.all([
    getLeads(),
    getChatConversations(),
    requireTenantSession(),
  ]);

  return (
    <CrmChatClient
      initialLeads={leads}
      initialConversas={conversas}
      tenantUrl={tenant.supabase_url}
      tenantAnonKey={tenant.supabase_anon_key}
    />
  );
}
