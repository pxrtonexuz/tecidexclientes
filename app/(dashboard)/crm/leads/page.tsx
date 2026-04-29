import { getLeads } from "@/app/actions/leads";
import { LeadsTable } from "@/components/crm/leads-table";

export default async function LeadsPage() {
  const leads = await getLeads();
  return <LeadsTable initialLeads={leads} />;
}
