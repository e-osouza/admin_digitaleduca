import Link from "next/link";
import { FormularioTrilha } from "@/components/formulario-trilha";
import {
  listarCategorias,
  listarConteudosParaTrilha,
  listarInstrutores,
  listarNomesDeTags,
  listarSubcategorias,
} from "@/lib/queries";

export const metadata = { title: "Nova trilha · Painel DigitalEduca" };

export default async function PaginaNovaTrilha() {
  const [conteudos, categorias, subcategorias, instrutores, nomesDeTags] =
    await Promise.all([
      listarConteudosParaTrilha(),
      listarCategorias(),
      listarSubcategorias(),
      listarInstrutores().catch(() => []),
      listarNomesDeTags().catch(() => []),
    ]);

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-5">
      <div>
        <Link
          href="/trilhas"
          className="text-texto-3 hover:text-texto text-sm transition-colors"
        >
          ← Trilhas
        </Link>
        <h1 className="text-texto mt-1 text-2xl font-semibold">Nova trilha</h1>
      </div>

      <FormularioTrilha
        conteudos={conteudos}
        categorias={categorias}
        subcategorias={subcategorias}
        instrutores={instrutores}
        nomesDeTags={nomesDeTags}
      />
    </div>
  );
}
