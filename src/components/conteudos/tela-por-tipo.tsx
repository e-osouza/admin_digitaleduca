import Link from "next/link";
import { AbasStatus } from "@/components/conteudos/abas-status";
import { BotaoEsvaziarLixeira } from "@/components/conteudos/botao-esvaziar-lixeira";
import { TabelaConteudos } from "@/components/conteudos/tabela-conteudos";
import { FiltrosSimples } from "@/components/filtros-simples";
import { Paginacao } from "@/components/paginacao";
import { plural } from "@/lib/formato";
import { LIMITE_MAXIMO_BUSCA, buscarConteudos } from "@/lib/queries";
import type { TipoConteudo } from "@/types/api";

/**
 * Listagem de um tipo de conteúdo — serve Cursos, Trilhas, MasterClass e
 * Podcasts.
 *
 * As quatro telas são a MESMA porque os quatro tipos são a mesma tabela. Foi
 * a lição do modelo anterior: enquanto curso e trilha viviam em `trilhas` e
 * masterclass e podcast em `conteudos`, eram duas telas quase iguais que
 * precisavam ganhar cada recurso duas vezes — e mover entre elas era
 * impossível.
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

export async function TelaPorTipo({
  tipo,
  titulo,
  singular,
  pluralNome,
  novo,
  base,
  feminino,
  criarEm,
  searchParams,
}: {
  tipo: TipoConteudo;
  titulo: string;
  singular: string;
  pluralNome: string;
  novo: string;
  base: string;
  /** "trilha" e "MasterClass" são femininos; "curso" e "episódio" não. */
  feminino?: boolean;
  /** Rota de criação — podcast e conteúdo têm formulários diferentes. */
  criarEm: string;
  searchParams: Record<string, string | string[] | undefined>;
}) {
  const texto = (chave: string) => {
    const valor = searchParams[chave];
    return typeof valor === "string" && valor ? valor : undefined;
  };
  const numero = (chave: string) => {
    const valor = Number(texto(chave));
    return Number.isFinite(valor) && valor > 0 ? valor : undefined;
  };

  const status = texto("status") ?? "";

  const resultado = await buscarConteudos({
    tipo,
    q: texto("q"),
    ...(STATUS[status] ?? {}),
    ordenar: texto("ordenar"),
    page: numero("page") ?? 1,
    limit: LIMITE_MAXIMO_BUSCA,
  });

  const parametros = new URLSearchParams();
  if (texto("q")) parametros.set("q", texto("q")!);
  if (texto("ordenar")) parametros.set("ordenar", texto("ordenar")!);

  const comStatus = new URLSearchParams(parametros);
  if (status) comStatus.set("status", status);

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-texto text-2xl font-semibold">{titulo}</h1>
          <p className="text-texto-3 mt-0.5 text-sm">
            {plural(
              resultado.pagination.total,
              `${singular} nesta seleção`,
              `${pluralNome} nesta seleção`,
            )}
          </p>
        </div>

        <Link
          href={criarEm}
          className="bg-acento hover:bg-acento-hover rounded-lg px-4 py-2.5 text-sm font-semibold text-white transition-colors"
        >
          {novo}
        </Link>
      </div>


      {resultado.contadores && (
        <AbasStatus
          contadores={resultado.contadores}
          statusAtual={status}
          parametros={parametros}
          base={base}
          rotulos={
            feminino
              ? { publicados: "Publicadas", rascunhos: "Rascunhos" }
              : undefined
          }
        />
      )}

      <FiltrosSimples base={base} placeholder={`Buscar ${singular}…`} />

      {status === "lixeira" && resultado.data.length > 0 && (
        <div className="flex justify-end">
          <BotaoEsvaziarLixeira total={resultado.contadores?.lixeira ?? 0} />
        </div>
      )}

      {resultado.data.length === 0 ? (
        <p className="border-borda-suave bg-superficie text-texto-2 rounded-xl border p-8 text-center text-sm">
          {status === "lixeira" ? (
            "A lixeira está vazia."
          ) : (
            <>
              {feminino ? "Nenhuma" : "Nenhum"} {singular}{" "}
              {feminino ? "encontrada" : "encontrado"} com esses filtros.
            </>
          )}
        </p>
      ) : (
        <TabelaConteudos
          conteudos={resultado.data}
          base={base}
          lixeira={status === "lixeira"}
        />
      )}

      <Paginacao
        dados={resultado.pagination}
        base={base}
        parametros={comStatus}
      />
    </div>
  );
}
