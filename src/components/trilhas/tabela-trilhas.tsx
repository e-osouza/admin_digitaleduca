"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState, useTransition } from "react";
import {
  excluirTrilhasEmLote,
  publicarTrilhasEmLote,
} from "@/app/(painel)/trilhas/acoes";
import { plural } from "@/lib/formato";
import type { TipoTrilha, Trilha } from "@/types/api";

const DATA = new Intl.DateTimeFormat("pt-BR", { dateStyle: "short" });

/**
 * Cabeçalho ordenável. Fora do componente da tabela de propósito: declarado
 * dentro, seria recriado a cada render e perderia estado a cada digitação.
 */
function Ordenavel({
  rotulo,
  ascendente,
  descendente,
  ordenar,
  parametros,
  base,
}: {
  rotulo: string;
  ascendente: string;
  descendente: string;
  ordenar: string;
  parametros: URLSearchParams;
  base: string;
}) {
  const ativoAsc = ordenar === ascendente;
  const ativoDesc = ordenar === descendente;

  const alvo = new URLSearchParams(parametros);
  alvo.set("ordenar", ativoAsc ? descendente : ascendente);
  alvo.delete("page");

  return (
    <Link
      href={`${base}?${alvo}`}
      aria-sort={ativoAsc ? "ascending" : ativoDesc ? "descending" : "none"}
      className={`hover:text-texto inline-flex items-center gap-1 transition-colors ${
        ativoAsc || ativoDesc ? "text-texto font-semibold" : ""
      }`}
    >
      {rotulo}
      <span aria-hidden className="text-xs">
        {ativoAsc ? "▲" : ativoDesc ? "▼" : "↕"}
      </span>
    </Link>
  );
}

