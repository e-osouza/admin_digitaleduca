"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import {
  excluirAula,
  vincularVideoExistente,
} from "@/app/(painel)/conteudos/acoes-aulas";
import { ModalVideoMidia } from "@/components/conteudos/modal-video-midia";

/**
 * Troca o vídeo de um episódio de podcast — agora pela biblioteca de mídia
 * (escolher existente ou enviar). O novo entra primeiro (vínculo) e só então o
 * antigo é removido: se algo falhar, o episódio anterior continua no ar.
 */
export function TrocarEpisodio({
  conteudoId,
  videoAtualId,
  titulo,
}: {
  conteudoId: number;
  /** `null` quando o episódio ainda não tem vídeo publicado. */
  videoAtualId: number | null;
  titulo: string;
}) {
  const router = useRouter();
  const [aberto, setAberto] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [salvando, setSalvando] = useState(false);

  async function usar(url: string) {
    setAberto(false);
    setErro(null);
    setSalvando(true);

    const novo = await vincularVideoExistente(conteudoId, {
      titulo,
      videoUrl: url,
    });
    if (!novo.ok) {
      setErro(novo.erro);
      setSalvando(false);
      return;
    }

    // Só agora o antigo sai — com o novo já no ar.
    if (videoAtualId !== null) {
      const remocao = await excluirAula(conteudoId, videoAtualId);
      if (!remocao.ok) {
        setErro(
          `O novo vídeo está no ar, mas o antigo não pôde ser removido: ${remocao.erro}`,
        );
        setSalvando(false);
        router.refresh();
        return;
      }
    }

    setSalvando(false);
    router.refresh();
  }

  return (
    <div className="flex flex-col gap-2">
      <button
        type="button"
        onClick={() => setAberto(true)}
        disabled={salvando}
        className="border-borda text-texto-2 hover:bg-superficie-2 hover:text-texto w-fit rounded-lg border px-3 py-2 text-sm font-medium transition-colors disabled:opacity-60"
      >
        {salvando
          ? "Aplicando…"
          : videoAtualId === null
            ? "Enviar vídeo do episódio"
            : "Trocar vídeo do episódio"}
      </button>

      {erro && (
        <p role="alert" className="text-alerta text-sm">
          {erro}
        </p>
      )}

      <ModalVideoMidia
        aberto={aberto}
        aoFechar={() => setAberto(false)}
        aoEscolher={usar}
      />
    </div>
  );
}
