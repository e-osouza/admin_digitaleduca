import Link from "next/link";
import { FormularioPropaganda } from "@/components/propagandas/cartao-propaganda";

export const metadata = { title: "Novo banner · Painel DigitalEduca" };

export default function PaginaNovaPropaganda() {
  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-5">
      <div>
        <Link
          href="/propagandas"
          className="text-texto-3 hover:text-texto text-sm transition-colors"
        >
          ← Propagandas
        </Link>
        <h1 className="text-texto mt-1 text-2xl font-semibold">Novo banner</h1>
      </div>

      <FormularioPropaganda />
    </div>
  );
}
