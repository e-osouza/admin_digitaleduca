"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import {
  atualizarConteudo,
  criarConteudo,
} from "@/app/(painel)/conteudos/acoes";
import { criarAula } from "@/app/(painel)/conteudos/acoes-aulas";
import {
  BOTAO_PRIMARIO,
  BOTAO_TEXTO,
  CAMPO_ARQUIVO,
  CONTROLE,
  Campo,
  CampoImagem,
  CampoTags,
  ProgressoUpload,
  Secao,
} from "@/components/campos-formulario";
import { SeletorPessoas } from "@/components/seletor-pessoas";
import { idsMarcados, paraData, separarTags } from "@/lib/dados-formulario";
import { enviarParaVimeo } from "@/lib/upload-vimeo";
import type {
  Categoria,
  ConteudoAdmin,
  Instrutor,
  Subcategoria,
} from "@/types/api";

const GRATUIDADES = [
  { valor: "NENHUM", rotulo: "Pago" },
  { valor: "PERMANENTE", rotulo: "Gratuito sempre" },
  { valor: "TEMPORARIO", rotulo: "Gratuito até uma data" },
];

/**
 * Cadastro de podcast.
 *
 * Usa os mesmos endpoints de conteúdo, mas o episódio é outra coisa: `tipo`
 * fica fixo em PODCAST (não é escolha), não há nível, nem "o que vai
 * aprender", nem módulos. O vídeo é o próprio episódio — o campo que a API
 * chama de `videoIntrodutorio` é, aqui, o único vídeo.
 *
 * Em compensação ganha apresentador e convidados, que só fazem sentido neste
 * formato.
 */
