import Link from "next/link";
import { FormularioConteudo } from "@/components/formulario-conteudo";
import {
  listarCategorias,
  listarInstrutores,
  listarNomesDeTags,
  listarSubcategorias,
} from "@/lib/queries";

export const metadata = { title: "Novo conteúdo · Painel DigitalEduca" };

export default async function PaginaNovoConteudo() {
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
          href="/conteudos"
          className="text-texto-3 hover:text-texto text-sm transition-colors"
        >
          ← Conteúdos
        </Link>
        <h1 className="text-texto mt-1 text-2xl font-semibold">
          Novo conteúdo
        </h1>
      </div>

      <FormularioConteudo
        categorias={categorias}
        subcategorias={subcategorias}
        instrutores={instrutores}
        nomesDeTags={nomesDeTags}
      />
    </div>
  );
}
