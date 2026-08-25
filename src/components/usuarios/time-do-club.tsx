"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { atualizarUsuario } from "@/app/(painel)/usuarios/acoes";
import { Campo, CONTROLE, Secao } from "@/components/campos-formulario";
import type { UsuarioDetalhe } from "@/types/api";

const data = new Intl.DateTimeFormat("pt-BR", { dateStyle: "short" });

/** Teto quando o dono não tem um próprio — igual ao LIMITE_PADRAO_MEMBROS da API. */
const LIMITE_PADRAO = 10;

/**
 * O time de um dono do Club.
 *
 * O acesso dos membros NÃO é copiado: é derivado do dono a cada requisição.
 * Por isso não há datas aqui — quem manda no acesso do time é o período do
 * Club do próprio dono, logo acima nesta mesma tela.
 */
export function TimeDoClub({ usuario }: { usuario: UsuarioDetalhe }) {
  const router = useRouter();
  const [removendo, setRemovendo] = useState<number | null>(null);
  const [erro, setErro] = useState<string | null>(null);

  const limite = usuario.clubLimiteMembros ?? LIMITE_PADRAO;
  const usadas = usuario.clubMembros.length + usuario.clubConvites.length;

  async function remover(membroId: number, nome: string) {
    if (
      !confirm(
        `Tirar ${nome} do time?\n\nA conta continua existindo — a pessoa só perde o acesso que vinha deste Club, na hora.`,
      )
    ) {
      return;
    }

    setErro(null);
    setRemovendo(membroId);

    /* Desvincular é editar o MEMBRO, não o dono: o vínculo mora na linha dele. */
    const resultado = await atualizarUsuario(membroId, { clubDonoId: null });

    setRemovendo(null);

    if (!resultado.ok) {
      setErro(resultado.erro);
      return;
    }

    router.refresh();
  }

  return (
    <Secao
      titulo="Time do Club"
      ajuda="Quem está no time vê todo o conteúdo enquanto o Club acima estiver válido. Nada é copiado: se o período vencer ou o papel mudar, o time inteiro perde o acesso no mesmo instante."
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <Campo
          rotulo="Limite de membros"
          ajuda={`Em branco usa o padrão (${LIMITE_PADRAO}). Reduzir não tira ninguém do time — só impede novos convites até caber.`}
        >
          <input
            name="clubLimiteMembros"
            type="number"
            min={0}
            max={500}
            defaultValue={usuario.clubLimiteMembros ?? ""}
            placeholder={String(LIMITE_PADRAO)}
            className={CONTROLE}
          />
        </Campo>

        <Campo rotulo="Vagas">
          <p className="text-texto-2 py-2 text-sm tabular-nums">
            {usadas} de {limite} em uso
            {usuario.clubConvites.length > 0 && (
              <span className="text-texto-3">
                {" "}
                ({usuario.clubConvites.length} aguardando aceite)
              </span>
            )}
          </p>
        </Campo>
      </div>

      {erro && (
        <p
          role="alert"
          className="border-alerta/40 bg-alerta/10 text-alerta rounded-lg border px-4 py-3 text-sm"
        >
          {erro}
        </p>
      )}

      {usuario.clubMembros.length === 0 ? (
        <p className="border-borda-suave bg-fundo-2 text-texto-2 rounded-lg border border-dashed p-4 text-sm">
          Ninguém no time ainda. Quem convida é o próprio dono do Club, pela
          plataforma.
        </p>
      ) : (
        <ul className="border-borda-suave divide-borda-suave divide-y overflow-hidden rounded-lg border">
          {usuario.clubMembros.map((membro) => (
            <li
              key={membro.id}
              className="flex items-center gap-3 px-4 py-2.5 text-sm"
            >
              {membro.avatar ? (
                <Image
                  src={membro.avatar}
                  alt=""
                  width={32}
                  height={32}
                  className="h-8 w-8 shrink-0 rounded-full object-cover"
                  unoptimized
                />
              ) : (
                <span className="bg-superficie-2 text-texto-3 flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-semibold">
                  {membro.nome.slice(0, 1).toUpperCase()}
                </span>
              )}

              <span className="flex min-w-0 flex-1 flex-col">
                <Link
                  href={`/usuarios/${membro.id}/editar`}
                  className="text-texto hover:text-acento-claro truncate font-medium transition-colors"
                >
                  {membro.nome}
                </Link>
                <span className="text-texto-3 truncate text-xs">
                  {membro.email}
                </span>
              </span>

              <button
                type="button"
                onClick={() => remover(membro.id, membro.nome)}
                disabled={removendo === membro.id}
                className="text-texto-2 hover:text-alerta shrink-0 text-xs font-medium transition-colors disabled:opacity-50"
              >
                {removendo === membro.id ? "Tirando…" : "Tirar do time"}
              </button>
            </li>
          ))}
        </ul>
      )}

      {usuario.clubConvites.length > 0 && (
        <div className="flex flex-col gap-2">
          <p className="text-texto-3 text-xs font-semibold uppercase">
            Convites em aberto
          </p>
          <ul className="border-borda-suave divide-borda-suave divide-y overflow-hidden rounded-lg border border-dashed">
            {usuario.clubConvites.map((convite) => (
              <li
                key={convite.id}
                className="flex flex-wrap items-center gap-x-3 gap-y-1 px-4 py-2.5 text-sm"
              >
                <span className="text-texto min-w-0 flex-1 truncate">
                  {convite.nome}{" "}
                  <span className="text-texto-3">· {convite.email}</span>
                </span>
                {!convite.emailEnviado && (
                  <span className="bg-aviso/12 text-aviso rounded px-1.5 py-0.5 text-xs">
                    e-mail não enviado
                  </span>
                )}
                <span className="text-texto-3 text-xs">
                  expira em {data.format(new Date(convite.expiraEm))}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </Secao>
  );
}
