import { getPedidos } from "@/app/actions/operacao";
import { PedidosClient } from "@/components/pedidos/pedidos-client";

export default async function PedidosPage() {
  const pedidos = await getPedidos();
  return <PedidosClient initialPedidos={pedidos} />;
}
