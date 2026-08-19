"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { excluirConteudo } from "@/app/(painel)/conteudos/acoes";

export function BotaoExcluirConteudo({
  id,
  titulo,
  destino = "/conteudos",
}: {
  id: number;
  titulo: string;
  /** Para onde voltar depois de excluir — podcasts têm listagem própria. */
  destino?: string;
}) {
  const router = useRouter();
  const [confirmando, setConfirmando] = useState(false);
  const [excluindo, setExcluindo] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  async function excluir() {
    setExcluindo(true);
    setErro(null);

    const resultado = await excluirConteudo(id);
    if (!resultado.ok) {
      setErro(resultado.erro);
      setExcluindo(false);
      setConfirmando(false);
      return;
    }

    router.push(`${destino}?feito=excluido`);
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
          Excluir
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
        Excluir <strong>{titulo}</strong>? A pasta inteira no Vimeo — com todos
        os vídeos dos módulos — e as imagens do servidor também são apagadas.
        Não dá para desfazer.
      </p>
      <div className="flex gap-2">
        <button
          type="button"
          onClick={excluir}
          disabled={excluindo}
          className="bg-alerta rounded-lg px-3 py-1.5 text-sm font-semibold text-white disabled:opacity-60"
        >
          {excluindo ? "Excluindo…" : "Sim, excluir"}
        </button>
        <button
          type="button"
          onClick={() => setConfirmando(false)}
          disabled={excluindo}
          className="text-texto-2 hover:bg-superficie-2 rounded-lg px-3 py-1.5 text-sm font-medium"
        >
          Cancelar
        </button>
      </div>
    </div>
  );
}
