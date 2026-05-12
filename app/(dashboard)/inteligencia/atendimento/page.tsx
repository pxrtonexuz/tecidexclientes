import { getAtendimentoData } from "@/app/actions/inteligencia";
import { AtendimentoClient } from "@/components/inteligencia/atendimento-client";

export default async function AtendimentoPage() {
  const data = await getAtendimentoData();
  return <AtendimentoClient data={data} />;
}
