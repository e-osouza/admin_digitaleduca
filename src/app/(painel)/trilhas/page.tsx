import { TelaPorTipo } from "@/components/conteudos/tela-por-tipo";

export const metadata = { title: "Trilhas · Painel DigitalEduca" };

export default async function PaginaTrilhas({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  return (
    <TelaPorTipo
      tipo="TRILHA"
      titulo="Trilhas"
      singular="trilha"
      pluralNome="trilhas"
      novo="Nova trilha"
      base="/trilhas"
      feminino
      criarEm="/trilhas/novo"
      searchParams={await searchParams}
    />
  );
}
