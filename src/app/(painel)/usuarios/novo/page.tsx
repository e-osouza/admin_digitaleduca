import Link from "next/link";
import { FormularioNovoUsuario } from "@/components/usuarios/formulario-novo-usuario";

export const metadata = { title: "Novo usuário · Painel DigitalEduca" };

export default function PaginaNovoUsuario() {
  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-5">
      <div>
        <Link
          href="/usuarios"
          className="text-texto-3 hover:text-texto text-sm transition-colors"
        >
          ← Usuários
        </Link>
        <h1 className="text-texto mt-1 text-2xl font-semibold">Novo usuário</h1>
      </div>

      <FormularioNovoUsuario />
    </div>
  );
}
