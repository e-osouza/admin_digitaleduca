import Link from "next/link";
import {
  TabelaCupons,
  type CupomNaTela,
} from "@/components/cupons/tabela-cupons";
import { numeroBR, plural } from "@/lib/formato";
import { descreverDuracao, situacaoDoCupom, type SituacaoCupom } from "@/lib/cupons";
import { listarCupons, listarPlanos } from "@/lib/queries";

export const metadata = { title: "Cupons · Painel DigitalEduca" };

const ABAS: { chave: string; rotulo: string; situacao?: SituacaoCupom }[] = [
  { chave: "", rotulo: "Todos" },
  { chave: "ativos", rotulo: "Ativos", situacao: "ativo" },
  { chave: "agendados", rotulo: "Agendados", situacao: "agendado" },
  { chave: "expirados", rotulo: "Expirados", situacao: "expirado" },
  { chave: "esgotados", rotulo: "Esgotados", situacao: "esgotado" },
  { chave: "inativos", rotulo: "Inativos", situacao: "inativo" },
];

export default async function PaginaCupons({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const brutos = await searchParams;
  const texto = (chave: string) => {
    const valor = brutos[chave];
    return typeof valor === "string" && valor ? valor : "";
  };

  const [cupons, planos] = await Promise.all([
    listarCupons(),
    listarPlanos().catch(() => []),
  ]);

  const nomeDoPlano = new Map(planos.map((p) => [p.id, p.nome]));

  /*
    A situação é calculada AQUI, no servidor, e desce pronta para a tabela.
    Calculá-la no cliente usaria o relógio do navegador — dois relógios
    diferentes dariam duas respostas para "expirado", e a diferença
    apareceria como troca de conteúdo depois da hidratação.
  */
  const agora = new Date();
  const todos: CupomNaTela[] = cupons.map((cupom) => ({
    ...cupom,
    situacao: situacaoDoCupom(cupom, agora),
    duracaoLegivel: descreverDuracao(cupom),
    planoNome: cupom.planoId
      ? (nomeDoPlano.get(cupom.planoId) ?? `Plano ${cupom.planoId}`)
      : "Qualquer plano",
  }));

  const contar = (situacao?: SituacaoCupom) =>
    situacao ? todos.filter((c) => c.situacao === situacao).length : todos.length;

  const status = texto("status");
  const busca = texto("q").toLowerCase();
  const abaAtual = ABAS.find((a) => a.chave === status) ?? ABAS[0];

  const filtrados = todos
    .filter((c) => !abaAtual.situacao || c.situacao === abaAtual.situacao)
    .filter(
      (c) =>
        !busca ||
        c.codigo.toLowerCase().includes(busca) ||
        (c.descricao ?? "").toLowerCase().includes(busca),
    );

  /* Cupom mais usado primeiro: é o que a equipe olha para medir campanha. */
  const ordenados =
    texto("ordenar") === "usos"
      ? [...filtrados].sort((a, b) => b.usosAtuais - a.usosAtuais)
      : filtrados;

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-texto text-2xl font-semibold">Cupons</h1>
          <p className="text-texto-3 mt-0.5 text-sm">
            {plural(
              ordenados.length,
              "cupom nesta seleção",
              "cupons nesta seleção",
            )}
          </p>
        </div>

        <Link
          href="/cupons/novo"
          className="bg-acento hover:bg-acento-hover rounded-lg px-4 py-2.5 text-sm font-semibold text-white transition-colors"
        >
          Novo cupom
        </Link>
      </div>


      {/*
        As abas são de SITUAÇÃO REAL, não da coluna `ativo` — "Expirado" e
        "Esgotado" são cupons que ainda estão marcados como ativos no banco e
        mesmo assim já não descontam nada.
      */}
      <nav aria-label="Filtrar por situação">
        <ul className="border-borda-suave flex flex-wrap items-center gap-x-1 border-b">
          {ABAS.map((aba) => {
            const ativa = aba.chave === status;
            const alvo = new URLSearchParams();
            if (aba.chave) alvo.set("status", aba.chave);
            if (busca) alvo.set("q", texto("q"));

            return (
              <li key={aba.chave || "todos"}>
                <Link
                  href={alvo.toString() ? `/cupons?${alvo}` : "/cupons"}
                  aria-current={ativa ? "page" : undefined}
                  className={`-mb-px flex items-center gap-1.5 border-b-2 px-3 py-2.5 text-sm transition-colors ${
                    ativa
                      ? "border-acento text-texto font-semibold"
                      : "text-texto-2 hover:text-texto border-transparent"
                  }`}
                >
                  {aba.rotulo}
                  <span
                    className={`rounded px-1.5 py-0.5 text-xs tabular-nums ${
                      ativa
                        ? "bg-acento/12 text-acento-claro"
                        : "bg-superficie-2 text-texto-3"
                    }`}
                  >
                    {numeroBR(contar(aba.situacao))}
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      <form action="/cupons" className="flex flex-wrap items-center gap-3">
        {status && <input type="hidden" name="status" value={status} />}
        <label className="min-w-0 flex-1 basis-64">
          <span className="sr-only">Buscar cupom</span>
          <input
            type="search"
            name="q"
            defaultValue={texto("q")}
            placeholder="Buscar por código ou descrição…"
            className="border-borda bg-superficie text-texto focus:border-acento-claro w-full rounded-lg border px-3 py-2 text-sm outline-none transition-colors"
          />
        </label>

        <label>
          <span className="sr-only">Ordenação</span>
          <select
            name="ordenar"
            defaultValue={texto("ordenar")}
            className="border-borda bg-superficie text-texto focus:border-acento-claro rounded-lg border px-3 py-2 text-sm outline-none transition-colors"
          >
            <option value="">Mais recentes</option>
            <option value="usos">Mais usados</option>
          </select>
        </label>

        <button
          type="submit"
          className="border-borda text-texto-2 hover:bg-superficie hover:text-texto rounded-lg border px-3 py-2 text-sm font-medium transition-colors"
        >
          Filtrar
        </button>
      </form>

      {ordenados.length === 0 ? (
        <p className="border-borda-suave bg-superficie text-texto-2 rounded-xl border p-8 text-center text-sm">
          {todos.length === 0
            ? "Nenhum cupom cadastrado ainda."
            : "Nenhum cupom encontrado com esses filtros."}
        </p>
      ) : (
        <TabelaCupons cupons={ordenados} />
      )}
    </div>
  );
}
