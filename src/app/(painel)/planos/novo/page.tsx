import Link from "next/link";
import { FormularioPlano } from "@/components/planos/formulario-plano";

export const metadata = { title: "Novo plano · Painel DigitalEduca" };

export default function PaginaNovoPlano() {
  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-5">
      <div>
        <Link
          href="/planos"
          className="text-texto-3 hover:text-texto text-sm transition-colors"
        >
          ← Planos
        </Link>
        <h1 className="text-texto mt-1 text-2xl font-semibold">Novo plano</h1>
      </div>

      <FormularioPlano />
    </div>
  );
}
