"use client";

import { useUploadVideo } from "@/components/conteudos/upload-video-context";

/*
  Barra de progresso do upload de vídeo, fixada no topo da página. Aparece só
  enquanto há envio (ou um erro a avisar) e some ao terminar. O envio é dono do
  contexto de página, então continua mesmo com o modal de vídeo já fechado.
*/
export function BarraUploadVideo() {
  const ctx = useUploadVideo();
  if (!ctx) return null;

  const { ativo, nomeArquivo, progresso, erro } = ctx.estado;
  if (!ativo && !erro) return null;

  return (
    <div className="border-borda bg-superficie sticky top-0 z-30 -mx-1 mb-2 rounded-xl border px-4 py-3 shadow-sm">
      {erro ? (
        <div className="flex items-center justify-between gap-3">
          <span className="text-alerta text-sm">{erro}</span>
          <button
            type="button"
            onClick={ctx.limparErro}
            className="text-texto-3 hover:text-texto text-sm"
          >
            Dispensar
          </button>
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between gap-3 text-sm">
            <span className="text-texto-2 min-w-0 truncate">
              Enviando vídeo: <strong className="text-texto">{nomeArquivo}</strong>
            </span>
            <div className="flex shrink-0 items-center gap-3">
              <span className="text-texto-3 tabular-nums">{progresso}%</span>
              <button
                type="button"
                onClick={ctx.cancelar}
                className="text-alerta text-sm font-medium hover:underline"
              >
                Cancelar
              </button>
            </div>
          </div>
          <div className="bg-superficie-2 h-2 w-full overflow-hidden rounded-full">
            <div
              className="bg-acento ease-suave h-full transition-all duration-300"
              style={{ width: `${progresso}%` }}
            />
          </div>
        </div>
      )}
    </div>
  );
}
