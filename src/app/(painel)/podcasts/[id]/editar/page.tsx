import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { BotaoExcluirConteudo } from "@/components/botao-excluir-conteudo";
import { MoverPara } from "@/components/mover-para";
import { FormularioPodcast } from "@/components/formulario-podcast";
import { PreviaVideo } from "@/components/previa-video";
import { TrocarEpisodio } from "@/components/trocar-episodio";
import { ApiError } from "@/lib/api";
import {
  listarCategorias,
  listarInstrutores,
  listarNomesDeTags,
  listarSubcategorias,
  obterConteudoAdmin,
} from "@/lib/queries";

export const metadata = { title: "Editar episódio · Painel DigitalEduca" };

export default async function PaginaEditarPodcast({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const numero = Number(id);
  if (!Number.isInteger(numero) || numero <= 0) notFound();

  const podcast = await obterConteudoAdmin(numero).catch((erro) => {
    if (erro instanceof ApiError && erro.naoEncontrado) notFound();
    throw erro;
  });

  /*
   * Os endpoints são os mesmos de conteúdo, então esta URL aceitaria qualquer
   * id. Redirecionar em vez de renderizar evita editar uma aula num formulário
   * que grava `tipo: PODCAST` e apagaria os vínculos de instrutor.
   */
  if (podcast.tipo !== "PODCAST") redirect(`/conteudos/${podcast.id}/editar`);

  /*
   * O episódio é o primeiro registro de `videos` — é o que a plataforma do
   * aluno toca. O `videoIntrodutorio` do podcast é OUTRO vídeo, curto, que não
   * interessa aqui.
   */
  const episodio = podcast.videos?.[0] ?? null;

  const [categorias, subcategorias, instrutores, nomesDeTags] =
    await Promise.all([
      listarCategorias(),
      listarSubcategorias(),
      listarInstrutores().catch(() => []),
      listarNomesDeTags().catch(() => []),
    ]);

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-6">
      <div className="min-w-0">
        <Link
          href="/podcasts"
          className="text-texto-3 hover:text-texto text-sm transition-colors"
        >
          ← Podcasts
        </Link>
        <h1 className="text-texto mt-1 truncate text-2xl font-semibold">
          {podcast.titulo}
        </h1>
        <p className="text-texto-3 mt-0.5 text-sm">
          {episodio ? "Vídeo do episódio publicado" : "Sem vídeo publicado"}
        </p>
      </div>

      <FormularioPodcast
        podcast={podcast}
        categorias={categorias}
        subcategorias={subcategorias}
        instrutores={instrutores}
        nomesDeTags={nomesDeTags}
        acaoExcluir={
          <BotaoExcluirConteudo
            id={podcast.id}
            titulo={podcast.titulo}
            destino="/podcasts"
          />
        }
        secoes={
          <>
            <MoverPara
              id={podcast.id}
              atual="PODCAST"
              titulo={podcast.titulo}
            />

          <section className="border-borda-suave bg-superficie flex flex-col gap-4 rounded-xl border p-5">
            <div>
              <h2 className="text-texto font-semibold">Vídeo do episódio</h2>
              <p className="text-texto-3 mt-1 text-sm">
                Título e descrição no Vimeo são sincronizados ao salvar.
              </p>
            </div>

            <PreviaVideo
              uri={episodio?.url}
              vazio="Este episódio não tem vídeo publicado — não vai tocar na plataforma."
            />

            <TrocarEpisodio
              conteudoId={podcast.id}
              videoAtualId={episodio?.id ?? null}
              titulo={podcast.titulo}
            />
          </section>
          </>
        }
      />
    </div>
  );
}
