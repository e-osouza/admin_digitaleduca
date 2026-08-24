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

async function chamar(
  rota: string,
  metodo: string,
  corpo?: unknown,
): Promise<Resultado> {
  const token = await lerToken();
  if (!token) return { ok: false, erro: "Sessão expirada." };

  const resposta = await fetch(`${API_URL}${rota}`, {
    method: metodo,
    headers: {
      Authorization: `Bearer ${token}`,
      ...(corpo ? { "Content-Type": "application/json" } : {}),
    },
    body: corpo ? JSON.stringify(corpo) : undefined,
    cache: "no-store",
  });

  if (!resposta.ok) return { ok: false, erro: await mensagemDeErro(resposta) };

  revalidatePath("/usuarios");
  return { ok: true };
}

/**
 * Cria usuário já com assinatura.
 *
 * `POST /usuario/admin/create` exige as datas — é o caminho de cortesia, para
 * liberar acesso sem passar por pagamento.
 */
export async function criarUsuario(dados: {
  nome: string;
  email: string;
  senha: string;
  celular: string;
  role: string;
  /*
    Opcionais de propósito: o backend só cria a assinatura de cortesia quando
    `dataFim` chega. Mandar datas para um papel que não é Cortesia liberaria
    acesso total sem ninguém ter pedido.
  */
  dataInicio?: string;
  dataFim?: string;
}): Promise<Resultado> {
  return chamar("/usuario/admin/create", "POST", dados);
}

/**
 * Atualiza um usuário.
 *
 * `senha` só vai quando preenchida — o backend faz o hash antes de gravar.
 * Rebaixar para `USER` encerra as cortesias automaticamente, do lado do
 * servidor.
 */
export async function atualizarUsuario(
  id: number,
  dados: Record<string, unknown>,
): Promise<Resultado> {
  return chamar(`/usuario/admin/usuarios/${id}`, "PUT", dados);
}

/** Remove o usuário e as assinaturas dele. */
export async function excluirUsuario(id: number): Promise<Resultado> {
  return chamar(`/usuario/admin/usuarios/${id}`, "DELETE");
}

/** Ajusta o período da assinatura de cortesia. */
export async function atualizarPeriodoCortesia(
  usuarioId: number,
  dados: { dataInicio?: string; dataFim?: string },
): Promise<Resultado> {
  return chamar(`/assinatura/admin/periodo/${usuarioId}`, "PUT", dados);
}
