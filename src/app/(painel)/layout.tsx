import { redirect } from "next/navigation";
import { Suspense } from "react";
import { AppShell } from "@/components/app-shell";
import { AvisoAcao } from "@/components/aviso-acao";
import { lerSessao } from "@/lib/session";

/**
 * Shell do painel. O proxy já barrou quem não tem cookie; aqui conferimos os
 * claims do token — role e expiração — antes de renderizar qualquer tela.
 *
 * A leitura é local, sem ida à API: o `/usuario/me` não devolve o campo `role`
 * (o backend o remove da resposta), e uma requisição por navegação só para
 * confirmar o que já está no token seria desperdício. A autoridade real
 * continua sendo a API, que recusa com 403 o que este token não puder fazer.
 */
export default async function LayoutPainel({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const sessao = await lerSessao();

  if (!sessao) redirect("/entrar?motivo=sessao-expirada");
  if (sessao.role !== "SUPERADMIN") redirect("/entrar?motivo=sem-permissao");

  return (
    <AppShell nome={sessao.nome || null} email={sessao.email || null}>
      {/*
        `useSearchParams` exige Suspense. Fica aqui, acima das telas, para
        que qualquer redirecionamento com `?feito=` mostre a confirmação.
      */}
      <Suspense>
        <AvisoAcao />
      </Suspense>

      {children}
    </AppShell>
  );
}
