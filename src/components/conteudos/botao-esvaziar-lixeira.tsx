"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { esvaziarLixeira } from "@/app/(painel)/conteudos/acoes";

/**
 * Esvazia a lixeira — exclui DEFINITIVAMENTE todos os conteúdos excluídos.
 *
 * Sem volta: apaga os vídeos no Vimeo. Por isso pede confirmação com o total,
 * o mesmo cuidado do "Esvaziar lixeira" do WordPress.
 */
export function BotaoEsvaziarLixeira({ total }: { total: number }) {
  const router = useRouter();
  const [processando, comecarTransicao] = useTransition();
  const [erro, setErro] = useState<string | null>(null);

  if (total <= 0) return null;

  return (
    <div className="flex flex-col items-end gap-1">
      <button
        type="button"
        disabled={processando}
        onClick={() => {
          if (
            !window.confirm(
              `Esvaziar a lixeira? Isso exclui definitivamente ${total} ${total === 1 ? "conteúdo" : "conteúdos"} e apaga os vídeos no Vimeo. NÃO há como desfazer.`,
            )
          ) {
            return;
          }
          setErro(null);
          comecarTransicao(async () => {
            const r = await esvaziarLixeira();
            if (!r.ok) setErro(r.erro ?? "Algo falhou.");
            router.refresh();
          });
        }}
        className="border-alerta/40 text-alerta hover:bg-alerta/10 rounded-lg border px-3 py-2 text-sm font-medium transition-colors disabled:opacity-50"
      >
        {processando ? "Esvaziando…" : "Esvaziar lixeira"}
      </button>
      {erro && (
        <span role="alert" className="text-alerta text-xs">
          {erro}
        </span>
      )}
    </div>
  );
}
