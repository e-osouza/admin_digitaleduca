"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  buscarVideosNaBiblioteca,
  criarAula,
  obterLinkDoVideo,
  vincularVideoExistente,
} from "@/app/(painel)/conteudos/acoes-aulas";
import { CAMPO_ARQUIVO, CONTROLE, ProgressoUpload } from "@/components/campos-formulario";
import { duracaoLegivel, lerDuracaoDoArquivo } from "@/lib/formato";
import { enviarParaVimeo } from "@/lib/upload-vimeo";
import type { Video } from "@/types/api";

/*
  Modal de vídeo, no formato da biblioteca de mídia do WordPress: duas abas,
  "Enviar do computador" e "Já na plataforma".

  A segunda aba existe porque o mesmo vídeo costuma servir a mais de um curso.
  Sem ela, a única saída era reenviar o arquivo — duplicando no Vimeo o que já
  estava lá, e criando duas cópias que envelhecem separadas.

  Reaproveitar cria apenas o vínculo: a aula nova aponta para a MESMA URI.
*/

type Aba = "enviar" | "biblioteca";

export function ModalVideo({
  conteudoId,
  moduloId,
  biblioteca,
  aoFechar,
}: {
  conteudoId: number;
  /** Ausente = aula solta, direto no conteúdo. */
  moduloId?: number;
  biblioteca: Video[];
  aoFechar: () => void;
}) {
  const router = useRouter();
  const [aba, setAba] = useState<Aba>("enviar");
  const [erro, setErro] = useState<string | null>(null);
  const dialogo = useRef<HTMLDivElement>(null);

  /* Esc fecha, como qualquer diálogo — e devolve o foco para quem abriu. */
  useEffect(() => {
    function aoTeclar(evento: KeyboardEvent) {
      if (evento.key === "Escape") aoFechar();
    }
    document.addEventListener("keydown", aoTeclar);
    dialogo.current?.focus();
    return () => document.removeEventListener("keydown", aoTeclar);
  }, [aoFechar]);

  function concluir() {
    router.refresh();
    aoFechar();
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      onMouseDown={(evento) => {
        /* Só fecha se o clique COMEÇOU no fundo: arrastar de dentro para fora
           ao selecionar texto não deveria descartar o que está em andamento. */
        if (evento.target === evento.currentTarget) aoFechar();
      }}
    >
      <div
        ref={dialogo}
        role="dialog"
        aria-modal="true"
        aria-label="Adicionar vídeo"
        tabIndex={-1}
        className="border-borda bg-superficie flex max-h-[85vh] w-full max-w-3xl flex-col overflow-hidden rounded-2xl border shadow-2xl outline-none"
      >
        <div className="border-borda-suave flex items-center justify-between border-b px-5 py-3">
          <h2 className="text-texto font-semibold">Adicionar vídeo</h2>
          <button
            type="button"
            onClick={aoFechar}
            aria-label="Fechar"
            className="text-texto-3 hover:text-texto text-xl leading-none transition-colors"
          >
            ×
          </button>
        </div>

        <div className="border-borda-suave flex gap-1 border-b px-5">
          {(
            [
              ["enviar", "Enviar do computador"],
              ["biblioteca", "Já na plataforma"],
            ] as const
          ).map(([chave, rotulo]) => (
            <button
              key={chave}
              type="button"
              onClick={() => {
                setAba(chave);
                setErro(null);
              }}
              aria-current={aba === chave ? "true" : undefined}
              className={`-mb-px border-b-2 px-3 py-2.5 text-sm transition-colors ${
                aba === chave
                  ? "border-acento text-texto font-semibold"
                  : "text-texto-2 hover:text-texto border-transparent"
              }`}
            >
              {rotulo}
            </button>
          ))}
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto p-5">
          {erro && (
            <p
              role="alert"
              className="border-alerta/40 bg-alerta/10 text-alerta mb-4 rounded-lg border px-4 py-3 text-sm"
            >
              {erro}
            </p>
          )}

          {aba === "enviar" ? (
            <AbaEnviar
              conteudoId={conteudoId}
              moduloId={moduloId}
              aoFalhar={setErro}
              aoConcluir={concluir}
            />
          ) : (
            <AbaBiblioteca
              conteudoId={conteudoId}
              moduloId={moduloId}
              biblioteca={biblioteca}
              aoFalhar={setErro}
              aoConcluir={concluir}
            />
          )}
        </div>
      </div>
    </div>
  );
}

