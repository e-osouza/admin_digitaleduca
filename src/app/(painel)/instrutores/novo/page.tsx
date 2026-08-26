import Link from "next/link";
import { FormularioInstrutor } from "@/components/formulario-instrutor";

export const metadata = { title: "Novo instrutor · Painel DigitalEduca" };

export default function PaginaNovoInstrutor() {
  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-5">
      <div>
        <Link
          href="/instrutores"
          className="text-texto-3 hover:text-texto text-sm transition-colors"
        >
          ← Instrutores
        </Link>
        <h1 className="text-texto mt-1 text-2xl font-semibold">
          Novo instrutor
        </h1>
      </div>

      <FormularioInstrutor />
    </div>
  );
}
