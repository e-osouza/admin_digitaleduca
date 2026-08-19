"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { criarAula, excluirAula } from "@/app/(painel)/conteudos/acoes-aulas";
import {
  BOTAO_PRIMARIO,
  CAMPO_ARQUIVO,
  ProgressoUpload,
} from "@/components/campos-formulario";
import { enviarParaVimeo } from "@/lib/upload-vimeo";

/**
 * Troca o vídeo de um episódio de podcast.
 *
 * Diferente do vídeo introdutório de aula e palestra, aqui não é preciso
 * endpoint novo: o episódio é um registro em `videos`, então basta criar o
 * novo, enviar o arquivo e só então apagar o antigo.
 *
 * Essa ordem é deliberada e mais segura que a do introdutório — se o envio
 * falhar, o episódio anterior continua intacto e nada se perde.
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
  const [enviando, setEnviando] = useState(false);
  const [progresso, setProgresso] = useState<number | null>(null);
  const [erro, setErro] = useState<string | null>(null);

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

    const novo = await criarAula(conteudoId, {
      titulo,
      fileSize: arquivo.size,
    });

    if (!novo.ok) {
      setErro(novo.erro);
      setEnviando(false);
      return;
    }

    if (novo.vimeoUploadLink) {
      try {
        await enviarParaVimeo(arquivo, novo.vimeoUploadLink, setProgresso);
      } catch {
        /*
         * O antigo ainda não foi apagado, então o episódio continua tocando.
         * Sobrou um registro vazio, que aparece na lista para ser removido.
         */
        setErro(
          "O envio falhou. O vídeo anterior continua no ar; remova o registro vazio que ficou e tente de novo.",
        );
        setEnviando(false);
        router.refresh();
        return;
      }
    }

    // Só agora o antigo sai — com o novo já no ar.
    if (videoAtualId !== null) {
      const remocao = await excluirAula(conteudoId, videoAtualId);
      if (!remocao.ok) {
        setErro(
          `O novo vídeo está no ar, mas o antigo não pôde ser removido: ${remocao.erro}`,
        );
        setEnviando(false);
        router.refresh();
        return;
      }
    }

    setAberto(false);
    setEnviando(false);
    setProgresso(null);
    router.refresh();
  }

  if (!aberto) {
    return (
      <button
        type="button"
        onClick={() => setAberto(true)}
        className="border-borda text-texto-2 hover:bg-superficie-2 hover:text-texto w-fit rounded-lg border px-3 py-2 text-sm font-medium transition-colors"
      >
        {videoAtualId === null ? "Enviar vídeo do episódio" : "Trocar vídeo do episódio"}
      </button>
    );
  }

  return (
    <form
      onSubmit={enviar}
      className="border-borda bg-superficie-2 flex flex-col gap-3 rounded-lg border p-4"
    >
      <p className="text-texto-2 text-sm">
        O vídeo novo entra primeiro; o anterior só é removido depois que o envio
        termina.
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
          {enviando ? "Enviando…" : "Enviar"}
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
