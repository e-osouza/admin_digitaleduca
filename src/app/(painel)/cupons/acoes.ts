"use server";

import { revalidatePath } from "next/cache";
import { API_URL } from "@/lib/api";
import { lerToken } from "@/lib/session";

export type Resultado = { ok: true } | { ok: false; erro: string };

async function mensagemDeErro(resposta: Response): Promise<string> {
  try {
    const corpo = (await resposta.json()) as { message?: string | string[] };
    if (Array.isArray(corpo.message)) return corpo.message.join(", ");
    if (corpo.message) return corpo.message;
  } catch {
    // sem corpo JSON
  }
  return `A API respondeu ${resposta.status}.`;
}

/**
 * Monta o corpo do cupom.
 *
 * Datas vão como ISO 8601 completo: o DTO valida com `@IsDateString()`, que
 * recusa `AAAA-MM-DD` puro. O campo da tela é `datetime-local`, sem fuso, e
 * `new Date(...)` o interpreta no fuso de quem preenche — que é o certo aqui,
 * já que a campanha começa e termina no horário de quem a criou.
 */
function montarCorpo(entrada: FormData) {
  const texto = (campo: string) => {
    const valor = entrada.get(campo);
    return typeof valor === "string" ? valor.trim() : "";
  };

  const dataOuNulo = (campo: string) => {
    const valor = texto(campo);
    return valor ? new Date(valor).toISOString() : null;
  };

  const inteiroOuNulo = (campo: string) => {
    const valor = texto(campo);
    return valor ? Number(valor) : null;
  };

  const duracao = texto("duracao");

  return {
    codigo: texto("codigo"),
    descricao: texto("descricao") || null,
    percentual: Number(texto("percentual").replace(",", ".")),
    duracao,
    /*
      Ciclos só existem em REPEATING. Enviar um número junto de ONCE gravaria
      um valor que nunca é lido e reapareceria no formulário como se valesse.
    */
    duracaoCiclos:
      duracao === "REPEATING" ? Number(texto("duracaoCiclos") || 1) : null,
    validoDe: dataOuNulo("validoDe"),
    validoAte: dataOuNulo("validoAte"),
    limiteUsos: inteiroOuNulo("limiteUsos"),
    planoId: inteiroOuNulo("planoId"),
    ativo: entrada.get("ativo") ? true : false,
  };
}

async function enviar(
  rota: string,
  metodo: string,
  corpo: unknown,
): Promise<Resultado> {
  const token = await lerToken();
  if (!token) return { ok: false, erro: "Sessão expirada." };

  const resposta = await fetch(`${API_URL}${rota}`, {
    method: metodo,
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(corpo),
    cache: "no-store",
  });

  if (!resposta.ok) return { ok: false, erro: await mensagemDeErro(resposta) };

  revalidatePath("/cupons");
  return { ok: true };
}

export async function criarCupom(entrada: FormData): Promise<Resultado> {
  return enviar("/cupom", "POST", montarCorpo(entrada));
}

export async function atualizarCupom(
  id: number,
  entrada: FormData,
): Promise<Resultado> {
  return enviar(`/cupom/${id}`, "PATCH", montarCorpo(entrada));
}

export type ResultadoLote =
  | { ok: true; afetados: number }
  | { ok: false; erro: string; afetados: number };

/**
 * Desativa os cupons selecionados.
 *
 * Só desativar, sem excluir: a API não expõe DELETE, e é proteção — o cupom
 * fica referenciado pela assinatura que o usou (`Assinatura.cupomId`), e
 * apagá-lo destruiria o registro de qual desconto foi concedido a quem.
 */
export async function desativarCupomEmLote(
  ids: number[],
): Promise<ResultadoLote> {
  const token = await lerToken();
  if (!token) return { ok: false, erro: "Sessão expirada.", afetados: 0 };

  let afetados = 0;
  let primeiroErro: string | null = null;

  for (const id of ids) {
    const resposta = await fetch(`${API_URL}/cupom/${id}/desativar`, {
      method: "PATCH",
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store",
    });
    if (resposta.ok) afetados += 1;
    else if (!primeiroErro) primeiroErro = await mensagemDeErro(resposta);
  }

  revalidatePath("/cupons");

  if (primeiroErro) return { ok: false, erro: primeiroErro, afetados };
  return { ok: true, afetados };
}
