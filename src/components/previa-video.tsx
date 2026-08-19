import { obterLinkVideo } from "@/lib/queries";

/**
 * Pré-visualização de um vídeo do Vimeo.
 *
 * Recebe a URI (`/videos/123456`) em vez de ler do conteúdo, porque cada tipo
 * guarda o vídeo num lugar diferente: em aula e palestra o `videoIntrodutorio`
 * é um teaser de verdade, enquanto no podcast o episódio é o primeiro registro
 * de `videos` — e o `videoIntrodutorio` do podcast é outro vídeo, curto, que
 * não é o que se quer conferir aqui.
 *
 * Prefere uma fonte MP4: o link padrão da API é HLS, que só toca nativamente
 * no Safari, e puxar o hls.js para o painel só por causa de uma prévia não se
 * paga. Sem MP4, oferecemos o link para abrir fora.
 */
export async function PreviaVideo({
  uri,
  vazio = "Nenhum vídeo enviado para este registro.",
}: {
  uri: string | null | undefined;
  vazio?: string;
}) {
  if (!uri) {
    return <p className="text-texto-3 text-sm">{vazio}</p>;
  }

  const vimeoId = uri.replace("/videos/", "").trim();
  const link = await obterLinkVideo(vimeoId);

  if (!link) {
    return (
      <p className="text-texto-3 text-sm">
        Não foi possível carregar o vídeo do Vimeo (ID {vimeoId}).
      </p>
    );
  }

  const mp4 = link.sources?.find((fonte) => fonte.type === "mp4");

  return (
    <div className="flex flex-col gap-2">
      {mp4 ? (
        <video
          controls
          preload="metadata"
          src={mp4.url}
          className="border-borda-suave bg-superficie-2 w-full rounded-lg border"
        />
      ) : (
        <a
          href={link.url}
          target="_blank"
          rel="noreferrer"
          className="text-acento-claro text-sm font-medium underline"
        >
          Abrir vídeo em nova aba
        </a>
      )}

      <p className="text-texto-3 text-xs">ID no Vimeo: {vimeoId}</p>
    </div>
  );
}
