import Link from "next/link";
import { AbasStatus } from "@/components/conteudos/abas-status";
import { BotaoEsvaziarLixeira } from "@/components/conteudos/botao-esvaziar-lixeira";
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
const STATUS: Record<
  string,
  { publicado?: boolean; destaque?: boolean; lixeira?: boolean }
> = {
  publicados: { publicado: true },
  rascunhos: { publicado: false },
  destaques: { destaque: true },
  lixeira: { lixeira: true },
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
      MasterClass é exatamente AULA.

      Por um período esta tela usou `excluirTipo: "PODCAST"` — mostrar tudo
      que não fosse podcast — como rede contra conteúdo órfão. Isso deixou de
      servir quando CURSO e TRILHA ganharam tela própria: o item movido daqui
      para Curso continuava aparecendo nesta lista, e parecia que a mudança
      tinha deixado uma cópia para trás.

      Hoje os quatro tipos do menu têm cada um a sua tela, então nada some.
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


      {resultado.contadores && (
        <AbasStatus
          contadores={resultado.contadores}
          statusAtual={status}
          parametros={parametros}
          base="/conteudos"
        />
      )}

      <FiltrosConteudo categorias={categorias} semTipo />

      {status === "lixeira" && resultado.data.length > 0 && (
        <div className="flex justify-end">
          <BotaoEsvaziarLixeira total={resultado.contadores?.lixeira ?? 0} />
        </div>
      )}

      {resultado.data.length === 0 ? (
        <p className="border-borda-suave bg-superficie text-texto-2 rounded-xl border p-8 text-center text-sm">
          {status === "lixeira"
            ? "A lixeira está vazia."
            : "Nenhuma MasterClass encontrada com esses filtros."}
        </p>
      ) : (
        <TabelaConteudos
          conteudos={resultado.data}
          lixeira={status === "lixeira"}
        />
      )}

      <Paginacao
        dados={resultado.pagination}
        base="/conteudos"
        parametros={parametrosComStatus}
      />
    </div>
  );
}
