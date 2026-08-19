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
 * Monta o corpo multipart.
 *
 * `ativo` e `ordem` viajam como texto — é assim que o DTO os declara, e o
 * backend interpreta `"false"` como desativado e converte a ordem com
 * `Number()`. Diferente das trilhas, aqui não há conversão implícita para
 * booleano atrapalhando, justamente porque o campo é string dos dois lados.
 */
function montarCorpo(entrada: FormData): FormData {
  const corpo = new FormData();

  for (const campo of ["link", "titulo", "ordem"]) {
    const valor = entrada.get(campo);
    if (typeof valor === "string" && valor !== "") corpo.set(campo, valor);
  }

  // Checkbox ausente significa desmarcado, então o valor é sempre explícito.
  corpo.set("ativo", entrada.get("ativo") ? "true" : "false");
  corpo.set("novaAba", entrada.get("novaAba") ? "true" : "false");

  const imagem = entrada.get("imagem");
  if (imagem instanceof File && imagem.size > 0) corpo.set("imagem", imagem);

  return corpo;
}

async function enviar(
  rota: string,
  metodo: string,
  corpo: FormData,
): Promise<Resultado> {
  const token = await lerToken();
  if (!token) return { ok: false, erro: "Sessão expirada." };

  const resposta = await fetch(`${API_URL}${rota}`, {
    method: metodo,
    headers: { Authorization: `Bearer ${token}` },
    body: corpo,
    cache: "no-store",
  });

  if (!resposta.ok) return { ok: false, erro: await mensagemDeErro(resposta) };

  revalidatePath("/propagandas");
  return { ok: true };
}

/** A imagem é obrigatória na criação — o backend recusa sem ela. */
export async function criarPropaganda(entrada: FormData): Promise<Resultado> {
  return enviar("/propagandas", "POST", montarCorpo(entrada));
}

/** Enviar imagem nova substitui e apaga a anterior do disco. */
export async function atualizarPropaganda(
  id: number,
  entrada: FormData,
): Promise<Resultado> {
  return enviar(`/propagandas/${id}`, "PATCH", montarCorpo(entrada));
}

export async function excluirPropaganda(id: number): Promise<Resultado> {
  const token = await lerToken();
  if (!token) return { ok: false, erro: "Sessão expirada." };

  const resposta = await fetch(`${API_URL}/propagandas/${id}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${token}` },
    cache: "no-store",
  });

  if (!resposta.ok) return { ok: false, erro: await mensagemDeErro(resposta) };

  revalidatePath("/propagandas");
  return { ok: true };
}
