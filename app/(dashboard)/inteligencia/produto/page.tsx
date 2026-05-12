import { getProdutoData } from "@/app/actions/inteligencia";
import { ProdutoClient } from "@/components/inteligencia/produto-client";

export default async function ProdutoPage() {
  const data = await getProdutoData();
  return <ProdutoClient data={data} />;
}
