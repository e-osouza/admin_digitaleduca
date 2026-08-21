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
  PALESTRA: "Palestra",
  PODCAST: "Podcast",
};

/** Tolerante a valor desconhecido: tipo novo no banco não vira tela em branco. */
export function rotuloDoTipo(tipo: string): string {
  return ROTULO_TIPO[tipo as TipoConteudo] ?? tipo;
}

/**
 * Tipos que o painel oferece para cadastrar e filtrar.
 *
 * Podcast fica de fora de propósito: ele tem menu, formulário e regras
 * próprias (apresentador, convidados, sem módulos), então nunca é escolhido
 * a partir daqui.
 */
export const TIPOS_EDITAVEIS: { valor: TipoConteudo; rotulo: string }[] = [
  { valor: "AULA", rotulo: ROTULO_TIPO.AULA },
  { valor: "CURSO", rotulo: ROTULO_TIPO.CURSO },
  { valor: "PALESTRA", rotulo: ROTULO_TIPO.PALESTRA },
];
