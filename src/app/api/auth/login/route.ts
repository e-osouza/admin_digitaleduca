import { NextResponse } from "next/server";
import { API_URL } from "@/lib/api";
import { gravarToken, lerSessaoDoToken } from "@/lib/session";
import type { LoginResponse } from "@/types/api";

/**
 * Login do painel. Além de autenticar, confirma que a conta é SUPERADMIN.
 *
 * A API aceita o login de qualquer usuário — quem não é admin só tomaria 403
 * depois, tela a tela. Barrar aqui evita entregar um painel que vai falhar em
 * todas as chamadas.
 *
 * A role NÃO vem de `/usuario/me` nem de `/auth/check`: os dois removem o
 * campo `role` da resposta de propósito. Ela vem do claim do JWT, que é
 * exatamente o que o `RoleGuard` do backend usa para autorizar.
 */
export async function POST(request: Request) {
  let corpo: { email?: string; senha?: string };
  try {
    corpo = await request.json();
  } catch {
    return NextResponse.json({ erro: "Requisição inválida." }, { status: 400 });
  }

  const email = corpo.email?.trim().toLowerCase();
  const senha = corpo.senha;

  if (!email || !senha) {
    return NextResponse.json(
      { erro: "Informe e-mail e senha." },
      { status: 400 },
    );
  }

  const resposta = await fetch(`${API_URL}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, senha }),
    cache: "no-store",
  });

  if (!resposta.ok) {
    // Mensagem genérica de propósito: não revelamos se o e-mail existe.
    return NextResponse.json(
      { erro: "E-mail ou senha incorretos." },
      { status: 401 },
    );
  }

  const { access_token } = (await resposta.json()) as LoginResponse;
  if (!access_token) {
    return NextResponse.json(
      { erro: "A API não devolveu um token de acesso." },
      { status: 502 },
    );
  }

  const sessao = lerSessaoDoToken(access_token);
  if (!sessao) {
    return NextResponse.json(
      { erro: "A API devolveu um token em formato inesperado." },
      { status: 502 },
    );
  }

  if (sessao.role !== "SUPERADMIN") {
    return NextResponse.json(
      { erro: "Esta conta não tem acesso ao painel administrativo." },
      { status: 403 },
    );
  }

  /*
   * O claim diz SUPERADMIN, mas quem decide é a API. Uma chamada a um endpoint
   * exclusivo de admin confirma a capacidade de verdade antes de abrirmos o
   * painel — pega, por exemplo, um token assinado com outro segredo ou uma
   * conta cujo acesso foi revogado no backend.
   *
   * `/app/config` é a sondagem mais barata: exige SUPERADMIN e devolve uma
   * única linha de configuração.
   */
  const sonda = await fetch(`${API_URL}/app/config`, {
    headers: { Authorization: `Bearer ${access_token}` },
    cache: "no-store",
  });

  if (sonda.status === 401 || sonda.status === 403) {
    return NextResponse.json(
      { erro: "Esta conta não tem acesso ao painel administrativo." },
      { status: 403 },
    );
  }

  await gravarToken(access_token);
  return NextResponse.json({ ok: true, nome: sessao.nome });
}
