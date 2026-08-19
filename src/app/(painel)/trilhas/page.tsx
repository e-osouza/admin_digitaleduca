import Image from "next/image";
import Link from "next/link";
import { listarTrilhas } from "@/lib/queries";

export const metadata = { title: "Trilhas · Painel DigitalEduca" };

const data = new Intl.DateTimeFormat("pt-BR", { dateStyle: "short" });

export default async function PaginaTrilhas() {
  const trilhas = await listarTrilhas();
  const publicadas = trilhas.filter((t) => t.publicada).length;

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-texto text-2xl font-semibold">Trilhas</h1>
          <p className="text-texto-3 mt-0.5 text-sm">
            {trilhas.length}{" "}
            {trilhas.length === 1 ? "formação" : "formações"} ·{" "}
            {publicadas} publicada{publicadas === 1 ? "" : "s"}
          </p>
        </div>

        <Link
          href="/trilhas/nova"
          className="bg-acento hover:bg-acento-hover rounded-lg px-4 py-2.5 text-sm font-semibold text-white transition-colors"
        >
          Nova trilha
        </Link>
      </div>

      {trilhas.length === 0 ? (
        <p className="border-borda-suave bg-superficie text-texto-2 rounded-xl border p-8 text-center text-sm">
          Nenhuma trilha cadastrada ainda.
        </p>
      ) : (
        <ul className="flex flex-col gap-3">
          {trilhas.map((trilha) => (
            <li
              key={trilha.id}
              className="border-borda-suave bg-superficie flex items-center gap-4 rounded-xl border p-4"
            >
              <span className="bg-superficie-2 relative h-14 w-24 shrink-0 overflow-hidden rounded-md">
                {trilha.thumbnailDesktop && (
                  <Image
                    src={trilha.thumbnailDesktop}
                    alt=""
                    fill
                    sizes="96px"
                    className="object-cover"
                  />
                )}
              </span>

              <div className="flex min-w-0 flex-1 flex-col">
                <span className="text-texto truncate font-medium">
                  {trilha.titulo}
                </span>
                <span className="text-texto-3 text-sm">
                  {trilha.totalConteudos}{" "}
                  {trilha.totalConteudos === 1 ? "conteúdo" : "conteúdos"}
                  {trilha.nivel && ` · ${trilha.nivel}`}
                  {` · ${data.format(new Date(trilha.updatedAt))}`}
                </span>
              </div>

              <div className="flex shrink-0 items-center gap-2">
                {trilha.destaque && (
                  <span className="text-acento-claro text-xs font-medium">
                    destaque
                  </span>
                )}
                <span
                  className={
                    trilha.publicada
                      ? "text-sucesso text-xs font-medium"
                      : "text-texto-3 text-xs font-medium"
                  }
                >
                  {trilha.publicada ? "publicada" : "rascunho"}
                </span>
              </div>

              <Link
                href={`/trilhas/${trilha.id}/editar`}
                className="border-borda text-texto-2 hover:bg-superficie-2 hover:text-texto shrink-0 rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors"
              >
                Editar
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
