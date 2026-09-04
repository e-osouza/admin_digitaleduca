"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect } from "react";

/**
 * Confirmação do que acabou de acontecer.
 *
 * As telas de criar e editar redirecionam para a listagem ao salvar, e isso
 * acontecia em silêncio — não dava para saber se gravou. O destino recebe
 * `?feito=` e mostra o aviso.
 *
 * A visibilidade vem do próprio parâmetro, sem estado local: passados alguns
 * segundos a URL é limpa e o aviso some por consequência. Assim recarregar ou
 * compartilhar o link não repete uma confirmação de algo que não aconteceu
 * ali — e não há `setState` dentro de efeito.
 */
const MENSAGENS: Record<string, string> = {
  criado: "Criado com sucesso.",
  salvo: "Alterações salvas.",
  excluido: "Movido para a lixeira.",
};

export function AvisoAcao() {
  const router = useRouter();
  const parametros = useSearchParams();

  const chave = parametros.get("feito");
  const mensagem = chave ? MENSAGENS[chave] : null;

  useEffect(() => {
    if (!mensagem) return;

    const relogio = setTimeout(() => {
      const limpos = new URLSearchParams(parametros.toString());
      limpos.delete("feito");
      // `replace` para não empilhar entrada no histórico.
      router.replace(limpos.toString() ? `?${limpos}` : "?", { scroll: false });
    }, 4000);

    return () => clearTimeout(relogio);
  }, [mensagem, parametros, router]);

  if (!mensagem) return null;

  return (
    <p
      role="status"
      className="border-sucesso/30 bg-sucesso/10 text-sucesso mb-4 flex items-center gap-2 rounded-lg border px-3 py-2.5 text-sm"
    >
      <svg
        viewBox="0 0 20 20"
        aria-hidden="true"
        className="h-4 w-4 shrink-0"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="m4 10.5 4 4 8-9" />
      </svg>
      {mensagem}
    </p>
  );
}
