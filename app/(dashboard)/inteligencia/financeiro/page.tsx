import { getFinanceiroData } from "@/app/actions/inteligencia";
import { FinanceiroClient } from "@/components/inteligencia/financeiro-client";

export default async function FinanceiroPage() {
  const data = await getFinanceiroData();
  return <FinanceiroClient data={data} />;
}
