import { NextResponse, type NextRequest } from "next/server";
import { NOME_COOKIE_SESSAO } from "@/lib/session";

/**
 * No painel a lógica é invertida em relação à plataforma do aluno: lá só
 * algumas rotas são privadas, aqui **tudo** é, exceto o login. Uma lista de
 * exceções é mais segura que uma lista de protegidas — tela nova nasce
 * fechada, sem depender de alguém lembrar de cadastrá-la.
 */
const ROTAS_PUBLICAS = ["/entrar"];

export function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl;

  const publica = ROTAS_PUBLICAS.some(
    (rota) => pathname === rota || pathname.startsWith(`${rota}/`),
  );
  if (publica) return NextResponse.next();

  // A presença do cookie é só o primeiro filtro: a API continua sendo a
  // autoridade sobre a validade do token e sobre a role SUPERADMIN.
  if (request.cookies.has(NOME_COOKIE_SESSAO)) return NextResponse.next();

  const destino = new URL("/entrar", request.url);
  destino.searchParams.set("proximo", `${pathname}${search}`);
  return NextResponse.redirect(destino);
}

export const config = {
  /*
   * Exclui a API, os internos do Next e QUALQUER arquivo com extensão.
   *
   * A lista original só dispensava `.svg`, e isso derrubava o favicon: o Next
   * serve `icon.png`/`apple-icon.png` como rotas da aplicação, então o proxy
   * as interceptava e respondia 307 para o login — o ícone não aparecia na
   * aba de quem ainda não entrou.
   */
  matcher: [
    "/((?!api|_next|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|txt|xml|webmanifest)$).*)",
  ],
};
