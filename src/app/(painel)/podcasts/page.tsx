import Link from "next/link";
import { AbasStatus } from "@/components/conteudos/abas-status";
import { BotaoEsvaziarLixeira } from "@/components/conteudos/botao-esvaziar-lixeira";
import { TabelaConteudos } from "@/components/conteudos/tabela-conteudos";
import { FiltrosSimples } from "@/components/filtros-simples";
import { Paginacao } from "@/components/paginacao";
import { plural } from "@/lib/formato";
import { LIMITE_MAXIMO_BUSCA, buscarConteudos } from "@/lib/queries";

export const metadata = { title: "Podcasts · Painel DigitalEduca" };

const STATUS: Record<
  string,
  { publicado?: boolean; destaque?: boolean; lixeira?: boolean }
> = {
  publicados: { publicado: true },
  rascunhos: { publicado: false },
  destaques: { destaque: true },
  lixeira: { lixeira: true },
};

export default async function PaginaPodcasts({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const brutos = await searchParams;

  const texto = (chave: string) => {
    const valor = brutos[chave];
    return typeof valor === "string" && valor ? valor : undefined;
  };
  const numero = (chave: string) => {
    const valor = Number(texto(chave));
    return Number.isFinite(valor) && valor > 0 ? valor : undefined;
  };

  const status = texto("status") ?? "";

  const resultado = await buscarConteudos({
    // Fixo: esta tela é só de episódios.
    tipo: "PODCAST",
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
          <h1 className="text-texto text-2xl font-semibold">Podcasts</h1>
          <p className="text-texto-3 mt-0.5 text-sm">
            {plural(
              resultado.pagination.total,
              "episódio nesta seleção",
              "episódios nesta seleção",
            )}
          </p>
        </div>

        <Link
          href="/podcasts/novo"
          className="bg-acento hover:bg-acento-hover rounded-lg px-4 py-2.5 text-sm font-semibold text-white transition-colors"
        >
          Novo episódio
        </Link>
      </div>


      {resultado.contadores && (
        <AbasStatus
          contadores={resultado.contadores}
          statusAtual={status}
          parametros={parametros}
          base="/podcasts"
        />
      )}

      <FiltrosSimples base="/podcasts" placeholder="Buscar episódio…" />

      {status === "lixeira" && resultado.data.length > 0 && (
        <div className="flex justify-end">
          <BotaoEsvaziarLixeira total={resultado.contadores?.lixeira ?? 0} />
        </div>
      )}

      {resultado.data.length === 0 ? (
        <p className="border-borda-suave bg-superficie text-texto-2 rounded-xl border p-8 text-center text-sm">
          {status === "lixeira"
            ? "A lixeira está vazia."
            : "Nenhum episódio encontrado com esses filtros."}
        </p>
      ) : (
        <TabelaConteudos
          conteudos={resultado.data}
          base="/podcasts"
          lixeira={status === "lixeira"}
          podcast
        />
      )}

      <Paginacao
        dados={resultado.pagination}
        base="/podcasts"
        parametros={comStatus}
      />
    </div>
  );
}
