import type { TipoConteudo } from "@/types/api";

/*
  Fonte única do nome de cada tipo de conteúdo.

  Existia uma cópia deste mapa em cada tela que mostrava tipo — e foi
  exatamente isso que tornou arriscada a troca de "Aula" por "MasterClass":
  quatro lugares para lembrar, e a tela de Estatísticas ainda escapava,
  mostrando o valor cru do banco.

  A distinção que este arquivo protege: o VALOR (`AULA`) é contrato de API,
  viaja para o app mobile instalado e não muda. O RÓTULO ("MasterClass") é
  apresentação e muda quando o produto quiser. Misturar os dois é o que
  quebraria os apps já publicados.
*/
export const ROTULO_TIPO: Record<TipoConteudo, string> = {
  AULA: "MasterClass",
  CURSO: "Curso",
  TRILHA: "Trilha",
  PALESTRA: "Palestra",
  PODCAST: "Podcast",
};

/**
 * Os quatro tipos do menu, na ordem em que aparecem lá.
 *
 * Todos são `Conteudo` — é isso que permite mover livremente entre eles: a
 * mudança é de campo, não de tabela. CURSO e TRILHA se distinguem por
 * conterem outros conteúdos (`conteudo_itens`), não por serem outra coisa.
 */
export const TIPOS_DO_MENU: { valor: TipoConteudo; rotulo: string; rota: string }[] =
  [
    { valor: "CURSO", rotulo: "Curso", rota: "/cursos" },
    { valor: "TRILHA", rotulo: "Trilha", rota: "/trilhas" },
    { valor: "AULA", rotulo: "MasterClass", rota: "/conteudos" },
    { valor: "PODCAST", rotulo: "Podcast", rota: "/podcasts" },
  ];

/** Agrupadores contêm outros conteúdos; os demais contêm vídeos. */
export function ehAgrupador(tipo: TipoConteudo): boolean {
  return tipo === "CURSO" || tipo === "TRILHA";
}

/** Tolerante a valor desconhecido: tipo novo no banco não vira tela em branco. */
export function rotuloDoTipo(tipo: string): string {
  return ROTULO_TIPO[tipo as TipoConteudo] ?? tipo;
}

/**
 * Tipos que o painel oferece para cadastrar e filtrar.
 *
 * Dois ficam de fora, por motivos diferentes:
 *
 * · PODCAST tem menu, formulário e regras próprias (apresentador, convidados,
 *   sem módulos), então nunca é escolhido a partir daqui.
 *
 * · CURSO existe no enum, mas curso NÃO é um tipo de conteúdo neste produto:
 *   é uma Trilha com `tipo: CURSO`, que agrupa MasterClasses. Oferecer a
 *   opção aqui criava um conteúdo que não aparecia em lugar nenhum — nem em
 *   MasterClass (que filtra AULA), nem em Cursos (que lê trilhas). Curso se
 *   cria em /cursos.
 */
export const TIPOS_EDITAVEIS: { valor: TipoConteudo; rotulo: string }[] = [
  { valor: "AULA", rotulo: ROTULO_TIPO.AULA },
  { valor: "PALESTRA", rotulo: ROTULO_TIPO.PALESTRA },
];
