"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { desativarCupomEmLote } from "@/app/(painel)/cupons/acoes";
import { numeroBR, plural } from "@/lib/formato";
import {
  COR_SITUACAO,
  ROTULO_SITUACAO,
  type SituacaoCupom,
} from "@/lib/cupons";
import type { Cupom } from "@/types/api";

const DATA = new Intl.DateTimeFormat("pt-BR", { dateStyle: "short" });

/** A situação vem calculada do servidor: `new Date()` no cliente divergiria. */
export type CupomNaTela = Cupom & {
  situacao: SituacaoCupom;
  duracaoLegivel: string;
  planoNome: string;
};

export function TabelaCupons({ cupons }: { cupons: CupomNaTela[] }) {
  const router = useRouter();
  const [processando, comecarTransicao] = useTransition();

  const [selecionados, setSelecionados] = useState<number[]>([]);
  const [erro, setErro] = useState<string | null>(null);
  const [aviso, setAviso] = useState<string | null>(null);

  /* Desativar um cupom já inativo não faz nada — só os vivos entram no lote. */
  const desativaveis = cupons.filter((c) => c.ativo).map((c) => c.id);
  const selecionaveis = selecionados.filter((id) => desativaveis.includes(id));

  const todosMarcados =
    cupons.length > 0 && selecionados.length === cupons.length;
  const parcial = selecionados.length > 0 && !todosMarcados;

  return (
    <div className="flex flex-col gap-3">
      {selecionados.length > 0 && (
        <div className="border-acento/30 bg-acento/8 flex flex-wrap items-center gap-3 rounded-lg border px-4 py-2.5">
          <span className="text-texto text-sm font-medium">
            {selecionados.length}{" "}
            {selecionados.length === 1 ? "selecionado" : "selecionados"}
          </span>

          <div className="ml-auto flex flex-wrap gap-2">
            <button
              type="button"
              disabled={processando || selecionaveis.length === 0}
              onClick={() => {
                setErro(null);
                setAviso(null);
                comecarTransicao(async () => {
                  const r = await desativarCupomEmLote(selecionaveis);
                  if (r.afetados > 0) {
                    setAviso(
                      `${plural(r.afetados, "cupom desativado", "cupons desativados")}.`,
                    );
                  }
                  if (!r.ok) setErro(r.erro);
                  setSelecionados([]);
                  router.refresh();
                });
              }}
              className="border-borda text-texto-2 hover:bg-superficie hover:text-texto rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors disabled:opacity-50"
            >
              {selecionaveis.length === 0
                ? "Nada a desativar"
                : `Desativar ${selecionaveis.length}`}
            </button>
          </div>
        </div>
      )}

      {aviso && (
        <p role="status" className="text-sucesso text-sm font-medium">
          {aviso}
        </p>
      )}
      {erro && (
        <p
          role="alert"
          className="border-alerta/40 bg-alerta/10 text-alerta rounded-lg border px-4 py-3 text-sm"
        >
          {erro}
        </p>
      )}

      <div className="border-borda-suave bg-superficie overflow-hidden rounded-xl border">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[56rem] text-sm">
            <thead>
              <tr className="border-borda-suave text-texto-3 border-b text-left">
                <th scope="col" className="w-10 px-4 py-3">
                  <input
                    type="checkbox"
                    checked={todosMarcados}
                    ref={(no) => {
                      if (no) no.indeterminate = parcial;
                    }}
                    onChange={() =>
                      setSelecionados(
                        todosMarcados ? [] : cupons.map((c) => c.id),
                      )
                    }
                    aria-label="Selecionar todos"
                    className="accent-acento size-4 align-middle"
                  />
                </th>
                <th scope="col" className="px-4 py-3 font-medium">Código</th>
                <th scope="col" className="px-4 py-3 font-medium">Desconto</th>
                <th scope="col" className="px-4 py-3 font-medium">Duração</th>
                <th scope="col" className="px-4 py-3 font-medium">Plano</th>
                <th scope="col" className="px-4 py-3 font-medium">Usos</th>
                <th scope="col" className="px-4 py-3 font-medium">Validade</th>
              </tr>
            </thead>

            <tbody>
              {cupons.map((cupom) => {
                const marcado = selecionados.includes(cupom.id);
                const esgotando =
                  cupom.limiteUsos !== null &&
                  cupom.usosAtuais / cupom.limiteUsos >= 0.8;

                return (
                  <tr
                    key={cupom.id}
                    className={`border-borda-suave group border-b last:border-b-0 transition-colors ${
                      marcado ? "bg-acento/8" : "hover:bg-superficie-2"
                    }`}
                  >
                    <td className="px-4 py-3 align-top">
                      <input
                        type="checkbox"
                        checked={marcado}
                        onChange={() =>
                          setSelecionados((atual) =>
                            atual.includes(cupom.id)
                              ? atual.filter((i) => i !== cupom.id)
                              : [...atual, cupom.id],
                          )
                        }
                        aria-label={`Selecionar ${cupom.codigo}`}
                        className="accent-acento mt-1 size-4"
                      />
                    </td>

                    <td className="px-4 py-3">
                      <span className="flex flex-col">
                        <span className="flex flex-wrap items-center gap-2">
                          <Link
                            href={`/cupons/${cupom.id}/editar`}
                            className="text-texto hover:text-acento-claro font-mono font-medium transition-colors"
                          >
                            {cupom.codigo}
                          </Link>
                          <span
                            className={`rounded px-1.5 py-0.5 text-xs font-semibold ${COR_SITUACAO[cupom.situacao]}`}
                          >
                            {ROTULO_SITUACAO[cupom.situacao]}
                          </span>
                        </span>

                        {cupom.descricao && (
                          <span className="text-texto-3 truncate text-xs">
                            {cupom.descricao}
                          </span>
                        )}

                        <span className="mt-1 flex gap-2 text-xs opacity-100 transition-opacity sm:opacity-0 sm:group-focus-within:opacity-100 sm:group-hover:opacity-100">
                          <Link
                            href={`/cupons/${cupom.id}/editar`}
                            className="text-texto-3 hover:text-acento-claro transition-colors"
                          >
                            Editar
                          </Link>
                        </span>
                      </span>
                    </td>

                    <td className="text-texto px-4 py-3 align-top font-semibold tabular-nums">
                      {cupom.percentual}%
                    </td>

                    <td className="text-texto-2 px-4 py-3 align-top">
                      {cupom.duracaoLegivel}
                    </td>

                    <td className="text-texto-2 px-4 py-3 align-top">
                      {cupom.planoNome}
                    </td>

                    <td className="px-4 py-3 align-top tabular-nums">
                      <span
                        className={
                          esgotando ? "text-aviso font-medium" : "text-texto-2"
                        }
                      >
                        {numeroBR(cupom.usosAtuais)}
                        {cupom.limiteUsos !== null
                          ? ` / ${numeroBR(cupom.limiteUsos)}`
                          : ""}
                      </span>
                    </td>

                    <td className="text-texto-3 px-4 py-3 align-top text-xs whitespace-nowrap">
                      {cupom.validoDe || cupom.validoAte ? (
                        <>
                          {cupom.validoDe
                            ? DATA.format(new Date(cupom.validoDe))
                            : "sempre"}
                          {" – "}
                          {cupom.validoAte
                            ? DATA.format(new Date(cupom.validoAte))
                            : "sem fim"}
                        </>
                      ) : (
                        "sem prazo"
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
