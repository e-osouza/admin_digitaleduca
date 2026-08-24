import { TelaPorTipo } from "@/components/conteudos/tela-por-tipo";

export const metadata = { title: "Cursos · Painel DigitalEduca" };

export default async function PaginaCursos({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  return (
    <TelaPorTipo
      tipo="CURSO"
      titulo="Cursos"
      singular="curso"
      pluralNome="cursos"
      novo="Novo curso"
      base="/cursos"
      criarEm="/conteudos/novo?tipo=CURSO"
      searchParams={await searchParams}
    />
  );
}
