import { getModelos } from "@/app/actions/catalogo";
import { ModelosCrud } from "@/components/catalogo/catalog-crud";

export default async function ModelosPage() {
  const modelos = await getModelos();
  return <ModelosCrud initialModelos={modelos} />;
}