export function TabelaTrilhas({
  trilhas,
  tipo,
  base,
}: {
  trilhas: Trilha[];
  tipo: TipoTrilha;
  base: string;
}) {
  const router = useRouter();
  const parametros = useSearchParams();
  const [processando, comecarTransicao] = useTransition();

  const [selecionados, setSelecionados] = useState<number[]>([]);
  const [erro, setErro] = useState<string | null>(null);
  const [aviso, setAviso] = useState<string | null>(null);

  const substantivo = tipo === "CURSO" ? "curso" : "trilha";
  const plural_ = tipo === "CURSO" ? "cursos" : "trilhas";

  const todosMarcados =
    trilhas.length > 0 && selecionados.length === trilhas.length;
  const parcial = selecionados.length > 0 && !todosMarcados;
  const ordenar = parametros.get("ordenar") ?? "recentes";

  function executar(
    acao: () => Promise<{ ok: boolean; erro?: string; afetados: number }>,
    descricao: (n: number) => string,
  ) {
    setErro(null);
    setAviso(null);

    comecarTransicao(async () => {
      const resultado = await acao();
      if (resultado.afetados > 0) setAviso(descricao(resultado.afetados));
      if (!resultado.ok) setErro(resultado.erro ?? "Algo falhou.");
      setSelecionados([]);
      router.refresh();
    });
  }

  return (
    <div className="flex flex-col gap-3">
      {selecionados.length > 0 && (
        <div className="border-acento/30 bg-acento/8 flex flex-wrap items-center gap-3 rounded-lg border px-4 py-2.5">
          <span className="text-texto text-sm font-medium">
            {selecionados.length}{" "}
            {selecionados.length === 1 ? "selecionado" : "selecionados"}
          </span>

          <div className="ml-auto flex flex-wrap gap-2">
            <BotaoLote
              disabled={processando}
              onClick={() =>
                executar(
                  () => publicarTrilhasEmLote(selecionados, true),
                  (n) => `${plural(n, substantivo, plural_)} publicado(s).`,
                )
              }
            >
              Publicar
            </BotaoLote>

            <BotaoLote
              disabled={processando}
              onClick={() =>
                executar(
                  () => publicarTrilhasEmLote(selecionados, false),
                  (n) => `${plural(n, substantivo, plural_)} em rascunho.`,
                )
              }
            >
              Passar para rascunho
            </BotaoLote>

            <BotaoLote
              perigo
              disabled={processando}
              onClick={() => {
                /* O número no aviso separa "os 3 que escolhi" de "os 24 da página". */
                const quantos = selecionados.length;
                if (
                  !window.confirm(
                    `Excluir ${plural(quantos, substantivo, plural_)}? Não há como desfazer.`,
                  )
                ) {
                  return;
                }
                executar(
                  () => excluirTrilhasEmLote(selecionados),
                  (n) => `${plural(n, substantivo, plural_)} excluído(s).`,
                );
              }}
            >
              Excluir
            </BotaoLote>
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
          <table className="w-full min-w-[48rem] text-sm">
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
                        todosMarcados ? [] : trilhas.map((t) => t.id),
                      )
                    }
                    aria-label="Selecionar todos desta página"
                    className="accent-acento size-4 align-middle"
                  />
                </th>
                <th scope="col" className="px-4 py-3 font-medium">
                  <Ordenavel
                    rotulo={tipo === "CURSO" ? "Curso" : "Trilha"}
                    ascendente="titulo"
                    descendente="titulo_desc"
                    ordenar={ordenar}
                    parametros={parametros}
                    base={base}
                  />
                </th>
                <th scope="col" className="px-4 py-3 font-medium">
                  {tipo === "CURSO" ? "MasterClasses" : "Conteúdos"}
                </th>
                <th scope="col" className="px-4 py-3 font-medium">
                  Nível
                </th>
                <th scope="col" className="px-4 py-3 font-medium">
                  <Ordenavel
                    rotulo="Atualizado"
                    ascendente="antigos"
                    descendente="recentes"
                    ordenar={ordenar}
                    parametros={parametros}
                    base={base}
                  />
                </th>
              </tr>
            </thead>

            <tbody>
              {trilhas.map((trilha) => {
                const marcado = selecionados.includes(trilha.id);
                const capa = trilha.thumbnailMobile ?? trilha.thumbnailDesktop;

                return (
                  <tr
                    key={trilha.id}
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
                            atual.includes(trilha.id)
                              ? atual.filter((i) => i !== trilha.id)
                              : [...atual, trilha.id],
                          )
                        }
                        aria-label={`Selecionar ${trilha.titulo}`}
                        className="accent-acento mt-1 size-4"
                      />
                    </td>

                    <td className="px-4 py-3">
                      <div className="flex items-start gap-3">
                        <span className="bg-superficie-2 relative mt-0.5 h-10 w-16 shrink-0 overflow-hidden rounded-md">
                          {capa && (
                            <Image
                              src={capa}
                              alt=""
                              fill
                              sizes="64px"
                              className="object-cover"
                            />
                          )}
                        </span>

                        <span className="flex min-w-0 flex-col">
                          <Link
                            href={`/trilhas/${trilha.id}/editar`}
                            className="text-texto hover:text-acento-claro truncate font-medium transition-colors"
                          >
                            {trilha.titulo}
                          </Link>

                          <span className="flex flex-wrap items-center gap-x-2">
                            {!trilha.publicada && (
                              <span className="text-aviso text-xs font-medium">
                                Rascunho
                              </span>
                            )}
                            {trilha.destaque && (
                              <span className="text-acento-claro text-xs font-medium">
                                Em destaque
                              </span>
                            )}
                          </span>

                          {/* Discretas até o cursor ou o teclado chegarem; no
                              toque ficam sempre visíveis, porque não há hover. */}
                          <span className="mt-1 flex gap-2 text-xs opacity-100 transition-opacity sm:opacity-0 sm:group-focus-within:opacity-100 sm:group-hover:opacity-100">
                            <Link
                              href={`/trilhas/${trilha.id}/editar`}
                              className="text-texto-3 hover:text-acento-claro transition-colors"
                            >
                              Editar
                            </Link>
                          </span>
                        </span>
                      </div>
                    </td>

                    <td className="text-texto-2 px-4 py-3 align-top tabular-nums">
                      {trilha.totalConteudos}
                    </td>

                    <td className="text-texto-2 px-4 py-3 align-top">
                      {trilha.nivel || "—"}
                    </td>

                    <td className="text-texto-3 px-4 py-3 align-top whitespace-nowrap">
                      {DATA.format(new Date(trilha.updatedAt))}
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

function BotaoLote({
  children,
  perigo,
  ...resto
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { perigo?: boolean }) {
  return (
    <button
      type="button"
      {...resto}
      className={`rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors disabled:opacity-50 ${
        perigo
          ? "border-alerta/40 text-alerta hover:bg-alerta/10"
          : "border-borda text-texto-2 hover:bg-superficie hover:text-texto"
      }`}
    >
      {children}
    </button>
  );
}
