"use server";

import { revalidatePath } from "next/cache";
import { API_URL } from "@/lib/api";
import { lerToken } from "@/lib/session";

export type Resultado = { ok: true } | { ok: false; erro: string };

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

  if (resposta.ok) {
    revalidatePath("/taxonomia");
    return { ok: true };
  }

  let mensagem = `A API respondeu ${resposta.status}.`;
  try {
    const erro = (await resposta.json()) as { message?: string | string[] };
    if (Array.isArray(erro.message)) mensagem = erro.message.join(", ");
    else if (erro.message) mensagem = erro.message;
  } catch {
    // sem corpo JSON
  }

  /*
   * O backend faz `prisma.delete` direto, sem checar uso. Quando a chave
   * estrangeira barra (categoria com conteúdo), o erro do Prisma vaza como 500
   * com texto interno. Traduzimos para algo acionável.
   */
  if (resposta.status >= 500 && metodo === "DELETE") {
    mensagem =
      "A API recusou a exclusão, provavelmente porque ainda há conteúdo vinculado. Mova ou remova os conteúdos antes.";
  }

  return { ok: false, erro: mensagem };
}

/* ---------------- categorias ---------------- */

export async function criarCategoria(nome: string, slug?: string) {
  return chamar("/categorias/create", "POST", { nome, slug });
}

export async function renomearCategoria(
  id: number,
  dados: { nome: string; slug?: string },
) {
  return chamar(`/categorias/${id}`, "PUT", dados);
}

export async function excluirCategoria(id: number) {
  return chamar(`/categorias/${id}`, "DELETE");
}

/* ---------------- subcategorias ---------------- */

export async function criarSubcategoria(
  nome: string,
  categoriaId: number,
  slug?: string,
) {
  return chamar("/subcategorias/create", "POST", { nome, categoriaId, slug });
}

export async function atualizarSubcategoria(
  id: number,
  dados: { nome?: string; slug?: string; categoriaId?: number },
) {
  return chamar(`/subcategorias/${id}`, "PUT", dados);
}

/**
 * ATENÇÃO: no schema, `Conteudo.subcategoria` tem `onDelete: Cascade`.
 * Excluir uma subcategoria APAGA todos os conteúdos dela — não é só um
 * desvínculo. A tela precisa avisar com o número de conteúdos afetados.
 */
export async function excluirSubcategoria(id: number) {
  return chamar(`/subcategorias/${id}`, "DELETE");
}

/* ---------------- tags ---------------- */

export async function criarTag(nome: string, slug?: string) {
  return chamar("/tags", "POST", { nome, slug });
}

export async function renomearTag(id: number, dados: { nome: string; slug?: string }) {
  return chamar(`/tags/${id}`, "PATCH", dados);
}

/** Seguro: o vínculo com conteúdo é `Cascade`, então só desassocia. */
export async function excluirTag(id: number) {
  return chamar(`/tags/${id}`, "DELETE");
}
