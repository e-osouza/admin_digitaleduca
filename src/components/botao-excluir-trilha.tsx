"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { excluirTrilha } from "@/app/(painel)/trilhas/acoes";

export function BotaoExcluirTrilha({
  id,
  titulo,
  totalConteudos,
}: {
  id: number;
  titulo: string;
  totalConteudos: number;
}) {
  const router = useRouter();
  const [confirmando, setConfirmando] = useState(false);
  const [excluindo, setExcluindo] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  async function excluir() {
    setExcluindo(true);
    const resultado = await excluirTrilha(id);

    if (!resultado.ok) {
      setErro(resultado.erro);
      setExcluindo(false);
      setConfirmando(false);
      return;
    }

    router.push("/trilhas?feito=excluido");
    router.refresh();
  }

  if (!confirmando) {
    return (
      <div className="flex flex-col items-end gap-1">
        <button
          type="button"
          onClick={() => setConfirmando(true)}
          className="border-borda text-alerta hover:bg-alerta/10 hover:border-alerta/40 rounded-lg border px-3 py-2 text-sm font-medium transition-colors"
        >
          Excluir trilha
        </button>
        {erro && (
          <p role="alert" className="text-alerta text-xs">
            {erro}
          </p>
        )}
      </div>
    );
  }

  return (
    <div className="border-alerta/40 bg-alerta/5 flex flex-col gap-2 rounded-lg border p-3">
      <p className="text-texto text-sm">
        Excluir <strong>{titulo}</strong>? Os módulos da trilha somem junto.{" "}
        {totalConteudos > 0 && (
          <>
            Os {totalConteudos}{" "}
            {totalConteudos === 1 ? "conteúdo continua" : "conteúdos continuam"}{" "}
            no acervo — só o agrupamento é desfeito.
          </>
        )}
      </p>
      <div className="flex gap-2">
        <button
          type="button"
          onClick={excluir}
          disabled={excluindo}
          className="bg-alerta rounded-lg px-3 py-1.5 text-xs font-semibold text-white disabled:opacity-60"
        >
          {excluindo ? "Excluindo…" : "Confirmar"}
        </button>
        <button
          type="button"
          onClick={() => setConfirmando(false)}
          disabled={excluindo}
          className="text-texto-2 rounded-lg px-3 py-1.5 text-xs font-medium"
        >
          Cancelar
        </button>
      </div>
    </div>
  );
}
