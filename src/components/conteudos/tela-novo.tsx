import Link from "next/link";
import type { TipoConteudo } from "@/types/api";
import { FormularioConteudo } from "@/components/formulario-conteudo";
import {
  listarCategorias,
  listarInstrutores,
  listarNomesDeTags,
  listarSubcategorias,
} from "@/lib/queries";

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

/**
 * Criação de conteúdo — serve MasterClass, Curso e Trilha.
 *
 * O tipo vem da ROTA, não de um select: `/cursos/novo` cria curso. É isso que
 * mantém o menu lateral acendendo o item certo e impede criar um tipo que não
 * corresponde à tela de origem.
 */
export async function TelaNovoConteudo({ tipo }: { tipo: TipoConteudo }) {
  const origem = ORIGEM[tipo] ?? ORIGEM.AULA;
  const [categorias, subcategorias, instrutores, nomesDeTags] =
    await Promise.all([
      listarCategorias(),
      listarSubcategorias(),
      listarInstrutores().catch(() => []),
      listarNomesDeTags().catch(() => []),
    ]);

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-5">
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
