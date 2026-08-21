import type { Cupom } from "@/types/api";

export type SituacaoCupom =
  | "ativo"
  | "agendado"
  | "expirado"
  | "esgotado"
  | "inativo";

/**
 * A situação REAL de um cupom.
 *
 * `ativo` no banco é só uma das cinco condições que o checkout verifica — um
 * cupom pode estar `ativo: true` e mesmo assim ser recusado por estar
 * agendado, vencido ou esgotado. Mostrar só a coluna crua faria o painel
 * afirmar "ativo" sobre um cupom que não desconta mais nada.
 *
 * A ORDEM das checagens espelha a do backend (`CupomService.validar`) de
 * propósito: quando um cupom falha por mais de um motivo, o painel precisa
 * dizer o mesmo que o usuário vai ver no checkout.
 */
export function situacaoDoCupom(cupom: Cupom, agora = new Date()): SituacaoCupom {
  if (!cupom.ativo) return "inativo";
  if (cupom.validoDe && agora < new Date(cupom.validoDe)) return "agendado";
  if (cupom.validoAte && agora > new Date(cupom.validoAte)) return "expirado";
  if (cupom.limiteUsos !== null && cupom.usosAtuais >= cupom.limiteUsos) {
    return "esgotado";
  }
  return "ativo";
}

export const ROTULO_SITUACAO: Record<SituacaoCupom, string> = {
  ativo: "Ativo",
  agendado: "Agendado",
  expirado: "Expirado",
  esgotado: "Esgotado",
  inativo: "Inativo",
};

/**
 * Cor de cada situação.
 *
 * Verde só para quem realmente desconta agora. Agendado é âmbar por ser um
 * "ainda não" — não é erro, mas também não está valendo.
 */
export const COR_SITUACAO: Record<SituacaoCupom, string> = {
  ativo: "text-sucesso bg-sucesso/10",
  agendado: "text-aviso bg-aviso/12",
  expirado: "text-texto-3 bg-superficie-2",
  esgotado: "text-texto-3 bg-superficie-2",
  inativo: "text-texto-3 bg-superficie-2",
};

export const ROTULO_DURACAO: Record<string, string> = {
  ONCE: "Só na 1ª cobrança",
  FOREVER: "Em todas as renovações",
  REPEATING: "Por alguns ciclos",
};

/** `REPEATING` sem o número de ciclos não diz nada — junta os dois. */
export function descreverDuracao(cupom: Cupom): string {
  if (cupom.duracao === "REPEATING") {
    const n = cupom.duracaoCiclos ?? 0;
    return `Por ${n} ${n === 1 ? "ciclo" : "ciclos"}`;
  }
  return ROTULO_DURACAO[cupom.duracao] ?? cupom.duracao;
}
