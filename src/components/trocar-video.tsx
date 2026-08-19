"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import {
  removerVideoIntrodutorio,
  trocarVideo,
} from "@/app/(painel)/conteudos/acoes";
import {
  BOTAO_PRIMARIO,
  CAMPO_ARQUIVO,
  ProgressoUpload,
} from "@/components/campos-formulario";
import { enviarParaVimeo } from "@/lib/upload-vimeo";

/**
 * Troca o arquivo de vídeo de um conteúdo ou episódio já publicado.
 *
 * Fica atrás de uma confirmação porque o backend apaga o vídeo anterior do
 * Vimeo assim que o ticket novo é aberto — não é uma ação para se disparar
 * por engano ao clicar num campo de arquivo.
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
  const [enviando, setEnviando] = useState(false);
  const [progresso, setProgresso] = useState<number | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  const [confirmandoRemocao, setConfirmandoRemocao] = useState(false);
  const [removendo, setRemovendo] = useState(false);

  async function enviar(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    setErro(null);

    const arquivo = new FormData(evento.currentTarget).get("video");
    if (!(arquivo instanceof File) || arquivo.size === 0) {
      setErro("Selecione o novo arquivo.");
      return;
    }

    setEnviando(true);
    setProgresso(null);

    const resultado = await trocarVideo(conteudoId, arquivo.size);
    if (!resultado.ok) {
      setErro(resultado.erro);
      setEnviando(false);
      return;
    }

    if (resultado.vimeoUploadLink) {
      try {
        await enviarParaVimeo(arquivo, resultado.vimeoUploadLink, setProgresso);
      } catch {
        /*
         * O vídeo antigo já foi apagado e o conteúdo aponta para o novo, que
         * ficou vazio. Repetir a troca resolve — por isso a mensagem diz
         * exatamente isso em vez de um "falhou" genérico.
         */
        setErro(
          "O envio falhou e o vídeo anterior já foi removido. Tente a troca novamente com o mesmo arquivo.",
        );
        setEnviando(false);
        return;
      }
    }

    setAberto(false);
    setEnviando(false);
    setProgresso(null);
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
          Remover o {rotulo}? O arquivo é apagado do Vimeo. As aulas e os
          módulos não são afetados.
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

  if (!aberto) {
    return (
      <div className="flex flex-col gap-2">
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setAberto(true)}
            className="border-borda text-texto-2 hover:bg-superficie-2 hover:text-texto w-fit rounded-lg border px-3 py-2 text-sm font-medium transition-colors"
          >
            {temVideo ? `Trocar ${rotulo}` : `Enviar ${rotulo}`}
          </button>

          {temVideo && (
            <button
              type="button"
              onClick={() => setConfirmandoRemocao(true)}
              className="border-borda text-alerta hover:bg-alerta/10 hover:border-alerta/40 w-fit rounded-lg border px-3 py-2 text-sm font-medium transition-colors"
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
      </div>
    );
  }

  return (
    <form
      onSubmit={enviar}
      className="border-aviso/40 bg-aviso/5 flex flex-col gap-3 rounded-lg border p-4"
    >
      <p className="text-texto text-sm">
        O vídeo atual é <strong>apagado do Vimeo</strong> assim que o envio
        começa. Não dá para desfazer.
      </p>

      <input
        type="file"
        name="video"
        accept="video/*"
        required
        className={CAMPO_ARQUIVO}
      />

      {erro && (
        <p role="alert" className="text-alerta text-sm">
          {erro}
        </p>
      )}

      {progresso !== null && <ProgressoUpload valor={progresso} />}

      <div className="flex gap-2">
        <button type="submit" disabled={enviando} className={BOTAO_PRIMARIO}>
          {enviando ? "Enviando…" : "Substituir vídeo"}
        </button>
        <button
          type="button"
          onClick={() => setAberto(false)}
          disabled={enviando}
          className="text-texto-2 hover:text-texto rounded-lg px-3 py-2 text-sm font-medium disabled:opacity-60"
        >
          Cancelar
        </button>
      </div>
    </form>
  );
}
