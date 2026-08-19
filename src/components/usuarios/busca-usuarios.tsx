"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { CONTROLE } from "@/components/campos-formulario";

/**
 * Busca por nome ou e-mail, escrita na URL.
 *
 * A filtragem acontece no servidor — são 234 usuários e crescendo, então não
 * dá para trazer tudo e filtrar no cliente.
 */
export function BuscaUsuarios() {
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
      const novos = new URLSearchParams();
      if (texto.trim()) novos.set("q", texto.trim());
      // Buscar volta para a primeira página: manter a atual mostraria vazio.
      router.replace(novos.toString() ? `/usuarios?${novos}` : "/usuarios");
    }, 400);

    return () => clearTimeout(relogio);
  }, [texto, router]);

  return (
    <input
      type="search"
      value={texto}
      onChange={(evento) => setTexto(evento.target.value)}
      placeholder="Buscar por nome ou e-mail…"
      className={CONTROLE}
    />
  );
}
