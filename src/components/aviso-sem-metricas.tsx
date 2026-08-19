/**
 * As rotas `/dashboard/*` do backend não usam o JWT do login: elas exigem um
 * segredo estático próprio. Quando ele falta, tudo responde 401 e a tela ficaria
 * apenas vazia — sem pista do motivo. Este aviso troca o vazio pela causa.
 */
export function AvisoSemMetricas() {
  return (
    <p
      role="alert"
      className="border-borda bg-superficie text-texto-2 rounded-xl border p-4 text-sm"
    >
      As métricas não carregaram. As rotas <code>/dashboard/*</code> usam um
      segredo próprio, separado do login: preencha <code>DASHBOARD_TOKEN</code>{" "}
      no <code>.env.local</code> com o valor do <code>.env</code> do backend.
    </p>
  );
}
