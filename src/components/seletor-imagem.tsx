"use client";

import Image from "next/image";
import { useState } from "react";
import { CONTROLE } from "@/components/campos-formulario";

export type ImagemDaBiblioteca = {
  url: string;
  titulo: string;
  origem: string;
};

/**
 * Escolhe uma imagem: da biblioteca ou colando o endereço.
 *
 * Duas abas, e não um campo só, porque são duas situações diferentes. Reusar
 * uma capa que já está na plataforma era possível mas exigia caçar a URL em
 * outra tela e copiá-la à mão; colar endereço continua valendo para imagem
 * que mora fora, feita para aquela campanha.
 *
 * O valor final é sempre a URL — a aba é só o caminho até ela.
 */
export function SeletorImagem({
  valor,
  aoMudar,
  biblioteca,
}: {
  valor: string;
  aoMudar: (url: string) => void;
  biblioteca: ImagemDaBiblioteca[];
}) {
  const [aba, setAba] = useState<"biblioteca" | "url">(
    biblioteca.length > 0 ? "biblioteca" : "url",
  );
  const [busca, setBusca] = useState("");

  const filtradas = busca
    ? biblioteca.filter((i) =>
        `${i.titulo} ${i.origem}`
          .toLocaleLowerCase("pt-BR")
          .includes(busca.toLocaleLowerCase("pt-BR")),
      )
    : biblioteca;

  return (
    <div className="flex flex-col gap-3">
      <div className="border-borda-suave flex gap-1 border-b">
        {(
          [
            ["biblioteca", "Da biblioteca"],
            ["url", "Colar endereço"],
          ] as const
        ).map(([chave, rotulo]) => (
          <button
            key={chave}
            type="button"
            onClick={() => setAba(chave)}
            aria-current={aba === chave ? "true" : undefined}
            className={`-mb-px border-b-2 px-3 py-2 text-sm transition-colors ${
              aba === chave
                ? "border-acento text-texto font-semibold"
                : "text-texto-2 hover:text-texto border-transparent"
            }`}
          >
            {rotulo}
          </button>
        ))}
      </div>

      {aba === "url" ? (
        <input
          value={valor}
          onChange={(e) => aoMudar(e.target.value)}
          placeholder="https://…"
          className={CONTROLE}
        />
      ) : biblioteca.length === 0 ? (
        <p className="text-texto-3 text-sm">
          Nenhuma imagem publicada ainda. Use a outra aba para colar um
          endereço.
        </p>
      ) : (
        <div className="flex flex-col gap-2">
          <input
            type="search"
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            placeholder="Buscar por título…"
            className={CONTROLE}
          />

          {filtradas.length === 0 ? (
            <p className="text-texto-3 py-4 text-center text-sm">
              Nenhuma imagem com esse nome.
            </p>
          ) : (
            <ul className="border-borda-suave grid max-h-64 grid-cols-2 gap-2 overflow-y-auto rounded-lg border p-2 sm:grid-cols-3">
              {filtradas.map((imagem) => {
                const escolhida = imagem.url === valor;
                return (
                  <li key={imagem.url}>
                    <button
                      type="button"
                      /* Clicar de novo desmarca — é como se tira a imagem sem apagar texto. */
                      onClick={() => aoMudar(escolhida ? "" : imagem.url)}
                      aria-pressed={escolhida}
                      className={`group block w-full overflow-hidden rounded-lg border text-left transition-colors ${
                        escolhida
                          ? "border-acento ring-acento/30 ring-2"
                          : "border-borda-suave hover:border-acento/50"
                      }`}
                    >
                      <span className="bg-superficie-2 relative block aspect-video">
                        <Image
                          src={imagem.url}
                          alt=""
                          fill
                          sizes="200px"
                          className="object-cover"
                        />
                        {/* A escolha é dita por texto, não só pela borda colorida. */}
                        {escolhida && (
                          <span className="bg-acento absolute right-1 bottom-1 rounded px-1.5 py-0.5 text-[10px] font-semibold text-white">
                            escolhida
                          </span>
                        )}
                      </span>
                      <span className="flex flex-col px-2 py-1.5">
                        <span className="text-texto truncate text-xs font-medium">
                          {imagem.titulo}
                        </span>
                        <span className="text-texto-3 truncate text-[11px]">
                          {imagem.origem}
                        </span>
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      )}

      {valor && (
        <p className="text-texto-3 flex flex-wrap items-center gap-2 text-xs">
          <span className="min-w-0 flex-1 truncate">{valor}</span>
          <button
            type="button"
            onClick={() => aoMudar("")}
            className="hover:text-alerta font-medium transition-colors"
          >
            remover
          </button>
        </p>
      )}
    </div>
  );
}
