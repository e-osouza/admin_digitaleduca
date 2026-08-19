"use client";

import { useState } from "react";
import { CONTROLE } from "@/components/campos-formulario";

export type ModuloNovo = {
  titulo: string;
  subtitulo: string;
  descricao: string;
};

/**
 * Monta a lista de módulos ANTES de o conteúdo existir.
 *
 * `POST /modulo-conteudo/create` exige `conteudoId`, então não há como criar
 * módulo antes de salvar. A saída é compor a lista aqui, em estado local, e
 * criar todos de uma vez assim que o conteúdo nascer — assim o layout de
 * módulos fica disponível de imediato, sem um salvamento intermediário.
 *
 * As aulas continuam sendo adicionadas na edição: cada uma é um upload de
 * arquivo, e encadear vários envios dentro da criação tornaria a falha
 * parcial muito mais difícil de explicar.
 */
export function CompositorModulos({
  modulos,
  aoMudar,
}: {
  modulos: ModuloNovo[];
  aoMudar: (modulos: ModuloNovo[]) => void;
}) {
  const [titulo, setTitulo] = useState("");
  const [subtitulo, setSubtitulo] = useState("");
  const [descricao, setDescricao] = useState("");
  const [aviso, setAviso] = useState<string | null>(null);

  function adicionar() {
    const limpo = {
      titulo: titulo.trim(),
      subtitulo: subtitulo.trim(),
      descricao: descricao.trim(),
    };

    // A API recusa qualquer um dos três em branco.
    if (!limpo.titulo || !limpo.subtitulo || !limpo.descricao) {
      setAviso("Preencha título, subtítulo e descrição — os três são exigidos pela API.");
      return;
    }

    if (
      modulos.some(
        (m) =>
          m.titulo.toLocaleLowerCase("pt-BR") ===
          limpo.titulo.toLocaleLowerCase("pt-BR"),
      )
    ) {
      setAviso("Já existe um módulo com esse título nesta lista.");
      return;
    }

    aoMudar([...modulos, limpo]);
    setTitulo("");
    setSubtitulo("");
    setDescricao("");
    setAviso(null);
  }

  return (
    <div className="flex flex-col gap-3">
      {modulos.length > 0 && (
        <ol className="border-borda-suave divide-borda-suave divide-y rounded-lg border">
          {modulos.map((modulo, indice) => (
            <li
              key={modulo.titulo}
              className="flex items-center gap-3 px-3 py-2.5 text-sm"
            >
              <span className="text-texto-3 w-5 shrink-0 text-xs tabular-nums">
                {indice + 1}
              </span>
              <span className="flex min-w-0 flex-1 flex-col">
                <span className="text-texto truncate font-medium">
                  {modulo.titulo}
                </span>
                <span className="text-texto-3 truncate text-xs">
                  {modulo.subtitulo}
                </span>
              </span>
              <button
                type="button"
                onClick={() =>
                  aoMudar(modulos.filter((_, i) => i !== indice))
                }
                className="text-alerta shrink-0 text-xs font-medium"
              >
                Remover
              </button>
            </li>
          ))}
        </ol>
      )}

      {/*
        Campos soltos, sem <form> próprio: este bloco vive dentro do formulário
        do conteúdo, e formulário aninhado é HTML inválido. O botão apenas
        empurra para o estado local — nada é enviado aqui.
      */}
      <div className="border-borda bg-superficie flex flex-col gap-2 rounded-lg border p-3">
        <input
          value={titulo}
          onChange={(e) => setTitulo(e.target.value)}
          placeholder="Título do módulo"
          className={CONTROLE}
        />
        <input
          value={subtitulo}
          onChange={(e) => setSubtitulo(e.target.value)}
          placeholder="Subtítulo"
          className={CONTROLE}
        />
        <textarea
          value={descricao}
          onChange={(e) => setDescricao(e.target.value)}
          rows={2}
          placeholder="Descrição"
          className={`${CONTROLE} resize-y`}
        />

        {aviso && (
          <p role="alert" className="text-alerta text-xs">
            {aviso}
          </p>
        )}

        <button
          type="button"
          onClick={adicionar}
          className="border-borda text-texto-2 hover:bg-superficie-2 hover:text-texto w-fit rounded-lg border px-3 py-1.5 text-sm font-medium transition-colors"
        >
          Adicionar módulo
        </button>
      </div>

      <p className="text-texto-3 text-xs">
        Os módulos são criados junto com o conteúdo. As aulas de cada um você
        envia na tela de edição, que abre em seguida.
      </p>
    </div>
  );
}
