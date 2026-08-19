import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { BotaoExcluirConteudo } from "@/components/botao-excluir-conteudo";
import { FormularioConteudo } from "@/components/formulario-conteudo";
import { GerenciadorAulas } from "@/components/gerenciador-aulas";
import { PreviaVideo } from "@/components/previa-video";
import { TrocarVideo } from "@/components/trocar-video";
import { ApiError } from "@/lib/api";
import { duracaoLegivel } from "@/lib/formato";
import {
  listarCategorias,
  listarInstrutores,
  listarNomesDeTags,
  listarSubcategorias,
  obterConteudoAdmin,
} from "@/lib/queries";

export const metadata = { title: "Editar conteúdo · Painel DigitalEduca" };

export default async function PaginaEditarConteudo({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const numero = Number(id);
  if (!Number.isInteger(numero) || numero <= 0) notFound();

  const conteudo = await obterConteudoAdmin(numero).catch((erro) => {
    if (erro instanceof ApiError && erro.naoEncontrado) notFound();
    throw erro;
  });

  /*
   * Espelho da regra de `/podcasts/[id]/editar`: cada tipo tem seu formulário,
   * e abrir um episódio aqui gravaria `tipo` errado e apagaria apresentador e
   * convidados.
   */
  if (conteudo.tipo === "PODCAST") redirect(`/podcasts/${conteudo.id}/editar`);

  const [categorias, subcategorias, instrutores, nomesDeTags] =
    await Promise.all([
      listarCategorias(),
      listarSubcategorias(),
      listarInstrutores().catch(() => []),
      listarNomesDeTags().catch(() => []),
    ]);

  const modulos = conteudo.modulos ?? [];

  /*
   * `videos` do conteúdo traz TODAS as aulas, inclusive as que pertencem a um
   * módulo. Aqui separamos as avulsas — as que ficam direto no conteúdo — para
   * não listá-las duas vezes.
   */
  const videosSoltos = (conteudo.videos ?? []).filter((video) => !video.moduloId);

  const totalAulas =
    videosSoltos.length +
    modulos.reduce((soma, modulo) => soma + (modulo.videos?.length ?? 0), 0);

  const duracaoTotal =
    videosSoltos.reduce((soma, v) => soma + (v.duracao ?? 0), 0) +
    modulos.reduce(
      (soma, modulo) =>
        soma + (modulo.videos ?? []).reduce((s, v) => s + (v.duracao ?? 0), 0),
      0,
    );

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-6">
      <div className="min-w-0">
        <Link
          href="/conteudos"
          className="text-texto-3 hover:text-texto text-sm transition-colors"
        >
          ← Conteúdos
        </Link>
        <h1 className="text-texto mt-1 truncate text-2xl font-semibold">
          {conteudo.titulo}
        </h1>
        <p className="text-texto-3 mt-0.5 text-sm">
          {totalAulas} {totalAulas === 1 ? "aula" : "aulas"}
          {duracaoTotal > 0 && ` · ${duracaoLegivel(duracaoTotal)}`}
          {conteudo.videoIntrodutorio
            ? " · vídeo introdutório enviado"
            : " · sem vídeo introdutório"}
        </p>
      </div>

      <FormularioConteudo
        conteudo={conteudo}
        categorias={categorias}
        subcategorias={subcategorias}
        instrutores={instrutores}
        nomesDeTags={nomesDeTags}
        acaoExcluir={
          <BotaoExcluirConteudo id={conteudo.id} titulo={conteudo.titulo} />
        }
        secoes={
          <>
            {/*
              Estas seções ficam FORA do <form> do conteúdo: cada ação delas
              tem formulário próprio, e formulário aninhado é HTML inválido —
              o navegador fecharia o de fora e quebraria o salvamento.
            */}
            <section className="border-borda-suave bg-superficie flex flex-col gap-4 rounded-xl border p-5">
              <div>
                <h2 className="text-texto font-semibold">
                  Vídeo introdutório
                </h2>
                <p className="text-texto-3 mt-1 text-sm">
                  Teaser da página do conteúdo — não é a aula. Opcional.
                </p>
              </div>

              <PreviaVideo
                uri={conteudo.videoIntrodutorio}
                vazio="Sem vídeo introdutório. É opcional."
              />
              <TrocarVideo
                conteudoId={conteudo.id}
                rotulo="vídeo introdutório"
                temVideo={Boolean(conteudo.videoIntrodutorio)}
              />
            </section>

            {/*
              O título desta seção muda com a estrutura escolhida — "Vídeo do
              conteúdo" ou "Módulos e aulas" —, então ele mora dentro do
              componente, que é quem conhece a escolha.

              A prévia do vídeo vai como prop porque resolver o link no Vimeo
              exige o token e só acontece no servidor.
            */}
            <section className="border-borda-suave bg-superficie flex flex-col gap-4 rounded-xl border p-5">
              <GerenciadorAulas
                conteudoId={conteudo.id}
                modulos={modulos}
                videosSoltos={videosSoltos}
                temPastaVimeo={Boolean(conteudo.vimeoFolderUri)}
                previaVideoUnico={
                  <PreviaVideo
                    uri={videosSoltos[0]?.url}
                    vazio="Sem vídeo enviado."
                  />
                }
              />
            </section>
          </>
        }
      />
    </div>
  );
}
