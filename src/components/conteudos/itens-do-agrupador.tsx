"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { salvarItensDoConteudo } from "@/app/(painel)/conteudos/acoes";
import { BOTAO_PRIMARIO } from "@/components/campos-formulario";
import { SeletorConteudos } from "@/components/seletor-conteudos";
import { plural } from "@/lib/formato";
import { ROTULO_TIPO } from "@/lib/tipos";
import type { ConteudoBusca, TipoConteudo } from "@/types/api";

/**
 * Escolhe quais conteúdos entram num curso ou numa trilha.
 *
 * Fica FORA do formulário principal: tem ação e botão próprios, e formulário
 * aninhado é HTML inválido — o navegador fecharia o de fora e quebraria o
 * salvamento do resto da página.
 *
 * A ordem da lista é a ordem em que o aluno percorre. Ela vem do próprio
 * array, então mover um item é mover a posição no array — nada de campo
 * "ordem" para o admin digitar e errar.
 */
export function ItensDoAgrupador({
  id,
  tipo,
  disponiveis,
  iniciais,
}: {
  id: number;
  tipo: TipoConteudo;
  /** Catálogo inteiro, para buscar e escolher. */
  disponiveis: ConteudoBusca[];
  /** IDs já dentro deste agrupador, na ordem gravada. */
  iniciais: number[];
}) {
  const router = useRouter();
  const [salvando, comecarTransicao] = useTransition();

  const [ids, setIds] = useState<number[]>(iniciais);
  const [erro, setErro] = useState<string | null>(null);
  const [salvo, setSalvo] = useState(false);

  const mudou =
    ids.length !== iniciais.length || ids.some((v, i) => v !== iniciais[i]);

  /*
    O próprio curso não pode entrar na lista — um conteúdo dentro de si mesmo
    é um laço. O backend também barra, mas deixar aparecer na escolha seria
    oferecer algo que vai falhar.
  */
  const indisponiveis = new Set<number>([id]);

  function salvar() {
    setErro(null);
    setSalvo(false);

    comecarTransicao(async () => {
      const resultado = await salvarItensDoConteudo(id, ids);
      if (!resultado.ok) {
        setErro(resultado.erro);
        return;
      }
      setSalvo(true);
      router.refresh();
    });
  }

  return (
    <section className="border-borda-suave bg-superficie flex flex-col gap-4 rounded-xl border p-5">
      <div>
        <h2 className="text-texto font-semibold">
          Conteúdos dentro {tipo === "CURSO" ? "do curso" : "da trilha"}
        </h2>
        <p className="text-texto-3 mt-1 text-sm">
          A ordem da lista é a ordem em que o aluno percorre. O mesmo conteúdo
          pode estar em vários cursos — ele continua existindo por conta
          própria em {ROTULO_TIPO.AULA}.
        </p>
      </div>

      <SeletorConteudos
        disponiveis={disponiveis}
        selecionados={ids}
        indisponiveis={indisponiveis}
        aoMudar={setIds}
      />

      {erro && (
        <p
          role="alert"
          className="border-alerta/40 bg-alerta/10 text-alerta rounded-lg border px-4 py-3 text-sm"
        >
          {erro}
        </p>
      )}

      <div className="flex flex-wrap items-center justify-end gap-3">
        <span className="text-texto-3 mr-auto text-sm">
          {plural(ids.length, "conteúdo selecionado", "conteúdos selecionados")}
        </span>

        {salvo && !mudou && (
          <span role="status" className="text-sucesso text-sm font-medium">
            Salvo.
          </span>
        )}

        {/*
          Desabilitado enquanto nada mudou: um botão que salva o mesmo estado
          só produz uma requisição e a dúvida de se funcionou.
        */}
        <button
          type="button"
          onClick={salvar}
          disabled={salvando || !mudou}
          className={BOTAO_PRIMARIO}
        >
          {salvando ? "Salvando…" : "Salvar conteúdos"}
        </button>
      </div>
    </section>
  );
}
