import Link from "next/link";
import { FormularioPodcast } from "@/components/formulario-podcast";
import {
  listarCategorias,
  listarInstrutores,
  listarNomesDeTags,
  listarSubcategorias,
} from "@/lib/queries";

export const metadata = { title: "Novo episódio · Painel DigitalEduca" };

export default async function PaginaNovoPodcast() {
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
          href="/podcasts"
          className="text-texto-3 hover:text-texto text-sm transition-colors"
        >
          ← Podcasts
        </Link>
        <h1 className="text-texto mt-1 text-2xl font-semibold">
          Novo episódio
        </h1>
      </div>

      <FormularioPodcast
        categorias={categorias}
        subcategorias={subcategorias}
        instrutores={instrutores}
        nomesDeTags={nomesDeTags}
      />
    </div>
  );
}
