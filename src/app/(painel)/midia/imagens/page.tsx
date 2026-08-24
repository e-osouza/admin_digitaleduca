import Link from "next/link";
import {
  BibliotecaImagens,
  FONTES_IMAGEM,
} from "@/components/midia/bibliotecas";
import { BuscaMidia } from "@/components/midia/busca-midia";

export const metadata = { title: "Imagens · Painel DigitalEduca" };

export default async function PaginaImagens({
  searchParams,
}: {
  searchParams: Promise<{ fonte?: string; q?: string; page?: string }>;
}) {
  const { fonte: bruta, q, page } = await searchParams;
  const fonte = FONTES_IMAGEM.some((f) => f.chave === bruta) ? bruta! : "";
  const pagina = Number(page);

  /* Só as capas paginam e buscam — as outras fontes têm dezenas de itens. */
  const grande = fonte === "";

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h1 className="text-texto text-2xl font-semibold">Imagens</h1>
        <p className="text-texto-3 mt-0.5 text-sm">
          Capas, fotos de instrutores e banners em uso, com o lugar de onde
          vieram.
        </p>
      </div>

      <nav aria-label="Origem da imagem">
        <ul className="border-borda-suave flex flex-wrap items-center gap-x-1 border-b">
          {FONTES_IMAGEM.map((item) => {
            const ativa = item.chave === fonte;
            return (
              <li key={item.chave || "capas"}>
                <Link
                  href={
                    item.chave ? `/midia/imagens?fonte=${item.chave}` : "/midia/imagens"
                  }
                  aria-current={ativa ? "page" : undefined}
                  className={`-mb-px block border-b-2 px-3 py-2.5 text-sm transition-colors ${
                    ativa
                      ? "border-acento text-texto font-semibold"
                      : "text-texto-2 hover:text-texto border-transparent"
                  }`}
                >
                  {item.rotulo}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {grande && (
        <BuscaMidia
          base="/midia/imagens"
          placeholder="Buscar pelo título do conteúdo…"
        />
      )}

      <BibliotecaImagens
        fonte={fonte}
        q={q?.trim() || undefined}
        page={Number.isFinite(pagina) && pagina > 0 ? pagina : 1}
      />
    </div>
  );
}
