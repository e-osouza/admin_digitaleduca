import Link from "next/link";
import { numeroBR } from "@/lib/formato";

/**
 * Abas de status, no formato do WordPress: o estado é a navegação principal
 * da tela, com a contagem ao lado de cada um.
 *
 * As contagens vêm do backend já considerando os OUTROS filtros ativos, mas
 * não o status — por isso "Rascunhos (5)" continua legível enquanto você olha
 * os publicados. Sem isso a aba marcaria zero justamente quando não está
 * selecionada, que é quando o número interessa.
 *
 * Conteúdo usa as quatro abas padrão (`contadores` + `rotulos`). Telas com
 * outro recorte passam `abas` direto: a de usuários filtra por PAPEL, e são
 * quatro papéis mais "Todos". Antes elas reaproveitavam as chaves de conteúdo
 * — `destaques` queria dizer "administradores" —, o que só funcionava
 * enquanto o número de abas coincidisse.
 */
export type Aba = { chave: string; rotulo: string; total: number };

export function AbasStatus({
  contadores,
  abas: abasDadas,
  statusAtual,
  parametros,
  base,
  rotulos,
  parametro = "status",
}: {
  /** As quatro abas de conteúdo. Ignorado quando `abas` é passado. */
  contadores?: {
    todos: number;
    publicados: number;
    rascunhos: number;
    destaques: number;
  };
  /** Abas arbitrárias — a chave vazia é sempre "todos". */
  abas?: Aba[];
  /** Chave da aba ativa; `""` é a primeira. */
  statusAtual: string;
  /** Demais filtros, preservados ao trocar de aba. */
  parametros: URLSearchParams;
  /** Rota da listagem — as telas do painel usam este mesmo componente. */
  base: string;
  /** Sobrescreve o nome de uma aba (trilha "publicada", conteúdo "publicado"). */
  rotulos?: Partial<Record<"todos" | "publicados" | "rascunhos" | "destaques", string>>;
  /** Nome do parâmetro na URL. Usuários filtra por `papel`, não por `status`. */
  parametro?: string;
}) {
  const abas: Aba[] =
    abasDadas ??
    (contadores
      ? [
          {
            chave: "",
            rotulo: rotulos?.todos ?? "Todos",
            total: contadores.todos,
          },
          {
            chave: "publicados",
            rotulo: rotulos?.publicados ?? "Publicados",
            total: contadores.publicados,
          },
          {
            chave: "rascunhos",
            rotulo: rotulos?.rascunhos ?? "Rascunhos",
            total: contadores.rascunhos,
          },
          {
            chave: "destaques",
            rotulo: rotulos?.destaques ?? "Em destaque",
            total: contadores.destaques,
          },
        ]
      : []);

  return (
    <nav aria-label="Filtrar por situação">
      <ul className="border-borda-suave flex flex-wrap items-center gap-x-1 border-b">
        {abas.map((aba) => {
          const ativa = aba.chave === statusAtual;

          const alvo = new URLSearchParams(parametros);
          if (aba.chave) alvo.set(parametro, aba.chave);
          else alvo.delete(parametro);
          /* Trocar de aba volta para a primeira página: manter a página atual
             mostraria "nada encontrado" num conjunto que tem resultados. */
          alvo.delete("page");

          return (
            <li key={aba.chave || "todos"}>
              <Link
                href={alvo.toString() ? `${base}?${alvo}` : base}
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
                  {numeroBR(aba.total)}
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
