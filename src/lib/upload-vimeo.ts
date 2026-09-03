import * as tus from "tus-js-client";

/**
 * Sobe um arquivo direto para o Vimeo pelo protocolo tus.
 *
 * O arquivo nunca passa pelo painel nem pela API: o backend só abre o ticket
 * e devolve a URL de upload. Compartilhado por conteúdos, podcasts e aulas —
 * os três seguem exatamente o mesmo caminho.
 */
export function enviarParaVimeo(
  arquivo: File,
  destino: string,
  aoProgredir: (porcentagem: number) => void,
): Promise<void> {
  return new Promise((resolver, rejeitar) => {
    const upload = new tus.Upload(arquivo, {
      uploadUrl: destino,
      metadata: { filename: arquivo.name, filetype: arquivo.type },
      chunkSize: 5 * 1024 * 1024,
      // Uma retentativa imediata cobre oscilação de rede; as seguintes dão
      // tempo para a conexão voltar antes de desistir.
      retryDelays: [0, 3000, 10000, 30000],
      onProgress: (enviado, total) =>
        aoProgredir(Math.round((enviado / total) * 100)),
      onSuccess: () => resolver(),
      onError: (falha) => rejeitar(falha),
    });

    upload.start();
  });
}

/**
 * Igual ao `enviarParaVimeo`, mas devolve um controle para CANCELAR o envio.
 *
 * `abortar()` chama `upload.abort(true)` — o `true` pede ao tus para terminar o
 * upload no servidor. O vídeo em si (mesmo incompleto) é apagado à parte, pela
 * API do Vimeo, para não deixar lixo na conta.
 */
export function enviarParaVimeoControlavel(
  arquivo: File,
  destino: string,
  aoProgredir: (porcentagem: number) => void,
): { promessa: Promise<void>; abortar: () => void } {
  let upload: tus.Upload;
  const promessa = new Promise<void>((resolver, rejeitar) => {
    upload = new tus.Upload(arquivo, {
      uploadUrl: destino,
      metadata: { filename: arquivo.name, filetype: arquivo.type },
      chunkSize: 5 * 1024 * 1024,
      retryDelays: [0, 3000, 10000, 30000],
      onProgress: (enviado, total) =>
        aoProgredir(Math.round((enviado / total) * 100)),
      onSuccess: () => resolver(),
      onError: (falha) => rejeitar(falha),
    });
    upload.start();
  });

  const abortar = () => {
    try {
      upload?.abort(true);
    } catch {
      /* já terminou ou nem começou — nada a abortar */
    }
  };

  return { promessa, abortar };
}
