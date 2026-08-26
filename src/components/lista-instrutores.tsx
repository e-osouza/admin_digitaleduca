"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { BotaoExcluirInstrutor } from "@/components/formulario-instrutor";
import type { Instrutor } from "@/types/api";

type ComUso = Instrutor & { totalConteudos: number };

/**
 * A listagem de instrutores.
 *
 * Criar e editar moram em páginas próprias — `/instrutores/novo` e
 * `/instrutores/[id]/editar` —, como em usuários. Antes o formulário abria
 * dentro da própria lista: cabia enquanto o cadastro eram três campos, mas
 * empurrava as linhas para baixo, não tinha endereço para compartilhar e não
 * havia onde crescer (a página de edição hoje também mostra o que a pessoa
 * assina).
 *
 * A busca continua aqui, no cliente: a lista inteira já vem carregada, e
 * filtrar em memória responde no teclado, sem ida ao servidor.
 */
export function ListaInstrutores({ instrutores }: { instrutores: ComUso[] }) {
  const [busca, setBusca] = useState("");

  const filtrados = busca
    ? instrutores.filter((i) =>
        i.nome
          .toLocaleLowerCase("pt-BR")
          .includes(busca.toLocaleLowerCase("pt-BR")),
      )
    : instrutores;

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-center gap-3">
        <input
          type="search"
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
          placeholder="Buscar por nome…"
          className="border-borda bg-superficie text-texto placeholder:text-texto-3 focus:border-acento-claro min-w-48 flex-1 rounded-lg border px-3 py-2 text-sm outline-none transition-colors"
        />

        <Link
          href="/instrutores/novo"
          className="bg-acento hover:bg-acento-hover shrink-0 rounded-lg px-4 py-2.5 text-sm font-semibold text-white transition-colors"
        >
          Novo instrutor
        </Link>
      </div>

      {filtrados.length === 0 ? (
        <p className="border-borda-suave bg-superficie text-texto-2 rounded-xl border p-8 text-center text-sm">
          {busca
            ? "Nenhum instrutor com esse nome."
            : "Nenhum instrutor cadastrado ainda."}
        </p>
      ) : (
        <ul className="flex flex-col gap-3">
          {filtrados.map((instrutor) => (
            <li
              key={instrutor.id}
              className="border-borda-suave bg-superficie flex items-center gap-4 rounded-xl border p-4"
            >
              <span className="bg-superficie-2 relative h-14 w-14 shrink-0 overflow-hidden rounded-full">
                {instrutor.avatar ? (
                  <Image
                    src={instrutor.avatar}
                    alt=""
                    fill
                    sizes="56px"
                    className="object-cover"
                  />
                ) : (
                  <span className="text-acento bg-acento/15 absolute inset-0 flex items-center justify-center text-lg font-semibold">
                    {instrutor.nome.charAt(0).toUpperCase()}
                  </span>
                )}
              </span>

              <div className="flex min-w-0 flex-1 flex-col">
                <Link
                  href={`/instrutores/${instrutor.id}/editar`}
                  className="text-texto hover:text-acento-claro truncate font-medium transition-colors"
                >
                  {instrutor.nome}
                </Link>
                <span className="text-texto-3 truncate text-sm">
                  {instrutor.formacao || (
                    <span className="text-aviso">Sem formação cadastrada</span>
                  )}
                </span>
              </div>

              <span className="text-texto-3 shrink-0 text-xs">
                {instrutor.totalConteudos === 0
                  ? "sem conteúdo"
                  : `${instrutor.totalConteudos} ${
                      instrutor.totalConteudos === 1 ? "conteúdo" : "conteúdos"
                    }`}
              </span>

              <Link
                href={`/instrutores/${instrutor.id}/editar`}
                className="text-texto-2 hover:text-texto shrink-0 text-xs font-medium transition-colors"
              >
                Editar
              </Link>

              <BotaoExcluirInstrutor
                id={instrutor.id}
                nome={instrutor.nome}
                totalConteudos={instrutor.totalConteudos}
              />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
