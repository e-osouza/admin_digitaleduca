import Image from "next/image";

/**
 * Traçado do símbolo, copiado de `/logo/de-escura.svg`. No arquivo oficial ele
 * é o único `path` que fica FORA dos dois grupos da tipografia — ou seja, é a
 * marca sem o texto, exatamente como desenhada.
 */
const SIMBOLO =
  "M610.2,325.35l-28.51-122.85c-3.41-14.68-12.3-28.47-24.31-37.03l-33.19-23.63-89.91-62.65c-11.4-7.94-25.06-11.39-38.92-11.38l-175.33.08c-14.93,0-28.57,5.47-40.31,14.04l-104.17,76.02-26.38,19.06c-12.31,8.89-22.04,20.56-25.78,35.75L1.06,303.38c-3.96,16.05,3.63,32.64,15.11,43.64l48.44,46.43c10.8,10.35,25.03,15.02,40.08,14.2l64.28.2c10.21.03,16.4,7.89,18.48,17.16l12.44,55.4c2.55,11.37,10.05,20.17,19.91,26.14l135.5,82.03c4.99,3.02,11.5.66,14.7-2.68,3.93-4.11,4.54-9.22,2.78-14.95l-17.69-57.55c-.93-3.03-.4-5.98,1.44-8.25,1.62-2,4.04-3.23,7.15-3.24l103.22-.3c13.89-.04,27.64-6.4,36.74-16.65l64.84-73.09,30.07-33.65c10.48-15.53,16-34.23,11.67-52.86ZM504.5,342.18l-60.42,66.92c-5.15,5.7-13.07,9.79-21.45,9.8l-157.25.15c-3.66,0-6.46-2.23-7.6-4.79-1.42-3.16-.69-6.12,1.32-9.13l58.23-87.23c2.31-3.46,2.33-7.4.4-10.79-1.54-2.71-4.62-5.24-8.82-5.24l-185.04-.19c-11.27-.01-19.11-11.16-16.63-21.32l7.1-29.08c1.67-6.86,4.02-15,10.18-19.55l85.35-63.06c5.88-4.35,13.23-7.17,20.81-7.17h139.2c8.93,0,16.19,4.25,23.19,9.07l88.28,60.72c8.04,5.53,14.33,12.07,16.52,21.9l14.37,64.57c1.92,8.64-1.99,18.07-7.74,24.43Z";

/**
 * Só o símbolo, sem o texto — para o menu recolhido, onde não cabe o logotipo
 * inteiro.
 *
 * Vem inline, e não como arquivo em `/public`, para ser pintado por CSS: um
 * `<img>` não herda `currentColor`, e sem isso seriam necessários dois novos
 * arquivos só para trocar o preenchimento entre os temas. As duas cores aqui
 * são as mesmas dos arquivos oficiais — `brand` é a tinta da logo (o único
 * token que não muda com o tema) e o negativo do tema escuro é branco.
 */
export function MarcaIcone({
  className = "",
  altura = 26,
}: {
  className?: string;
  altura?: number;
}) {
  // Caixa do traçado: x 0..612, y 68..590 do viewBox original, com uma folga
  // de 2 para o arredondamento das curvas não encostar na borda.
  const largura = Math.round((altura * 616) / 528);

  return (
    <svg
      viewBox="-2 66 616 528"
      width={largura}
      height={altura}
      aria-hidden="true"
      className={`text-brand escuro:text-white ${className}`}
    >
      <path fill="currentColor" d={SIMBOLO} />
    </svg>
  );
}

/**
 * Logotipo oficial. O arquivo original é branco, para fundo escuro; a variante
 * de tinta escura é a mesma arte com o preenchimento trocado, usada no tema
 * claro. Renderizamos os dois e alternamos por CSS — assim não depende de
 * JavaScript nem pisca na troca de tema.
 */
export function Marca({
  className = "",
  altura = 30,
}: {
  className?: string;
  altura?: number;
}) {
  // Proporção do arquivo original: 1922.4 × 636.94
  const largura = Math.round((altura * 1922.4) / 636.94);

  return (
    <>
      <Image
        src="/logo/de-escura.svg"
        alt="Digital Educa"
        width={largura}
        height={altura}
        priority
        className={`escuro:hidden ${className}`}
      />
      <Image
        src="/logo/de-branca.svg"
        alt=""
        aria-hidden="true"
        width={largura}
        height={altura}
        priority
        className={`hidden escuro:block ${className}`}
      />
    </>
  );
}
