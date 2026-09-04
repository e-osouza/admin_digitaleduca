"use client";

import { useRouter } from "next/navigation";
import { useRef, useState, type FormEvent } from "react";
import {
  atualizarConteudo,
  criarConteudo,
} from "@/app/(painel)/conteudos/acoes";
import { vincularVideoExistente } from "@/app/(painel)/conteudos/acoes-aulas";
import { BlocoPublicar } from "@/components/conteudos/bloco-publicar";
import { BarraUploadVideo } from "@/components/conteudos/barra-upload-video";
import { UploadVideoProvider } from "@/components/conteudos/upload-video-context";
import { CampoVideoBiblioteca } from "@/components/conteudos/campo-video-biblioteca";
import { CampoImagemBiblioteca } from "@/components/conteudos/campo-imagem-biblioteca";
import {
  CONTROLE,
  Campo,
  CampoTags,
  Secao,
} from "@/components/campos-formulario";
import { paraData, separarTags } from "@/lib/dados-formulario";
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
  /* Qual botão foi clicado: "Salvar como rascunho" (true) força rascunho e
     dispensa o vídeo; lido no submit e resetado em seguida. */
  const rascunhoRef = useRef(false);
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
    /*
     * Convidados agora é TEXTO livre (campo `convidados`), não mais vínculo com
     * Instrutor. Mantemos só os vínculos INSTRUTOR legados; enviar `instrutorIds`
     * faz o backend recriar só eles, limpando de quebra os antigos CONVIDADO —
     * que já foram migrados para o texto. Não mandamos `convidadoIds`.
     */
    dados.delete("convidadoIds");
    dados.set("instrutorIds", JSON.stringify(porPapel("INSTRUTOR")));

    const tagsCruas = String(dados.get("tagsTexto") ?? "");
    dados.delete("tagsTexto");
    dados.set("tags", JSON.stringify(separarTags(tagsCruas)));

    dados.set("destaque", dados.get("destaque") ? "true" : "false");

    // "Salvar como rascunho" força rascunho e dispensa o vídeo; o botão normal
    // respeita o checkbox (que na criação nem existe → rascunho de qualquer jeito).
    // Publicar x rascunho vem do botão (bloco Publicar), não de um checkbox.
    // Na criação o episódio nasce sempre rascunho (o backend também força).
    const rascunho = rascunhoRef.current;
    rascunhoRef.current = false;
    dados.set("publicado", !rascunho && editando ? "true" : "false");

    // Capa única (quadrada): replica a mesma arte (caminho da biblioteca) nos 3
    // campos de thumbnail que a plataforma lê em layouts diferentes, para nenhum
    // card ficar sem imagem.
    const capa = dados.get("thumbnailMobile");
    if (typeof capa === "string" && capa) {
      dados.set("thumbnailDesktop", capa);
      dados.set("thumbnailDestaque", capa);
    }

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
        /*
          Criação. O vídeo já foi enviado ao Vimeo no ato da seleção (upload
          autom.) ou escolhido da biblioteca — em ambos os casos temos só a URL,
          e aqui é só o vínculo, sem tus no submit. Ao salvar como rascunho pode
          nem haver vídeo (anexado depois, na edição). Nasce sempre rascunho.
        */
        // O vídeo (da biblioteca ou recém-enviado) chega como URL. Sem vídeo,
        // só ao salvar como rascunho (anexado depois, na edição).
        const url = String(dados.get("videoUrl") ?? "");
        const temVideo = !!url;

        if (!rascunho && !temVideo) {
          setErro("Escolha ou envie o vídeo do episódio.");
          setEnviando(false);
          return;
        }

        dados.delete("video");
        dados.delete("videoUrl"); // não é campo de conteúdo

        const resultado = await criarConteudo(dados);
        if (!resultado.ok) {
          setErro(resultado.erro);
          setEnviando(false);
          return;
        }

        // Vincula o episódio só quando há vídeo. É `conteudo.videos[0]` que a
        // plataforma toca; sem vídeo (rascunho), fica para a edição. A duração
        // é preenchida pela API a partir do Vimeo.
        if (temVideo) {
          const episodio = await vincularVideoExistente(resultado.id, {
            titulo: String(dados.get("titulo") ?? "Episódio"),
            videoUrl: url,
          });
          if (!episodio.ok) {
            setErro(
              `O episódio foi criado, mas não foi possível vincular o vídeo: ${episodio.erro}`,
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
    <UploadVideoProvider>
      <BarraUploadVideo />
    <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
      <div className="flex min-w-0 flex-col gap-6">
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

        <Campo
          rotulo="Convidados"
          ajuda="Nomes de quem participa, separados por vírgula."
        >
          <input
            name="convidados"
            autoComplete="off"
            placeholder="Ex.: João Silva, Maria Souza"
            defaultValue={podcast?.convidados ?? ""}
            className={CONTROLE}
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

      {!editando && (
        <Secao
          titulo="Vídeo do episódio"
          ajuda="Escolha um vídeo da biblioteca ou envie um novo. Opcional ao salvar como rascunho — dá para anexar depois, na edição."
        >
          <CampoVideoBiblioteca nome="videoUrl" />
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

      </div>

      {/* ------------------------------ sidebar ----------------------------- */}
      <aside className="flex flex-col gap-6 lg:sticky lg:top-6">
        <BlocoPublicar
          formId="formulario-podcast"
          editando={editando}
          conteudoId={podcast?.id}
          publicadoAtual={podcast?.publicado ?? false}
          enviando={enviando}
          dataCriacaoInicial={paraData(podcast?.dataCriacao)}
          rotuloCriar="Criar episódio"
          aoRascunho={() => {
            rascunhoRef.current = true;
          }}
          aoSalvar={() => {
            rascunhoRef.current = false;
          }}
          acaoExcluir={acaoExcluir}
        />

        <section className="border-borda bg-superficie overflow-hidden rounded-xl border">
          <header className="border-borda-suave border-b px-4 py-3">
            <h3 className="text-texto font-semibold">Capa do episódio</h3>
          </header>
          <div className="flex flex-col gap-2 p-4">
            {/*
              Podcast tem uma capa só, quadrada. A mesma arte é replicada no
              submit para os três campos de thumbnail que a plataforma lê.
            */}
            <CampoImagemBiblioteca
              nome="thumbnailMobile"
              rotulo="Arte quadrada (1:1)"
              atual={podcast?.thumbnailMobile}
              form="formulario-podcast"
            />
          </div>
        </section>
      </aside>
    </div>
    </UploadVideoProvider>
  );
}