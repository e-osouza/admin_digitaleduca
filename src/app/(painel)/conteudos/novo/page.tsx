import Link from "next/link";
import type { TipoConteudo } from "@/types/api";
import { FormularioConteudo } from "@/components/formulario-conteudo";
import {
  listarCategorias,
  listarInstrutores,
  listarNomesDeTags,
  listarSubcategorias,
} from "@/lib/queries";

export const metadata = { title: "Novo conteúdo · Painel DigitalEduca" };

/** De onde veio, para onde volta e como se chama o que está sendo criado. */
const ORIGEM: Record<string, { titulo: string; volta: string; rotulo: string }> =
  {
    CURSO: { titulo: "Novo curso", volta: "/cursos", rotulo: "Cursos" },
    TRILHA: { titulo: "Nova trilha", volta: "/trilhas", rotulo: "Trilhas" },
    AULA: {
      titulo: "Nova MasterClass",
      volta: "/conteudos",
      rotulo: "MasterClass",
    },
  };

export default async function PaginaNovoConteudo({
  searchParams,
}: {
  searchParams: Promise<{ tipo?: string }>;
}) {
  const { tipo: bruto } = await searchParams;
  /*
    O tipo vem da tela que abriu esta — não de um select. Valor desconhecido
    cai em MasterClass, que é o caso comum e o que a rota fazia antes.
  */
  const tipo = (bruto && ORIGEM[bruto] ? bruto : "AULA") as TipoConteudo;
  const origem = ORIGEM[tipo] ?? ORIGEM.AULA;
  const [categorias, subcategorias, instrutores, nomesDeTags] =
    await Promise.all([
      listarCategorias(),
      listarSubcategorias(),
      listarInstrutores().catch(() => []),
      listarNomesDeTags().catch(() => []),
    ]);

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-5">
      <div>
        <Link
          href={origem.volta}
          className="text-texto-3 hover:text-texto text-sm transition-colors"
        >
          ← {origem.rotulo}
        </Link>
        <h1 className="text-texto mt-1 text-2xl font-semibold">
          {origem.titulo}
        </h1>
      </div>

      <FormularioConteudo
        tipo={tipo}
        categorias={categorias}
        subcategorias={subcategorias}
        instrutores={instrutores}
        nomesDeTags={nomesDeTags}
      />
    </div>
  );
}
