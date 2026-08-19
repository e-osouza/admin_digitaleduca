import "server-only";
import { lerToken } from "@/lib/session";

export const API_URL =
  process.env.NEXT_PUBLIC_API_URL ?? "https://api-dev.digitaleduca.com.vc";

/**
 * Segredo compartilhado das rotas `/dashboard/*`. Elas NÃO usam o JWT: o
 * backend compara este valor fixo num guard próprio (`DashboardTokenGuard`).
 * Sem `NEXT_PUBLIC_`, de propósito — nunca pode chegar ao browser.
 */
const DASHBOARD_TOKEN = process.env.DASHBOARD_TOKEN;

export class ApiError extends Error {
  constructor(
    readonly status: number,
    readonly rota: string,
    mensagem: string,
  ) {
    super(mensagem);
    this.name = "ApiError";
  }

  get naoAutenticado() {
    return this.status === 401;
  }

  get semPermissao() {
    return this.status === 403;
  }

  get naoEncontrado() {
    return this.status === 404;
  }

  /**
   * A API valida com `whitelist + forbidNonWhitelisted`: qualquer campo a mais
   * no corpo vira 400 com a lista do que foi recusado. Distinguir isso de um
   * erro de negócio evita mostrar "algo deu errado" quando o problema é o
   * formulário mandando um campo que o DTO não aceita.
   */
  get erroDeValidacao() {
    return this.status === 400;
  }
}

/**
 * Qual credencial a rota exige:
 * - `jwt`       → `Authorization: Bearer <token>` (todo o CRUD administrativo)
 * - `dashboard` → `x-dashboard-token` (apenas `/dashboard/*`)
 * - `publica`   → nenhuma (listagens abertas: planos, categorias, tags…)
 */
type Autenticacao = "jwt" | "dashboard" | "publica";

type Opcoes = Omit<RequestInit, "cache"> & {
  auth?: Autenticacao;
  /** Segundos de cache no Data Cache do Next. `false` desliga. */
  revalidar?: number | false;
};

/**
 * Cliente HTTP da API DigitalEduca. Só roda no servidor: nem o JWT (cookie
 * httpOnly) nem o token do dashboard podem ser expostos ao JavaScript do
 * browser. As telas chamam isto de Server Components; as mutações passam por
 * route handlers em `src/app/api`.
 */
export async function api<T>(rota: string, opcoes: Opcoes = {}): Promise<T> {
  const { auth = "jwt", revalidar, headers, ...init } = opcoes;

  const cabecalhos = new Headers(headers);
  if (!cabecalhos.has("Accept")) cabecalhos.set("Accept", "application/json");

  if (auth === "jwt") {
    const token = await lerToken();
    if (!token) throw new ApiError(401, rota, "Sessão ausente ou expirada.");
    cabecalhos.set("Authorization", `Bearer ${token}`);
  }

  if (auth === "dashboard") {
    if (!DASHBOARD_TOKEN) {
      throw new ApiError(
        500,
        rota,
        "DASHBOARD_TOKEN não configurado. As métricas do painel não funcionam sem ele.",
      );
    }
    cabecalhos.set("x-dashboard-token", DASHBOARD_TOKEN);
  }

  const resposta = await fetch(`${API_URL}${rota}`, {
    ...init,
    headers: cabecalhos,
    ...(revalidar === false
      ? { cache: "no-store" as const }
      : { next: { revalidate: revalidar ?? 60 } }),
  });

  if (!resposta.ok) {
    throw new ApiError(resposta.status, rota, await extrairMensagem(resposta));
  }

  if (resposta.status === 204) return undefined as T;

  /*
   * Vários endpoints respondem 200 com corpo vazio quando não há o que
   * devolver. Chamar `.json()` direto nesse caso lança SyntaxError, que não é
   * ApiError e escaparia do tratamento das telas.
   */
  const texto = await resposta.text();
  if (texto.trim().length === 0) return undefined as T;

  try {
    return JSON.parse(texto) as T;
  } catch {
    throw new ApiError(
      resposta.status,
      rota,
      "A API devolveu uma resposta que não é JSON.",
    );
  }
}

/** Igual a `api`, mas devolve `null` em vez de lançar. Para blocos opcionais da página. */
export async function apiOpcional<T>(
  rota: string,
  opcoes: Opcoes = {},
): Promise<T | null> {
  try {
    return (await api<T>(rota, opcoes)) ?? null;
  } catch (erro) {
    if (erro instanceof ApiError) return null;
    throw erro;
  }
}

async function extrairMensagem(resposta: Response): Promise<string> {
  try {
    const corpo = await resposta.json();
    const msg = (corpo as { message?: string | string[] }).message;
    if (Array.isArray(msg)) return msg.join(", ");
    if (typeof msg === "string") return msg;
  } catch {
    // resposta sem corpo JSON — cai no texto padrão
  }
  return `${resposta.status} ${resposta.statusText}`;
}