export function FormularioPodcast({
  podcast,
  categorias,
  subcategorias,
  instrutores,
  nomesDeTags,
  secoes,
  acaoExcluir,
}: {
  /** Ausente = criação. */
  podcast?: ConteudoAdmin;
  categorias: Categoria[];
  subcategorias: Subcategoria[];
  instrutores: Instrutor[];
  /** Sugestões para o autocompletar de tags. */
  nomesDeTags: string[];
  /**
   * Seções que vivem entre os campos e a barra de ações — módulos e
   * aulas, vídeo. Ficam FORA do <form> porque têm formulários próprios,
   * e formulário aninhado é HTML inválido.
   */
  secoes?: React.ReactNode;
  /** Botão de excluir, montado pela página que conhece o destino. */
  acaoExcluir?: React.ReactNode;
}) {
  const router = useRouter();
  const editando = Boolean(podcast);

  const [erro, setErro] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);
  const [progresso, setProgresso] = useState<number | null>(null);
  const [gratuitoTipo, setGratuitoTipo] = useState(
    podcast?.gratuitoTipo ?? "NENHUM",
  );

  const porPapel = (papel: string) =>
    (podcast?.instrutores ?? [])
      .filter((p) => p.papel === papel)
      .map((p) => p.instrutor.id);

  async function enviar(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    setErro(null);
    setEnviando(true);
    setProgresso(null);

    const formulario = evento.currentTarget;
    const dados = new FormData(formulario);

    // Não é campo do formulário: todo registro daqui é podcast.
    dados.set("tipo", "PODCAST");

    /*
     * O apresentador é digitado, mas a API guarda `apresentadorId` — uma
     * chave estrangeira para Instrutor. Resolvemos o nome para o id aqui.
     *
     * Não criamos a pessoa automaticamente: `POST /instrutor/create` exige
     * também `formacao` e `sobre`, e preencher com vazio geraria cadastro pela
     * metade — foi assim que as tags viraram lixo no banco.
     */
    const nomeApresentador = String(dados.get("apresentadorNome") ?? "").trim();
    dados.delete("apresentadorNome");

    /*
     * O apresentador é texto puro na coluna `conteudos.apresentador`, desde
     * 19/08/2026. Antes virava um registro em Instrutores, o que o colocava na
     * vitrine pública da plataforma com a formação em branco.
     */
    dados.set("apresentador", nomeApresentador);

    /*
     * Os três campos de pessoas vão SEMPRE juntos. O backend apaga TODOS os
     * vínculos quando qualquer um deles chega, e recria só com o que veio.
     *
     * `instrutorIds` não é editável nesta tela — podcast trabalha com
     * apresentador e convidados. Mas mandar lista vazia apagaria os vínculos
     * de papel INSTRUTOR que já existem no banco (há 17 deles, de cadastros
     * antigos). Por isso devolvemos os atuais intactos: a tela não os edita,
     * mas também não os destrói.
     */
    dados.delete("convidadoIds");
    dados.set(
      "convidadoIds",
      JSON.stringify(idsMarcados(formulario, "convidadoIds")),
    );
    dados.set("instrutorIds", JSON.stringify(porPapel("INSTRUTOR")));

    const tagsCruas = String(dados.get("tagsTexto") ?? "");
    dados.delete("tagsTexto");
    dados.set("tags", JSON.stringify(separarTags(tagsCruas)));

    dados.set("destaque", dados.get("destaque") ? "true" : "false");
    dados.set("publicado", dados.get("publicado") ? "true" : "false");

    if (gratuitoTipo !== "TEMPORARIO") dados.delete("gratuitoAte");

    try {
      if (editando && podcast) {
        const resultado = await atualizarConteudo(podcast.id, dados);
        if (!resultado.ok) {
          setErro(resultado.erro);
          setEnviando(false);
          return;
        }
      } else {
        const video = dados.get("video");
        if (!(video instanceof File) || video.size === 0) {
          setErro("Selecione o vídeo do episódio.");
          setEnviando(false);
          return;
        }

        dados.delete("video");
        dados.set("fileSize", String(video.size));

        const resultado = await criarConteudo(dados);
        if (!resultado.ok) {
          setErro(resultado.erro);
          setEnviando(false);
          return;
        }

        /*
         * O arquivo vai para um registro em `videos`, NÃO para o
         * `videoIntrodutorio` que `/conteudos/create` acabou de abrir.
         *
         * É onde a plataforma do aluno procura: ela toca `conteudo.videos[0]`
         * e não tem retorno para o introdutório — um podcast sem esse registro
         * mostra "episódio ainda não tem áudio publicado". Os 18 episódios do
         * acervo seguem esse mesmo desenho.
         *
         * Efeito colateral conhecido: o ticket introdutório fica sem upload,
         * deixando um vídeo vazio no Vimeo. `/conteudos/create` exige
         * `fileSize` e sempre abre esse ticket — não há como recusá-lo.
         */
        const episodio = await criarAula(resultado.id, {
          titulo: String(dados.get("titulo") ?? "Episódio"),
          fileSize: video.size,
        });

        if (!episodio.ok) {
          setErro(
            `O episódio foi criado, mas não foi possível registrar o vídeo: ${episodio.erro}`,
          );
          setEnviando(false);
          return;
        }

        if (episodio.vimeoUploadLink) {
          try {
            await enviarParaVimeo(video, episodio.vimeoUploadLink, setProgresso);
          } catch {
            setErro(
              "O episódio foi criado, mas o envio do vídeo falhou. Abra a edição para reenviar.",
            );
            setEnviando(false);
            return;
          }
        }
      }

      router.push(editando ? "/podcasts?feito=salvo" : "/podcasts?feito=criado");
      router.refresh();
    } catch (falha) {
      setErro(falha instanceof Error ? falha.message : "Não foi possível salvar.");
      setEnviando(false);
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <form
        id="formulario-podcast"
        onSubmit={enviar}
        className="flex flex-col gap-6"
      >
      <Secao titulo="Episódio">
        <Campo rotulo="Título" obrigatorio>
          <input
            name="titulo"
            required
            defaultValue={podcast?.titulo ?? ""}
            className={CONTROLE}
          />
        </Campo>

        <Campo rotulo="Descrição">
          <textarea
            name="descricao"
            rows={4}
            defaultValue={podcast?.descricao ?? ""}
            className={`${CONTROLE} resize-y`}
          />
        </Campo>

        <div className="grid gap-4 sm:grid-cols-2">
          <Campo rotulo="Categoria" obrigatorio>
            <select
              name="categoriaId"
              required
              defaultValue={podcast?.categoriaId ?? ""}
              className={CONTROLE}
            >
              <option value="">Selecione…</option>
              {categorias.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.nome}
                </option>
              ))}
            </select>
          </Campo>

          <Campo rotulo="Subcategoria" obrigatorio>
            <select
              name="subcategoriaId"
              required
              defaultValue={podcast?.subcategoriaId ?? ""}
              className={CONTROLE}
            >
              <option value="">Selecione…</option>
              {subcategorias.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.nome}
                </option>
              ))}
            </select>
          </Campo>
        </div>

        {!editando && (
          <Campo
            rotulo="Data de publicação"
            ajuda="Em branco, usa hoje."
          >
            <input type="date" name="dataCriacao" className={CONTROLE} />
          </Campo>
        )}

        <Campo
          rotulo="Tags"
          ajuda="Separadas por vírgula. Tags novas são criadas automaticamente."
        >
          <CampoTags
            nomes={nomesDeTags}
            valorInicial={(podcast?.tags ?? [])
              .map((t) => t.tag.nome)
              .join(", ")}
          />
        </Campo>

        <div className="flex flex-col gap-2">
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              name="publicado"
              defaultChecked={podcast?.publicado ?? true}
              className="accent-acento h-4 w-4"
            />
            <span className="text-texto-2">Publicado — aparece no app</span>
          </label>
          <p className="text-texto-3 text-xs">
            Desmarcado vira rascunho: some das listagens, da busca e do detalhe
            para quem não é da equipe. Continua aqui no painel.
          </p>
        </div>

        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            name="destaque"
            defaultChecked={podcast?.destaque ?? false}
            className="accent-acento h-4 w-4"
          />
          <span className="text-texto-2">Exibir em destaque</span>
        </label>
      </Secao>

      <Secao
        titulo="Participantes"
        ajuda="O apresentador conduz o episódio; os convidados são quem participa."
      >
        <Campo
          rotulo="Apresentador"
          ajuda="Nome de quem conduz o episódio."
        >
          <input
            name="apresentadorNome"
            autoComplete="off"
            placeholder="Nome do apresentador"
            defaultValue={podcast?.apresentador ?? ""}
            className={CONTROLE}
          />
        </Campo>

        <Campo rotulo="Convidados">
          <SeletorPessoas
            nome="convidadoIds"
            pessoas={instrutores}
            selecionadosIniciais={porPapel("CONVIDADO")}
            vazio="Nenhuma pessoa cadastrada ainda. Cadastre em Instrutores."
          />
        </Campo>
      </Secao>

      <Secao titulo="Acesso">
        <div className="grid gap-4 sm:grid-cols-2">
          <Campo rotulo="Gratuidade">
            <select
              name="gratuitoTipo"
              value={gratuitoTipo}
              onChange={(e) =>
                setGratuitoTipo(e.target.value as typeof gratuitoTipo)
              }
              className={CONTROLE}
            >
              {GRATUIDADES.map((item) => (
                <option key={item.valor} value={item.valor}>
                  {item.rotulo}
                </option>
              ))}
            </select>
          </Campo>

          {gratuitoTipo === "TEMPORARIO" && (
            <Campo rotulo="Gratuito até" obrigatorio>
              <input
                type="date"
                name="gratuitoAte"
                required
                defaultValue={paraData(podcast?.gratuitoAte)}
                className={CONTROLE}
              />
            </Campo>
          )}
        </div>
      </Secao>

      <Secao
        titulo="Imagens"
        ajuda={
          editando
            ? "Envie um arquivo apenas para substituir a imagem atual."
            : "A arte quadrada do podcast vai em Mobile — é a que a plataforma usa nos cards."
        }
      >
        <div className="grid gap-4 sm:grid-cols-3">
          <CampoImagem
            nome="thumbnailDesktop"
            rotulo="Desktop (horizontal)"
            atual={podcast?.thumbnailDesktop}
          />
          <CampoImagem
            nome="thumbnailMobile"
            rotulo="Mobile (quadrada)"
            atual={podcast?.thumbnailMobile}
          />
          <CampoImagem
            nome="thumbnailDestaque"
            rotulo="Destaque"
            atual={podcast?.thumbnailDestaque}
          />
        </div>
      </Secao>

      {!editando && (
        <Secao
          titulo="Vídeo do episódio"
          ajuda="Obrigatório. O arquivo vai direto do seu navegador para o Vimeo — não passa pelo painel."
        >
          <input
            type="file"
            name="video"
            accept="video/*"
            required
            className={CAMPO_ARQUIVO}
          />
        </Secao>
      )}

      </form>

      {secoes}

      {erro && (
        <p
          role="alert"
          className="border-alerta/30 bg-alerta/10 text-alerta rounded-lg border px-3 py-2 text-sm"
        >
          {erro}
        </p>
      )}

      {progresso !== null && <ProgressoUpload valor={progresso} />}

      {/*
        Barra de ações no fim da página. O botão de salvar vive fora do <form>
        e o alcança pelo atributo `form` — assim as seções acima podem ter
        formulários próprios sem aninhamento inválido.
      */}
      <div className="border-borda-suave flex flex-wrap items-center gap-3 border-t pt-5">
        <button
          type="submit"
          form="formulario-podcast"
          disabled={enviando}
          className={BOTAO_PRIMARIO}
        >
          {enviando
            ? "Salvando…"
            : editando
              ? "Salvar alterações"
              : "Criar episódio"}
        </button>

        <button
          type="button"
          onClick={() => router.push("/podcasts")}
          disabled={enviando}
          className={BOTAO_TEXTO}
        >
          Cancelar
        </button>

        {acaoExcluir && <div className="ml-auto">{acaoExcluir}</div>}
      </div>
    </div>
  );
}