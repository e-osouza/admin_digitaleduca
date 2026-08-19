"use client";

import { useState } from "react";
import type { Instrutor } from "@/types/api";

/**
 * Seleção múltipla de pessoas com busca e resumo do que já foi escolhido.
 *
 * A lista tem mais de 70 nomes: rolar até achar alguém é inviável. A busca
 * filtra, e as pessoas selecionadas aparecem como fichas no topo — assim quem
 * já está escolhido continua visível mesmo quando o filtro esconde a linha
 * dele lá embaixo.
 *
 * Os checkboxes reais são SEMPRE renderizados, e o filtro apenas os oculta com
 * CSS. Removê-los do DOM perderia a marcação de quem sumiu do filtro — e o
 * formulário lê justamente `input[name=...]:checked` na hora de enviar.
 */
export function SeletorPessoas({
  nome,
  pessoas,
  selecionadosIniciais,
  vazio = "Nenhuma pessoa cadastrada ainda.",
}: {
  nome: string;
  pessoas: Instrutor[];
  selecionadosIniciais: number[];
  vazio?: string;
}) {
  const [selecionados, setSelecionados] = useState<number[]>(
    selecionadosIniciais,
  );
  const [busca, setBusca] = useState("");

  if (pessoas.length === 0) {
    return <p className="text-texto-3 text-sm">{vazio}</p>;
  }

  const normalizar = (texto: string) => texto.toLocaleLowerCase("pt-BR").trim();
  const filtro = normalizar(busca);

  const alternar = (id: number) =>
    setSelecionados((atuais) =>
      atuais.includes(id)
        ? atuais.filter((x) => x !== id)
        : [...atuais, id],
    );

  const escolhidas = pessoas.filter((p) => selecionados.includes(p.id));
  const visivel = (p: Instrutor) => !filtro || normalizar(p.nome).includes(filtro);
  const encontradas = pessoas.filter(visivel).length;

  return (
    <div className="flex flex-col gap-2">
      {escolhidas.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {escolhidas.map((pessoa) => (
            <span
              key={pessoa.id}
              className="bg-acento/10 text-acento flex items-center gap-1.5 rounded-full py-1 pr-1 pl-3 text-xs font-medium"
            >
              {pessoa.nome}
              <button
                type="button"
                onClick={() => alternar(pessoa.id)}
                aria-label={`Remover ${pessoa.nome}`}
                className="hover:bg-acento/20 flex h-5 w-5 items-center justify-center rounded-full"
              >
                <svg
                  viewBox="0 0 20 20"
                  aria-hidden="true"
                  className="h-3 w-3"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.4"
                  strokeLinecap="round"
                >
                  <path d="M5 5l10 10M15 5L5 15" />
                </svg>
              </button>
            </span>
          ))}
        </div>
      )}

      <input
        type="search"
        value={busca}
        onChange={(evento) => setBusca(evento.target.value)}
        placeholder="Buscar pessoa…"
        className="border-borda bg-superficie text-texto placeholder:text-texto-3 focus:border-acento-claro w-full rounded-lg border px-3 py-2 text-sm outline-none transition-colors"
      />

      <div className="border-borda max-h-52 overflow-y-auto rounded-lg border p-2">
        {pessoas.map((pessoa) => {
          const marcado = selecionados.includes(pessoa.id);

          return (
            <label
              key={pessoa.id}
              className={`hover:bg-superficie-2 flex items-center gap-2 rounded-md px-2 py-1.5 text-sm ${
                visivel(pessoa) ? "" : "hidden"
              }`}
            >
              <input
                type="checkbox"
                name={nome}
                value={pessoa.id}
                checked={marcado}
                onChange={() => alternar(pessoa.id)}
                className="accent-acento h-4 w-4"
              />
              <span className="text-texto-2">{pessoa.nome}</span>
            </label>
          );
        })}

        {encontradas === 0 && (
          <p className="text-texto-3 px-2 py-1.5 text-sm">
            Nenhuma pessoa com esse nome.
          </p>
        )}
      </div>
    </div>
  );
}
