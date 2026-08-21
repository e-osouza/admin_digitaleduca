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

export async function salvarConfigApp(entrada: FormData): Promise<Resultado> {
  const token = await lerToken();
  if (!token) return { ok: false, erro: "Sessão expirada." };

  const texto = (campo: string) => {
    const valor = entrada.get(campo);
    return typeof valor === "string" ? valor.trim() : "";
  };

  /*
   * Todos os campos vão em toda gravação, inclusive os vazios.
   *
   * O DTO é todo opcional e o backend faz um `update` com o que chegar — chave
   * ausente significa "não mexe". Se o campo vazio virasse `undefined`, o
   * admin apagaria uma URL de loja, salvaria, e o valor antigo continuaria no
   * banco. String vazia limpa de fato.
   *
   * O DTO não aceita `null`, só `string`, então limpar é gravar `""`.
   */
  const corpo = {
    minBuildAndroid: Number(texto("minBuildAndroid") || 0),
    minBuildIos: Number(texto("minBuildIos") || 0),
    storeUrlAndroid: texto("storeUrlAndroid"),
    storeUrlIos: texto("storeUrlIos"),
    mensagemUpdate: texto("mensagemUpdate"),
    // Checkbox ausente é desmarcado — o valor vai sempre explícito.
    slideDestaqueAtivo: entrada.get("slideDestaqueAtivo") ? true : false,
  };

  const resposta = await fetch(`${API_URL}/app/config`, {
    method: "PUT",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(corpo),
    cache: "no-store",
  });

  if (!resposta.ok) return { ok: false, erro: await mensagemDeErro(resposta) };

  revalidatePath("/configuracoes");
  return { ok: true };
}
