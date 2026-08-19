import Link from "next/link";

/**
 * 404 dentro do painel. Sem este arquivo o Next cai no 404 global e a pessoa
 * perde o menu — fica presa numa página sem saída.
 */
export default function NaoEncontrado() {
  return (
    <div className="border-borda-suave bg-superficie mx-auto mt-10 max-w-md rounded-xl border p-8 text-center">
      <h1 className="text-texto text-lg font-semibold">Não encontrado</h1>
      <p className="text-texto-2 mt-2 text-sm">
        O registro que você tentou abrir não existe ou foi removido.
      </p>
      <Link
        href="/"
        className="bg-acento hover:bg-acento-hover mt-6 inline-block rounded-lg px-4 py-2 text-sm font-semibold text-white transition-colors"
      >
        Voltar ao dashboard
      </Link>
    </div>
  );
}
