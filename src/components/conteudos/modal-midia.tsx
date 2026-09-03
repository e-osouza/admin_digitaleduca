"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import {
  enviarImagemMidia,
  listarImagensMidia,
} from "@/app/(painel)/conteudos/acoes";
import { CAMPO_ARQUIVO, CONTROLE } from "@/components/campos-formulario";

type Aba = "biblioteca" | "enviar";
type Imagem = { src: string; nome: string; tamanho: number };

/*
  Biblioteca de mídia (imagens), no estilo WordPress: um modal com duas abas —
  "Biblioteca" (as imagens já enviadas, para reaproveitar) e "Enviar" (uma nova).
  Escolher uma imagem devolve o CAMINHO ("uploads/x.jpg"), que o formulário
  guarda; nada é reenviado ao selecionar uma existente.
*/
export function ModalMidia({
  aberto,
  aoFechar,
  aoEscolher,
}: {
  aberto: boolean;
  aoFechar: () => void;
  aoEscolher: (src: string) => void;
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
        aria-label="Biblioteca de mídia"
        tabIndex={-1}
        className="border-borda bg-superficie flex max-h-[85vh] w-full max-w-4xl flex-col overflow-hidden rounded-2xl border shadow-2xl outline-none"
      >
        <div className="border-borda-suave flex items-center justify-between border-b px-5 py-3">
          <h2 className="text-texto font-semibold">Biblioteca de mídia</h2>
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

function AbaBiblioteca({ aoEscolher }: { aoEscolher: (src: string) => void }) {
  const [busca, setBusca] = useState("");
  const [itens, setItens] = useState<Imagem[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [carregando, setCarregando] = useState(false);

  useEffect(() => {
    const relogio = setTimeout(async () => {
      setCarregando(true);
      const r = await listarImagensMidia(busca, 1);
      setItens(r.data);
      setPage(r.page);
      setTotalPages(r.totalPages);
      setCarregando(false);
    }, 350);
    return () => clearTimeout(relogio);
  }, [busca]);

  async function verMais() {
    const proxima = page + 1;
    setCarregando(true);
    const r = await listarImagensMidia(busca, proxima);
    setItens((atual) => [...atual, ...r.data]);
    setPage(r.page);
    setTotalPages(r.totalPages);
    setCarregando(false);
  }

  return (
    <div className="flex flex-col gap-4">
      <input
        type="search"
        value={busca}
        onChange={(e) => setBusca(e.target.value)}
        placeholder="Buscar por nome do arquivo…"
        className={CONTROLE}
      />

      {itens.length === 0 && !carregando ? (
        <p className="text-texto-3 py-8 text-center text-sm">
          Nenhuma imagem encontrada.
        </p>
      ) : (
        <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-6">
          {itens.map((img) => (
            <button
              key={img.src}
              type="button"
              onClick={() => aoEscolher(img.src)}
              title={img.nome}
              className="border-borda-suave hover:border-acento focus-visible:border-acento bg-superficie-2 relative aspect-square overflow-hidden rounded-lg border transition-colors"
            >
              <Image
                src={img.src}
                alt=""
                fill
                sizes="120px"
                className="object-cover"
              />
            </button>
          ))}
        </div>
      )}

      {carregando && (
        <p className="text-texto-3 text-center text-xs">Carregando…</p>
      )}

      {page < totalPages && !carregando && (
        <button
          type="button"
          onClick={verMais}
          className="border-borda text-texto-2 hover:border-acento hover:text-acento mx-auto rounded-lg border px-4 py-2 text-sm"
        >
          Ver mais
        </button>
      )}
    </div>
  );
}

function AbaEnviar({ aoEscolher }: { aoEscolher: (src: string) => void }) {
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  async function aoSelecionar(e: React.ChangeEvent<HTMLInputElement>) {
    const arquivo = e.target.files?.[0];
    e.target.value = "";
    if (!arquivo) return;
    setErro(null);
    setEnviando(true);
    const fd = new FormData();
    fd.set("file", arquivo);
    const r = await enviarImagemMidia(fd);
    setEnviando(false);
    if (!r.ok) {
      setErro(r.erro);
      return;
    }
    aoEscolher(r.src); // já seleciona a imagem recém-enviada
  }

  return (
    <div className="flex flex-col gap-3 py-4">
      <p className="text-texto-2 text-sm">
        Envie uma imagem nova — ela entra na biblioteca e já fica selecionada.
      </p>
      <input
        type="file"
        accept="image/*"
        disabled={enviando}
        onChange={aoSelecionar}
        className={CAMPO_ARQUIVO}
      />
      {enviando && <p className="text-texto-3 text-xs">Enviando…</p>}
      {erro && <p className="text-alerta text-xs">{erro}</p>}
    </div>
  );
}
