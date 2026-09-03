"use client";

import { useRouter } from "next/navigation";
import { useRef, useState, type FormEvent } from "react";
import {
  atualizarConteudo,
  criarConteudo,
} from "@/app/(painel)/conteudos/acoes";
import {
  criarModulo,
  vincularVideoExistente,
} from "@/app/(painel)/conteudos/acoes-aulas";
import {
  CompositorModulos,
  type ModuloNovo,
} from "@/components/compositor-modulos";
import {
  BOTAO_TEXTO,
  CONTROLE,
  Campo,
  CampoTags,
  Secao,
} from "@/components/campos-formulario";
import { SeletorPessoas } from "@/components/seletor-pessoas";
import { BlocoPublicar } from "@/components/conteudos/bloco-publicar";
import { BarraUploadVideo } from "@/components/conteudos/barra-upload-video";
import { UploadVideoProvider } from "@/components/conteudos/upload-video-context";
import { CampoImagemBiblioteca } from "@/components/conteudos/campo-imagem-biblioteca";
import { CampoVideoBiblioteca } from "@/components/conteudos/campo-video-biblioteca";
import { idsMarcados, paraData, separarTags } from "@/lib/dados-formulario";
import type { Categoria, ConteudoAdmin, Instrutor, Subcategoria, TipoConteudo } from "@/types/api";

/**
 * Podcast não aparece aqui: tem cadastro próprio em `/podcasts`, com campos
 * diferentes (apresentador, convidados) e sem módulos.
 */

/**
 * Níveis oferecidos. Hoje o acervo inteiro está como "Iniciante"; os outros
 * dois existem para novos cadastros. O campo é opcional na API.
 */
const NIVEIS = ["Iniciante", "Intermediário", "Avançado"];

const GRATUIDADES = [
  { valor: "NENHUM", rotulo: "Pago" },
  { valor: "PERMANENTE", rotulo: "Gratuito sempre" },
  { valor: "TEMPORARIO", rotulo: "Gratuito até uma data" },
];

