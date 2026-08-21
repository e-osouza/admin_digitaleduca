import Link from "next/link";
import { AvisoAcao } from "@/components/aviso-acao";
import { AbasStatus } from "@/components/conteudos/abas-status";
import { TabelaConteudos } from "@/components/conteudos/tabela-conteudos";
import { FiltrosConteudo } from "@/components/filtros-conteudo";
import { Paginacao } from "@/components/paginacao";
import { plural } from "@/lib/formato";
import {
  LIMITE_MAXIMO_BUSCA,
  buscarConteudos,
  listarCategorias,
} from "@/lib/queries";

export const metadata = { title: "MasterClass · Painel DigitalEduca" };

/**
 * As abas de situação, traduzidas para os parâmetros que a API entende.
 *
 * `publicado` aceita `false`, que é um valor útil e não "ausente" — por isso
 * o mapa guarda o booleano explícito em vez de depender de veracidade.
 */
const STATUS: Record<string, { publicado?: boolean; destaque?: boolean }> = {
  publicados: { publicado: true },
  rascunhos: { publicado: false },
  destaques: { destaque: true },
};

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

  const status = texto("status") ?? "";
  const recorte = STATUS[status] ?? {};

  const filtros = {
    q: texto("q"),
    /*
      Esta tela é só de MasterClass. Cada tipo virou um item de menu próprio —
      cursos e trilhas em /cursos e /trilhas, episódios em /podcasts — então
      aqui o tipo é fixo, e o filtro de tipo saiu da barra por não ter mais o
      que escolher.
    */
    tipo: "AULA",
    categoriaId: numero("categoriaId"),
    ...recorte,
    ordenar: texto("ordenar"),
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
  if (filtros.categoriaId) {
    parametros.set("categoriaId", String(filtros.categoriaId));
  }
  if (filtros.ordenar) parametros.set("ordenar", filtros.ordenar);

  /* Os links de paginação precisam manter a aba; as abas, não a si mesmas. */
  const parametrosComStatus = new URLSearchParams(parametros);
  if (status) parametrosComStatus.set("status", status);

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-texto text-2xl font-semibold">MasterClass</h1>
          <p className="text-texto-3 mt-0.5 text-sm">
            {plural(
              resultado.pagination.total,
              "MasterClass nesta seleção",
              "MasterClasses nesta seleção",
            )}
          </p>
        </div>

        <Link
          href="/conteudos/novo"
          className="bg-acento hover:bg-acento-hover rounded-lg px-4 py-2.5 text-sm font-semibold text-white transition-colors"
        >
          Nova MasterClass
        </Link>
      </div>

      <AvisoAcao />

      {resultado.contadores && (
        <AbasStatus
          contadores={resultado.contadores}
          statusAtual={status}
          parametros={parametros}
          base="/conteudos"
        />
      )}

      <FiltrosConteudo categorias={categorias} semTipo />

      {resultado.data.length === 0 ? (
        <p className="border-borda-suave bg-superficie text-texto-2 rounded-xl border p-8 text-center text-sm">
          Nenhum conteúdo encontrado com esses filtros.
        </p>
      ) : (
        <TabelaConteudos conteudos={resultado.data} />
      )}

      <Paginacao
        dados={resultado.pagination}
        base="/conteudos"
        parametros={parametrosComStatus}
      />
    </div>
  );
}
