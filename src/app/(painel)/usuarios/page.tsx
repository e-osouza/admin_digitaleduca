import Link from "next/link";
import { AvisoAcao } from "@/components/aviso-acao";
import { AbasStatus } from "@/components/conteudos/abas-status";
import { FiltrosSimples } from "@/components/filtros-simples";
import { Paginacao } from "@/components/paginacao";
import { LinhaUsuario } from "@/components/usuarios/linha-usuario";
import { plural } from "@/lib/formato";
import { listarUsuarios } from "@/lib/queries";

export const metadata = { title: "Usuários · Painel DigitalEduca" };

/**
 * As abas são por PAPEL — é o recorte que a equipe realmente usa aqui, do
 * mesmo jeito que em conteúdos o recorte é publicado/rascunho.
 *
 * `AbasStatus` já sabe montar isso; só os rótulos mudam, e o parâmetro na URL
 * continua sendo `status` para não haver dois vocabulários de navegação.
 */
const PAPEL: Record<string, string> = {
  publicados: "USER",
  rascunhos: "CORTESIA",
  destaques: "SUPERADMIN",
};

export default async function PaginaUsuarios({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const brutos = await searchParams;
  const texto = (chave: string) => {
    const valor = brutos[chave];
    return typeof valor === "string" && valor ? valor : undefined;
  };
  const numero = (chave: string) => {
    const valor = Number(texto(chave));
    return Number.isFinite(valor) && valor > 0 ? valor : undefined;
  };

  const status = texto("status") ?? "";

  const resultado = await listarUsuarios({
    q: texto("q"),
    role: PAPEL[status],
    ordenar: texto("ordenar"),
    page: numero("page") ?? 1,
  });

  const parametros = new URLSearchParams();
  if (texto("q")) parametros.set("q", texto("q")!);
  if (texto("ordenar")) parametros.set("ordenar", texto("ordenar")!);

  const comStatus = new URLSearchParams(parametros);
  if (status) comStatus.set("status", status);

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-texto text-2xl font-semibold">Usuários</h1>
          <p className="text-texto-3 mt-0.5 text-sm">
            {plural(
              resultado.pagination.total,
              "usuário nesta seleção",
              "usuários nesta seleção",
            )}
          </p>
        </div>

        <Link
          href="/usuarios/novo"
          className="bg-acento hover:bg-acento-hover rounded-lg px-4 py-2.5 text-sm font-semibold text-white transition-colors"
        >
          Novo usuário
        </Link>
      </div>

      <AvisoAcao />

      <AbasStatus
        contadores={{
          todos: resultado.contadores.todos,
          publicados: resultado.contadores.USER,
          rascunhos: resultado.contadores.CORTESIA,
          destaques: resultado.contadores.SUPERADMIN,
        }}
        statusAtual={status}
        parametros={parametros}
        base="/usuarios"
        rotulos={{
          publicados: "Usuários",
          rascunhos: "Cortesia",
          destaques: "Administradores",
        }}
      />

      <FiltrosSimples
        base="/usuarios"
        placeholder="Buscar por nome ou e-mail…"
        ordenacoes={[
          { valor: "", rotulo: "Cadastro mais recente" },
          { valor: "antigos", rotulo: "Cadastro mais antigo" },
          { valor: "nome", rotulo: "Nome (A–Z)" },
          { valor: "nome_desc", rotulo: "Nome (Z–A)" },
        ]}
      />

      {resultado.data.length === 0 ? (
        <p className="border-borda-suave bg-superficie text-texto-2 rounded-xl border p-8 text-center text-sm">
          Nenhum usuário encontrado com esses filtros.
        </p>
      ) : (
        <ul className="border-borda-suave divide-borda-suave bg-superficie divide-y overflow-hidden rounded-xl border">
          {resultado.data.map((usuario) => (
            <LinhaUsuario key={usuario.id} usuario={usuario} />
          ))}
        </ul>
      )}

      <Paginacao
        dados={resultado.pagination}
        base="/usuarios"
        parametros={comStatus}
      />
    </div>
  );
}
