"use client";

import { useState } from "react";
import { ModalVideoMidia } from "@/components/conteudos/modal-video-midia";

/*
  Campo de vídeo no mesmo estilo do campo de imagem: um botão que abre a
  biblioteca de vídeos (escolher existente OU enviar novo). O valor guardado é a
  URL do vídeo ("/videos/123"), enviada ao formulário por um input escondido; o
  formulário a vincula ao conteúdo no submit. A duração é preenchida pela API.
*/
export function CampoVideoBiblioteca({
  nome,
  atual,
}: {
  /** Campo do FormData que recebe a URL do vídeo escolhido. */
  nome: string;
  /** Edição: já existe um vídeo vinculado. */
  atual?: string | null;
}) {
  const [valor, setValor] = useState<string>(atual ?? "");
  const [novo, setNovo] = useState(false);
  const [aberto, setAberto] = useState(false);

  const temVideo = !!valor;

  return (
    <div className="flex flex-col gap-2">
      <div className="border-borda-suave bg-superficie-2 flex items-center justify-between gap-3 rounded-lg border px-3 py-2.5">
        <span className="text-texto-2 min-w-0 truncate text-sm">
          {temVideo
            ? novo
              ? "✓ Vídeo escolhido"
              : "✓ Vídeo atual"
            : "Nenhum vídeo selecionado"}
        </span>
        <div className="flex shrink-0 items-center gap-2">
          {temVideo && (
            <button
              type="button"
              onClick={() => {
                setValor("");
                setNovo(true);
              }}
              className="text-texto-3 hover:text-alerta text-sm"
            >
              Remover
            </button>
          )}
          <button
            type="button"
            onClick={() => setAberto(true)}
            className="border-borda text-texto-2 hover:border-acento hover:text-acento rounded-lg border px-3 py-1.5 text-sm font-medium transition-colors"
          >
            {temVideo ? "Trocar vídeo" : "Escolher vídeo"}
          </button>
        </div>
      </div>

      {/* Vai como texto no FormData; vazio não é enviado. */}
      <input type="hidden" name={nome} value={valor} />

      <ModalVideoMidia
        aberto={aberto}
        aoFechar={() => setAberto(false)}
        aoEscolher={(url) => {
          setValor(url);
          setNovo(true);
          setAberto(false);
        }}
      />
    </div>
  );
}
