import { getChatConversations } from "@/app/actions/agente";
import { requireTenantSession } from "@/lib/auth";
import { ChatClient } from "@/components/atendente/chat-client";

export default async function ChatPage() {
  const [conversas, { tenant }] = await Promise.all([
    getChatConversations(),
    requireTenantSession(),
  ]);

  return (
    <ChatClient
      initialConversas={conversas}
      tenantUrl={tenant.supabase_url}
      tenantAnonKey={tenant.supabase_anon_key}
    />
  );
}
