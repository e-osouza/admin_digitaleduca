"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import {
  atualizarConteudo,
  removerVideoIntrodutorio,
} from "@/app/(painel)/conteudos/acoes";
import { ModalVideoMidia } from "@/components/conteudos/modal-video-midia";

/**
 * Troca o vídeo introdutório de um conteúdo — agora pela biblioteca de mídia
 * (escolher existente ou enviar). O vídeo escolhido vira o teaser pelo update
 * (`videoIntrodutorioUrl`); a remoção continua atrás de confirmação.
 */
export function TrocarVideo({
  conteudoId,
  rotulo,
  temVideo,
}: {
  conteudoId: number;
  /** "vídeo introdutório" ou "vídeo do episódio". */
  rotulo: string;
  /** Sem vídeo não faz sentido oferecer remoção. */
  temVideo: boolean;
}) {
  const router = useRouter();
  const [aberto, setAberto] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [salvando, setSalvando] = useState(false);
  const [confirmandoRemocao, setConfirmandoRemocao] = useState(false);
  const [removendo, setRemovendo] = useState(false);

  async function usar(url: string) {
    setAberto(false);
    setErro(null);
    setSalvando(true);

    const fd = new FormData();
    fd.set("videoIntrodutorioUrl", url);
    const resultado = await atualizarConteudo(conteudoId, fd);

    setSalvando(false);
    if (!resultado.ok) {
      setErro(resultado.erro);
      return;
    }
    router.refresh();
  }

  async function remover() {
    setRemovendo(true);
    setErro(null);

    const resultado = await removerVideoIntrodutorio(conteudoId);
    setRemovendo(false);

    if (!resultado.ok) {
      setErro(resultado.erro);
      setConfirmandoRemocao(false);
      return;
    }

    setConfirmandoRemocao(false);
    router.refresh();
  }

  if (confirmandoRemocao) {
    return (
      <div className="border-alerta/40 bg-alerta/5 flex flex-col gap-2 rounded-lg border p-3">
        <p className="text-texto text-sm">
          Remover o {rotulo}? O arquivo é apagado do Vimeo. As aulas e os módulos
          não são afetados.
        </p>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={remover}
            disabled={removendo}
            className="bg-alerta rounded-lg px-3 py-1.5 text-xs font-semibold text-white disabled:opacity-60"
          >
            {removendo ? "Removendo…" : "Confirmar"}
          </button>
          <button
            type="button"
            onClick={() => setConfirmandoRemocao(false)}
            disabled={removendo}
            className="text-texto-2 rounded-lg px-3 py-1.5 text-xs font-medium"
          >
            Cancelar
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => setAberto(true)}
          disabled={salvando}
          className="border-borda text-texto-2 hover:bg-superficie-2 hover:text-texto w-fit rounded-lg border px-3 py-2 text-sm font-medium transition-colors disabled:opacity-60"
        >
          {salvando
            ? "Aplicando…"
            : temVideo
              ? `Trocar ${rotulo}`
              : `Enviar ${rotulo}`}
        </button>

        {temVideo && (
          <button
            type="button"
            onClick={() => setConfirmandoRemocao(true)}
            disabled={salvando}
            className="border-borda text-alerta hover:bg-alerta/10 hover:border-alerta/40 w-fit rounded-lg border px-3 py-2 text-sm font-medium transition-colors disabled:opacity-60"
          >
            Remover
          </button>
        )}
      </div>

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
