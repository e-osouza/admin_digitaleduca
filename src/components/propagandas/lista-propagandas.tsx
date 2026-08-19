import Image from "next/image";
import Link from "next/link";
import type { Propaganda } from "@/types/api";

/**
 * Listagem de banners — só leitura.
 *
 * Criar e editar têm páginas próprias: o formulário tem imagem, link, título,
 * ordem e estado, e em linha isso empurrava os outros banners para longe da
 * vista. Não é client component, porque não há estado aqui.
 */
export function ListaPropagandas({
  propagandas,
}: {
  propagandas: Propaganda[];
}) {
  if (propagandas.length === 0) {
    return (
      <p className="border-borda-suave bg-superficie text-texto-2 rounded-xl border p-8 text-center text-sm">
        Nenhum banner cadastrado ainda.
      </p>
    );
  }

  return (
    <ul className="flex flex-col gap-4">
      {propagandas.map((propaganda) => (
        <li key={propaganda.id}>
          <Link
            href={`/propagandas/${propaganda.id}/editar`}
            className="border-borda-suave bg-superficie hover:border-acento/40 flex flex-col gap-3 rounded-xl border p-4 transition-colors sm:flex-row sm:items-center"
          >
            {/*
              A proporção 16:6 é a mesma que o app usa nos banners — ver a arte
              no formato certo evita descobrir o corte só em produção.
            */}
            <span className="bg-superficie-2 relative block aspect-[16/6] w-full shrink-0 overflow-hidden rounded-lg sm:w-64">
              <Image
                src={propaganda.imagem}
                alt=""
                fill
                sizes="(min-width: 640px) 256px, 100vw"
                className="object-cover"
              />
            </span>

            <div className="flex min-w-0 flex-1 flex-col gap-1">
              <span className="text-texto truncate font-medium">
                {propaganda.titulo || "Sem título"}
              </span>
              <span className="text-texto-3 truncate text-sm">
                {propaganda.link}
              </span>
              <span className="flex items-center gap-3 text-xs">
                <span
                  className={
                    propaganda.ativo
                      ? "text-sucesso font-medium"
                      : "text-texto-3 font-medium"
                  }
                >
                  {propaganda.ativo ? "ativo" : "inativo"}
                </span>
                <span className="text-texto-3">
                  {`ordem ${propaganda.ordem ?? 0}`}
                </span>
                {propaganda.novaAba && (
                  <span className="text-texto-3">abre em nova aba</span>
                )}
              </span>
            </div>

            <span aria-hidden="true" className="text-texto-3 shrink-0 text-sm">
              →
            </span>
          </Link>
        </li>
      ))}
    </ul>
  );
}
