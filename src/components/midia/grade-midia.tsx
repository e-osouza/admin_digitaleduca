"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { obterLinkDoVideo } from "@/app/(painel)/conteudos/acoes-aulas";
import { duracaoLegivel } from "@/lib/formato";

export type ItemMidia = {
  chave: string;
  titulo: string;
  /** Caminho da imagem ou da miniatura do vídeo. */
  imagem: string | null;
  /** Onde essa mídia é usada — é o que torna a grade navegável. */
  origem: string;
  /** Rota de edição de quem usa a mídia. */
  href?: string;
  /** Só em vídeo: a URI do Vimeo, para a prévia. */
  uri?: string;
  duracao?: number | null;
};

/**
 * Grade de mídias publicadas.
 *
 * Mostra o que está EM USO na plataforma, não o conteúdo bruto do disco: cada
 * item carrega de onde veio e leva para lá. Uma lista de arquivos soltos seria
 * mais fácil de montar e quase inútil — o que se quer saber, ao abrir esta
 * tela, é onde aquela imagem aparece.
 */
export function GradeMidia({
  itens,
  tipo,
}: {
  itens: ItemMidia[];
  tipo: "video" | "imagem";
}) {
  const [aberto, setAberto] = useState<ItemMidia | null>(null);
  const [fonte, setFonte] = useState<string | null>(null);
  const [carregando, setCarregando] = useState(false);

  async function abrir(item: ItemMidia) {
    setAberto(item);
    setFonte(null);
    if (tipo !== "video" || !item.uri) return;

    setCarregando(true);
    const link = await obterLinkDoVideo(item.uri);
    setCarregando(false);
    setFonte(link.mp4);
  }

  return (
    <div className="flex flex-col gap-4">
      {itens.length === 0 ? (
        <p className="border-borda-suave bg-superficie text-texto-2 rounded-xl border p-8 text-center text-sm">
          Nenhuma mídia encontrada.
        </p>
      ) : (
        <ul className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
          {itens.map((item) => (
            <li key={item.chave}>
              <button
                type="button"
                onClick={() => abrir(item)}
                className="border-borda-suave bg-superficie hover:border-acento/60 group flex w-full flex-col overflow-hidden rounded-xl border text-left transition-colors"
              >
                <span className="bg-superficie-2 relative block aspect-video w-full overflow-hidden">
                  {item.imagem ? (
                    <Image
                      src={item.imagem}
                      alt=""
                      fill
                      sizes="(min-width: 1280px) 20vw, (min-width: 640px) 33vw, 50vw"
                      className="object-cover"
                    />
                  ) : (
                    <span className="text-texto-3 absolute inset-0 flex items-center justify-center text-xs">
                      sem miniatura
                    </span>
                  )}

                  {tipo === "video" && item.duracao ? (
                    <span className="absolute right-1.5 bottom-1.5 rounded bg-black/70 px-1.5 py-0.5 text-[11px] font-medium text-white tabular-nums">
                      {duracaoLegivel(item.duracao)}
                    </span>
                  ) : null}
                </span>

                <span className="flex flex-col gap-0.5 p-3">
                  <span className="text-texto truncate text-sm font-medium">
                    {item.titulo}
                  </span>
                  <span className="text-texto-3 truncate text-xs">
                    {item.origem}
                  </span>
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}

      {aberto && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) setAberto(null);
          }}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-label={aberto.titulo}
            className="border-borda bg-superficie flex max-h-[85vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl border shadow-2xl"
          >
            <div className="border-borda-suave flex items-start justify-between gap-3 border-b px-5 py-3">
              <div className="min-w-0">
                <p className="text-texto truncate font-semibold">
                  {aberto.titulo}
                </p>
                <p className="text-texto-3 truncate text-sm">{aberto.origem}</p>
              </div>
              <button
                type="button"
                onClick={() => setAberto(null)}
                aria-label="Fechar"
                className="text-texto-3 hover:text-texto shrink-0 text-xl leading-none"
              >
                ×
              </button>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto p-5">
              {tipo === "video" ? (
                carregando ? (
                  <p className="text-texto-3 text-sm">Carregando prévia…</p>
                ) : fonte ? (
                  <video
                    src={fonte}
                    controls
                    className="border-borda-suave w-full rounded-lg border"
                  />
                ) : (
                  /* Sem MP4 sobra HLS, que só toca nativamente no Safari —
                     melhor dizer isso do que exibir um player quebrado. */
                  <p className="text-texto-3 text-sm">
                    Prévia indisponível para este vídeo. Ele funciona
                    normalmente na plataforma.
                  </p>
                )
              ) : aberto.imagem ? (
                <Image
                  src={aberto.imagem}
                  alt=""
                  width={1280}
                  height={720}
                  className="border-borda-suave h-auto w-full rounded-lg border"
                />
              ) : (
                <p className="text-texto-3 text-sm">Sem imagem.</p>
              )}
            </div>

            {aberto.href && (
              <div className="border-borda-suave border-t px-5 py-3">
                <Link
                  href={aberto.href}
                  className="text-acento-claro hover:text-acento text-sm font-medium transition-colors"
                >
                  Abrir onde é usado →
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
