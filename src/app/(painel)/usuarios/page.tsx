import { Paginacao } from "@/components/paginacao";
import { BuscaUsuarios } from "@/components/usuarios/busca-usuarios";
import { LinhaUsuario } from "@/components/usuarios/linha-usuario";
import { NovoUsuario } from "@/components/usuarios/novo-usuario";
import { listarUsuarios } from "@/lib/queries";

export const metadata = { title: "Usuários · Painel DigitalEduca" };

export default async function PaginaUsuarios({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; page?: string }>;
}) {
  const { q, page } = await searchParams;
  const pagina = Number(page);

  const resultado = await listarUsuarios({
    q: q?.trim() || undefined,
    page: Number.isFinite(pagina) && pagina > 0 ? pagina : 1,
  });

  const parametros = new URLSearchParams();
  if (q?.trim()) parametros.set("q", q.trim());

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-texto text-2xl font-semibold">Usuários</h1>
          <p className="text-texto-3 mt-0.5 text-sm">
            {resultado.pagination.total}{" "}
            {resultado.pagination.total === 1 ? "cadastrado" : "cadastrados"}
            {q?.trim() && " no filtro"}
          </p>
        </div>

        <NovoUsuario />
      </div>

      <BuscaUsuarios />

      {resultado.data.length === 0 ? (
        <p className="border-borda-suave bg-superficie text-texto-2 rounded-xl border p-8 text-center text-sm">
          Nenhum usuário encontrado.
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
        parametros={parametros}
      />
    </div>
  );
}
