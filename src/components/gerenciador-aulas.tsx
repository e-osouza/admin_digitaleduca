"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import {
  atualizarAula,
  atualizarModulo,
  criarAula,
  criarModulo,
  excluirAula,
  excluirModulo,
} from "@/app/(painel)/conteudos/acoes-aulas";
import { BOTAO_PRIMARIO, CONTROLE } from "@/components/campos-formulario";
import { duracaoLegivel, lerDuracaoDoArquivo } from "@/lib/formato";
import { enviarParaVimeo } from "@/lib/upload-vimeo";
import type { Modulo, Video } from "@/types/api";

const BOTAO_SECUNDARIO =
  "border-borda text-texto-2 hover:bg-superficie-2 hover:text-texto rounded-lg border px-3 py-1.5 text-sm font-medium transition-colors disabled:opacity-60";

export function GerenciadorAulas({
  conteudoId,
  modulos,
  videosSoltos,
  temPastaVimeo,
  previaVideoUnico,
}: {
  conteudoId: number;
  modulos: Modulo[];
  /** Aulas penduradas direto no conteúdo, sem módulo. */
  videosSoltos: Video[];
  /** Sem pasta no Vimeo o backend recusa criar módulo e aula. */
  temPastaVimeo: boolean;
  /**
   * Player do vídeo do conteúdo, montado no servidor — resolver o link do
   * Vimeo exige token, então não dá para fazer aqui no cliente.
   */
  previaVideoUnico?: React.ReactNode;
}) {
  const [erro, setErro] = useState<string | null>(null);

  /*
   * Estrutura do conteúdo. O valor inicial vem do que já existe: se há
   * módulos, é um curso modular; se só há aulas soltas, é vídeo único. Um
   * conteúdo vazio começa em "vídeo único", que é o caso mais simples.
   *
   * É só uma escolha de interface — no banco a diferença é a aula ter ou não
   * `moduloId`. Por isso a opção fica travada quando já existe conteúdo do
   * outro lado: trocar não migraria nada, só esconderia o que está lá.
   */
  const [comModulos, setComModulos] = useState(modulos.length > 0);

  const travado = modulos.length > 0 || videosSoltos.length > 0;

  if (!temPastaVimeo) {
    return (
      <p className="border-borda bg-superficie-2 text-texto-2 rounded-lg border px-3 py-2.5 text-sm">
        Este conteúdo não tem pasta no Vimeo, então ainda não aceita módulos nem
        aulas. Isso acontece quando a criação foi interrompida antes do envio do
        vídeo introdutório.
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h2 className="text-texto font-semibold">
          {comModulos ? "Módulos e aulas" : "Vídeo do conteúdo"}
        </h2>
        <p className="text-texto-3 mt-1 text-sm">
          {comModulos
            ? "Salvos na hora, independentemente do formulário acima."
            : "O vídeo que o aluno assiste. Diferente do introdutório, que é só o teaser da página."}
        </p>
      </div>

      {erro && (
        <p
          role="alert"
          className="border-alerta/30 bg-alerta/10 text-alerta rounded-lg border px-3 py-2 text-sm"
        >
          {erro}
        </p>
      )}

      <fieldset className="border-borda-suave flex flex-col gap-2 rounded-lg border p-3">
        <legend className="text-texto-2 px-1 text-sm font-medium">
          Como este conteúdo é organizado
        </legend>

        <div className="flex flex-wrap gap-4">
          <label className="flex items-center gap-2 text-sm">
            <input
              type="radio"
              name="estrutura"
              checked={!comModulos}
              onChange={() => setComModulos(false)}
              disabled={travado && modulos.length > 0}
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
              disabled={travado && videosSoltos.length > 0}
              className="accent-acento h-4 w-4"
            />
            <span className="text-texto-2">Dividido em módulos</span>
          </label>
        </div>

        {travado && (
          <p className="text-texto-3 text-xs">
            A estrutura já está definida pelo que foi cadastrado. Para trocar,
            remova primeiro {modulos.length > 0 ? "os módulos" : "as aulas"}.
          </p>
        )}
      </fieldset>

      {comModulos ? (
        <>
          {modulos.length === 0 && (
            <p className="text-texto-3 text-sm">
              Nenhum módulo ainda. Crie o primeiro para começar a adicionar
              aulas.
            </p>
          )}

          {modulos.map((modulo) => (
            <CartaoModulo
              key={modulo.id}
              conteudoId={conteudoId}
              modulo={modulo}
              aoFalhar={setErro}
            />
          ))}

          <div className="flex flex-wrap gap-2">
            <NovoModulo conteudoId={conteudoId} aoFalhar={setErro} />
          </div>
        </>
      ) : (
        <>
          {videosSoltos.length > 0 ? (
            <div className="border-borda-suave flex flex-col gap-3 rounded-lg border p-4">
              {previaVideoUnico}

              <ListaAulas
                conteudoId={conteudoId}
                videos={videosSoltos}
                aoFalhar={setErro}
              />
            </div>
          ) : (
            <p className="text-texto-3 text-sm">
              Nenhum vídeo ainda. Envie o vídeo deste conteúdo abaixo.
            </p>
          )}

          <div className="flex flex-wrap gap-2">
            <NovaAula
              conteudoId={conteudoId}
              rotulo={
                videosSoltos.length === 0 ? "Enviar vídeo" : "Adicionar vídeo"
              }
              aoFalhar={setErro}
            />
          </div>
        </>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */

function CartaoModulo({
  conteudoId,
  modulo,
  aoFalhar,
}: {
  conteudoId: number;
  modulo: Modulo;
  aoFalhar: (mensagem: string) => void;
}) {
  const router = useRouter();
  const [confirmando, setConfirmando] = useState(false);
  const [editando, setEditando] = useState(false);
  const [ocupado, setOcupado] = useState(false);

  async function remover() {
    setOcupado(true);
    const resultado = await excluirModulo(conteudoId, modulo.id);
    if (!resultado.ok) {
      aoFalhar(resultado.erro);
      setOcupado(false);
      setConfirmando(false);
      return;
    }
    router.refresh();
  }

  return (
    <div className="border-borda-suave rounded-lg border p-4">
      {editando ? (
        <FormularioModulo
          modulo={modulo}
          aoCancelar={() => setEditando(false)}
          aoSalvar={async (dados) => {
            const resultado = await atualizarModulo(conteudoId, modulo.id, dados);
            if (!resultado.ok) {
              aoFalhar(resultado.erro);
              return false;
            }
            setEditando(false);
            router.refresh();
            return true;
          }}
        />
      ) : (
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="text-texto text-sm font-semibold">{modulo.titulo}</h3>
          {modulo.subtitulo && (
            <p className="text-texto-3 text-xs">{modulo.subtitulo}</p>
          )}
        </div>

        {confirmando ? (
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-texto-2 text-xs">
              Apaga as aulas e a pasta no Vimeo.
            </span>
            <button
              type="button"
              onClick={remover}
              disabled={ocupado}
              className="bg-alerta rounded-lg px-2.5 py-1 text-xs font-semibold text-white disabled:opacity-60"
            >
              {ocupado ? "Excluindo…" : "Confirmar"}
            </button>
            <button
              type="button"
              onClick={() => setConfirmando(false)}
              className="text-texto-2 text-xs"
            >
              Cancelar
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => setEditando(true)}
              className="text-texto-2 hover:bg-superficie-2 hover:text-texto rounded-lg px-2 py-1 text-xs font-medium transition-colors"
            >
              Editar
            </button>
            <button
              type="button"
              onClick={() => setConfirmando(true)}
              className="text-alerta hover:bg-alerta/10 rounded-lg px-2 py-1 text-xs font-medium transition-colors"
            >
              Excluir
            </button>
          </div>
        )}
      </div>
      )}

      <ListaAulas
        conteudoId={conteudoId}
        videos={modulo.videos ?? []}
        aoFalhar={aoFalhar}
      />

      <div className="mt-3">
        <NovaAula
          conteudoId={conteudoId}
          moduloId={modulo.id}
          rotulo="Adicionar aula neste módulo"
          aoFalhar={aoFalhar}
        />
      </div>
    </div>
  );
}

function ListaAulas({
  conteudoId,
  videos,
  aoFalhar,
}: {
  conteudoId: number;
  videos: Video[];
  aoFalhar: (mensagem: string) => void;
}) {
  const router = useRouter();
  const [removendo, setRemovendo] = useState<number | null>(null);

  if (videos.length === 0) {
    return <p className="text-texto-3 mt-3 text-xs">Sem aulas ainda.</p>;
  }

  async function remover(id: number) {
    setRemovendo(id);
    const resultado = await excluirAula(conteudoId, id);
    if (!resultado.ok) {
      aoFalhar(resultado.erro);
      setRemovendo(null);
      return;
    }
    router.refresh();
  }

  async function renomear(id: number, titulo: string) {
    const resultado = await atualizarAula(conteudoId, id, { titulo });
    if (!resultado.ok) {
      aoFalhar(resultado.erro);
      return false;
    }
    router.refresh();
    return true;
  }

  return (
    <ol className="mt-3 flex flex-col gap-1">
      {videos.map((video, indice) => (
        <ItemAula
          key={video.id}
          video={video}
          indice={indice}
          removendo={removendo === video.id}
          aoRemover={() => remover(video.id)}
          aoRenomear={(titulo) => renomear(video.id, titulo)}
        />
      ))}
    </ol>
  );
}

function ItemAula({
  video,
  indice,
  removendo,
  aoRemover,
  aoRenomear,
}: {
  video: Video;
  indice: number;
  removendo: boolean;
  aoRemover: () => void;
  aoRenomear: (titulo: string) => Promise<boolean>;
}) {
  const [editando, setEditando] = useState(false);
  const [salvando, setSalvando] = useState(false);

  async function salvar(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    const titulo = String(
      new FormData(evento.currentTarget).get("titulo") ?? "",
    ).trim();

    if (!titulo || titulo === video.titulo) {
      setEditando(false);
      return;
    }

    setSalvando(true);
    const deuCerto = await aoRenomear(titulo);
    setSalvando(false);
    if (deuCerto) setEditando(false);
  }

  if (editando) {
    return (
      <li>
        <form onSubmit={salvar} className="flex items-center gap-2 px-2 py-1.5">
          <input
            name="titulo"
            defaultValue={video.titulo}
            autoFocus
            required
            className={`${CONTROLE} flex-1`}
          />
          <button
            type="submit"
            disabled={salvando}
            className="text-acento shrink-0 text-xs font-semibold disabled:opacity-60"
          >
            {salvando ? "Salvando…" : "Salvar"}
          </button>
          <button
            type="button"
            onClick={() => setEditando(false)}
            disabled={salvando}
            className="text-texto-2 shrink-0 text-xs"
          >
            Cancelar
          </button>
        </form>
      </li>
    );
  }

  return (
    <li className="hover:bg-superficie-2 flex items-center gap-3 rounded-md px-2 py-1.5 text-sm">
      <span className="text-texto-3 w-5 shrink-0 text-xs tabular-nums">
        {indice + 1}
      </span>
      <span className="text-texto-2 min-w-0 flex-1 truncate">
        {video.titulo}
      </span>
      <span className="text-texto-3 shrink-0 text-xs">
        {duracaoLegivel(video.duracao)}
      </span>
      <button
        type="button"
        onClick={() => setEditando(true)}
        className="text-texto-2 hover:text-texto shrink-0 text-xs font-medium"
      >
        Renomear
      </button>
      <button
        type="button"
        onClick={aoRemover}
        disabled={removendo}
        className="text-alerta shrink-0 text-xs font-medium disabled:opacity-60"
      >
        {removendo ? "Excluindo…" : "Excluir"}
      </button>
    </li>
  );
}

function NovoModulo({
  conteudoId,
  aoFalhar,
}: {
  conteudoId: number;
  aoFalhar: (mensagem: string) => void;
}) {
  const router = useRouter();
  const [aberto, setAberto] = useState(false);

  if (!aberto) {
    return (
      <button
        type="button"
        onClick={() => setAberto(true)}
        className={BOTAO_SECUNDARIO}
      >
        Novo módulo
      </button>
    );
  }

  return (
    <FormularioModulo
      titulo="Novo módulo"
      rotuloEnvio="Criar módulo"
      aoCancelar={() => setAberto(false)}
      aoSalvar={async (dados) => {
        const resultado = await criarModulo(conteudoId, dados);
        if (!resultado.ok) {
          aoFalhar(resultado.erro);
          return false;
        }
        setAberto(false);
        router.refresh();
        return true;
      }}
    />
  );
}

/**
 * Campos do módulo, compartilhados entre criar e editar. Os três textos são
 * obrigatórios no backend (`@IsString()` sem `@IsOptional()`) — daí o
 * `required` em todos.
 */
function FormularioModulo({
  modulo,
  titulo = "Editar módulo",
  rotuloEnvio = "Salvar",
  aoSalvar,
  aoCancelar,
}: {
  modulo?: Modulo;
  titulo?: string;
  rotuloEnvio?: string;
  aoSalvar: (dados: {
    titulo: string;
    subtitulo: string;
    descricao: string;
  }) => Promise<boolean>;
  aoCancelar: () => void;
}) {
  const [salvando, setSalvando] = useState(false);

  async function enviar(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    const dados = new FormData(evento.currentTarget);

    setSalvando(true);
    await aoSalvar({
      titulo: String(dados.get("titulo") ?? ""),
      subtitulo: String(dados.get("subtitulo") ?? ""),
      descricao: String(dados.get("descricao") ?? ""),
    });
    setSalvando(false);
  }

  return (
    <form
      onSubmit={enviar}
      className="border-borda bg-superficie-2 flex w-full flex-col gap-3 rounded-lg border p-4"
    >
      <h4 className="text-texto text-sm font-semibold">{titulo}</h4>

      <input
        name="titulo"
        required
        defaultValue={modulo?.titulo ?? ""}
        placeholder="Título do módulo"
        className={CONTROLE}
      />
      <input
        name="subtitulo"
        required
        defaultValue={modulo?.subtitulo ?? ""}
        placeholder="Subtítulo"
        className={CONTROLE}
      />
      <textarea
        name="descricao"
        required
        rows={2}
        defaultValue={modulo?.descricao ?? ""}
        placeholder="Descrição"
        className={`${CONTROLE} resize-y`}
      />
      <p className="text-texto-3 text-xs">
        Os três campos são obrigatórios na API.
      </p>

      <div className="flex gap-2">
        <button type="submit" disabled={salvando} className={BOTAO_PRIMARIO}>
          {salvando ? "Salvando…" : rotuloEnvio}
        </button>
        <button
          type="button"
          onClick={aoCancelar}
          disabled={salvando}
          className="text-texto-2 hover:text-texto rounded-lg px-3 py-1.5 text-sm font-medium disabled:opacity-60"
        >
          Cancelar
        </button>
      </div>
    </form>
  );
}

function NovaAula({
  conteudoId,
  moduloId,
  rotulo = "Nova aula avulsa",
  aoFalhar,
}: {
  conteudoId: number;
  moduloId?: number;
  rotulo?: string;
  aoFalhar: (mensagem: string) => void;
}) {
  const router = useRouter();
  const [aberto, setAberto] = useState(false);
  const [salvando, setSalvando] = useState(false);
  const [progresso, setProgresso] = useState<number | null>(null);

  async function salvar(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault();

    const dados = new FormData(evento.currentTarget);
    const arquivo = dados.get("video");

    if (!(arquivo instanceof File) || arquivo.size === 0) {
      aoFalhar("Selecione o arquivo de vídeo da aula.");
      return;
    }

    setSalvando(true);
    setProgresso(null);

    // Lida do próprio arquivo: ninguém acerta a duração digitando.
    const duracao = await lerDuracaoDoArquivo(arquivo);

    const resultado = await criarAula(conteudoId, {
      titulo: String(dados.get("titulo") ?? ""),
      fileSize: arquivo.size,
      duracao: duracao ?? undefined,
      moduloId,
    });

    if (!resultado.ok) {
      aoFalhar(resultado.erro);
      setSalvando(false);
      return;
    }

    if (resultado.vimeoUploadLink) {
      try {
        await enviarParaVimeo(arquivo, resultado.vimeoUploadLink, setProgresso);
      } catch {
        aoFalhar(
          "A aula foi registrada, mas o envio do vídeo falhou. Exclua a aula e crie de novo.",
        );
        setSalvando(false);
        return;
      }
    }

    setAberto(false);
    setSalvando(false);
    setProgresso(null);
    router.refresh();
  }

  if (!aberto) {
    return (
      <button
        type="button"
        onClick={() => setAberto(true)}
        className={BOTAO_SECUNDARIO}
      >
        {rotulo}
      </button>
    );
  }

  return (
    <form
      onSubmit={salvar}
      className="border-borda bg-superficie-2 flex w-full flex-col gap-3 rounded-lg border p-4"
    >
      <h4 className="text-texto text-sm font-semibold">{rotulo}</h4>

      <input
        name="titulo"
        required
        placeholder="Título da aula"
        className={CONTROLE}
      />
      <input
        type="file"
        name="video"
        accept="video/*"
        required
        className="text-texto-2 file:border-borda file:bg-superficie file:text-texto file:mr-3 file:rounded-lg file:border file:px-3 file:py-1.5 file:text-sm w-full text-sm"
      />
      <p className="text-texto-3 text-xs">
        A duração é lida do arquivo automaticamente.
      </p>

      {progresso !== null && (
        <div className="flex flex-col gap-1.5">
          <div className="text-texto-2 flex justify-between text-xs">
            <span>Enviando para o Vimeo…</span>
            <span>{progresso}%</span>
          </div>
          <div
            role="progressbar"
            aria-valuenow={progresso}
            aria-valuemin={0}
            aria-valuemax={100}
            className="bg-borda-suave h-1.5 overflow-hidden rounded-full"
          >
            <div
              className="bg-acento h-full transition-[width] duration-200"
              style={{ width: `${progresso}%` }}
            />
          </div>
          <p className="text-texto-3 text-xs">
            Não feche esta aba até terminar.
          </p>
        </div>
      )}

      <div className="flex gap-2">
        <button type="submit" disabled={salvando} className={BOTAO_PRIMARIO}>
          {salvando ? "Enviando…" : "Enviar aula"}
        </button>
        <button
          type="button"
          onClick={() => setAberto(false)}
          disabled={salvando}
          className="text-texto-2 hover:text-texto rounded-lg px-3 py-1.5 text-sm font-medium disabled:opacity-60"
        >
          Cancelar
        </button>
      </div>
    </form>
  );
}