export function FormularioConteudo({
  conteudo,
  categorias,
  subcategorias,
  instrutores,
  nomesDeTags,
  secoes,
  acaoExcluir,
  tipo: tipoInicial,
}: {
  /** Ausente = criação. */
  conteudo?: ConteudoAdmin;
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
  /** Tipo do conteúdo. Vem da tela de origem, não de um select. */
  tipo?: TipoConteudo;
}) {
  const router = useRouter();
  const editando = Boolean(conteudo);

  const tipo = conteudo?.tipo ?? tipoInicial ?? "AULA";

  const [erro, setErro] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);
  /* "Salvar como rascunho" (true) força rascunho; lido no submit e resetado. */
  const rascunhoRef = useRef(false);
  const [gratuitoTipo, setGratuitoTipo] = useState(
    conteudo?.gratuitoTipo ?? "NENHUM",
  );
  /*
   * Só na criação. Na edição a estrutura é escolhida no gerenciador de aulas,
   * que conhece o que já existe e trava a troca quando há conteúdo cadastrado.
   */
  const [comModulos, setComModulos] = useState(false);
  const [modulosNovos, setModulosNovos] = useState<ModuloNovo[]>([]);
  // Só curso tem módulos. MasterClass (AULA) e Palestra são vídeo único — sem a
  // escolha de estrutura, `comModulos` fica sempre false.
  const permiteModulos = tipo === "CURSO";

  const instrutoresAtuais = (conteudo?.instrutores ?? [])
    .filter((p) => p.papel === "INSTRUTOR")
    .map((p) => p.instrutor.id);

  async function enviar(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    setErro(null);
    setEnviando(true);

    const formulario = evento.currentTarget;
    const dados = new FormData(formulario);

    // Arrays viajam como JSON string: o backend faz `JSON.parse` em cada um.
    dados.delete("instrutorIds");
    dados.set("instrutorIds", JSON.stringify(idsMarcados(formulario, "instrutorIds")));

    const tagsCruas = String(dados.get("tagsTexto") ?? "");
    dados.delete("tagsTexto");
    dados.set("tags", JSON.stringify(separarTags(tagsCruas)));

    // Checkbox ausente não vai no FormData; a API precisa do booleano.
    dados.set("destaque", dados.get("destaque") ? "true" : "false");
    /*
      Publicar x rascunho vem do botão clicado (bloco Publicar), não de um
      checkbox. "Salvar como rascunho" força rascunho; o botão primário publica
      — mas na CRIAÇÃO o conteúdo nasce sempre rascunho (o backend também força),
      porque o vídeo ainda está processando.
    */
    const rascunho = rascunhoRef.current;
    rascunhoRef.current = false;
    dados.set("publicado", !rascunho && editando ? "true" : "false");

    if (gratuitoTipo !== "TEMPORARIO") dados.delete("gratuitoAte");

    try {
      if (editando && conteudo) {
        const resultado = await atualizarConteudo(conteudo.id, dados);
        if (!resultado.ok) {
          setErro(resultado.erro);
          setEnviando(false);
          return;
        }
      } else {
        /*
         * Teaser e vídeo principal já subiram ao Vimeo no ato da seleção; aqui
         * só temos as URLs. O teaser (`videoIntrodutorioUrl`) viaja no corpo do
         * conteúdo (montarCorpo o encaminha); o principal (`videoUrl`) é
         * vinculado como aula depois. Ambos são opcionais — dá para enviar
         * depois, na edição.
         */
        const videoUrl = String(dados.get("videoUrl") ?? "");
        dados.delete("videoUrl");
        dados.delete("video");
        dados.delete("videoConteudo");

        const resultado = await criarConteudo(dados);
        if (!resultado.ok) {
          setErro(resultado.erro);
          setEnviando(false);
          return;
        }

        /*
         * Vídeo único: o principal vira `conteudo.videos[0]`, que é onde a
         * plataforma procura o que tocar. Cria só o vínculo — o upload já foi.
         */
        if (!comModulos && videoUrl) {
          const aula = await vincularVideoExistente(resultado.id, {
            titulo: String(dados.get("titulo") ?? "Vídeo"),
            videoUrl,
          });

          if (!aula.ok) {
            setErro(
              `O conteúdo foi criado, mas o vídeo não pôde ser vinculado: ${aula.erro}`,
            );
            setEnviando(false);
            return;
          }
        }

        /*
         * Módulos compostos antes de salvar. São criados em sequência, e não
         * em paralelo, porque cada um cria uma subpasta no Vimeo — disparar
         * tudo de uma vez tem dado erro de concorrência na API deles.
         */
        if (comModulos && modulosNovos.length > 0) {
          const falhas: string[] = [];

          for (const modulo of modulosNovos) {
            const criado = await criarModulo(resultado.id, modulo);
            if (!criado.ok) falhas.push(`${modulo.titulo}: ${criado.erro}`);
          }

          if (falhas.length > 0) {
            setErro(
              `O conteúdo foi criado, mas alguns módulos falharam — ${falhas.join("; ")}. Crie-os na edição.`,
            );
            setEnviando(false);
            router.push(`/conteudos/${resultado.id}/editar?feito=criado`);
            return;
          }
        }

        // Vai direto para a edição: sempre há o que conferir ou completar.
        router.push(`/conteudos/${resultado.id}/editar`);
        router.refresh();
        return;
      }

      router.push("/conteudos?feito=salvo");
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
        id="formulario-conteudo"
        onSubmit={enviar}
        className="flex flex-col gap-6"
      >
      <Secao titulo="Informações básicas">
        <Campo rotulo="Título" obrigatorio>
          <input
            name="titulo"
            required
            defaultValue={conteudo?.titulo ?? ""}
            className={CONTROLE}
          />
        </Campo>

        <Campo rotulo="Descrição">
          <textarea
            name="descricao"
            rows={3}
            defaultValue={conteudo?.descricao ?? ""}
            className={`${CONTROLE} resize-y`}
          />
        </Campo>

        {/*
          O tipo é campo oculto, não um select.

          Cada tipo tem a sua tela — o botão "Novo curso" cria curso, "Nova
          MasterClass" cria MasterClass. Um select aqui permitia criar um tipo
          que não corresponde à tela de origem, e foi assim que conteúdos
          foram parar num tipo sem listagem. Para trocar depois existe o
          "Mover para", que avisa o que muda.
        */}
        <input type="hidden" name="tipo" value={tipo} />

        <div className="grid gap-4 sm:grid-cols-2">
          <Campo rotulo="Nível">
            <select
              name="level"
              defaultValue={conteudo?.level ?? ""}
              className={CONTROLE}
            >
              <option value="">Sem nível definido</option>
              {NIVEIS.map((nivel) => (
                <option key={nivel} value={nivel}>
                  {nivel}
                </option>
              ))}
            </select>
          </Campo>

          <Campo rotulo="Categoria" obrigatorio>
            <select
              name="categoriaId"
              required
              defaultValue={conteudo?.categoriaId ?? ""}
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

          <Campo
            rotulo="Subcategoria"
            obrigatorio
            ajuda="Qualquer combinação é aceita — a API cria o vínculo com a categoria se ainda não existir."
          >
            <select
              name="subcategoriaId"
              required
              defaultValue={conteudo?.subcategoriaId ?? ""}
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
            valorInicial={(conteudo?.tags ?? [])
              .map((t) => t.tag.nome)
              .join(", ")}
          />
        </Campo>

        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            name="destaque"
            defaultChecked={conteudo?.destaque ?? false}
            className="accent-acento h-4 w-4"
          />
          <span className="text-texto-2">Exibir em destaque</span>
        </label>
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
                defaultValue={paraData(conteudo?.gratuitoAte)}
                className={CONTROLE}
              />
            </Campo>
          )}
        </div>
      </Secao>

      <Secao titulo="Instrutores">
        <SeletorPessoas
          nome="instrutorIds"
          pessoas={instrutores}
          selecionadosIniciais={instrutoresAtuais}
        />
      </Secao>

      <Secao titulo="Conteúdo da página">
        <Campo rotulo="O que vai aprender">
          <textarea
            name="aprendizagem"
            rows={3}
            defaultValue={conteudo?.aprendizagem ?? ""}
            className={`${CONTROLE} resize-y`}
          />
        </Campo>

        <Campo rotulo="Pré-requisitos">
          <textarea
            name="requisitos"
            rows={2}
            defaultValue={conteudo?.requisitos ?? ""}
            className={`${CONTROLE} resize-y`}
          />
        </Campo>
      </Secao>

      {!editando && (
        <>
          {permiteModulos && (
            <Secao
              titulo="Estrutura"
              ajuda="Dá para mudar depois, enquanto não houver módulo nem vídeo cadastrado."
            >
              <div className="flex flex-wrap gap-4">
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="radio"
                    name="estrutura"
                    checked={!comModulos}
                    onChange={() => setComModulos(false)}
                    className="accent-acento h-4 w-4"
                  />
                  <span className="text-texto-2">Vídeo único</span>
                </label>

                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="radio"
                    name="estrutura"
                    checked={comModulos}
                    onChange={() => setComModulos(true)}
                    className="accent-acento h-4 w-4"
                  />
                  <span className="text-texto-2">Dividido em módulos</span>
                </label>
              </div>

              {comModulos && (
                <CompositorModulos
                  modulos={modulosNovos}
                  aoMudar={setModulosNovos}
                />
              )}
            </Secao>
          )}

          {!comModulos && (
            <Secao
              titulo="Vídeo do conteúdo"
              ajuda="O vídeo que o aluno assiste. Escolha da biblioteca ou envie um novo; opcional aqui — dá para definir depois na edição."
            >
              <CampoVideoBiblioteca nome="videoUrl" />
            </Secao>
          )}

          <Secao
            titulo="Vídeo introdutório"
            ajuda="Opcional. É o teaser da página do conteúdo, não o vídeo que o aluno assiste."
          >
            <CampoVideoBiblioteca nome="videoIntrodutorioUrl" />
          </Secao>
        </>
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


      {/* Rodapé da coluna principal: cancelar e excluir. Publicar mora na sidebar. */}
      <div className="border-borda-suave flex items-center gap-3 border-t pt-5">
        <button
          type="button"
          onClick={() => router.push("/conteudos")}
          disabled={enviando}
          className={BOTAO_TEXTO}
        >
          Cancelar
        </button>

        {acaoExcluir && <div className="ml-auto">{acaoExcluir}</div>}
      </div>
      </div>

      {/* ------------------------------ sidebar ----------------------------- */}
      <aside className="flex flex-col gap-6 lg:sticky lg:top-6">
        <BlocoPublicar
          formId="formulario-conteudo"
          editando={editando}
          conteudoId={conteudo?.id}
          publicadoAtual={conteudo?.publicado ?? false}
          enviando={enviando}
          dataCriacaoInicial={paraData(conteudo?.dataCriacao)}
          aoRascunho={() => {
            rascunhoRef.current = true;
          }}
          aoSalvar={() => {
            rascunhoRef.current = false;
          }}
        />

        <section className="border-borda bg-superficie overflow-hidden rounded-xl border">
          <header className="border-borda-suave border-b px-4 py-3">
            <h3 className="text-texto font-semibold">Imagens de capa</h3>
          </header>
          <div className="flex flex-col gap-4 p-4">
            <CampoImagemBiblioteca
              nome="thumbnailDesktop"
              rotulo="Desktop (horizontal)"
              atual={conteudo?.thumbnailDesktop}
              form="formulario-conteudo"
            />
            <CampoImagemBiblioteca
              nome="thumbnailMobile"
              rotulo="Mobile (vertical)"
              atual={conteudo?.thumbnailMobile}
              form="formulario-conteudo"
            />
            <CampoImagemBiblioteca
              nome="thumbnailDestaque"
              rotulo="Destaque"
              atual={conteudo?.thumbnailDestaque}
              form="formulario-conteudo"
            />
          </div>
        </section>
      </aside>
    </div>
    </UploadVideoProvider>
  );
}