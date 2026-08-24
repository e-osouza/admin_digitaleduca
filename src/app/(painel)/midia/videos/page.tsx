import { BibliotecaVideos } from "@/components/midia/bibliotecas";
import { BuscaMidia } from "@/components/midia/busca-midia";

export const metadata = { title: "Vídeos · Painel DigitalEduca" };

export default async function PaginaVideos({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; page?: string }>;
}) {
  const { q, page } = await searchParams;
  const pagina = Number(page);

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h1 className="text-texto text-2xl font-semibold">Vídeos</h1>
        <p className="text-texto-3 mt-0.5 text-sm">
          Tudo que está no Vimeo pela plataforma.
        </p>
      </div>

      <BuscaMidia base="/midia/videos" placeholder="Buscar vídeo por título…" />

      <BibliotecaVideos
        q={q?.trim() || undefined}
        page={Number.isFinite(pagina) && pagina > 0 ? pagina : 1}
      />
    </div>
  );
}
