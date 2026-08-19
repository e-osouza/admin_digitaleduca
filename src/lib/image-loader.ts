"use client";

/**
 * Loader do next/image apontando para o proxy de imagem da própria API
 * (`GET /img?src=&w=&q=`), que devolve WebP redimensionado.
 *
 * A API entrega os caminhos como `uploads/1768937900033-424633210.png`.
 */
export default function loaderDaApi({
  src,
  width,
  quality,
}: {
  src: string;
  width: number;
  quality?: number;
}): string {
  const base = process.env.NEXT_PUBLIC_API_URL ?? "https://api-dev.digitaleduca.com.vc";

  // URLs absolutas (avatares externos, por exemplo) passam direto.
  if (/^https?:\/\//.test(src)) return src;

  // Assets locais de /public (logo, ilustrações) começam com barra; a API
  // sempre devolve caminhos relativos como `uploads/arquivo.png`.
  if (src.startsWith("/")) return src;

  const caminho = src.replace(/^\/+/, "");
  return `${base}/img?src=${encodeURIComponent(caminho)}&w=${width}&q=${quality ?? 75}`;
}
