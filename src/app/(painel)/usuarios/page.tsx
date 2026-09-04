import Link from "next/link";
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
 * A chave da aba é o próprio papel, e o parâmetro na URL é `papel`. Antes as
 * abas reaproveitavam as chaves de conteúdo (`destaques` querendo dizer
 * "administradores"), o que só se sustentava enquanto os papéis coubessem nas
 * quatro abas fixas — com CLUB deixaram de caber.
 */
const ABAS = [
  { chave: "USER", rotulo: "Usuários" },
  { chave: "CORTESIA", rotulo: "Cortesia" },
  { chave: "CLUB", rotulo: "Club" },
  { chave: "SUPERADMIN", rotulo: "Administradores" },
] as const;

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

  /* Só um papel conhecido vira filtro: `?papel=qualquercoisa` na URL
     devolveria 400 do backend em vez de simplesmente não filtrar. */
  const papelBruto = texto("papel") ?? "";
  const papel = ABAS.some((a) => a.chave === papelBruto) ? papelBruto : "";

  const resultado = await listarUsuarios({
    q: texto("q"),
    role: papel || undefined,
    ordenar: texto("ordenar"),
    page: numero("page") ?? 1,
  });

  const parametros = new URLSearchParams();
  if (texto("q")) parametros.set("q", texto("q")!);
  if (texto("ordenar")) parametros.set("ordenar", texto("ordenar")!);

  const comPapel = new URLSearchParams(parametros);
  if (papel) comPapel.set("papel", papel);

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


      <AbasStatus
        abas={[
          { chave: "", rotulo: "Todos", total: resultado.contadores.todos },
          ...ABAS.map((aba) => ({
            chave: aba.chave,
            rotulo: aba.rotulo,
            total: resultado.contadores[aba.chave] ?? 0,
          })),
        ]}
        statusAtual={papel}
        parametros={parametros}
        base="/usuarios"
        parametro="papel"
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
        parametros={comPapel}
      />
    </div>
  );
}
