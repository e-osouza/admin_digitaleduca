import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { BotaoExcluirConteudo } from "@/components/botao-excluir-conteudo";
import { EstruturaDoCurso } from "@/components/conteudos/estrutura-do-curso";
import { MoverPara } from "@/components/mover-para";
import { FormularioConteudo } from "@/components/formulario-conteudo";
import { GerenciadorAulas } from "@/components/gerenciador-aulas";
import { PreviaVideo } from "@/components/previa-video";
import { TrocarVideo } from "@/components/trocar-video";
import { ApiError } from "@/lib/api";
import { ehAgrupador, rotaDeEdicao, rotaDoTipo } from "@/lib/tipos";
import type { TipoConteudo } from "@/types/api";
import { duracaoLegivel } from "@/lib/formato";
import {
  listarCategorias,
  listarInstrutores,
  listarConteudosParaAgrupar,
  listarNomesDeTags,
  listarVideos,
  listarSubcategorias,
  obterConteudoAdmin,
} from "@/lib/queries";

/**
 * Edição de conteúdo — serve MasterClass, Curso e Trilha.
 *
 * Cada tipo entra por uma rota própria (`/cursos/:id/editar` etc.) para o
 * menu lateral acender o item certo; o corpo é este, um só.
 */
/** Nome da lista de origem, para o link de volta. */
const ROTULO_LISTA: Partial<Record<TipoConteudo, string>> = {
  CURSO: "Cursos",
  TRILHA: "Trilhas",
  AULA: "MasterClass",
};

export async function TelaEditarConteudo({
  id: idBruto,
  esperado,
}: {
  id: string;
  /** Tipo que a rota promete. Divergiu, redireciona para a rota correta. */
  esperado?: TipoConteudo;
}) {
  const numero = Number(idBruto);
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
  /*
    A URL tem de corresponder ao tipo. Abrir um curso por `/conteudos/:id`
    acenderia "MasterClass" no menu e ofereceria os campos errados — então em
    vez de renderizar torto, manda para a rota que corresponde ao que o
    conteúdo é hoje. Também cobre quem move o tipo e recarrega a página.
  */
  if (esperado && conteudo.tipo !== esperado) {
    redirect(rotaDeEdicao(conteudo.tipo, conteudo.id));
  }
  if (conteudo.tipo === "PODCAST") redirect(`/podcasts/${conteudo.id}/editar`);

  /*
    O catálogo para escolher itens só é buscado quando o conteúdo agrupa —
    são várias páginas da API, e uma MasterClass não tem o que fazer com elas.
  */
  const agrupador = ehAgrupador(conteudo.tipo);

  const [
    categorias,
    subcategorias,
    instrutores,
    nomesDeTags,
    paraAgrupar,
    biblioteca,
  ] = await Promise.all([
    listarCategorias(),
    listarSubcategorias(),
    listarInstrutores().catch(() => []),
    listarNomesDeTags().catch(() => []),
    agrupador ? listarConteudosParaAgrupar().catch(() => []) : [],
    /*
      Primeira página da biblioteca, para o modal abrir já com opções — a
      busca dentro dele vai ao servidor. Falha não pode derrubar a edição.
    */
    listarVideos()
      .then((r) => r.data)
      .catch(() => []),
  ]);

  const itensAtuais = (conteudo.itens ?? [])
    .sort((a, b) => a.ordem - b.ordem)
    .map((item) => ({
      conteudoId: item.filho.id,
      moduloId: item.modulo?.id ?? null,
    }));

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
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-6">
      <div className="min-w-0">
        <Link
          href={rotaDoTipo(conteudo.tipo)}
          className="text-texto-3 hover:text-texto text-sm transition-colors"
        >
          ← {ROTULO_LISTA[conteudo.tipo] ?? "Conteúdos"}
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
          <BotaoExcluirConteudo
            id={conteudo.id}
            titulo={conteudo.titulo}
            destino={rotaDoTipo(conteudo.tipo)}
          />
        }
        secoes={
          <>
            <MoverPara
              id={conteudo.id}
              atual={conteudo.tipo}
              titulo={conteudo.titulo}
            />

            {agrupador && (
              <EstruturaDoCurso
                conteudoId={conteudo.id}
                tipo={conteudo.tipo}
                modulos={modulos}
                videosSoltos={videosSoltos}
                biblioteca={biblioteca}
                disponiveis={paraAgrupar}
                iniciais={itensAtuais}
              />
            )}

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
            {/*
              Módulos e aulas organizam VÍDEOS. Num curso ou trilha o conteúdo
              vem da seção acima, que agrupa outros conteúdos — mostrar os dois
              juntos ofereceria dois mecanismos concorrentes para a mesma
              pergunta ("o que tem dentro?").
            */}
            {!agrupador && (
            <section className="border-borda-suave bg-superficie flex flex-col gap-4 rounded-xl border p-5">
              <GerenciadorAulas
                biblioteca={biblioteca}
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
            )}
          </>
        }
      />
    </div>
  );
}
