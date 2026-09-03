"use client";

import {
  createContext,
  useContext,
  useRef,
  useState,
  type ReactNode,
} from "react";
import {
  apagarVideoVimeo,
  criarTicketUpload,
} from "@/app/(painel)/conteudos/acoes";
import { enviarParaVimeoControlavel } from "@/lib/upload-vimeo";

type EstadoUpload = {
  ativo: boolean;
  nomeArquivo: string;
  progresso: number;
  erro: string | null;
};

type UploadVideo = {
  estado: EstadoUpload;
  /** Sobe o arquivo e resolve com a URI do vídeo, ou null (erro/cancelado). */
  iniciar: (arquivo: File) => Promise<string | null>;
  cancelar: () => void;
  limparErro: () => void;
};

const Ctx = createContext<UploadVideo | null>(null);

const VAZIO: EstadoUpload = {
  ativo: false,
  nomeArquivo: "",
  progresso: 0,
  erro: null,
};

/*
  Dono do upload de vídeo NO NÍVEL DA PÁGINA (não do modal). Assim o modal pode
  fechar assim que o arquivo é escolhido, e o envio segue com a barra no topo da
  página — perto do "Publicar", que agora vive na sidebar.
*/
export function UploadVideoProvider({ children }: { children: ReactNode }) {
  const [estado, setEstado] = useState<EstadoUpload>(VAZIO);
  const controle = useRef<{ abortar: () => void; uri: string } | null>(null);
  const abortado = useRef(false);

  async function iniciar(arquivo: File): Promise<string | null> {
    abortado.current = false;
    setEstado({ ativo: true, nomeArquivo: arquivo.name, progresso: 0, erro: null });

    const ticket = await criarTicketUpload(arquivo.size);
    if (!ticket) {
      setEstado({
        ...VAZIO,
        erro: "Não foi possível abrir o upload no Vimeo.",
      });
      return null;
    }

    const { promessa, abortar } = enviarParaVimeoControlavel(
      arquivo,
      ticket.uploadLink,
      (p) => setEstado((s) => (s.ativo ? { ...s, progresso: p } : s)),
    );
    controle.current = { abortar, uri: ticket.uri };

    try {
      await promessa;
      controle.current = null;
      setEstado(VAZIO);
      return ticket.uri;
    } catch {
      controle.current = null;
      if (abortado.current) {
        abortado.current = false;
        return null; // cancelado — cancelar() já limpou
      }
      await apagarVideoVimeo(ticket.uri);
      setEstado({ ...VAZIO, erro: "Falha no envio do vídeo. Tente de novo." });
      return null;
    }
  }

  function cancelar() {
    abortado.current = true;
    const atual = controle.current;
    controle.current = null;
    atual?.abortar();
    if (atual?.uri) void apagarVideoVimeo(atual.uri);
    setEstado(VAZIO);
  }

  function limparErro() {
    setEstado((s) => ({ ...s, erro: null }));
  }

  return (
    <Ctx.Provider value={{ estado, iniciar, cancelar, limparErro }}>
      {children}
    </Ctx.Provider>
  );
}

/** Null quando não há provedor (ex.: modais fora do formulário de publicação). */
export function useUploadVideo(): UploadVideo | null {
  return useContext(Ctx);
}
