import { getTecidos } from "@/app/actions/catalogo";
import { TecidosCrud } from "@/components/catalogo/catalog-crud";

export default async function TecidosPage() {
  const tecidos = await getTecidos();
  return <TecidosCrud initialTecidos={tecidos} />;
}
