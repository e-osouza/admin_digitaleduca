"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";

export function BotaoSair({ compacto = false }: { compacto?: boolean }) {
  const router = useRouter();
  const [saindo, iniciarSaida] = useTransition();

  function sair() {
    iniciarSaida(async () => {
      await fetch("/api/auth/logout", { method: "POST" });
      router.replace("/entrar");
      router.refresh();
    });
  }

  if (compacto) {
    return (
      <button
        type="button"
        onClick={sair}
        disabled={saindo}
        aria-label="Sair"
        title="Sair"
        className="text-texto-3 hover:text-texto hover:bg-superficie-2 mx-auto flex h-9 w-9 items-center justify-center rounded-lg transition-colors disabled:opacity-50"
      >
        <svg
          viewBox="0 0 20 20"
          aria-hidden="true"
          className="h-5 w-5"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M8 17H5a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1h3" />
          <path d="M13 13.5 16.5 10 13 6.5M16.5 10H8" />
        </svg>
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={sair}
      disabled={saindo}
      className="text-texto-2 hover:text-texto text-sm font-medium transition-colors disabled:opacity-50"
    >
      {saindo ? "Saindo…" : "Sair"}
    </button>
  );
}