function AbaEnviar({
  conteudoId,
  moduloId,
  aoFalhar,
  aoConcluir,
}: {
  conteudoId: number;
  moduloId?: number;
  aoFalhar: (mensagem: string) => void;
  aoConcluir: () => void;
}) {
  const [titulo, setTitulo] = useState("");
  const [arquivo, setArquivo] = useState<File | null>(null);
  const [progresso, setProgresso] = useState<number | null>(null);
  const [enviando, setEnviando] = useState(false);

  async function enviar() {
    if (!arquivo) return;
    aoFalhar("");
    setEnviando(true);

    try {
      /* Duração lida no navegador: a API aceita sem, mas aí a plataforma do
         aluno não mostra o tempo da aula nem soma o total do curso. */
      const duracao = await lerDuracaoDoArquivo(arquivo);

      const criada = await criarAula(conteudoId, {
        titulo: titulo.trim() || arquivo.name.replace(/\.[^.]+$/, ""),
        fileSize: arquivo.size,
        duracao: duracao ?? undefined,
        moduloId,
      });

      if (!criada.ok) {
        aoFalhar(criada.erro);
        setEnviando(false);
        return;
      }

      if (!criada.vimeoUploadLink) {
        aoFalhar("A API não devolveu o link de envio.");
        setEnviando(false);
        return;
      }

      /* O arquivo vai do navegador direto para o Vimeo — nunca passa pelo
         servidor do painel, que tem limite de corpo bem menor. */
      await enviarParaVimeo(arquivo, criada.vimeoUploadLink, setProgresso);
      aoConcluir();
    } catch (falha) {
      aoFalhar(
        falha instanceof Error ? falha.message : "Falha ao enviar o vídeo.",
      );
      setEnviando(false);
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <label className="flex flex-col gap-1.5">
        <span className="text-texto-2 text-sm font-medium">Arquivo</span>
        <input
          type="file"
          accept="video/*"
          disabled={enviando}
          onChange={(e) => setArquivo(e.target.files?.[0] ?? null)}
          className={CAMPO_ARQUIVO}
        />
      </label>

      <label className="flex flex-col gap-1.5">
        <span className="text-texto-2 text-sm font-medium">Título</span>
        <input
          value={titulo}
          onChange={(e) => setTitulo(e.target.value)}
          placeholder={arquivo ? arquivo.name.replace(/\.[^.]+$/, "") : "Nome da aula"}
          disabled={enviando}
          className={CONTROLE}
        />
        <span className="text-texto-3 text-xs">
          Em branco, usa o nome do arquivo.
        </span>
      </label>

      {progresso !== null && <ProgressoUpload valor={progresso} />}

      <button
        type="button"
        onClick={enviar}
        disabled={!arquivo || enviando}
        className="bg-acento hover:bg-acento-hover ml-auto rounded-lg px-4 py-2.5 text-sm font-semibold text-white transition-colors disabled:opacity-60"
      >
        {enviando ? "Enviando…" : "Enviar vídeo"}
      </button>
    </div>
  );
}

function AbaBiblioteca({
  conteudoId,
  moduloId,
  biblioteca,
  aoFalhar,
  aoConcluir,
}: {
  conteudoId: number;
  moduloId?: number;
  biblioteca: Video[];
  aoFalhar: (mensagem: string) => void;
  aoConcluir: () => void;
}) {
  const [busca, setBusca] = useState("");
  const [lista, setLista] = useState<Video[]>(biblioteca);
  const [buscando, setBuscando] = useState(false);
  const [escolhido, setEscolhido] = useState<Video | null>(null);
  const [fonte, setFonte] = useState<string | null>(null);
  const [carregandoPrevia, setCarregandoPrevia] = useState(false);
  const [vinculando, setVinculando] = useState(false);

  /*
    Busca no servidor, com atraso.

    A rota pagina, então filtrar no cliente só varreria a primeira página — o
    vídeo da 25ª posição em diante ficaria inalcançável. O atraso evita uma
    requisição por tecla.
  */
  useEffect(() => {
    const relogio = setTimeout(async () => {
      setBuscando(true);
      const resultado = await buscarVideosNaBiblioteca(busca);
      setLista(resultado as Video[]);
      setBuscando(false);
    }, 400);

    return () => clearTimeout(relogio);
  }, [busca]);

  async function escolher(video: Video) {
    setEscolhido(video);
    setFonte(null);
    if (!video.url) return;

    setCarregandoPrevia(true);
    const link = await obterLinkDoVideo(video.url);
    setCarregandoPrevia(false);
    setFonte(link.mp4);
  }

  async function usar() {
    if (!escolhido?.url) return;
    aoFalhar("");
    setVinculando(true);

    const r = await vincularVideoExistente(conteudoId, {
      titulo: escolhido.titulo,
      videoUrl: escolhido.url,
      duracao: escolhido.duracao ?? undefined,
      moduloId,
    });

    setVinculando(false);
    if (!r.ok) {
      aoFalhar(r.erro);
      return;
    }
    aoConcluir();
  }

  return (
    <div className="flex flex-col gap-4 sm:flex-row">
      <div className="flex min-w-0 flex-1 flex-col gap-2">
        <input
          type="search"
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
          placeholder="Buscar vídeo…"
          className={CONTROLE}
        />

        {buscando && (
          <p className="text-texto-3 text-xs">Buscando…</p>
        )}

        <ul className="border-borda-suave divide-borda-suave/60 max-h-80 divide-y overflow-y-auto rounded-lg border">
          {lista.filter((v) => v.url).map((video) => (
            <li key={video.id}>
              <button
                type="button"
                onClick={() => escolher(video)}
                className={`flex w-full items-center gap-2 px-3 py-2 text-left transition-colors ${
                  escolhido?.id === video.id
                    ? "bg-acento/10"
                    : "hover:bg-superficie-2"
                }`}
              >
                <span className="text-texto-2 min-w-0 flex-1 truncate text-sm">
                  {video.titulo}
                </span>
                <span className="text-texto-3 shrink-0 text-xs">
                  {duracaoLegivel(video.duracao)}
                </span>
              </button>
            </li>
          ))}

          {lista.length === 0 && (
            <li className="text-texto-3 px-3 py-4 text-center text-sm">
              Nenhum vídeo encontrado.
            </li>
          )}
        </ul>
      </div>

      <div className="flex w-full flex-col gap-3 sm:w-72">
        {escolhido ? (
          <>
            <p className="text-texto text-sm font-medium">{escolhido.titulo}</p>

            {carregandoPrevia ? (
              <p className="text-texto-3 text-sm">Carregando prévia…</p>
            ) : fonte ? (
              <video
                src={fonte}
                controls
                className="border-borda-suave w-full rounded-lg border"
              />
            ) : (
              /* Sem MP4 o link é HLS, que só toca nativamente no Safari —
                 melhor dizer isso do que mostrar um player quebrado. */
              <p className="text-texto-3 text-sm">
                Prévia indisponível para este vídeo. Ele funciona normalmente na
                plataforma.
              </p>
            )}

            <button
              type="button"
              onClick={usar}
              disabled={vinculando}
              className="bg-acento hover:bg-acento-hover rounded-lg px-4 py-2.5 text-sm font-semibold text-white transition-colors disabled:opacity-60"
            >
              {vinculando ? "Vinculando…" : "Usar este vídeo"}
            </button>

            <p className="text-texto-3 text-xs">
              Cria a aula apontando para o mesmo vídeo. O arquivo não é
              duplicado no Vimeo, e o conteúdo de origem não é alterado.
            </p>
          </>
        ) : (
          <p className="text-texto-3 text-sm">
            Escolha um vídeo à esquerda para ver a prévia.
          </p>
        )}
      </div>
    </div>
  );
}
