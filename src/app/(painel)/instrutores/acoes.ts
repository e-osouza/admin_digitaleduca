"use server";

import { revalidatePath } from "next/cache";
import { API_URL } from "@/lib/api";
import { lerToken } from "@/lib/session";

export type Resultado = { ok: true } | { ok: false; erro: string };

/** Campos de texto aceitos pela API. Qualquer outro é descartado. */
const CAMPOS = ["nome", "formacao", "sobre"] as const;

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

function montarCorpo(entrada: FormData, incluirVazios: boolean): FormData {
  const corpo = new FormData();

  for (const campo of CAMPOS) {
    const valor = entrada.get(campo);
    if (typeof valor !== "string") continue;
    // Na criação os três são obrigatórios, mesmo vazios; na edição só vai o
    // que foi preenchido, para não sobrescrever texto com string vazia.
    if (incluirVazios || valor !== "") corpo.set(campo, valor);
  }

  const avatar = entrada.get("avatar");
  if (avatar instanceof File && avatar.size > 0) corpo.set("avatar", avatar);

  return corpo;
}

export async function criarInstrutor(entrada: FormData): Promise<Resultado> {
  const token = await lerToken();
  if (!token) return { ok: false, erro: "Sessão expirada." };

  const resposta = await fetch(`${API_URL}/instrutor/create`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
    body: montarCorpo(entrada, true),
    cache: "no-store",
  });

  if (!resposta.ok) return { ok: false, erro: await mensagemDeErro(resposta) };

  revalidatePath("/instrutores");
  return { ok: true };
}

/**
 * Atualiza o instrutor.
 *
 * O avatar tem três caminhos no backend: arquivo novo substitui e apaga o
 * antigo do disco; `removerAvatar=true` sem arquivo zera a foto; nada dos dois
 * mantém a atual. O formulário reflete exatamente isso.
 */
export async function atualizarInstrutor(
  id: number,
  entrada: FormData,
): Promise<Resultado> {
  const token = await lerToken();
  if (!token) return { ok: false, erro: "Sessão expirada." };

  const corpo = montarCorpo(entrada, false);

  const remover = entrada.get("removerAvatar");
  const temArquivo = corpo.has("avatar");
  if (!temArquivo && remover === "on") corpo.set("removerAvatar", "true");

  const resposta = await fetch(`${API_URL}/instrutor/update/${id}`, {
    method: "PUT",
    headers: { Authorization: `Bearer ${token}` },
    body: corpo,
    cache: "no-store",
  });

  if (!resposta.ok) return { ok: false, erro: await mensagemDeErro(resposta) };

  revalidatePath("/instrutores");
  return { ok: true };
}

/**
 * Remove o instrutor e a foto do disco.
 *
 * O vínculo com conteúdo é `Cascade`, então os conteúdos NÃO são apagados —
 * apenas ficam sem essa pessoa creditada.
 */
export async function excluirInstrutor(id: number): Promise<Resultado> {
  const token = await lerToken();
  if (!token) return { ok: false, erro: "Sessão expirada." };

  const resposta = await fetch(`${API_URL}/instrutor/delete/${id}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${token}` },
    cache: "no-store",
  });

  if (!resposta.ok) return { ok: false, erro: await mensagemDeErro(resposta) };

  revalidatePath("/instrutores");
  return { ok: true };
}
