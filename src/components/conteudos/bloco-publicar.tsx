"use client";

import { useEffect, useState } from "react";
import { obterProntidao } from "@/app/(painel)/conteudos/acoes";
import { BOTAO_PRIMARIO } from "@/components/campos-formulario";

type Prontidao = {
  pronto: boolean;
  total: number;
  prontos: number;
  semVideo: boolean;
  pendentes: { id: number; titulo: string }[];
};

/*
  Bloco "Publicar" no estilo WordPress, para viver na sidebar do formulário.

  - Criação: o conteúdo nasce rascunho, então há só o botão de criar + o aviso.
  - Edição: "Salvar como rascunho", o status atual, o estado do vídeo (que trava
    "Publicar" enquanto o Vimeo processa) e o botão de publicar/atualizar.

  Os botões são `type="submit"` associados ao formulário por `form={formId}`,
  então funcionam mesmo estando fora do <form>. Cada um avisa o pai (via
  `aoRascunho`/`aoSalvar`) qual ação foi escolhida, para o submit decidir entre
  publicar e rascunho.
*/
export function BlocoPublicar({
  formId,
  editando,
  conteudoId,
  publicadoAtual,
  enviando,
  aoRascunho,
  aoSalvar,
  rotuloCriar = "Criar conteúdo",
}: {
  formId: string;
  editando: boolean;
  conteudoId?: number;
  publicadoAtual: boolean;
  enviando: boolean;
  aoRascunho: () => void;
  aoSalvar: () => void;
  rotuloCriar?: string;
}) {
  const [prontidao, setProntidao] = useState<Prontidao | null>(null);

  // Só vale vigiar um rascunho existente: publicado já passou pela trava, e na
  // criação ainda nem há vídeo.
  const vigiar = editando && !publicadoAtual && !!conteudoId;

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
        {!editando ? (
          <>
            <p className="text-texto-3 text-xs">
              O conteúdo é salvo como <strong>rascunho</strong>. Você publica na
              edição, depois que o vídeo terminar de processar no Vimeo.
            </p>
            <button
              type="submit"
              form={formId}
              disabled={enviando}
              onClick={aoSalvar}
              className={`${BOTAO_PRIMARIO} w-full`}
            >
              {enviando ? "Salvando…" : rotuloCriar}
            </button>
          </>
        ) : (
          <>
            <button
              type="submit"
              form={formId}
              disabled={enviando}
              onClick={aoRascunho}
              className="border-acento text-acento hover:bg-acento/10 rounded-lg border px-4 py-2 text-sm font-semibold transition-colors disabled:opacity-60"
            >
              Salvar como rascunho
            </button>

            <dl className="text-texto-2 flex flex-col gap-1.5 text-sm">
              <div className="flex items-center gap-1.5">
                <span className="text-texto-3">Status:</span>
                <strong className="text-texto">
                  {publicadoAtual ? "Publicado" : "Rascunho"}
                </strong>
              </div>
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
                : publicadoAtual
                  ? "Atualizar"
                  : "Publicar"}
            </button>
          </>
        )}
      </div>
    </section>
  );
}
