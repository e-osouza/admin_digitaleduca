"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { moverConteudo } from "@/app/(painel)/conteudos/acoes";

/*
  "Mover para" entre os quatro tipos do menu.

  Os quatro são `Conteudo.tipo`, então mover é sempre troca de um campo, na
  mesma tabela — nada é copiado, nada é apagado. Foi exatamente para isso que
  o modelo mudou: enquanto curso e trilha viviam noutra tabela, mover entre
  eles teria de migrar o registro e perder os filhos pelo caminho.

  O que muda ao mover é o formulário que edita o item e a tela onde ele
  aparece. Os dados que o tipo de destino não exibe continuam gravados.
*/

import { ROTULO_TIPO, TIPOS_DO_MENU, rotaDeEdicao } from "@/lib/tipos";
import type { TipoConteudo } from "@/types/api";

/**
 * O que sai de vista ao mover. Nada é perdido — o formulário de destino é que
 * não mostra tudo que o de origem mostrava, e volta se mover de volta.
 */
const RESSALVA: Partial<Record<string, string>> = {
  PODCAST:
    "Podcast não tem módulos nem vídeo introdutório. Os que existirem continuam gravados, mas somem do formulário.",
  AULA: "Apresentador e convidados são campos de podcast — ficam gravados, mas o formulário de MasterClass não os mostra.",
  CURSO:
    "Curso agrupa outros conteúdos. Os vídeos deste item continuam gravados, e você escolhe quais conteúdos entram na edição.",
  TRILHA:
    "Trilha agrupa outros conteúdos. Os vídeos deste item continuam gravados, e você escolhe quais conteúdos entram na edição.",
};

export function MoverPara({
  id,
  atual,
  titulo,
}: {
  id: number;
  atual: TipoConteudo;
  /** Só para a confirmação dizer o que está sendo movido. */
  titulo: string;
}) {
  const router = useRouter();
  const [movendo, comecarTransicao] = useTransition();
  const [erro, setErro] = useState<string | null>(null);

  const destinos = TIPOS_DO_MENU.filter((t) => t.valor !== atual);

  function mover(destino: TipoConteudo, rota: string) {
    const ressalva = RESSALVA[destino];
    const aviso = ressalva ? `\n\n${ressalva}` : "";

    if (
      !window.confirm(
        `Mover "${titulo}" de ${ROTULO_TIPO[atual]} para ${ROTULO_TIPO[destino]}?${aviso}`,
      )
    ) {
      return;
    }

    setErro(null);
    comecarTransicao(async () => {
      const resultado = await moverConteudo(id, destino);

      if (!resultado.ok) {
        setErro(resultado.erro);
        return;
      }

      /*
        Reabre na rota do NOVO tipo. Sem isso o admin ficava numa URL que já
        não corresponde ao item — o menu lateral acendia a seção antiga e o
        link de volta apontava para a lista errada.
      */
      router.push(rotaDeEdicao(destino, id));
      router.refresh();
      void rota;
    });
  }

  return (
    <section className="border-borda-suave bg-superficie flex flex-col gap-4 rounded-xl border p-5">
      <div>
        <h2 className="text-texto font-semibold">Mover para</h2>
        <p className="text-texto-3 mt-1 text-sm">
          Hoje é{" "}
          <strong className="text-texto-2 font-medium">
            {ROTULO_TIPO[atual]}
          </strong>
          . Mover troca só o tipo — nada é apagado.
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        {destinos.map((destino) => (
          <button
            key={destino.valor}
            type="button"
            disabled={movendo}
            onClick={() => mover(destino.valor, destino.rota)}
            className="border-borda text-texto-2 hover:border-acento/60 hover:text-acento rounded-lg border px-3 py-2 text-sm font-medium transition-colors disabled:opacity-50"
          >
            {destino.rotulo}
          </button>
        ))}
      </div>

      {erro && (
        <p
          role="alert"
          className="border-alerta/40 bg-alerta/10 text-alerta rounded-lg border px-4 py-3 text-sm"
        >
          {erro}
        </p>
      )}
    </section>
  );
}
