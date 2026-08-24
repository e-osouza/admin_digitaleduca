"use client";

import { useState } from "react";
import { ModalVideo } from "@/components/conteudos/modal-video";
import type { Video } from "@/types/api";

/**
 * Substitui o formulário de upload inline pelo modal de vídeo.
 *
 * Mesmo botão de antes; o que muda é para onde ele leva. Um único componente
 * para MasterClass e cursos, para os dois não divergirem — foi a lição das
 * telas de listagem, que ganhavam cada recurso duas vezes enquanto eram duas.
 */
export function BotaoAdicionarVideo({
  conteudoId,
  moduloId,
  biblioteca,
  rotulo = "Adicionar aula",
}: {
  conteudoId: number;
  moduloId?: number;
  biblioteca: Video[];
  rotulo?: string;
}) {
  const [aberto, setAberto] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setAberto(true)}
        className="border-borda text-texto-2 hover:border-acento/60 hover:text-acento rounded-lg border px-3 py-2 text-sm font-medium transition-colors"
      >
        {rotulo}
      </button>

      {aberto && (
        <ModalVideo
          conteudoId={conteudoId}
          moduloId={moduloId}
          biblioteca={biblioteca}
          aoFechar={() => setAberto(false)}
        />
      )}
    </>
  );
}
