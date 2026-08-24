"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { CONTROLE } from "@/components/campos-formulario";

/**
 * Busca das bibliotecas de mídia.
 *
 * Escreve na URL em vez de filtrar no cliente: com a listagem paginada, um
 * filtro local só varreria a página atual — o item da 25ª posição em diante
 * ficaria inalcançável. Assim a busca é do servidor, e o recorte fica
 * compartilhável.
 */
export function BuscaMidia({
  base,
  placeholder,
}: {
  base: string;
  placeholder: string;
}) {
  const router = useRouter();
  const parametros = useSearchParams();

  const [texto, setTexto] = useState(parametros.get("q") ?? "");
  const primeira = useRef(true);

  useEffect(() => {
    if (primeira.current) {
      primeira.current = false;
      return;
    }

    const relogio = setTimeout(() => {
      const novos = new URLSearchParams(parametros.toString());
      if (texto.trim()) novos.set("q", texto.trim());
      else novos.delete("q");
      /* Busca nova recomeça na primeira página. */
      novos.delete("page");
      router.replace(novos.toString() ? `${base}?${novos}` : base);
    }, 400);

    return () => clearTimeout(relogio);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [texto]);

  return (
    <input
      type="search"
      value={texto}
      onChange={(evento) => setTexto(evento.target.value)}
      placeholder={placeholder}
      className={`${CONTROLE} max-w-md`}
    />
  );
}
