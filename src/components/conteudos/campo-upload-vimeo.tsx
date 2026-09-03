"use client";

import { useEffect, useRef, useState } from "react";
import {
  apagarVideoVimeo,
  criarTicketUpload,
} from "@/app/(painel)/conteudos/acoes";
import { enviarParaVimeoControlavel } from "@/lib/upload-vimeo";
import { CAMPO_ARQUIVO } from "@/components/campos-formulario";

export type EstadoUpload = "vazio" | "enviando" | "pronto" | "erro";

/*
  Upload de vídeo que começa SOZINHO ao selecionar o arquivo — o arquivo vai
  direto para o Vimeo (tus), com barra de progresso e botão de cancelar.

  Cancelar aborta o envio e apaga o vídeo (mesmo incompleto) no Vimeo, sem
  deixar lixo. Quando termina, a URI do vídeo entra no formulário por um input
  escondido (`nome`), e o formulário só a vincula ao conteúdo no submit.

  O estado é avisado ao pai (`aoMudarEstado`) para ele travar o botão de salvar
  enquanto o envio não termina.
*/
export function CampoUploadVimeo({
  nome,
  aoMudarEstado,
  aoMudarUrl,
  atualUrl,
}: {
  /** Campo do FormData que recebe a URI do vídeo enviado. */
  nome: string;
  aoMudarEstado?: (estado: EstadoUpload) => void;
  /** URI do vídeo enviado (ou "" ao limpar) — para quem usa fora de um form. */
  aoMudarUrl?: (uri: string) => void;
  /** Edição: já existe um vídeo vinculado. */
  atualUrl?: string | null;
}) {
  const [estado, setEstado] = useState<EstadoUpload>(
    atualUrl ? "pronto" : "vazio",
  );
  const [progresso, setProgresso] = useState(0);
  const [uri, setUri] = useState<string>(atualUrl ?? "");
  const [nomeArquivo, setNomeArquivo] = useState("");
  const [erro, setErro] = useState<string | null>(null);
  const controle = useRef<{ abortar: () => void; uri: string } | null>(null);
  const abortado = useRef(false);

  useEffect(() => {
    aoMudarEstado?.(estado);
    // aoMudarEstado é estável o suficiente; observar só o estado evita loop.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [estado]);

  useEffect(() => {
    aoMudarUrl?.(uri);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [uri]);

  async function aoSelecionar(evento: React.ChangeEvent<HTMLInputElement>) {
    const arquivo = evento.target.files?.[0];
    evento.target.value = ""; // permite reescolher o mesmo arquivo depois
    if (!arquivo) return;

    abortado.current = false;
    setErro(null);
    setNomeArquivo(arquivo.name);
    setProgresso(0);
    setEstado("enviando");

    const ticket = await criarTicketUpload(arquivo.size);
    if (!ticket) {
      setErro("Não foi possível abrir o upload no Vimeo.");
      setEstado("erro");
      return;
    }

    const { promessa, abortar } = enviarParaVimeoControlavel(
      arquivo,
      ticket.uploadLink,
      setProgresso,
    );
    controle.current = { abortar, uri: ticket.uri };

    try {
      await promessa;
      controle.current = null;
      setUri(ticket.uri);
      setEstado("pronto");
    } catch {
      controle.current = null;
      if (abortado.current) {
        abortado.current = false;
        return; // cancelado pelo usuário — cancelar() já limpou tudo
      }
      await apagarVideoVimeo(ticket.uri);
      setErro("Falha no envio do vídeo. Tente de novo.");
      setEstado("erro");
    }
  }

  async function cancelar() {
    abortado.current = true;
    const atual = controle.current;
    controle.current = null;
    atual?.abortar();
    if (atual?.uri) await apagarVideoVimeo(atual.uri);
    setUri("");
    setProgresso(0);
    setEstado("vazio");
  }

  async function trocar() {
    const antigo = uri;
    setUri("");
    setEstado("vazio");
    if (antigo && !atualUrl) {
      // Só apaga o que ESTE componente enviou agora; um vídeo que já era do
      // conteúdo (atualUrl) não é removido do Vimeo por um simples "trocar".
      await apagarVideoVimeo(antigo);
    }
  }

  return (
    <div className="flex flex-col gap-2">
      {estado === "vazio" || estado === "erro" ? (
        <>
          <input
            type="file"
            accept="video/*"
            onChange={aoSelecionar}
            className={CAMPO_ARQUIVO}
          />
          {erro && <p className="text-alerta text-xs">{erro}</p>}
        </>
      ) : estado === "enviando" ? (
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between gap-3 text-sm">
            <span className="text-texto-2 min-w-0 truncate">
              Enviando {nomeArquivo}…
            </span>
            <button
              type="button"
              onClick={cancelar}
              className="text-alerta shrink-0 text-sm font-medium hover:underline"
            >
              Cancelar
            </button>
          </div>
          <div className="bg-superficie-2 h-2 w-full overflow-hidden rounded-full">
            <div
              className="bg-acento ease-suave h-full transition-all duration-300"
              style={{ width: `${progresso}%` }}
            />
          </div>
          <span className="text-texto-3 text-xs tabular-nums">
            {progresso}% enviado
          </span>
        </div>
      ) : (
        <div className="border-borda-suave flex items-center justify-between gap-3 rounded-lg border px-3 py-2 text-sm">
          <span className="text-texto-2 min-w-0 truncate">
            ✓ Vídeo enviado{nomeArquivo ? ` — ${nomeArquivo}` : ""}
          </span>
          <button
            type="button"
            onClick={trocar}
            className="text-texto-3 hover:text-alerta shrink-0 text-sm"
          >
            Trocar
          </button>
        </div>
      )}

      {estado === "pronto" && uri ? (
        <input type="hidden" name={nome} value={uri} />
      ) : null}
    </div>
  );
}
