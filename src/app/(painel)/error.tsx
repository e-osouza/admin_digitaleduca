"use client";

import Link from "next/link";
import { useEffect } from "react";

/**
 * Rede de segurança das telas do painel.
 *
 * O caso que mais importa: o layout valida o token localmente (assinatura não,
 * só os claims e a expiração), então um token que a API recusa — segredo
 * rotacionado, conta revogada — passa por ele e só falha aqui, na primeira
 * chamada. Sem este limite, isso viraria uma tela de erro crua.
 */
export default function ErroPainel({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[painel]", error);
  }, [error]);

  // `ApiError` não sobrevive à fronteira servidor→cliente com a classe
  // intacta, então reconhecemos a sessão inválida pela mensagem.
  const sessaoInvalida = /401|sess(ã|a)o|token|autoriza/i.test(error.message);

  return (
    <div className="border-borda-suave bg-superficie mx-auto mt-10 max-w-md rounded-xl border p-8 text-center">
      <h1 className="text-texto text-lg font-semibold">
        {sessaoInvalida ? "Sessão inválida" : "Algo deu errado"}
      </h1>

      <p className="text-texto-2 mt-2 text-sm">
        {sessaoInvalida
          ? "A API recusou suas credenciais. Entre novamente para continuar."
          : "Não foi possível carregar esta tela. Tente de novo em instantes."}
      </p>

      <div className="mt-6 flex justify-center gap-3">
        {sessaoInvalida ? (
          <Link
            href="/entrar"
            className="bg-acento hover:bg-acento-hover rounded-lg px-4 py-2 text-sm font-semibold text-white transition-colors"
          >
            Entrar novamente
          </Link>
        ) : (
          <button
            type="button"
            onClick={reset}
            className="bg-acento hover:bg-acento-hover rounded-lg px-4 py-2 text-sm font-semibold text-white transition-colors"
          >
            Tentar de novo
          </button>
        )}
      </div>
    </div>
  );
}
