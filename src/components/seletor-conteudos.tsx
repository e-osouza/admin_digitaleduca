"use client";

import { useState } from "react";
import { CONTROLE } from "@/components/campos-formulario";
import { ROTULO_TIPO } from "@/lib/tipos";
import type { ConteudoBusca } from "@/types/api";



/**
 * Escolhe conteúdos numa ordem específica.
 *
 * Diferente de uma seleção comum, aqui a ORDEM importa — ela vira o `ordem` de
 * cada item na trilha. Por isso os escolhidos aparecem numa lista numerada com
 * setas, e não como fichas soltas.
 *
 * `indisponiveis` são os conteúdos já usados em outro módulo da mesma trilha:
 * a API tem unique em (trilha, conteúdo), então o mesmo conteúdo não pode
 * aparecer duas vezes. Mostrar como bloqueado é mais claro que deixar
 * escolher e descartar em silêncio no servidor.
 */
export function SeletorConteudos({
  disponiveis,
  selecionados,
  indisponiveis,
  aoMudar,
}: {
  disponiveis: ConteudoBusca[];
  selecionados: number[];
  indisponiveis: Set<number>;
  aoMudar: (ids: number[]) => void;
}) {
  const [busca, setBusca] = useState("");

  const porId = new Map(disponiveis.map((c) => [c.id, c]));
  const filtro = busca.trim().toLocaleLowerCase("pt-BR");

  const lista = disponiveis.filter(
    (c) =>
      !selecionados.includes(c.id) &&
      !indisponiveis.has(c.id) &&
      (!filtro || c.titulo.toLocaleLowerCase("pt-BR").includes(filtro)),
  );

  function mover(de: number, para: number) {
    if (para < 0 || para >= selecionados.length) return;
    const copia = [...selecionados];
    [copia[de], copia[para]] = [copia[para], copia[de]];
    aoMudar(copia);
  }

  return (
    <div className="flex flex-col gap-2">
      {selecionados.length > 0 && (
        <ol className="border-borda-suave divide-borda-suave divide-y rounded-lg border">
          {selecionados.map((id, indice) => {
            const conteudo = porId.get(id);
            return (
              <li
                key={id}
                className="flex items-center gap-2 px-3 py-2 text-sm"
              >
                <span className="text-texto-3 w-5 shrink-0 text-xs tabular-nums">
                  {indice + 1}
                </span>
                <span className="text-texto min-w-0 flex-1 truncate">
                  {conteudo?.titulo ?? `Conteúdo #${id}`}
                </span>
                {conteudo && (
                  <span className="text-texto-3 shrink-0 text-xs">
                    {ROTULO_TIPO[conteudo.tipo] ?? conteudo.tipo}
                  </span>
                )}
                <button
                  type="button"
                  onClick={() => mover(indice, indice - 1)}
                  disabled={indice === 0}
                  aria-label="Mover para cima"
                  className="text-texto-2 hover:text-texto shrink-0 px-1 disabled:opacity-30"
                >
                  ↑
                </button>
                <button
                  type="button"
                  onClick={() => mover(indice, indice + 1)}
                  disabled={indice === selecionados.length - 1}
                  aria-label="Mover para baixo"
                  className="text-texto-2 hover:text-texto shrink-0 px-1 disabled:opacity-30"
                >
                  ↓
                </button>
                <button
                  type="button"
                  onClick={() => aoMudar(selecionados.filter((x) => x !== id))}
                  className="text-alerta shrink-0 text-xs font-medium"
                >
                  Remover
                </button>
              </li>
            );
          })}
        </ol>
      )}

      <input
        type="search"
        value={busca}
        onChange={(evento) => setBusca(evento.target.value)}
        placeholder="Buscar conteúdo para adicionar…"
        className={CONTROLE}
      />

      <div className="border-borda max-h-44 overflow-y-auto rounded-lg border p-1">
        {lista.length === 0 ? (
          <p className="text-texto-3 px-2 py-1.5 text-sm">
            {filtro
              ? "Nenhum conteúdo com esse nome."
              : "Todos os conteúdos já foram usados nesta trilha."}
          </p>
        ) : (
          lista.map((conteudo) => (
            <button
              key={conteudo.id}
              type="button"
              onClick={() => aoMudar([...selecionados, conteudo.id])}
              className="hover:bg-superficie-2 flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm"
            >
              <span className="text-texto-2 min-w-0 flex-1 truncate">
                {conteudo.titulo}
              </span>
              <span className="text-texto-3 shrink-0 text-xs">
                {ROTULO_TIPO[conteudo.tipo] ?? conteudo.tipo}
              </span>
            </button>
          ))
        )}
      </div>
    </div>
  );
}
