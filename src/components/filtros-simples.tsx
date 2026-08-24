"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";

const CONTROLE =
  "border-borda bg-superficie text-texto focus:border-acento-claro rounded-lg border px-3 py-2 text-sm outline-none transition-colors";

/**
 * Busca e ordenação para as listagens que não têm tipo nem categoria a
 * filtrar — trilhas, cursos, podcasts.
 *
 * Escreve na URL em vez de guardar estado: a página é Server Component, então
 * mudar a URL é o que dispara a nova consulta — e de quebra o recorte fica
 * compartilhável e o botão voltar funciona.
 */
export function FiltrosSimples({
  base,
  placeholder,
  ordenacoes,
}: {
  base: string;
  placeholder: string;
  /** Sobrescreve as opções de ordenação — pessoas ordenam por nome, não por título. */
  ordenacoes?: { valor: string; rotulo: string }[];
}) {
  const router = useRouter();
  const parametros = useSearchParams();

  const [texto, setTexto] = useState(parametros.get("q") ?? "");
  const primeiraRenderizacao = useRef(true);

  function aplicar(mudancas: Record<string, string | null>) {
    const novos = new URLSearchParams(parametros.toString());
    for (const [chave, valor] of Object.entries(mudancas)) {
      if (valor) novos.set(chave, valor);
      else novos.delete(chave);
    }
    // Filtro novo volta para a primeira página: manter a atual mostraria
    // "nada encontrado" num conjunto que tem resultados.
    novos.delete("page");
    router.replace(novos.toString() ? `${base}?${novos}` : base);
  }

  /* Busca com atraso: sem isso cada tecla dispararia uma requisição. */
  useEffect(() => {
    if (primeiraRenderizacao.current) {
      primeiraRenderizacao.current = false;
      return;
    }
    const relogio = setTimeout(() => aplicar({ q: texto.trim() || null }), 400);
    return () => clearTimeout(relogio);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [texto]);

  const ordenar = parametros.get("ordenar") ?? "";
  const temFiltro = Boolean(texto || ordenar || parametros.get("status"));

  return (
    <div className="flex flex-wrap items-center gap-3">
      <label className="min-w-0 flex-1 basis-64">
        <span className="sr-only">Buscar</span>
        <input
          type="search"
          value={texto}
          onChange={(evento) => setTexto(evento.target.value)}
          placeholder={placeholder}
          className={`${CONTROLE} w-full`}
        />
      </label>

      <label>
        <span className="sr-only">Ordenação</span>
        <select
          value={ordenar}
          onChange={(evento) =>
            aplicar({ ordenar: evento.target.value || null })
          }
          className={CONTROLE}
        >
          {(
            ordenacoes ?? [
              { valor: "", rotulo: "Atualizados recentemente" },
              { valor: "antigos", rotulo: "Mais antigos" },
              { valor: "titulo", rotulo: "Título (A–Z)" },
              { valor: "titulo_desc", rotulo: "Título (Z–A)" },
            ]
          ).map((opcao) => (
            <option key={opcao.valor} value={opcao.valor}>
              {opcao.rotulo}
            </option>
          ))}
        </select>
      </label>

      {temFiltro && (
        <button
          type="button"
          onClick={() => {
            setTexto("");
            router.replace(base);
          }}
          className="text-texto-2 hover:text-texto hover:bg-superficie-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors"
        >
          Limpar
        </button>
      )}
    </div>
  );
}
