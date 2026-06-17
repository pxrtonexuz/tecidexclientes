import { getChatConversations } from "@/app/actions/agente";
import { getLeads } from "@/app/actions/leads";
import { getWhatsAppConnection } from "@/app/actions/whatsapp";
import { CrmChatClient } from "@/components/crm/crm-chat-client";
import { requireTenantSession } from "@/lib/auth";

export default async function CrmConversasPage() {
  const [leads, conversas, whatsappConnection, { tenant }] = await Promise.all([
    getLeads(),
    getChatConversations(),
    getWhatsAppConnection(),
    requireTenantSession(),
  ]);

  return (
    <CrmChatClient
      initialLeads={leads}
      initialConversas={conversas}
      initialWhatsappConnection={whatsappConnection}
      tenantUrl={tenant.supabase_url}
      tenantAnonKey={tenant.supabase_anon_key}
    />
  );
}
