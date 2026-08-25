"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { atualizarUsuario } from "@/app/(painel)/usuarios/acoes";
import { Secao } from "@/components/campos-formulario";
import type { UsuarioDetalhe } from "@/types/api";

/**
 * Mostrado em quem é MEMBRO do time de alguém.
 *
 * O acesso desta pessoa não está no papel dela nem em nenhuma data aqui: vem
 * do Club do dono, resolvido a cada requisição. Por isso a tela manda olhar
 * lá — mexer no papel deste usuário não explica nem resolve o acesso dele.
 */
export function VinculoDeTime({ usuario }: { usuario: UsuarioDetalhe }) {
  const router = useRouter();
  const [saindo, setSaindo] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  const dono = usuario.clubDono;
  if (!dono) return null;

  const donoAtivo = dono.role === "CLUB";

  async function sair() {
    if (
      !confirm(
        `Tirar ${usuario.nome} do time de ${dono!.nome}?\n\nA conta continua existindo — só o acesso que vinha do Club acaba, na hora.`,
      )
    ) {
      return;
    }

    setErro(null);
    setSaindo(true);

    const resultado = await atualizarUsuario(usuario.id, { clubDonoId: null });

    setSaindo(false);

    if (!resultado.ok) {
      setErro(resultado.erro);
      return;
    }

    router.refresh();
  }

  return (
    <Secao
      titulo="Time do Club"
      ajuda="O acesso desta pessoa vem do Club de quem a convidou — não do papel dela nem de uma cortesia própria."
    >
      <div className="border-borda-suave bg-fundo-2 flex flex-wrap items-center gap-x-4 gap-y-2 rounded-lg border border-dashed p-4">
        <p className="text-texto-2 min-w-0 flex-1 text-sm">
          Faz parte do time de{" "}
          <Link
            href={`/usuarios/${dono.id}/editar`}
            className="text-texto hover:text-acento-claro font-semibold transition-colors"
          >
            {dono.nome}
          </Link>
          .{" "}
          {donoAtivo ? (
            "Enquanto o Club de lá estiver válido, esta pessoa vê todo o conteúdo."
          ) : (
            <span className="text-aviso font-medium">
              Quem convidou não tem mais o papel Club, então este vínculo não
              libera mais nada.
            </span>
          )}
        </p>

        <button
          type="button"
          onClick={sair}
          disabled={saindo}
          className="text-texto-2 hover:text-alerta shrink-0 text-sm font-medium transition-colors disabled:opacity-50"
        >
          {saindo ? "Tirando…" : "Tirar do time"}
        </button>
      </div>

      {erro && (
        <p
          role="alert"
          className="border-alerta/40 bg-alerta/10 text-alerta rounded-lg border px-4 py-3 text-sm"
        >
          {erro}
        </p>
      )}
    </Secao>
  );
}
