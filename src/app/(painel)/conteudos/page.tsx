import Image from "next/image";
import Link from "next/link";
import { FiltrosConteudo } from "@/components/filtros-conteudo";
import { Paginacao } from "@/components/paginacao";
import {
  LIMITE_MAXIMO_BUSCA,
  buscarConteudos,
  listarCategorias,
} from "@/lib/queries";
import type { ConteudoBusca, TipoConteudo } from "@/types/api";

export const metadata = { title: "Conteúdos · Painel DigitalEduca" };

const ROTULO_TIPO: Record<TipoConteudo, string> = {
  AULA: "Aula",
  PALESTRA: "Palestra",
  PODCAST: "Podcast",
};

const data = new Intl.DateTimeFormat("pt-BR", { dateStyle: "short" });

export default async function PaginaConteudos({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const parametrosBrutos = await searchParams;

  const texto = (chave: string) => {
    const valor = parametrosBrutos[chave];
    return typeof valor === "string" && valor ? valor : undefined;
  };

  const numero = (chave: string) => {
    const valor = Number(texto(chave));
    return Number.isFinite(valor) && valor > 0 ? valor : undefined;
  };

  const filtros = {
    q: texto("q"),
    tipo: texto("tipo"),
    categoriaId: numero("categoriaId"),
    page: numero("page") ?? 1,
    limit: LIMITE_MAXIMO_BUSCA,
  };

  const [resultado, categorias] = await Promise.all([
    buscarConteudos(filtros),
    listarCategorias().catch(() => []),
  ]);

  // Reconstruído a partir dos filtros aplicados, e não do que veio na URL:
  // assim um parâmetro inválido não é propagado para os links de paginação.
  const parametros = new URLSearchParams();
  if (filtros.q) parametros.set("q", filtros.q);
  if (filtros.tipo) parametros.set("tipo", filtros.tipo);
  if (filtros.categoriaId) {
    parametros.set("categoriaId", String(filtros.categoriaId));
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-texto text-2xl font-semibold">Conteúdos</h1>
          <p className="text-texto-3 mt-0.5 text-sm">
            {resultado.pagination.total}{" "}
            {resultado.pagination.total === 1
              ? "conteúdo cadastrado"
              : "conteúdos cadastrados"}
          </p>
        </div>

        <Link
          href="/conteudos/novo"
          className="bg-acento hover:bg-acento-hover rounded-lg px-4 py-2.5 text-sm font-semibold text-white transition-colors"
        >
          Novo conteúdo
        </Link>
      </div>

      <FiltrosConteudo categorias={categorias} />

      {resultado.data.length === 0 ? (
        <p className="border-borda-suave bg-superficie text-texto-2 rounded-xl border p-8 text-center text-sm">
          Nenhum conteúdo encontrado com esses filtros.
        </p>
      ) : (
        <div className="border-borda-suave bg-superficie overflow-hidden rounded-xl border">
          {/*
            A tabela rola sozinha no horizontal. Sem este contêiner, uma linha
            larga empurraria a página inteira e criaria rolagem lateral no
            corpo — que o shell não espera.
          */}
          <div className="overflow-x-auto">
            <table className="w-full min-w-[52rem] text-sm">
              <thead>
                <tr className="border-borda-suave text-texto-3 border-b text-left">
                  <th scope="col" className="px-4 py-3 font-medium">
                    Conteúdo
                  </th>
                  <th scope="col" className="px-4 py-3 font-medium">
                    Tipo
                  </th>
                  <th scope="col" className="px-4 py-3 font-medium">
                    Categoria
                  </th>
                  <th scope="col" className="px-4 py-3 font-medium">
                    Instrutores
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
                {resultado.data.map((conteudo) => (
                  <Linha key={conteudo.id} conteudo={conteudo} />
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <Paginacao
        dados={resultado.pagination}
        base="/conteudos"
        parametros={parametros}
      />
    </div>
  );
}

function Linha({ conteudo }: { conteudo: ConteudoBusca }) {
  const miniatura = conteudo.thumbnailMobile ?? conteudo.thumbnailDesktop;
  const instrutores = conteudo.instrutores.map((i) => i.nome).join(", ");

  return (
    <tr className="border-borda-suave hover:bg-superficie-2 border-b last:border-b-0">
      <td className="px-4 py-3">
        <div className="flex items-center gap-3">
          <span className="bg-superficie-2 relative h-10 w-16 shrink-0 overflow-hidden rounded-md">
            {miniatura && (
              <Image
                src={miniatura}
                alt=""
                fill
                sizes="64px"
                className="object-cover"
              />
            )}
          </span>

          <span className="flex min-w-0 flex-col">
            <span className="text-texto truncate font-medium">
              {conteudo.titulo}
            </span>
            {conteudo.destaque && (
              <span className="text-acento-claro text-xs font-medium">
                Em destaque
              </span>
            )}
            {conteudo.publicado === false && (
              <span className="text-aviso text-xs font-medium">Rascunho</span>
            )}
          </span>
        </div>
      </td>

      <td className="text-texto-2 px-4 py-3">{ROTULO_TIPO[conteudo.tipo]}</td>

      <td className="text-texto-2 px-4 py-3">
        <span className="flex flex-col">
          <span>{conteudo.categoria?.nome ?? "—"}</span>
          {conteudo.subcategoria && (
            <span className="text-texto-3 text-xs">
              {conteudo.subcategoria.nome}
            </span>
          )}
        </span>
      </td>

      <td className="text-texto-2 max-w-56 truncate px-4 py-3">
        {instrutores || "—"}
      </td>

      <td className="text-texto-3 px-4 py-3 whitespace-nowrap">
        {data.format(new Date(conteudo.createdAt))}
      </td>

      <td className="px-4 py-3 text-right">
        {/*
          Podcast tem formulário próprio. Enquanto o `search` não permitir
          excluir um tipo, episódios ainda aparecem nesta lista — o link precisa
          mandar cada um para a tela certa.
        */}
        <Link
          href={
            conteudo.tipo === "PODCAST"
              ? `/podcasts/${conteudo.id}/editar`
              : `/conteudos/${conteudo.id}/editar`
          }
          className="border-borda text-texto-2 hover:bg-superficie hover:text-texto rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors"
        >
          Editar
        </Link>
      </td>
    </tr>
  );
}
