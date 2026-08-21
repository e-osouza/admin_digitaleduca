import Link from "next/link";
import { FormularioCupom } from "@/components/cupons/formulario-cupom";
import { listarPlanos } from "@/lib/queries";

export const metadata = { title: "Novo cupom · Painel DigitalEduca" };

export default async function PaginaNovoCupom() {
  const planos = await listarPlanos().catch(() => []);

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-5">
      <div>
        <Link
          href="/cupons"
          className="text-texto-3 hover:text-texto text-sm transition-colors"
        >
          ← Cupons
        </Link>
        <h1 className="text-texto mt-1 text-2xl font-semibold">Novo cupom</h1>
      </div>

      <FormularioCupom planos={planos} />
    </div>
  );
}
