"use client";

import { useEffect, useRef, useState } from "react";
import { buscarVideosNaBiblioteca } from "@/app/(painel)/conteudos/acoes-aulas";
import { CONTROLE } from "@/components/campos-formulario";
import { CampoUploadVimeo } from "@/components/conteudos/campo-upload-vimeo";
import { duracaoLegivel } from "@/lib/formato";

type Aba = "biblioteca" | "enviar";
type VideoBiblioteca = {
  id: number;
  titulo: string;
  url?: string;
  duracao: number | null;
};

/*
  Biblioteca de mídia para VÍDEOS, no mesmo espírito do modal de imagens: duas
  abas — "Biblioteca" (vídeos já no Vimeo/plataforma, para reaproveitar) e
  "Enviar" (upload que começa ao selecionar, com progresso e cancelar).

  Escolher devolve a URL do vídeo ("/videos/123"); selecionar um existente não
  reenvia nada, e um upload novo já fica escolhido quando termina.
*/
export function ModalVideoMidia({
  aberto,
  aoFechar,
  aoEscolher,
}: {
  aberto: boolean;
  aoFechar: () => void;
  aoEscolher: (url: string) => void;
}) {
  const [aba, setAba] = useState<Aba>("biblioteca");
  const dialogo = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!aberto) return;
    function aoTeclar(e: KeyboardEvent) {
      if (e.key === "Escape") aoFechar();
    }
    document.addEventListener("keydown", aoTeclar);
    dialogo.current?.focus();
    return () => document.removeEventListener("keydown", aoTeclar);
  }, [aberto, aoFechar]);

  if (!aberto) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) aoFechar();
      }}
    >
      <div
        ref={dialogo}
        role="dialog"
        aria-modal="true"
        aria-label="Biblioteca de vídeos"
        tabIndex={-1}
        className="border-borda bg-superficie flex max-h-[85vh] w-full max-w-3xl flex-col overflow-hidden rounded-2xl border shadow-2xl outline-none"
      >
        <div className="border-borda-suave flex items-center justify-between border-b px-5 py-3">
          <h2 className="text-texto font-semibold">Vídeo</h2>
          <button
            type="button"
            onClick={aoFechar}
            className="text-texto-3 hover:text-texto text-xl leading-none"
            aria-label="Fechar"
          >
            ×
          </button>
        </div>

        <div className="border-borda-suave flex gap-1 border-b px-5 pt-3">
          {(
            [
              ["biblioteca", "Biblioteca"],
              ["enviar", "Enviar"],
            ] as const
          ).map(([chave, rotulo]) => (
            <button
              key={chave}
              type="button"
              onClick={() => setAba(chave)}
              className={`rounded-t-lg px-3 py-2 text-sm font-medium transition-colors ${
                aba === chave
                  ? "text-acento border-acento border-b-2"
                  : "text-texto-3 hover:text-texto border-b-2 border-transparent"
              }`}
            >
              {rotulo}
            </button>
          ))}
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto p-5">
          {aba === "biblioteca" ? (
            <AbaBiblioteca aoEscolher={aoEscolher} />
          ) : (
            <AbaEnviar aoEscolher={aoEscolher} />
          )}
        </div>
      </div>
    </div>
  );
}

function AbaBiblioteca({ aoEscolher }: { aoEscolher: (url: string) => void }) {
  const [busca, setBusca] = useState("");
  const [itens, setItens] = useState<VideoBiblioteca[]>([]);
  const [carregando, setCarregando] = useState(false);

  useEffect(() => {
    const relogio = setTimeout(async () => {
      setCarregando(true);
      setItens(await buscarVideosNaBiblioteca(busca));
      setCarregando(false);
    }, 350);
    return () => clearTimeout(relogio);
  }, [busca]);

  return (
    <div className="flex flex-col gap-3">
      <input
        type="search"
        value={busca}
        onChange={(e) => setBusca(e.target.value)}
        placeholder="Buscar vídeo…"
        className={CONTROLE}
      />

      {carregando && <p className="text-texto-3 text-xs">Buscando…</p>}

      <ul className="border-borda-suave divide-borda-suave/60 max-h-96 divide-y overflow-y-auto rounded-lg border">
        {itens
          .filter((v) => v.url)
          .map((video) => (
            <li key={video.id}>
              <button
                type="button"
                onClick={() => aoEscolher(video.url!)}
                className="hover:bg-superficie-2 flex w-full items-center gap-2 px-3 py-2 text-left transition-colors"
              >
                <span className="text-texto-2 min-w-0 flex-1 truncate text-sm">
                  {video.titulo}
                </span>
                <span className="text-texto-3 shrink-0 text-xs">
                  {duracaoLegivel(video.duracao)}
                </span>
              </button>
            </li>
          ))}

        {itens.length === 0 && !carregando && (
          <li className="text-texto-3 px-3 py-4 text-center text-sm">
            Nenhum vídeo encontrado.
          </li>
        )}
      </ul>
    </div>
  );
}

function AbaEnviar({ aoEscolher }: { aoEscolher: (url: string) => void }) {
  return (
    <div className="flex flex-col gap-3 py-2">
      <p className="text-texto-2 text-sm">
        O envio começa ao selecionar o arquivo. Você pode cancelar enquanto sobe;
        quando terminar, o vídeo é escolhido automaticamente.
      </p>
      <CampoUploadVimeo
        nome="_videoMidiaTmp"
        aoMudarUrl={(url) => {
          if (url) aoEscolher(url);
        }}
      />
    </div>
  );
}
