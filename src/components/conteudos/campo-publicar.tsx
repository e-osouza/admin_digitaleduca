"use client";

import { useEffect, useState } from "react";
import { obterProntidao } from "@/app/(painel)/conteudos/acoes";

type Prontidao = {
  pronto: boolean;
  total: number;
  prontos: number;
  semVideo: boolean;
  pendentes: { id: number; titulo: string }[];
};

/*
  Controle de "Publicado" com trava de vídeo.

  Um conteúdo só pode ir ao ar quando seus vídeos estão TOCÁVEIS no Vimeo —
  "enviado" não basta, o Vimeo ainda transcodifica. A garantia real é no
  backend (a API recusa publicar sem vídeo pronto); aqui é a camada de UX: o
  checkbox fica desabilitado e a tela avisa o status enquanto processa, e libera
  sozinho quando fica pronto.

  Na criação não há checkbox: o conteúdo nasce rascunho e é publicado depois, na
  edição, quando o vídeo estiver validado.
*/
export function CampoPublicar({
  conteudoId,
  publicadoAtual = false,
}: {
  /** Ausente = criação. */
  conteudoId?: number;
  publicadoAtual?: boolean;
}) {
  const criando = !conteudoId;
  const [prontidao, setProntidao] = useState<Prontidao | null>(null);

  // Só vale vigiar um rascunho existente: já publicado passou pela trava, e na
  // criação ainda nem há vídeo.
  const vigiar = !criando && !publicadoAtual;

  useEffect(() => {
    if (!vigiar || !conteudoId) return;
    let vivo = true;
    let timer: ReturnType<typeof setTimeout>;

    const checar = async () => {
      const p = await obterProntidao(conteudoId);
      if (!vivo) return;
      setProntidao(p);
      // Re-checa enquanto o Vimeo processa; para quando ficar pronto.
      if (!p?.pronto) timer = setTimeout(checar, 8000);
    };

    checar();
    return () => {
      vivo = false;
      clearTimeout(timer);
    };
  }, [conteudoId, vigiar]);

  if (criando) {
    return (
      <div className="border-borda-suave bg-superficie-2/40 rounded-lg border px-3 py-2">
        <p className="text-texto-2 text-sm font-medium">Nasce como rascunho</p>
        <p className="text-texto-3 mt-0.5 text-xs">
          O conteúdo é salvo como rascunho. Você publica na edição, depois que o
          vídeo terminar de ser processado no Vimeo.
        </p>
      </div>
    );
  }

  const bloqueado = vigiar && prontidao !== null && !prontidao.pronto;

  return (
    <div className="flex flex-col gap-2">
      <label
        className={`flex items-center gap-2 text-sm ${
          bloqueado ? "opacity-60" : ""
        }`}
      >
        <input
          type="checkbox"
          name="publicado"
          defaultChecked={publicadoAtual}
          disabled={bloqueado}
          className="accent-acento h-4 w-4"
        />
        <span className="text-texto-2">Publicado — aparece no app</span>
      </label>

      {bloqueado ? (
        <p className="text-alerta text-xs">
          {prontidao?.semVideo
            ? "Adicione um vídeo e aguarde o processamento no Vimeo para poder publicar."
            : `Vídeo sendo processado no Vimeo (${prontidao?.prontos}/${prontidao?.total} pronto${
                prontidao?.total === 1 ? "" : "s"
              }). O botão libera quando ficar pronto.`}
        </p>
      ) : (
        <p className="text-texto-3 text-xs">
          Desmarcado vira rascunho: some das listagens, da busca e do detalhe
          para quem não é da equipe. Continua aqui no painel.
        </p>
      )}
    </div>
  );
}
