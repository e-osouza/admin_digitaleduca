"use client";

import Image from "next/image";
import { useState } from "react";
import {
  BotaoExcluirInstrutor,
  FormularioInstrutor,
} from "@/components/formulario-instrutor";
import type { Instrutor } from "@/types/api";

type ComUso = Instrutor & { totalConteudos: number };

export function ListaInstrutores({ instrutores }: { instrutores: ComUso[] }) {
  const [criando, setCriando] = useState(false);
  const [editando, setEditando] = useState<number | null>(null);
  const [busca, setBusca] = useState("");

  const filtrados = busca
    ? instrutores.filter((i) =>
        i.nome.toLocaleLowerCase("pt-BR").includes(busca.toLocaleLowerCase("pt-BR")),
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

        {!criando && (
          <button
            type="button"
            onClick={() => {
              setCriando(true);
              setEditando(null);
            }}
            className="bg-acento hover:bg-acento-hover shrink-0 rounded-lg px-4 py-2.5 text-sm font-semibold text-white transition-colors"
          >
            Novo instrutor
          </button>
        )}
      </div>

      {criando && <FormularioInstrutor aoFechar={() => setCriando(false)} />}

      {filtrados.length === 0 ? (
        <p className="border-borda-suave bg-superficie text-texto-2 rounded-xl border p-8 text-center text-sm">
          {busca
            ? "Nenhum instrutor com esse nome."
            : "Nenhum instrutor cadastrado ainda."}
        </p>
      ) : (
        <ul className="flex flex-col gap-3">
          {filtrados.map((instrutor) =>
            editando === instrutor.id ? (
              <li key={instrutor.id}>
                <FormularioInstrutor
                  instrutor={instrutor}
                  aoFechar={() => setEditando(null)}
                />
              </li>
            ) : (
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
                  <span className="text-texto truncate font-medium">
                    {instrutor.nome}
                  </span>
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

                <button
                  type="button"
                  onClick={() => {
                    setEditando(instrutor.id);
                    setCriando(false);
                  }}
                  className="text-texto-2 hover:text-texto shrink-0 text-xs font-medium"
                >
                  Editar
                </button>

                <BotaoExcluirInstrutor
                  id={instrutor.id}
                  nome={instrutor.nome}
                  totalConteudos={instrutor.totalConteudos}
                />
              </li>
            ),
          )}
        </ul>
      )}
    </div>
  );
}
