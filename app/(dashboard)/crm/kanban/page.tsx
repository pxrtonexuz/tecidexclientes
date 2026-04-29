import { getLeads } from "@/app/actions/leads";
import { KanbanBoard } from "@/components/crm/kanban-board";

export default async function KanbanPage() {
  const leads = await getLeads();
  return <KanbanBoard initialLeads={leads} />;
}
