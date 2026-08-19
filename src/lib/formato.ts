/** Segundos → `1h 05min` ou `12min 30s`. Zero e nulo viram travessão. */
export function duracaoLegivel(segundos: number | null | undefined): string {
  if (!segundos || segundos <= 0) return "—";

  const horas = Math.floor(segundos / 3600);
  const minutos = Math.floor((segundos % 3600) / 60);
  const resto = segundos % 60;

  if (horas > 0) return `${horas}h ${String(minutos).padStart(2, "0")}min`;
  if (minutos > 0) return `${minutos}min ${String(resto).padStart(2, "0")}s`;
  return `${resto}s`;
}

/**
 * Lê a duração do próprio arquivo de vídeo, no browser.
 *
 * A API aceita `duracao` opcional, mas sem ela a plataforma do aluno não tem
 * como mostrar o tempo da aula nem calcular o total do curso — e ninguém vai
 * digitar isso à mão corretamente. Resolve em `null` se o navegador não
 * conseguir ler o metadado, para não bloquear o envio por causa disso.
 */
export function lerDuracaoDoArquivo(arquivo: File): Promise<number | null> {
  return new Promise((resolver) => {
    const url = URL.createObjectURL(arquivo);
    const video = document.createElement("video");
    video.preload = "metadata";

    const encerrar = (valor: number | null) => {
      URL.revokeObjectURL(url);
      resolver(valor);
    };

    video.onloadedmetadata = () => {
      const total = video.duration;
      encerrar(Number.isFinite(total) && total > 0 ? Math.round(total) : null);
    };

    video.onerror = () => encerrar(null);
    video.src = url;
  });
}

const NUMERO = new Intl.NumberFormat("pt-BR");
const MOEDA = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
});
const MOEDA_CURTA = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
  maximumFractionDigits: 0,
});

/** `1234` → `1.234`. */
export function numeroBR(valor: number): string {
  return NUMERO.format(valor);
}

/** `2556.8` → `R$ 2.556,80`. */
export function moedaBR(valor: number): string {
  return MOEDA.format(valor);
}

/** Versão sem centavos, para eixos de gráfico — lá o centavo é ruído. */
export function moedaCurtaBR(valor: number): string {
  return MOEDA_CURTA.format(valor);
}

const MESES = [
  "jan",
  "fev",
  "mar",
  "abr",
  "mai",
  "jun",
  "jul",
  "ago",
  "set",
  "out",
  "nov",
  "dez",
];

/**
 * `2025-08` → `ago/25`.
 *
 * Formatar à mão em vez de `new Date("2025-08")` porque essa string é lida
 * como UTC: em fuso negativo, como o nosso, ela retrocede para julho.
 */
export function mesLegivel(mes: string): string {
  const [ano, numero] = mes.split("-");
  const indice = Number(numero) - 1;
  if (!ano || indice < 0 || indice > 11) return mes;
  return `${MESES[indice]}/${ano.slice(2)}`;
}

/**
 * `2026-07-21` → `21/07`.
 *
 * Mesmo cuidado de `mesLegivel`: fatiar a string em vez de passar por `Date`,
 * que leria o texto como UTC e devolveria o dia anterior no nosso fuso.
 */
export function diaLegivel(iso: string): string {
  const [, mes, dia] = iso.split("-");
  return mes && dia ? `${dia}/${mes}` : iso;
}

/** ISO com hora → `18/08/2026`. Vazio vira travessão. */
export function dataBR(iso: string | null | undefined): string {
  if (!iso) return "—";
  const d = new Date(iso);
  return Number.isNaN(d.getTime())
    ? "—"
    : d.toLocaleDateString("pt-BR", { timeZone: "America/Sao_Paulo" });
}

/** `62` → `62 h`; usado nos indicadores, onde o valor já vem em horas. */
export function horasBR(valor: number): string {
  return `${NUMERO.format(valor)} h`;
}

/** `1 avaliação` / `48 avaliações` — concorda o número com o substantivo. */
export function plural(
  quantidade: number,
  singular: string,
  plural: string,
): string {
  return `${numeroBR(quantidade)} ${quantidade === 1 ? singular : plural}`;
}
