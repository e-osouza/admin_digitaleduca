import Link from "next/link";
import { FormularioTrilha } from "@/components/formulario-trilha";
import {
  listarCategorias,
  listarConteudosParaAgrupar,
  listarInstrutores,
  listarNomesDeTags,
  listarSubcategorias,
} from "@/lib/queries";

export const metadata = { title: "Nova formação · Painel DigitalEduca" };

export default async function PaginaNovaTrilha({
  searchParams,
}: {
  searchParams: Promise<{ tipo?: string }>;
}) {
  /*
    A mesma tela cria os dois: curso e trilha são o mesmo registro. O `?tipo=`
    diz qual, e sem ele o padrão é TRILHA — que é o comportamento que a rota
    tinha antes de existirem cursos.
  */
  const { tipo: tipoBruto } = await searchParams;
  const tipo = tipoBruto === "CURSO" ? "CURSO" : "TRILHA";
  const curso = tipo === "CURSO";
  const [conteudos, categorias, subcategorias, instrutores, nomesDeTags] =
    await Promise.all([
      listarConteudosParaAgrupar(),
      listarCategorias(),
      listarSubcategorias(),
      listarInstrutores().catch(() => []),
      listarNomesDeTags().catch(() => []),
    ]);

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-5">
      <div>
        <Link
          href={curso ? "/cursos" : "/trilhas"}
          className="text-texto-3 hover:text-texto text-sm transition-colors"
        >
          ← {curso ? "Cursos" : "Trilhas"}
        </Link>
        <h1 className="text-texto mt-1 text-2xl font-semibold">
          {curso ? "Novo curso" : "Nova trilha"}
        </h1>
      </div>

      <FormularioTrilha
        tipo={tipo}
        conteudos={conteudos}
        categorias={categorias}
        subcategorias={subcategorias}
        instrutores={instrutores}
        nomesDeTags={nomesDeTags}
      />
    </div>
  );
}
