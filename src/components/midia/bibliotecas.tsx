import {
  GradeMidia,
  type ItemMidia,
} from "@/components/midia/grade-midia";
import { Paginacao } from "@/components/paginacao";
import { rotaDeEdicao } from "@/lib/tipos";
import {
  LIMITE_MIDIA,
  buscarConteudos,
  listarInstrutores,
  listarPropagandas,
  listarVideos,
} from "@/lib/queries";
import type { Paginacao as DadosPaginacao } from "@/types/api";

/*
  Bibliotecas de mídia publicada.

  "Publicada" no sentido de EM USO: as telas são montadas a partir do que os
  conteúdos, instrutores e propagandas referenciam, não de uma varredura do
  disco — a API não expõe o diretório de uploads, e o que se quer saber aqui é
  ONDE aquela mídia aparece.

  Ambas paginam no SERVIDOR. Antes a de imagens percorria até 40 páginas da
  API em sequência só para montar a grade; agora pede uma página por vez.
*/

export async function BibliotecaVideos({
  q,
  page,
}: {
  q?: string;
  page: number;
}) {
  const resultado = await listarVideos({ q, page }).catch(() => null);

  if (!resultado) {
    return (
      <p
        role="alert"
        className="border-borda bg-superficie text-texto-2 rounded-xl border p-4 text-sm"
      >
        A biblioteca não carregou. Se a sessão expirou, entre de novo.
      </p>
    );
  }

  const itens: ItemMidia[] = resultado.data.map((video) => ({
    chave: `v${video.id}`,
    titulo: video.titulo,
    imagem: video.thumbnailUrl ?? null,
    /*
      O vínculo do vídeo vem por id, e resolver o título de cada conteúdo
      exigiria uma consulta por linha. Como a origem legível não vale N
      requisições, mostramos o vínculo estrutural.
    */
    origem: video.moduloId
      ? "Dentro de um módulo"
      : video.conteudoId
        ? "Direto no conteúdo"
        : "Sem vínculo",
    uri: video.url,
    duracao: video.duracao,
  }));

  return (
    <Grade
      itens={itens}
      tipo="video"
      paginacao={resultado.pagination}
      base="/midia/videos"
      q={q}
    />
  );
}

/** As fontes de imagem são coisas diferentes, e só uma delas é grande. */
export const FONTES_IMAGEM = [
  { chave: "", rotulo: "Capas de conteúdo" },
  { chave: "instrutores", rotulo: "Fotos de instrutores" },
  { chave: "banners", rotulo: "Banners" },
] as const;

export async function BibliotecaImagens({
  fonte,
  q,
  page,
}: {
  fonte: string;
  q?: string;
  page: number;
}) {
  if (fonte === "instrutores") {
    const instrutores = await listarInstrutores().catch(() => []);
    const itens: ItemMidia[] = instrutores
      .filter((instrutor) => instrutor.avatar)
      .map((instrutor) => ({
        chave: `i${instrutor.id}`,
        titulo: instrutor.nome,
        imagem: instrutor.avatar,
        origem: "Instrutor · foto",
        href: "/instrutores",
      }));

    /* 19 fotos: não pagina, porque não há o que economizar. */
    return <GradeMidia itens={itens} tipo="imagem" />;
  }

  if (fonte === "banners") {
    const propagandas = await listarPropagandas().catch(() => []);
    const itens: ItemMidia[] = propagandas.map((propaganda) => ({
      chave: `p${propaganda.id}`,
      titulo: propaganda.titulo || `Banner ${propaganda.id}`,
      imagem: propaganda.imagem,
      origem: "Propaganda · banner",
      href: `/propagandas/${propaganda.id}/editar`,
    }));

    return <GradeMidia itens={itens} tipo="imagem" />;
  }

  /*
    Capas: a fonte grande, e a única que precisa paginar. A paginação segue a
    do CONTEÚDO — cada um rende até duas capas (desktop e mobile), então a
    página traz entre 24 e 48 imagens. Paginar pela imagem exigiria um índice
    que o banco não tem.
  */
  const resultado = await buscarConteudos({ q, page, limit: LIMITE_MIDIA });

  const itens: ItemMidia[] = resultado.data.flatMap((conteudo) => {
    const capas: ItemMidia[] = [];

    for (const [campo, rotulo] of [
      ["thumbnailDesktop", "capa desktop"],
      ["thumbnailMobile", "capa mobile"],
    ] as const) {
      const caminho = conteudo[campo];
      if (!caminho) continue;

      capas.push({
        chave: `c${conteudo.id}-${campo}`,
        titulo: conteudo.titulo,
        imagem: caminho,
        origem: `Conteúdo · ${rotulo}`,
        href: rotaDeEdicao(conteudo.tipo, conteudo.id),
      });
    }

    return capas;
  });

  return (
    <Grade
      itens={itens}
      tipo="imagem"
      paginacao={resultado.pagination}
      base="/midia/imagens"
      q={q}
    />
  );
}

function Grade({
  itens,
  tipo,
  paginacao,
  base,
  q,
}: {
  itens: ItemMidia[];
  tipo: "video" | "imagem";
  paginacao: DadosPaginacao;
  base: string;
  q?: string;
}) {
  const parametros = new URLSearchParams();
  if (q) parametros.set("q", q);

  return (
    <>
      <GradeMidia itens={itens} tipo={tipo} />
      <Paginacao dados={paginacao} base={base} parametros={parametros} />
    </>
  );
}
