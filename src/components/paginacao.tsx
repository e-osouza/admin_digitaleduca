import Link from "next/link";
import type { Paginacao as DadosPaginacao } from "@/types/api";

/**
 * Paginação server-side: são links de verdade, não botões com JavaScript.
 * Assim funcionam com "abrir em nova aba" e com o botão voltar, e a página
 * continua sendo Server Component.
 */
export function Paginacao({
  dados,
  base,
  parametros,
}: {
  dados: DadosPaginacao;
  /** Caminho da tela, ex.: "/conteudos". */
  base: string;
  /** Filtros atuais, preservados na troca de página. */
  parametros: URLSearchParams;
}) {
  if (dados.totalPages <= 1) return null;

  function href(pagina: number) {
    const novos = new URLSearchParams(parametros.toString());
    if (pagina <= 1) novos.delete("page");
    else novos.set("page", String(pagina));
    return novos.toString() ? `${base}?${novos}` : base;
  }

  const anterior = dados.page - 1;
  const proxima = dados.page + 1;
  const temAnterior = anterior >= 1;
  const temProxima = proxima <= dados.totalPages;

  const estilo =
    "border-borda text-texto-2 hover:bg-superficie-2 hover:text-texto rounded-lg border px-3 py-1.5 text-sm font-medium transition-colors";
  const desabilitado =
    "border-borda-suave text-texto-3 rounded-lg border px-3 py-1.5 text-sm font-medium opacity-50";

  return (
    <nav
      aria-label="Paginação"
      className="flex items-center justify-between gap-4"
    >
      <p className="text-texto-3 text-sm">
        Página {dados.page} de {dados.totalPages} · {dados.total}{" "}
        {dados.total === 1 ? "item" : "itens"}
      </p>

      <div className="flex items-center gap-2">
        {temAnterior ? (
          <Link href={href(anterior)} className={estilo} rel="prev">
            Anterior
          </Link>
        ) : (
          <span className={desabilitado} aria-disabled="true">
            Anterior
          </span>
        )}

        {temProxima ? (
          <Link href={href(proxima)} className={estilo} rel="next">
            Próxima
          </Link>
        ) : (
          <span className={desabilitado} aria-disabled="true">
            Próxima
          </span>
        )}
      </div>
    </nav>
  );
}
