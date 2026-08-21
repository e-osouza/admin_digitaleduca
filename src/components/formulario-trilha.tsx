"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import {
  atualizarTrilha,
  criarTrilha,
  type ModuloEnviado,
} from "@/app/(painel)/trilhas/acoes";
import {
  BOTAO_PRIMARIO,
  BOTAO_TEXTO,
  CONTROLE,
  Campo,
  CampoImagem,
  ProgressoUpload,
  Secao,
} from "@/components/campos-formulario";
import { CampoTags } from "@/components/campos-formulario";
import { SeletorConteudos } from "@/components/seletor-conteudos";
import { SeletorPessoas } from "@/components/seletor-pessoas";
import { enviarParaVimeo } from "@/lib/upload-vimeo";
import { idsMarcados, paraData, separarTags } from "@/lib/dados-formulario";
import type {
  Categoria,
  ConteudoBusca,
  Instrutor,
  Subcategoria,
  TrilhaDetalhe,
} from "@/types/api";

const NIVEIS = ["Iniciante", "Intermediário", "Avançado"];

type ModuloLocal = ModuloEnviado & { chave: string };

export function FormularioTrilha({
  trilha,
  conteudos,
  categorias,
  subcategorias,
  instrutores,
  nomesDeTags,
  acaoExcluir,
  tipo = "TRILHA",
}: {
  trilha?: TrilhaDetalhe;
  conteudos: ConteudoBusca[];
  categorias: Categoria[];
  subcategorias: Subcategoria[];
  instrutores: Instrutor[];
  nomesDeTags: string[];
  acaoExcluir?: React.ReactNode;
  /** O que está sendo criado. A tela de Cursos passa CURSO. */
  tipo?: "CURSO" | "TRILHA";
}) {
  const router = useRouter();
  const editando = Boolean(trilha);

  const [erro, setErro] = useState<string | null>(null);
  const [salvando, setSalvando] = useState(false);
  const [progresso, setProgresso] = useState<number | null>(null);
  const [gratuitoTipo, setGratuitoTipo] = useState(
    trilha?.gratuitoTipo ?? "NENHUM",
  );

  const [soltos, setSoltos] = useState<number[]>(
    (trilha?.conteudos ?? []).map((c) => c.id),
  );

  const [modulos, setModulos] = useState<ModuloLocal[]>(
    (trilha?.modulos ?? []).map((m) => ({
      chave: `m${m.id}`,
      titulo: m.titulo,
      subtitulo: m.subtitulo ?? "",
      descricao: m.descricao ?? "",
      conteudoIds: m.conteudos.map((c) => c.id),
    })),
  );

  /**
   * Conteúdos já usados em qualquer parte da trilha. A API tem unique em
   * (trilha, conteúdo), então repetir seria descartado em silêncio — melhor
   * bloquear na origem.
   */
  const usados = (exceto?: string) => {
    const ids = new Set<number>(soltos);
    for (const modulo of modulos) {
      if (modulo.chave === exceto) continue;
      for (const id of modulo.conteudoIds) ids.add(id);
    }
    return ids;
  };

  const usadosSemSoltos = () => {
    const ids = new Set<number>();
    for (const modulo of modulos) {
      for (const id of modulo.conteudoIds) ids.add(id);
    }
    return ids;
  };

  function alterarModulo(chave: string, mudanca: Partial<ModuloLocal>) {
    setModulos((atuais) =>
      atuais.map((m) => (m.chave === chave ? { ...m, ...mudanca } : m)),
    );
  }

  function moverModulo(indice: number, destino: number) {
    if (destino < 0 || destino >= modulos.length) return;
    const copia = [...modulos];
    [copia[indice], copia[destino]] = [copia[destino], copia[indice]];
    setModulos(copia);
  }

  async function enviar(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    setErro(null);

    const formulario = evento.currentTarget;
    const arquivos = new FormData(formulario);

    const semTitulo = modulos.find((m) => !m.titulo.trim());
    if (semTitulo) {
      setErro("Todo módulo precisa de um título.");
      return;
    }

    setSalvando(true);

    const texto = (campo: string) =>
      String(arquivos.get(campo) ?? "").trim() || undefined;

    const numero = (campo: string) => {
      const valor = Number(arquivos.get(campo));
      return Number.isFinite(valor) && valor > 0 ? valor : undefined;
    };

    /* O vídeo não vai para a Server Action — sobe direto para o Vimeo. */
    const bruto = arquivos.get("video");
    const video = bruto instanceof File && bruto.size > 0 ? bruto : null;
    arquivos.delete("video");

    const dados = {
      /* Só na criação: mudar o tipo de uma trilha existente é outra operação. */
      ...(trilha ? {} : { tipo }),
      titulo: String(arquivos.get("titulo") ?? "").trim(),
      descricao: texto("descricao"),
      nivel: texto("nivel"),
      destaque: arquivos.get("destaque") === "on",
      publicada: arquivos.get("publicada") === "on",
      categoriaId: numero("categoriaId"),
      subcategoriaId: numero("subcategoriaId"),
      aprendizagem: texto("aprendizagem"),
      requisitos: texto("requisitos"),
      gratuitoTipo,
      gratuitoAte:
        gratuitoTipo === "TEMPORARIO" ? texto("gratuitoAte") : undefined,
      dataCriacao: texto("dataCriacao"),
      tags: separarTags(String(arquivos.get("tagsTexto") ?? "")),
      instrutorIds: idsMarcados(formulario, "instrutorIds"),
      fileSize: video?.size,
      conteudoIds: soltos,
      // `chave` é só identidade local para o React — não vai para a API.
      modulos: modulos.map((modulo) => ({
        titulo: modulo.titulo,
        conteudoIds: modulo.conteudoIds,
        subtitulo: modulo.subtitulo?.trim() || undefined,
        descricao: modulo.descricao?.trim() || undefined,
      })),
    };

    const resultado =
      editando && trilha
        ? await atualizarTrilha(trilha.id, dados, arquivos)
        : await criarTrilha(dados, arquivos);

    setSalvando(false);

    if (!resultado.ok) {
      setErro(resultado.erro);
      return;
    }

    if (video && resultado.vimeoUploadLink) {
      setSalvando(true);
      try {
        await enviarParaVimeo(video, resultado.vimeoUploadLink, setProgresso);
      } catch {
        setErro(
          "A trilha foi criada, mas o envio do vídeo falhou. Abra a edição para conferir.",
        );
        setSalvando(false);
        return;
      }
      setSalvando(false);
    }

    router.push(editando ? "/trilhas?feito=salvo" : "/trilhas?feito=criado");
    router.refresh();
  }

  return (
    <form onSubmit={enviar} className="flex flex-col gap-6">
      <Secao titulo="Informações">
        <Campo rotulo="Título" obrigatorio>
          <input
            name="titulo"
            required
            defaultValue={trilha?.titulo ?? ""}
            className={CONTROLE}
          />
        </Campo>

        <Campo rotulo="Descrição">
          <textarea
            name="descricao"
            rows={3}
            defaultValue={trilha?.descricao ?? ""}
            className={`${CONTROLE} resize-y`}
          />
        </Campo>

        <Campo rotulo="Nível">
          <select
            name="nivel"
            defaultValue={trilha?.nivel ?? ""}
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

        <div className="grid gap-4 sm:grid-cols-2">
          <Campo rotulo="Categoria">
            <select
              name="categoriaId"
              defaultValue={trilha?.categoriaId ?? ""}
              className={CONTROLE}
            >
              <option value="">Sem categoria</option>
              {categorias.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.nome}
                </option>
              ))}
            </select>
          </Campo>

          <Campo rotulo="Subcategoria">
            <select
              name="subcategoriaId"
              defaultValue={trilha?.subcategoriaId ?? ""}
              className={CONTROLE}
            >
              <option value="">Sem subcategoria</option>
              {subcategorias.map((sc) => (
                <option key={sc.id} value={sc.id}>
                  {sc.nome}
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
            valorInicial={(trilha?.tags ?? []).map((t) => t.nome).join(", ")}
          />
        </Campo>

        <div className="flex flex-wrap gap-5">
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              name="publicada"
              defaultChecked={trilha?.publicada ?? false}
              className="accent-acento h-4 w-4"
            />
            <span className="text-texto-2">
              Publicada — visível na plataforma
            </span>
          </label>

          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              name="destaque"
              defaultChecked={trilha?.destaque ?? false}
              className="accent-acento h-4 w-4"
            />
            <span className="text-texto-2">Em destaque</span>
          </label>
        </div>
      </Secao>

      <Secao titulo="Acesso">
        <div className="grid gap-4 sm:grid-cols-2">
          <Campo rotulo="Gratuidade">
            <select
              value={gratuitoTipo}
              onChange={(e) =>
                setGratuitoTipo(e.target.value as typeof gratuitoTipo)
              }
              className={CONTROLE}
            >
              <option value="NENHUM">Paga</option>
              <option value="PERMANENTE">Gratuita sempre</option>
              <option value="TEMPORARIO">Gratuita até uma data</option>
            </select>
          </Campo>

          {gratuitoTipo === "TEMPORARIO" && (
            <Campo rotulo="Gratuita até" obrigatorio>
              <input
                type="date"
                name="gratuitoAte"
                required
                defaultValue={paraData(trilha?.gratuitoAte)}
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
          selecionadosIniciais={(trilha?.instrutores ?? []).map(
            (i) => i.instrutor.id,
          )}
        />
      </Secao>

      <Secao titulo="Conteúdo da página">
        <Campo rotulo="O que vai aprender">
          <textarea
            name="aprendizagem"
            rows={3}
            defaultValue={trilha?.aprendizagem ?? ""}
            className={`${CONTROLE} resize-y`}
          />
        </Campo>

        <Campo rotulo="Pré-requisitos">
          <textarea
            name="requisitos"
            rows={2}
            defaultValue={trilha?.requisitos ?? ""}
            className={`${CONTROLE} resize-y`}
          />
        </Campo>
      </Secao>

      <Secao
        titulo="Imagens"
        ajuda="Opcionais. Sem arte própria, a plataforma usa a do primeiro conteúdo da trilha."
      >
        <div className="grid gap-4 sm:grid-cols-3">
          <CampoImagem
            nome="thumbnailDesktop"
            rotulo="Desktop"
            atual={trilha?.thumbnailDesktop}
          />
          <CampoImagem
            nome="thumbnailMobile"
            rotulo="Mobile"
            atual={trilha?.thumbnailMobile}
          />
          <CampoImagem
            nome="thumbnailDestaque"
            rotulo="Destaque"
            atual={trilha?.thumbnailDestaque}
          />
        </div>
      </Secao>

      <Secao
        titulo="Módulos"
        ajuda="Cada módulo agrupa conteúdos inteiros. A ordem dos módulos e dos conteúdos dentro deles é a ordem da trilha."
      >
        {modulos.length === 0 && (
          <p className="text-texto-3 text-sm">
            Nenhum módulo ainda. Uma trilha pode ser toda organizada em módulos
            ou ter conteúdos soltos — ou os dois.
          </p>
        )}

        {modulos.map((modulo, indice) => (
          <div
            key={modulo.chave}
            className="border-borda-suave flex flex-col gap-3 rounded-lg border p-4"
          >
            <div className="flex items-center gap-2">
              <span className="text-texto-3 text-xs font-semibold">
                Módulo {indice + 1}
              </span>
              <div className="ml-auto flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => moverModulo(indice, indice - 1)}
                  disabled={indice === 0}
                  aria-label="Mover módulo para cima"
                  className="text-texto-2 hover:text-texto px-1 disabled:opacity-30"
                >
                  ↑
                </button>
                <button
                  type="button"
                  onClick={() => moverModulo(indice, indice + 1)}
                  disabled={indice === modulos.length - 1}
                  aria-label="Mover módulo para baixo"
                  className="text-texto-2 hover:text-texto px-1 disabled:opacity-30"
                >
                  ↓
                </button>
                <button
                  type="button"
                  onClick={() =>
                    setModulos((atuais) =>
                      atuais.filter((m) => m.chave !== modulo.chave),
                    )
                  }
                  className="text-alerta ml-2 text-xs font-medium"
                >
                  Remover módulo
                </button>
              </div>
            </div>

            <input
              value={modulo.titulo}
              onChange={(e) =>
                alterarModulo(modulo.chave, { titulo: e.target.value })
              }
              placeholder="Título do módulo"
              className={CONTROLE}
            />
            <input
              value={modulo.subtitulo ?? ""}
              onChange={(e) =>
                alterarModulo(modulo.chave, { subtitulo: e.target.value })
              }
              placeholder="Subtítulo (opcional)"
              className={CONTROLE}
            />
            <textarea
              value={modulo.descricao ?? ""}
              onChange={(e) =>
                alterarModulo(modulo.chave, { descricao: e.target.value })
              }
              rows={2}
              placeholder="Descrição (opcional)"
              className={`${CONTROLE} resize-y`}
            />

            <SeletorConteudos
              disponiveis={conteudos}
              selecionados={modulo.conteudoIds}
              indisponiveis={usados(modulo.chave)}
              aoMudar={(ids) =>
                alterarModulo(modulo.chave, { conteudoIds: ids })
              }
            />
          </div>
        ))}

        <button
          type="button"
          onClick={() =>
            setModulos((atuais) => [
              ...atuais,
              {
                chave: `novo-${Date.now()}-${atuais.length}`,
                titulo: "",
                subtitulo: "",
                descricao: "",
                conteudoIds: [],
              },
            ])
          }
          className="border-borda text-texto-2 hover:bg-superficie-2 hover:text-texto w-fit rounded-lg border px-3 py-2 text-sm font-medium transition-colors"
        >
          Adicionar módulo
        </button>
      </Secao>

      <Secao
        titulo="Conteúdos soltos"
        ajuda="Ficam direto na trilha, fora de qualquer módulo. Aparecem antes dos módulos na ordem."
      >
        <SeletorConteudos
          disponiveis={conteudos}
          selecionados={soltos}
          indisponiveis={usadosSemSoltos()}
          aoMudar={setSoltos}
        />
      </Secao>

      {!editando && (
        <Secao
          titulo="Vídeo introdutório"
          ajuda="Opcional. É o teaser da formação. O arquivo vai direto do seu navegador para o Vimeo."
        >
          <input
            type="file"
            name="video"
            accept="video/*"
            className="text-texto-2 file:border-borda file:bg-superficie-2 file:text-texto file:mr-3 file:rounded-lg file:border file:px-3 file:py-1.5 file:text-sm w-full text-sm"
          />
        </Secao>
      )}

      {progresso !== null && <ProgressoUpload valor={progresso} />}

      {erro && (
        <p
          role="alert"
          className="border-alerta/30 bg-alerta/10 text-alerta rounded-lg border px-3 py-2 text-sm"
        >
          {erro}
        </p>
      )}

      <div className="border-borda-suave flex flex-wrap items-center gap-3 border-t pt-5">
        <button type="submit" disabled={salvando} className={BOTAO_PRIMARIO}>
          {salvando ? "Salvando…" : editando ? "Salvar alterações" : "Criar trilha"}
        </button>
        <button
          type="button"
          onClick={() => router.push("/trilhas")}
          disabled={salvando}
          className={BOTAO_TEXTO}
        >
          Cancelar
        </button>
        {acaoExcluir && <div className="ml-auto">{acaoExcluir}</div>}
      </div>
    </form>
  );
}
