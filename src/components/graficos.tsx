"use client";

import {
  dataBR,
  diaLegivel,
  horasBR,
  mesLegivel,
  moedaBR,
  moedaCurtaBR,
  numeroBR,
} from "@/lib/formato";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  LabelList,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

/*
  Camada fina sobre o Recharts com as decisões de leitura já embutidas, para
  que nenhuma tela precise redecidir espessura de traço, cor de grade ou se
  tem tooltip. Quem chama passa dado e rótulo; o resto é regra da casa.

  As regras que estes componentes garantem:

  · A ORDEM das cores é fixa (`--color-serie-1..5`) e nunca é ciclada. Ela é o
    mecanismo de segurança para daltonismo — foi validada como sequência, não
    como cores soltas. Uma 6ª série vira "Outros" ou vira outro gráfico.
  · Um eixo só. Duas medidas de escalas diferentes (assinaturas e receita, por
    exemplo) viram DOIS gráficos, nunca dois eixos Y no mesmo.
  · Texto usa token de texto, nunca a cor da série. A cor mora na marca; o
    número ao lado fica legível.
  · Todo gráfico tem camada de hover e tabela. Parte da paleta clara fica
    abaixo de 3:1 no branco, então cor sozinha nunca é o único caminho para o
    dado — a tabela em `<details>` é a saída obrigatória, não um extra.
*/

/** Ordem fixa da paleta. Índice = posição da série, sempre. */
export const SERIES = [
  "var(--color-serie-1)",
  "var(--color-serie-2)",
  "var(--color-serie-3)",
  "var(--color-serie-4)",
  "var(--color-serie-5)",
] as const;

/**
 * Rampa sequencial. Não é uma paleta alternativa: serve para escala ORDENADA
 * (nota 1→5), onde a ordem precisa ser lida na luminosidade. Usar as cores
 * categóricas aí sugeriria que nota 3 e nota 5 são coisas diferentes em vez de
 * pontos da mesma régua.
 */
export const RAMPA = [
  "var(--color-rampa-1)",
  "var(--color-rampa-2)",
  "var(--color-rampa-3)",
  "var(--color-rampa-4)",
  "var(--color-rampa-5)",
] as const;

const GRADE = "var(--color-grade)";
const TINTA_EIXO = { fill: "var(--color-texto-3)", fontSize: 12 };
const MARGEM = { top: 8, right: 12, bottom: 0, left: 0 };

/*
  Formato é um NOME, não uma função.

  Estes componentes são client e quem os usa são Server Components. Função não
  atravessa essa fronteira — a serialização do RSC recusa, e em produção a
  página inteira cai. Então a página diz "esta coluna é moeda" e a formatação
  acontece aqui, do lado do cliente.
*/
export type Formato =
  | "texto"
  | "numero"
  | "moeda"
  | "moedaCurta"
  | "horas"
  | "mes"
  | "dia"
  | "data"
  | "nota";

const FORMATADORES: Record<Formato, (valor: unknown) => string> = {
  texto: (valor) => String(valor ?? ""),
  numero: (valor) => numeroBR(Number(valor)),
  moeda: (valor) => moedaBR(Number(valor)),
  moedaCurta: (valor) => moedaCurtaBR(Number(valor)),
  horas: (valor) => horasBR(Number(valor)),
  mes: (valor) => mesLegivel(String(valor)),
  dia: (valor) => diaLegivel(String(valor)),
  data: (valor) => dataBR(valor as string | null),
  nota: (valor) => Number(valor).toFixed(1),
};

/** Número alinha à direita para as casas baterem entre linhas; texto, não. */
const NUMERICOS: Formato[] = ["numero", "moeda", "moedaCurta", "horas", "nota"];

function formatar(valor: unknown, formato: Formato = "texto"): string {
  return FORMATADORES[formato](valor);
}

/* ------------------------------------------------------------------ */
/* Moldura                                                             */
/* ------------------------------------------------------------------ */

