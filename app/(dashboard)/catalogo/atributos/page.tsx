import { getAtributos } from "@/app/actions/catalogo";
import { AtributosCrud } from "@/components/catalogo/catalog-crud";

export default async function AtributosPage() {
  const atributos = await getAtributos();
  return <AtributosCrud initialAtributos={atributos} />;
}
