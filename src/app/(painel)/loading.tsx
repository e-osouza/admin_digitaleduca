/**
 * Esqueleto entre navegações.
 *
 * As páginas respondem rápido (abaixo de 350ms com cache quente), mas numa
 * conexão ruim ou com o cache frio a tela ficaria em branco — o esqueleto
 * mantém a estrutura visível e evita o salto de layout quando o conteúdo chega.
 */
export default function Carregando() {
  return (
    <div className="flex animate-pulse flex-col gap-5" aria-hidden="true">
      <div className="flex flex-col gap-2">
        <div className="bg-superficie-2 h-7 w-52 rounded-lg" />
        <div className="bg-superficie-2 h-4 w-32 rounded" />
      </div>

      <div className="bg-superficie-2 h-10 w-full rounded-lg" />

      <div className="border-borda-suave flex flex-col gap-px overflow-hidden rounded-xl border">
        {Array.from({ length: 6 }).map((_, indice) => (
          <div key={indice} className="bg-superficie flex items-center gap-4 p-4">
            <div className="bg-superficie-2 h-10 w-16 shrink-0 rounded-md" />
            <div className="flex min-w-0 flex-1 flex-col gap-2">
              <div className="bg-superficie-2 h-4 w-1/3 rounded" />
              <div className="bg-superficie-2 h-3 w-1/5 rounded" />
            </div>
            <div className="bg-superficie-2 h-7 w-16 shrink-0 rounded-lg" />
          </div>
        ))}
      </div>

      <span className="sr-only">Carregando…</span>
    </div>
  );
}