export type Coluna = {
  cabecalho: string;
  /** Chave do campo na linha de dado. Campos derivados vêm prontos da página. */
  campo: string;
  formato?: Formato;
};

/**
 * Cartão de gráfico: título, área do desenho e a tabela equivalente.
 *
 * A tabela não é opcional de propósito. É ela que cumpre a regra de alívio da
 * paleta e é o que um leitor de tela consegue percorrer — o SVG do Recharts,
 * não.
 */
export function CartaoGrafico<T extends Record<string, unknown>>({
  titulo,
  descricao,
  altura = 260,
  larga,
  dados,
  colunas,
  children,
}: {
  titulo: string;
  descricao?: string;
  altura?: number;
  /** Ocupa as duas colunas da grade. Para rankings longos e séries densas. */
  larga?: boolean;
  dados: T[];
  colunas: Coluna[];
  children: React.ReactNode;
}) {
  const vazio = dados.length === 0;

  return (
    <section
      className={`border-borda-suave bg-superficie flex flex-col gap-4 rounded-xl border p-5 ${
        larga ? "xl:col-span-2" : ""
      }`}
    >
      <div>
        <h2 className="text-texto font-semibold">{titulo}</h2>
        {descricao ? (
          <p className="text-texto-3 mt-0.5 text-sm">{descricao}</p>
        ) : null}
      </div>

      {vazio ? (
        <p
          className="text-texto-3 flex items-center justify-center rounded-lg border border-dashed border-borda-suave text-sm"
          style={{ height: altura }}
        >
          Sem dados no período.
        </p>
      ) : (
        <>
          <div style={{ height: altura }}>{children}</div>

          <details className="group">
            <summary className="text-texto-3 hover:text-texto w-fit text-sm transition-colors">
              Ver tabela
            </summary>
            <div className="mt-3 overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-borda-suave border-b">
                    {colunas.map((coluna) => (
                      <th
                        key={coluna.cabecalho}
                        scope="col"
                        className={`text-texto-3 py-2 font-medium ${
                          NUMERICOS.includes(coluna.formato ?? "texto")
                            ? "text-right"
                            : "text-left"
                        }`}
                      >
                        {coluna.cabecalho}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {dados.map((linha, indice) => (
                    <tr
                      key={indice}
                      className="border-borda-suave/60 border-b last:border-0"
                    >
                      {colunas.map((coluna) => (
                        <td
                          key={coluna.cabecalho}
                          className={`text-texto-2 py-2 ${
                            NUMERICOS.includes(coluna.formato ?? "texto")
                              ? "text-right tabular-nums"
                              : "text-left"
                          }`}
                        >
                          {formatar(linha[coluna.campo], coluna.formato)}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </details>
        </>
      )}
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* Tooltip                                                             */
/* ------------------------------------------------------------------ */

function CaixaDica({
  titulo,
  linhas,
}: {
  titulo: string;
  linhas: { rotulo: string; valor: string; cor?: string }[];
}) {
  return (
    <div className="border-borda bg-superficie rounded-lg border px-3 py-2 shadow-lg">
      <p className="text-texto text-sm font-medium">{titulo}</p>
      <ul className="mt-1 flex flex-col gap-0.5">
        {linhas.map((linha) => (
          <li
            key={linha.rotulo}
            className="text-texto-2 flex items-center gap-2 text-sm"
          >
            {linha.cor ? (
              <span
                aria-hidden
                className="size-2.5 shrink-0 rounded-full"
                style={{ background: linha.cor }}
              />
            ) : null}
            <span>{linha.rotulo}</span>
            <span className="text-texto ml-auto font-medium tabular-nums">
              {linha.valor}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Linha — mudança ao longo do tempo                                   */
/* ------------------------------------------------------------------ */

export type SerieLinha = {
  chave: string;
  rotulo: string;
  /** Índice na paleta. Segue a ENTIDADE, não a posição no ranking. */
  slot: number;
  formato: Formato;
};

export function GraficoLinha<T extends Record<string, unknown>>({
  dados,
  chaveX,
  formatoX = "mes",
  series,
}: {
  dados: T[];
  chaveX: string;
  formatoX?: Formato;
  series: SerieLinha[];
}) {
  /*
    Uma série sozinha dispensa legenda — o título do cartão já a nomeia, e uma
    caixinha com um item só é ruído.
  */
  const comLegenda = series.length > 1;

  /*
    "R$ 2.600" não cabe nos 56px que bastam para "40" — o cifrão sai cortado.
    A largura vem do formato do próprio eixo em vez de ser fixa.
  */
  const larguraEixo =
    series[0].formato === "moeda" || series[0].formato === "moedaCurta"
      ? 84
      : 56;

  return (
    <div className="flex h-full flex-col gap-2">
      {comLegenda ? (
        <ul className="flex flex-wrap items-center gap-x-4 gap-y-1">
          {series.map((serie) => (
            <li
              key={serie.chave}
              className="text-texto-2 flex items-center gap-1.5 text-sm"
            >
              <span
                aria-hidden
                className="h-0.5 w-4 rounded-full"
                style={{ background: SERIES[serie.slot] }}
              />
              {serie.rotulo}
            </li>
          ))}
        </ul>
      ) : null}

      <div className="min-h-0 flex-1">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={dados} margin={MARGEM} accessibilityLayer>
            {/* Só as horizontais: as verticais competem com a própria linha. */}
            <CartesianGrid vertical={false} stroke={GRADE} />
            <XAxis
              dataKey={chaveX}
              tickFormatter={(valor) => formatar(valor, formatoX)}
              tick={TINTA_EIXO}
              tickLine={false}
              axisLine={{ stroke: GRADE }}
              minTickGap={16}
            />
            <YAxis
              tick={TINTA_EIXO}
              tickLine={false}
              axisLine={false}
              width={larguraEixo}
              /*
                Contagem não tem meio. Num recorte curto o eixo ia de 0 a 1 e
                inventava 0,25 · 0,5 · 0,75 — que não existem em "cadastros".
                Hora e dinheiro têm fração de verdade e mantêm as casas.
              */
              allowDecimals={series[0].formato !== "numero"}
              tickFormatter={(valor) => formatar(valor, series[0].formato)}
            />
            <Tooltip
              cursor={{ stroke: GRADE, strokeWidth: 2 }}
              content={({ active, payload, label }) =>
                active && payload?.length ? (
                  <CaixaDica
                    titulo={formatar(label, formatoX)}
                    linhas={payload.map((item, indice) => ({
                      rotulo: series[indice]?.rotulo ?? String(item.name),
                      valor: formatar(
                        item.value,
                        series[indice]?.formato ?? "numero",
                      ),
                      cor: SERIES[series[indice]?.slot ?? 0],
                    }))}
                  />
                ) : null
              }
            />
            {series.map((serie) => (
              <Line
                key={serie.chave}
                /*
                  Reta entre pontos, não curva. Curva suavizada desenha valores
                  entre os meses que ninguém mediu — com 13 pontos espaçados
                  isso é inventar dado.
                */
                type="linear"
                dataKey={serie.chave}
                name={serie.rotulo}
                stroke={SERIES[serie.slot]}
                strokeWidth={2}
                /* Ponto por ponto polui; o marcador aparece no hover. */
                dot={false}
                /*
                  Sem animação de entrada. Numa tela de trabalho ela atrasa a
                  leitura sem acrescentar nada — e quem imprime ou captura a
                  tela pega o gráfico pela metade.
                */
                isAnimationActive={false}
                activeDot={{
                  r: 4,
                  strokeWidth: 2,
                  stroke: "var(--color-superficie)",
                }}
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Barras horizontais — magnitude comparada entre categorias           */
/* ------------------------------------------------------------------ */

/**
 * Barras deitadas por padrão: rótulo de categoria em português é longo, e
 * deitado ele cabe inteiro e na horizontal de leitura, sem girar texto.
 *
 * `chaveSlot` existe para o caso em que cada barra é uma entidade com cor
 * própria (status, canal): a página grava o índice na própria linha, e assim a
 * cor segue a entidade mesmo que a ordem mude. Quando é só magnitude de uma
 * mesma medida, todas ficam no slot 1 — pintar cada barra de uma cor sem que a
 * cor signifique algo é decoração que atrapalha.
 */
export function GraficoBarras<T extends Record<string, unknown>>({
  dados,
  chaveRotulo,
  chaveValor,
  formato = "numero",
  slot = 0,
  chaveSlot,
  larguraRotulo = 132,
}: {
  dados: T[];
  chaveRotulo: string;
  chaveValor: string;
  formato?: Formato;
  slot?: number;
  /** Espaço reservado ao rótulo da categoria. Título de conteúdo pede mais. */
  larguraRotulo?: number;
  /** Campo que carrega o índice de cor de cada linha, quando a cor é da entidade. */
  chaveSlot?: string;
}) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart
        data={dados}
        layout="vertical"
        margin={{ ...MARGEM, right: 56 }}
        barCategoryGap={6}
        accessibilityLayer
      >
        {/* Sem grade: o rótulo no fim da barra já entrega o valor exato. */}
        <XAxis type="number" hide />
        <YAxis
          type="category"
          dataKey={chaveRotulo}
          tick={TINTA_EIXO}
          tickLine={false}
          axisLine={false}
          width={larguraRotulo}
        />
        <Tooltip
          cursor={{ fill: "var(--color-superficie-2)" }}
          content={({ active, payload }) =>
            active && payload?.length ? (
              <CaixaDica
                titulo={String(payload[0].payload[chaveRotulo])}
                linhas={[
                  {
                    rotulo: String(payload[0].name),
                    valor: formatar(payload[0].value, formato),
                  },
                ]}
              />
            ) : null
          }
        />
        <Bar
          dataKey={chaveValor}
          /* Ponta arredondada só do lado do dado; a base fica na linha zero. */
          radius={[0, 4, 4, 0]}
          /* Marca fina: barra gorda vira bloco de cor e some com o dado. */
          maxBarSize={26}
          isAnimationActive={false}
        >
          {dados.map((linha, indice) => (
            <Cell
              key={indice}
              fill={SERIES[chaveSlot ? Number(linha[chaveSlot]) : slot]}
            />
          ))}
          {/*
            Rótulo direto em toda barra: são poucas, e é ele que dispensa o
            leitor de estimar comprimento contra um eixo.
          */}
          <LabelList
            dataKey={chaveValor}
            position="right"
            formatter={(valor) => formatar(valor, formato)}
            fill="var(--color-texto-2)"
            fontSize={12}
          />
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}

/* ------------------------------------------------------------------ */
/* Rosca — parte sobre o todo                                          */
/* ------------------------------------------------------------------ */

/** Teto de fatias antes de a cauda virar "Outros". Além disso vira mancha. */
const MAXIMO_FATIAS = 6;

/**
 * Rosca (pizza com furo), para "quanto cada parte representa do total".
 *
 * Rosca em vez de pizza cheia porque o furo carrega o total — o número que a
 * comparação de ângulos nunca entrega sozinha. E a legenda ao lado traz valor
 * e percentual de cada fatia: ângulo é bom para "essa é a maior", ruim para
 * "quanto exatamente", e a leitura exata tem de existir em algum lugar.
 *
 * Duas guardas, as duas da lista de armadilhas de gráfico:
 *
 * · Menos de duas fatias vira número, não anel. Rosca de uma fatia só diz
 *   "100%", que já estava escrito no total.
 * · Acima de seis fatias a cauda vira "Outros". Cor nova para a sétima fatia
 *   sairia da paleta validada, e sete cunhas finas não se distinguem.
 */
export function GraficoPizza<T extends Record<string, unknown>>({
  dados,
  chaveRotulo,
  chaveValor,
  formato = "numero",
  paleta = "series",
  chaveSlot,
  rotuloTotal = "total",
}: {
  dados: T[];
  chaveRotulo: string;
  chaveValor: string;
  formato?: Formato;
  /** `rampa` para escala ordenada (nota, faixa etária); `series` para identidade. */
  paleta?: "series" | "rampa";
  /** Campo com o índice de cor. Sem ele, a cor segue a posição na lista. */
  chaveSlot?: string;
  rotuloTotal?: string;
}) {
  const tons = paleta === "rampa" ? RAMPA : SERIES;

  const fatias = dados.map((linha, indice) => ({
    rotulo: String(linha[chaveRotulo]),
    valor: Number(linha[chaveValor]),
    cor: tons[
      (chaveSlot ? Number(linha[chaveSlot]) : indice) % tons.length
    ],
  }));

  const visiveis =
    fatias.length > MAXIMO_FATIAS
      ? [
          ...fatias.slice(0, MAXIMO_FATIAS - 1),
          {
            rotulo: "Outros",
            valor: fatias
              .slice(MAXIMO_FATIAS - 1)
              .reduce((soma, f) => soma + f.valor, 0),
            cor: "var(--color-texto-3)",
          },
        ]
      : fatias;

  const total = visiveis.reduce((soma, f) => soma + f.valor, 0);
  const parte = (valor: number) =>
    total > 0 ? `${Math.round((valor / total) * 100)}%` : "—";

  if (visiveis.length < 2) {
    const unica = visiveis[0];
    return (
      <div className="flex h-full flex-col items-center justify-center gap-1">
        <p className="text-texto text-3xl font-semibold tabular-nums">
          {formatar(total, formato)}
        </p>
        <p className="text-texto-3 text-sm">
          {unica ? `100% · ${unica.rotulo}` : rotuloTotal}
        </p>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col items-center gap-4 sm:flex-row">
      <div className="relative h-full min-h-40 w-full sm:w-1/2">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Tooltip
              content={({ active, payload }) =>
                active && payload?.length ? (
                  <CaixaDica
                    titulo={String(payload[0].name)}
                    linhas={[
                      {
                        rotulo: "Total",
                        valor: formatar(payload[0].value, formato),
                      },
                      {
                        rotulo: "Do período",
                        valor: parte(Number(payload[0].value)),
                      },
                    ]}
                  />
                ) : null
              }
            />
            <Pie
              data={visiveis}
              dataKey="valor"
              nameKey="rotulo"
              /* Anel, não disco: o furo é onde mora o total. */
              innerRadius="58%"
              outerRadius="88%"
              /* Respiro de 2px entre fatias, como entre barras vizinhas. */
              paddingAngle={2}
              stroke="var(--color-superficie)"
              strokeWidth={2}
              isAnimationActive={false}
            >
              {visiveis.map((fatia) => (
                <Cell key={fatia.rotulo} fill={fatia.cor} />
              ))}
            </Pie>
          </PieChart>
        </ResponsiveContainer>

        {/* O total fica no furo; `pointer-events-none` deixa o hover passar. */}
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-texto text-xl font-semibold tabular-nums">
            {formatar(total, formato)}
          </span>
          <span className="text-texto-3 text-xs">{rotuloTotal}</span>
        </div>
      </div>

      {/*
        Legenda com número, não só cor: parte da paleta clara fica abaixo de
        3:1 no branco, e ângulo não se lê em valor exato.
      */}
      <ul className="flex w-full flex-col gap-1.5 sm:w-1/2">
        {visiveis.map((fatia) => (
          <li key={fatia.rotulo} className="flex items-center gap-2 text-sm">
            <span
              aria-hidden
              className="size-2.5 shrink-0 rounded-full"
              style={{ background: fatia.cor }}
            />
            <span className="text-texto-2 truncate">{fatia.rotulo}</span>
            <span className="text-texto ml-auto shrink-0 font-medium tabular-nums">
              {formatar(fatia.valor, formato)}
            </span>
            <span className="text-texto-3 w-10 shrink-0 text-right tabular-nums">
              {parte(fatia.valor)}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
