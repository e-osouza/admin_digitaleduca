import Link from "next/link";
import { ListaPropagandas } from "@/components/propagandas/lista-propagandas";
import { listarPropagandas } from "@/lib/queries";

export const metadata = { title: "Propagandas · Painel DigitalEduca" };

export default async function PaginaPropagandas() {
  const propagandas = await listarPropagandas();
  const ativas = propagandas.filter((p) => p.ativo).length;

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-texto text-2xl font-semibold">Propagandas</h1>
          <p className="text-texto-3 mt-0.5 text-sm">
            {propagandas.length}{" "}
            {propagandas.length === 1 ? "banner" : "banners"} · {ativas}{" "}
            {ativas === 1 ? "ativo" : "ativos"} no app
          </p>
        </div>

        <Link
          href="/propagandas/nova"
          className="bg-acento hover:bg-acento-hover rounded-lg px-4 py-2.5 text-sm font-semibold text-white transition-colors"
        >
          Novo banner
        </Link>
      </div>

      <ListaPropagandas propagandas={propagandas} />
    </div>
  );
}
