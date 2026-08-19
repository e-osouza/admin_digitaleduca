/*
  Nem todo dado quer virar gráfico. Um número único — total de usuários, nota
  média — se lê melhor grande e sozinho: não há comparação a fazer, e um
  gráfico de uma barra só é desenho a mais para dizer a mesma coisa.
*/

export function Indicador({
  rotulo,
  valor,
  apoio,
}: {
  rotulo: string;
  valor: string;
  /** Linha secundária: a leitura que o número sozinho não entrega. */
  apoio?: string;
}) {
  return (
    <div className="border-borda-suave bg-superficie rounded-xl border p-4">
      <p className="text-texto-3 text-sm">{rotulo}</p>
      <p className="text-texto mt-1 text-2xl font-semibold tabular-nums">
        {valor}
      </p>
      {apoio ? <p className="text-texto-3 mt-0.5 text-xs">{apoio}</p> : null}
    </div>
  );
}

export function GradeIndicadores({
  titulo,
  children,
}: {
  titulo?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="flex flex-col gap-3">
      {titulo ? (
        <h2 className="text-texto-3 text-sm font-semibold tracking-wide uppercase">
          {titulo}
        </h2>
      ) : null}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">{children}</div>
    </section>
  );
}
