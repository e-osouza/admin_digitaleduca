import Image from "next/image";
import Link from "next/link";
import type { UsuarioAdmin } from "@/types/api";

const data = new Intl.DateTimeFormat("pt-BR", { dateStyle: "short" });

const ROTULO_PAPEL: Record<string, string> = {
  USER: "Usuário",
  SUPERADMIN: "Admin",
  CORTESIA: "Cortesia",
};

/** Assinatura ativa e dentro do período — mesma regra do `AcessoService`. */
function assinaturaAtiva(usuario: UsuarioAdmin) {
  const agora = Date.now();
  return usuario.assinaturas.find(
    (a) =>
      a.status === "ATIVA" &&
      new Date(a.dataInicio).getTime() <= agora &&
      (!a.dataFim || new Date(a.dataFim).getTime() >= agora),
  );
}

/**
 * Linha da listagem — só leitura.
 *
 * Editar e excluir vivem em `/usuarios/[id]/editar`, junto com o resto do que
 * o banco guarda: negócio, interesses, histórico de assinaturas e atividade.
 * Em linha não caberia, e a listagem não carrega esses dados.
 *
 * Não é client component: nada aqui tem estado.
 */
export function LinhaUsuario({ usuario }: { usuario: UsuarioAdmin }) {
  const ativa = assinaturaAtiva(usuario);

  return (
    <li>
      <Link
        href={`/usuarios/${usuario.id}/editar`}
        className="hover:bg-superficie-2 group flex items-center gap-3 px-4 py-3 transition-colors"
      >
        <span className="bg-superficie-2 relative h-10 w-10 shrink-0 overflow-hidden rounded-full">
          {usuario.avatar ? (
            <Image
              src={usuario.avatar}
              alt=""
              fill
              sizes="40px"
              className="object-cover"
            />
          ) : (
            <span className="text-acento bg-acento/15 absolute inset-0 flex items-center justify-center text-sm font-semibold">
              {usuario.nome.charAt(0).toUpperCase()}
            </span>
          )}
        </span>

        <span className="flex min-w-0 flex-1 flex-col">
          <span className="text-texto truncate text-sm font-medium">
            {usuario.nome}
            {!usuario.emailVerified && (
              <span className="text-aviso ml-2 text-xs font-normal">
                e-mail não verificado
              </span>
            )}
          </span>
          <span className="text-texto-3 truncate text-xs">{usuario.email}</span>
        </span>

        <span className="text-texto-3 hidden shrink-0 text-xs sm:block">
          {ativa
            ? `${ativa.plano?.nome ?? "assinante"}${
                ativa.metodoPagamento === "CORTESIA" ? " (cortesia)" : ""
              }`
            : "sem assinatura"}
        </span>

        <span
          className={
            usuario.role === "SUPERADMIN"
              ? "text-acento shrink-0 text-xs font-semibold"
              : "text-texto-3 shrink-0 text-xs"
          }
        >
          {ROTULO_PAPEL[usuario.role] ?? usuario.role}
        </span>

        <span className="text-texto-3 hidden shrink-0 text-xs md:block">
          {data.format(new Date(usuario.createdAt))}
        </span>

        {/*
          Botão de editar em vez de uma seta.

          A linha inteira já é o link — o rótulo não acrescenta destino, mas
          diz o que acontece ao clicar. A seta sozinha obrigava a deduzir, e a
          ação aqui abre uma tela com senha, papel e período de acesso.

          `aria-hidden` porque a linha já anuncia o destino ao leitor de tela:
          sem isso, cada usuário seria lido duas vezes.
        */}
        <span
          aria-hidden="true"
          className="border-borda text-texto-2 group-hover:border-acento/60 group-hover:text-acento shrink-0 rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors"
        >
          Editar
        </span>
      </Link>
    </li>
  );
}
