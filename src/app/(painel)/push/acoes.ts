"use server";

import { API_URL } from "@/lib/api";
import { lerToken } from "@/lib/session";
import type { ResultadoPush } from "@/types/api";

export type Resultado =
  | { ok: true; resultado: ResultadoPush }
  | { ok: false; erro: string };

/**
 * Dispara o push para todos os destinos.
 *
 * A API envia nos dois canais no mesmo disparo — FCM para o app e web-push
 * para os navegadores inscritos. Não há segmentação nem agendamento: é para
 * todo mundo, na hora, e não tem desfazer.
 */
export async function enviarPush(dados: {
  title: string;
  body: string;
  link?: string;
  imageUrl?: string;
}): Promise<Resultado> {
  const token = await lerToken();
  if (!token) return { ok: false, erro: "Sessão expirada." };

  const corpo: Record<string, unknown> = {
    title: dados.title,
    body: dados.body,
  };
  if (dados.link) corpo.link = dados.link;
  if (dados.imageUrl) corpo.imageUrl = dados.imageUrl;

  const resposta = await fetch(`${API_URL}/notificacoes/push`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(corpo),
    cache: "no-store",
  });

  if (!resposta.ok) {
    try {
      const erro = (await resposta.json()) as { message?: string | string[] };
      const msg = Array.isArray(erro.message)
        ? erro.message.join(", ")
        : erro.message;
      return { ok: false, erro: msg ?? `A API respondeu ${resposta.status}.` };
    } catch {
      return { ok: false, erro: `A API respondeu ${resposta.status}.` };
    }
  }

  return { ok: true, resultado: (await resposta.json()) as ResultadoPush };
}
