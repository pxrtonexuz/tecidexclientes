import { getClientes } from "@/app/actions/operacao";
import { ClientesClient } from "@/components/clientes/clientes-client";

export default async function ClientesPage() {
  const clientes = await getClientes();
  return <ClientesClient initialClientes={clientes} />;
}
