import "server-only";
import { cookies } from "next/headers";

export const NOME_COOKIE_SESSAO = "de_admin_sessao";

/**
 * 8 horas. O JWT da API vale 365 dias, mas um painel administrativo não deve
 * manter sessão aberta por tanto tempo: a janela curta aqui é a única defesa
 * enquanto o backend não encurta a validade do token.
 */
const DURACAO_SESSAO = 60 * 60 * 8;

export async function lerToken(): Promise<string | null> {
  const jar = await cookies();
  return jar.get(NOME_COOKIE_SESSAO)?.value ?? null;
}

export async function gravarToken(token: string): Promise<void> {
  const jar = await cookies();
  jar.set(NOME_COOKIE_SESSAO, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: DURACAO_SESSAO,
  });
}

export async function apagarToken(): Promise<void> {
  const jar = await cookies();
  jar.delete(NOME_COOKIE_SESSAO);
}

export async function estaAutenticado(): Promise<boolean> {
  return (await lerToken()) !== null;
}

/** Claims que o backend coloca no JWT (`auth.service.ts`). */
export type Sessao = {
  userId: number;
  nome: string;
  email: string;
  role: string;
  /** Expiração em segundos desde a época (claim `exp`). */
  expiraEm: number | null;
};

/**
 * Lê os claims do JWT sem verificar a assinatura.
 *
 * Não verificamos porque não precisamos: o token chegou da própria API por
 * HTTPS e vive num cookie httpOnly que o browser não consegue tocar. E, mais
 * importante, isto NÃO é o controle de acesso — a autoridade continua sendo a
 * API, que recusa com 403 qualquer chamada administrativa de um token sem
 * SUPERADMIN. Aqui só decidimos o que mostrar, para não renderizar um painel
 * inteiro que vai falhar em todas as chamadas.
 *
 * Ler o claim é o critério certo (e não o banco) porque o `RoleGuard` do
 * backend autoriza exatamente por este campo do token.
 */
export function lerSessaoDoToken(token: string): Sessao | null {
  const partes = token.split(".");
  if (partes.length !== 3) return null;

  try {
    const payload = JSON.parse(
      Buffer.from(partes[1], "base64url").toString("utf8"),
    ) as Record<string, unknown>;

    const sub = Number(payload.sub);
    if (!Number.isFinite(sub)) return null;

    return {
      userId: sub,
      nome: typeof payload.nome === "string" ? payload.nome : "",
      email: typeof payload.email === "string" ? payload.email : "",
      role: typeof payload.role === "string" ? payload.role : "",
      expiraEm: typeof payload.exp === "number" ? payload.exp : null,
    };
  } catch {
    return null;
  }
}

/** Sessão atual a partir do cookie, ou `null` se ausente, ilegível ou expirada. */
export async function lerSessao(): Promise<Sessao | null> {
  const token = await lerToken();
  if (!token) return null;

  const sessao = lerSessaoDoToken(token);
  if (!sessao) return null;

  if (sessao.expiraEm !== null && sessao.expiraEm * 1000 <= Date.now()) {
    return null;
  }

  return sessao;
}
