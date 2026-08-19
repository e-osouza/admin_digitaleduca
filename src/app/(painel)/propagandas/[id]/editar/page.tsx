import Link from "next/link";
import { notFound } from "next/navigation";
import { FormularioPropaganda } from "@/components/propagandas/cartao-propaganda";
import { obterPropaganda } from "@/lib/queries";

export const metadata = { title: "Editar banner · Painel DigitalEduca" };

export default async function PaginaEditarPropaganda({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const numero = Number(id);
  if (!Number.isInteger(numero) || numero <= 0) notFound();

  const propaganda = await obterPropaganda(numero);
  if (!propaganda) notFound();

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-5">
      <div className="min-w-0">
        <Link
          href="/propagandas"
          className="text-texto-3 hover:text-texto text-sm transition-colors"
        >
          ← Propagandas
        </Link>
        <h1 className="text-texto mt-1 truncate text-2xl font-semibold">
          {propaganda.titulo || "Banner sem título"}
        </h1>
        <p className="text-texto-3 mt-0.5 text-sm">
          {propaganda.ativo ? "Ativo no app" : "Inativo"} · ordem{" "}
          {propaganda.ordem ?? 0}
        </p>
      </div>

      <FormularioPropaganda propaganda={propaganda} />
    </div>
  );
}
