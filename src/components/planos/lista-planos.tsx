import Link from "next/link";
import { moedaBR, numeroBR, plural } from "@/lib/formato";
import type { Plano } from "@/types/api";

const CICLO: Record<string, string> = {
  day: "por dia",
  week: "por semana",
  month: "por mês",
  year: "por ano",
};

export function ListaPlanos({
  planos,
  assinantes,
}: {
  planos: Plano[];
  /** Assinaturas por plano, por id. Ausente quando as métricas não carregam. */
  assinantes: Map<number, number>;
}) {
  if (planos.length === 0) {
    return (
      <p className="border-borda-suave bg-superficie text-texto-3 rounded-xl border border-dashed p-8 text-center text-sm">
        Nenhum plano cadastrado.
      </p>
    );
  }

  return (
    <ul className="flex flex-col gap-3">
      {planos.map((plano) => {
        const gratuito = plano.preco <= 0;
        const contratos = assinantes.get(plano.id) ?? 0;
        const aVista =
          plano.preco * (1 - plano.percentualDescontoAVista / 100);

        return (
          <li
            key={plano.id}
            /* Desativado fica esmaecido em vez de sumir: ele continua
               existindo e ainda pode ser reativado — sumir seria mentira. */
            className={`border-borda-suave bg-superficie flex flex-col gap-4 rounded-xl border p-5 sm:flex-row sm:items-start ${
              plano.ativo ? "" : "opacity-60"
            }`}
          >
            <div className="flex min-w-0 flex-1 flex-col gap-2">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-texto font-semibold">{plano.nome}</h2>
                {!plano.ativo && (
                  <span className="text-aviso bg-aviso/12 rounded px-2 py-0.5 text-xs font-semibold">
                    Fora de circulação
                  </span>
                )}
                {gratuito && (
                  <span className="text-texto-2 bg-superficie-2 rounded px-2 py-0.5 text-xs font-medium">
                    Gratuito
                  </span>
                )}
                {plano.permiteParcelamento && (
                  <span className="text-acento-claro bg-acento/10 rounded px-2 py-0.5 text-xs font-medium">
                    Parcela em até {plano.maxParcelas}×
                  </span>
                )}
                {plano.percentualDescontoAVista > 0 && (
                  <span className="text-sucesso bg-sucesso/10 rounded px-2 py-0.5 text-xs font-medium">
                    {plano.percentualDescontoAVista}% à vista
                  </span>
                )}
              </div>

              {plano.descricao && (
                <p className="text-texto-3 line-clamp-2 text-sm">
                  {plano.descricao}
                </p>
              )}

              <p className="text-texto-3 text-xs">
                {contratos > 0
                  ? plural(contratos, "assinatura", "assinaturas")
                  : "Nenhuma assinatura"}
                {/*
                  Os ids da Stripe ficam à vista porque são o que se procura
                  quando uma cobrança some: sem eles, rastrear um pagamento no
                  painel da operadora vira adivinhação. Hoje a cobrança corre
                  pelo Mercado Pago, então são resquício — mas resquício que
                  ainda aparece em assinatura antiga.
                */}
                {plano.stripeProductId && (
                  <span className="text-texto-3/70">
                    {" · "}
                    <span className="font-mono">{plano.stripeProductId}</span>
                  </span>
                )}
              </p>
            </div>

            <div className="flex shrink-0 items-center gap-4 sm:flex-col sm:items-end sm:gap-2">
              {/* Plano gratuito não tem ciclo de cobrança que faça sentido
                  mostrar: "— por ano" só confunde quem lê. */}
              <p className="text-texto text-right text-xl font-semibold tabular-nums">
                {gratuito ? (
                  "Grátis"
                ) : (
                  <>
                    {moedaBR(plano.preco)}
                    <span className="text-texto-3 ml-1 text-xs font-normal">
                      {CICLO[plano.intervalo ?? ""] ?? plano.intervalo}
                    </span>
                  </>
                )}
              </p>

              {!gratuito && plano.permiteParcelamento && plano.maxParcelas > 1 && (
                <p className="text-texto-3 text-right text-xs tabular-nums">
                  {plano.maxParcelas}× de{" "}
                  {moedaBR(plano.preco / plano.maxParcelas)}
                  {plano.percentualDescontoAVista > 0 &&
                    ` · ${moedaBR(aVista)} à vista`}
                </p>
              )}

              <Link
                href={`/planos/${plano.id}/editar`}
                className="border-borda text-texto-2 hover:border-acento/60 hover:text-acento rounded-lg border px-3 py-1.5 text-sm font-medium transition-colors"
              >
                Editar
              </Link>
            </div>
          </li>
        );
      })}
    </ul>
  );
}

/** Só para o cabeçalho da página não repetir a conta. */
export function totalDeAssinaturas(assinantes: Map<number, number>) {
  return numeroBR([...assinantes.values()].reduce((s, n) => s + n, 0));
}
