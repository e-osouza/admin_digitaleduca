"use client";

import { useEffect, useState } from "react";
import { obterProntidao } from "@/app/(painel)/conteudos/acoes";
import { BOTAO_PRIMARIO, CONTROLE } from "@/components/campos-formulario";

type Prontidao = {
  pronto: boolean;
  total: number;
  prontos: number;
  semVideo: boolean;
  pendentes: { id: number; titulo: string }[];
};

const HOJE = new Date().toISOString().slice(0, 10);

function dataBonita(iso?: string) {
  if (!iso) return "—";
  const [a, m, d] = iso.slice(0, 10).split("-");
  return d && m && a ? `${d}/${m}/${a}` : iso;
}

/*
  Bloco "Publicar" no estilo WordPress, para a sidebar do formulário. Reúne:
  salvar como rascunho, a data de publicação, o status/estado do vídeo (que
  trava "Publicar" enquanto o Vimeo processa) e o botão principal.

  Os botões são `type="submit"` associados ao <form> por `form={formId}`, então
  funcionam fora dele. Cada um avisa o pai (`aoRascunho`/`aoSalvar`) qual ação
  foi escolhida, e o submit decide entre publicar e rascunho.
*/
export function BlocoPublicar({
  formId,
  editando,
  conteudoId,
  publicadoAtual,
  enviando,
  aoRascunho,
  aoSalvar,
  dataCriacaoInicial,
  rotuloCriar = "Criar conteúdo",
  comVideo = true,
}: {
  formId: string;
  editando: boolean;
  conteudoId?: number;
  publicadoAtual: boolean;
  enviando: boolean;
  aoRascunho: () => void;
  aoSalvar: () => void;
  /** Data já cadastrada (edição), em ISO/yyyy-mm-dd. */
  dataCriacaoInicial?: string;
  rotuloCriar?: string;
  /**
   * Mostra o estado do vídeo e trava "Publicar" enquanto o Vimeo processa.
   * Falso para tipos sem vídeo próprio (trilha), que também não têm essa trava.
   */
  comVideo?: boolean;
}) {
  const [prontidao, setProntidao] = useState<Prontidao | null>(null);

  const vigiar = comVideo && editando && !publicadoAtual && !!conteudoId;

  useEffect(() => {
    if (!vigiar || !conteudoId) return;
    let vivo = true;
    let timer: ReturnType<typeof setTimeout>;
    const checar = async () => {
      const p = await obterProntidao(conteudoId);
      if (!vivo) return;
      setProntidao(p);
      if (!p?.pronto) timer = setTimeout(checar, 8000);
    };
    checar();
    return () => {
      vivo = false;
      clearTimeout(timer);
    };
  }, [conteudoId, vigiar]);

  const bloqueiaPublicar =
    !publicadoAtual && prontidao !== null && !prontidao.pronto;

  return (
    <section className="border-borda bg-superficie overflow-hidden rounded-xl border">
      <header className="border-borda-suave border-b px-4 py-3">
        <h3 className="text-texto font-semibold">Publicar</h3>
      </header>

      <div className="flex flex-col gap-3 p-4">
        {/* Salvar como rascunho — some sem publicar; disponível sempre. */}
        <button
          type="submit"
          form={formId}
          disabled={enviando}
          onClick={aoRascunho}
          className="border-acento text-acento hover:bg-acento/10 rounded-lg border px-4 py-2 text-sm font-semibold transition-colors disabled:opacity-60"
        >
          Salvar como rascunho
        </button>

        <dl className="text-texto-2 flex flex-col gap-1.5 border-t border-borda-suave pt-3 text-sm">
          {editando && (
            <div className="flex items-center gap-1.5">
              <span className="text-texto-3">Status:</span>
              <strong className="text-texto">
                {publicadoAtual ? "Publicado" : "Rascunho"}
              </strong>
            </div>
          )}

          {vigiar && (
            <div className="flex items-center gap-1.5">
              <span className="text-texto-3">Vídeo:</span>
              {prontidao === null ? (
                <span className="text-texto-3">verificando…</span>
              ) : prontidao.pronto ? (
                <strong className="text-texto">pronto para publicar</strong>
              ) : prontidao.semVideo ? (
                <span className="text-alerta">sem vídeo tocável ainda</span>
              ) : (
                <span className="text-alerta">
                  processando no Vimeo ({prontidao.prontos}/{prontidao.total})
                </span>
              )}
            </div>
          )}

          {/* Data de publicação: editável ao criar; só leitura ao editar. */}
          <div className="flex flex-col gap-1">
            <span className="text-texto-3">Data de publicação</span>
            {editando ? (
              <strong className="text-texto">
                {dataBonita(dataCriacaoInicial)}
              </strong>
            ) : (
              <input
                type="date"
                name="dataCriacao"
                form={formId}
                defaultValue={HOJE}
                className={CONTROLE}
              />
            )}
          </div>
        </dl>

        <button
          type="submit"
          form={formId}
          disabled={enviando || bloqueiaPublicar}
          onClick={aoSalvar}
          title={
            bloqueiaPublicar
              ? "Disponível quando o vídeo terminar de processar."
              : undefined
          }
          className={`${BOTAO_PRIMARIO} w-full`}
        >
          {enviando
            ? "Salvando…"
            : !editando
              ? rotuloCriar
              : publicadoAtual
                ? "Atualizar"
                : "Publicar"}
        </button>
      </div>
    </section>
  );
}
