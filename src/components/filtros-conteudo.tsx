"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { TIPOS_EDITAVEIS } from "@/lib/tipos";
import type { Categoria } from "@/types/api";

/**
 * Podcast tem tela própria em `/podcasts`, então não é oferecido aqui.
 *
 * Sem filtro de tipo a listagem ainda traz episódios: o `/conteudos/search`
 * só aceita UM tipo por vez, e não há como pedir "tudo menos podcast".
 */
const TIPOS = TIPOS_EDITAVEIS;

const CONTROLE =
  "border-borda bg-superficie text-texto focus:border-acento-claro rounded-lg border px-3 py-2 text-sm outline-none transition-colors";

export function FiltrosConteudo({
  categorias,
  semTipo,
}: {
  categorias: Categoria[];
  /** Telas de um tipo só (MasterClass, Podcasts) não têm o que escolher aqui. */
  semTipo?: boolean;
}) {
  const router = useRouter();
  const parametros = useSearchParams();

  const [texto, setTexto] = useState(parametros.get("q") ?? "");
  const primeiraRenderizacao = useRef(true);

  /**
   * Escreve os filtros na URL. A página é Server Component, então mudar a URL
   * é o que dispara a nova busca — e de quebra o estado fica compartilhável e
   * o botão voltar funciona.
   */
  function aplicar(mudancas: Record<string, string | null>) {
    const novos = new URLSearchParams(parametros.toString());

    for (const [chave, valor] of Object.entries(mudancas)) {
      if (valor) novos.set(chave, valor);
      else novos.delete(chave);
    }

    // Qualquer mudança de filtro volta para a primeira página: manter a página
    // atual mostraria "nenhum resultado" num conjunto que tem resultados.
    novos.delete("page");

    router.replace(novos.toString() ? `/conteudos?${novos}` : "/conteudos");
  }

  /*
   * Busca textual com atraso: sem isso cada tecla dispararia uma requisição.
   * O `primeiraRenderizacao` evita reescrever a URL na montagem, o que
   * apagaria os filtros vindos de um link compartilhado.
   */
  useEffect(() => {
    if (primeiraRenderizacao.current) {
      primeiraRenderizacao.current = false;
      return;
    }

    const relogio = setTimeout(() => {
      aplicar({ q: texto.trim() || null });
    }, 400);

    return () => clearTimeout(relogio);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [texto]);

  const tipo = parametros.get("tipo") ?? "";
  const categoriaId = parametros.get("categoriaId") ?? "";
  const ordenar = parametros.get("ordenar") ?? "";
  const status = parametros.get("status") ?? "";
  const temFiltro = Boolean(texto || tipo || categoriaId || ordenar || status);

  return (
    <div className="flex flex-wrap items-center gap-3">
      <label className="min-w-0 flex-1 basis-64">
        <span className="sr-only">Buscar conteúdo</span>
        <input
          type="search"
          value={texto}
          onChange={(evento) => setTexto(evento.target.value)}
          placeholder="Buscar por título…"
          className={`${CONTROLE} w-full`}
        />
      </label>

      {!semTipo && (
      <label>
        <span className="sr-only">Tipo</span>
        <select
          value={tipo}
          onChange={(evento) => aplicar({ tipo: evento.target.value || null })}
          className={CONTROLE}
        >
          <option value="">Todos os tipos</option>
          {TIPOS.map((item) => (
            <option key={item.valor} value={item.valor}>
              {item.rotulo}
            </option>
          ))}
        </select>
      </label>
      )}

      <label>
        <span className="sr-only">Categoria</span>
        <select
          value={categoriaId}
          onChange={(evento) =>
            aplicar({ categoriaId: evento.target.value || null })
          }
          className={CONTROLE}
        >
          <option value="">Todas as categorias</option>
          {categorias.map((categoria) => (
            <option key={categoria.id} value={categoria.id}>
              {categoria.nome}
            </option>
          ))}
        </select>
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
          <option value="">Mais recentes</option>
          <option value="antigos">Mais antigos</option>
          <option value="titulo">Título (A–Z)</option>
          <option value="titulo_desc">Título (Z–A)</option>
        </select>
      </label>

      {temFiltro && (
        <button
          type="button"
          onClick={() => {
            setTexto("");
            router.replace("/conteudos");
          }}
          className="text-texto-2 hover:text-texto hover:bg-superficie-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors"
        >
          Limpar
        </button>
      )}
    </div>
  );
}
