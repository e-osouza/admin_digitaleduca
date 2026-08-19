import Link from "next/link";
import {
  AbaCategorias,
  AbaSubcategorias,
  AbaTags,
} from "@/components/taxonomia/abas";
import {
  listarCategoriasComUso,
  listarSubcategorias,
  listarTags,
} from "@/lib/queries";

export const metadata = { title: "Categorias e tags · Painel DigitalEduca" };

const ABAS = [
  { id: "categorias", rotulo: "Categorias" },
  { id: "subcategorias", rotulo: "Subcategorias" },
  { id: "tags", rotulo: "Tags" },
] as const;

type IdAba = (typeof ABAS)[number]["id"];

export default async function PaginaTaxonomia({
  searchParams,
}: {
  searchParams: Promise<{ aba?: string }>;
}) {
  const { aba } = await searchParams;
  const ativa: IdAba = ABAS.some((item) => item.id === aba)
    ? (aba as IdAba)
    : "categorias";

  const [categorias, subcategorias, tags] = await Promise.all([
    listarCategoriasComUso(),
    listarSubcategorias(),
    listarTags(),
  ]);

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h1 className="text-texto text-2xl font-semibold">Categorias e tags</h1>
        <p className="text-texto-3 mt-0.5 text-sm">
          {categorias.length} categorias · {subcategorias.length} subcategorias
          · {tags.length} tags
        </p>
      </div>

      <nav className="border-borda-suave flex gap-1 border-b">
        {ABAS.map((item) => (
          <Link
            key={item.id}
            href={`/taxonomia?aba=${item.id}`}
            aria-current={item.id === ativa ? "page" : undefined}
            className={
              item.id === ativa
                ? "border-acento text-acento -mb-px border-b-2 px-3 py-2 text-sm font-semibold"
                : "text-texto-2 hover:text-texto -mb-px border-b-2 border-transparent px-3 py-2 text-sm font-medium"
            }
          >
            {item.rotulo}
          </Link>
        ))}
      </nav>

      {ativa === "categorias" && (
        <AbaCategorias
          categorias={categorias.map((c) => ({
            id: c.id,
            nome: c.nome,
            uso: c.conteudos,
          }))}
        />
      )}

      {ativa === "subcategorias" && (
        <AbaSubcategorias
          subcategorias={subcategorias.map((sub) => ({
            id: sub.id,
            nome: sub.nome,
            uso: sub._count?.conteudos ?? 0,
            /*
             * O vínculo é N:N — 5 das 8 subcategorias pertencem a mais de uma
             * categoria. Listamos todas, em vez de só a primeira.
             */
            categorias: (sub.categorias ?? []).map((v) => v.categoria.nome),
          }))}
          categorias={categorias.map((c) => ({ id: c.id, nome: c.nome }))}
        />
      )}

      {ativa === "tags" && (
        <AbaTags
          tags={tags.map((tag) => ({
            id: tag.id,
            nome: tag.nome,
            uso: (tag.totalConteudos ?? 0) + (tag.totalTrilhas ?? 0),
          }))}
        />
      )}
    </div>
  );
}
