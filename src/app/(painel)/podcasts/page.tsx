import Image from "next/image";
import Link from "next/link";
import { Paginacao } from "@/components/paginacao";
import { LIMITE_MAXIMO_BUSCA, buscarConteudos } from "@/lib/queries";
import type { ConteudoBusca } from "@/types/api";

export const metadata = { title: "Podcasts · Painel DigitalEduca" };

const data = new Intl.DateTimeFormat("pt-BR", { dateStyle: "short" });

export default async function PaginaPodcasts({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const brutos = await searchParams;
  const pagina = Number(brutos.page);

  const resultado = await buscarConteudos({
    // Fixo: esta tela é só de podcasts.
    tipo: "PODCAST",
    page: Number.isFinite(pagina) && pagina > 0 ? pagina : 1,
    limit: LIMITE_MAXIMO_BUSCA,
  });

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-texto text-2xl font-semibold">Podcasts</h1>
          <p className="text-texto-3 mt-0.5 text-sm">
            {resultado.pagination.total}{" "}
            {resultado.pagination.total === 1 ? "episódio" : "episódios"}
          </p>
        </div>

        <Link
          href="/podcasts/novo"
          className="bg-acento hover:bg-acento-hover rounded-lg px-4 py-2.5 text-sm font-semibold text-white transition-colors"
        >
          Novo episódio
        </Link>
      </div>

      {resultado.data.length === 0 ? (
        <p className="border-borda-suave bg-superficie text-texto-2 rounded-xl border p-8 text-center text-sm">
          Nenhum episódio cadastrado ainda.
        </p>
      ) : (
        <div className="border-borda-suave bg-superficie overflow-hidden rounded-xl border">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[44rem] text-sm">
              <thead>
                <tr className="border-borda-suave text-texto-3 border-b text-left">
                  <th scope="col" className="px-4 py-3 font-medium">
                    Episódio
                  </th>
                  <th scope="col" className="px-4 py-3 font-medium">
                    Categoria
                  </th>
                  <th scope="col" className="px-4 py-3 font-medium">
                    Participantes
                  </th>
                  <th scope="col" className="px-4 py-3 font-medium">
                    Criado em
                  </th>
                  <th scope="col" className="px-4 py-3 font-medium">
                    <span className="sr-only">Ações</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {resultado.data.map((podcast) => (
                  <Linha key={podcast.id} podcast={podcast} />
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <Paginacao
        dados={resultado.pagination}
        base="/podcasts"
        parametros={new URLSearchParams()}
      />
    </div>
  );
}

function Linha({ podcast }: { podcast: ConteudoBusca }) {
  const miniatura = podcast.thumbnailMobile ?? podcast.thumbnailDesktop;
  const pessoas = podcast.instrutores.map((i) => i.nome).join(", ");

  return (
    <tr className="border-borda-suave hover:bg-superficie-2 border-b last:border-b-0">
      <td className="px-4 py-3">
        <div className="flex items-center gap-3">
          <span className="bg-superficie-2 relative h-11 w-11 shrink-0 overflow-hidden rounded-md">
            {miniatura && (
              <Image
                src={miniatura}
                alt=""
                fill
                sizes="44px"
                className="object-cover"
              />
            )}
          </span>

          <span className="flex min-w-0 flex-col">
            <span className="text-texto truncate font-medium">
              {podcast.titulo}
            </span>
            {podcast.destaque && (
              <span className="text-acento-claro text-xs font-medium">
                Em destaque
              </span>
            )}
            {podcast.publicado === false && (
              <span className="text-aviso text-xs font-medium">Rascunho</span>
            )}
          </span>
        </div>
      </td>

      <td className="text-texto-2 px-4 py-3">
        <span className="flex flex-col">
          <span>{podcast.categoria?.nome ?? "—"}</span>
          {podcast.subcategoria && (
            <span className="text-texto-3 text-xs">
              {podcast.subcategoria.nome}
            </span>
          )}
        </span>
      </td>

      <td className="text-texto-2 max-w-56 truncate px-4 py-3">
        {pessoas || "—"}
      </td>

      <td className="text-texto-3 px-4 py-3 whitespace-nowrap">
        {data.format(new Date(podcast.createdAt))}
      </td>

      <td className="px-4 py-3 text-right">
        <Link
          href={`/podcasts/${podcast.id}/editar`}
          className="border-borda text-texto-2 hover:bg-superficie hover:text-texto rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors"
        >
          Editar
        </Link>
      </td>
    </tr>
  );
}
