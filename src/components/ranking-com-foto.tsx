import Image from "next/image";

/*
  Ranking com foto.

  É um gráfico de barras, só que montado em HTML em vez de SVG. O motivo é a
  foto: dentro do SVG do Recharts o avatar seria um `<image>` cru — fora do
  loader de imagem da API, sem o recorte redondo fácil e sem a inicial de
  reserva para a maioria que não tem foto cadastrada. Em HTML tudo isso é
  natural, e a lista ainda vira uma `<ol>` de verdade para quem navega por
  leitor de tela.

  Serve para qualquer ranking de PESSOA — instrutor ou usuário.

  As regras de marca continuam as mesmas do resto: barra fina, ponta
  arredondada só do lado do dado, respiro entre as barras, valor sempre escrito
  ao lado — comprimento estima, número informa.
*/

export type LinhaRanking = {
  id: number;
  nome: string;
  avatar: string | null;
  valor: number;
  apoio: string;
  /** Etiqueta curta ao lado do nome, quando há algo a ressalvar (papel, status). */
  marca?: string;
};

export function RankingComFoto({
  itens,
  formatar,
}: {
  itens: LinhaRanking[];
  formatar: (valor: number) => string;
}) {
  /* A barra é proporcional ao primeiro colocado, não ao total: a leitura aqui
     é "quanto deste em relação ao maior", não parte sobre o todo. */
  const maior = Math.max(...itens.map((i) => i.valor), 1);

  return (
    <ol className="flex flex-col gap-2">
      {itens.map((item) => (
        <li key={item.id} className="flex items-center gap-3">
          <span className="bg-superficie-2 relative size-9 shrink-0 overflow-hidden rounded-full">
            {item.avatar ? (
              <Image
                src={item.avatar}
                alt=""
                fill
                sizes="36px"
                className="object-cover"
              />
            ) : (
              /* Sem foto é o caso comum, não a exceção — 60 dos 79
                 instrutores, quase todos os usuários. Por isso a inicial tem
                 tratamento próprio, e não um quadrado cinza vazio. */
              <span className="text-acento bg-acento/15 absolute inset-0 flex items-center justify-center text-sm font-semibold">
                {item.nome.charAt(0).toUpperCase()}
              </span>
            )}
          </span>

          <span className="flex w-32 shrink-0 items-center gap-1.5 sm:w-44">
            <span className="text-texto-2 truncate text-sm">{item.nome}</span>
            {item.marca ? (
              <span className="text-aviso bg-aviso/12 shrink-0 rounded px-1.5 py-0.5 text-[10px] font-semibold">
                {item.marca}
              </span>
            ) : null}
          </span>

          <span className="bg-superficie-2/60 relative h-6 min-w-12 flex-1 overflow-hidden rounded-r">
            <span
              className="bg-serie-1 absolute inset-y-0 left-0 rounded-r"
              style={{ width: `${(item.valor / maior) * 100}%` }}
            />
          </span>

          <span className="text-texto w-14 shrink-0 text-right text-sm font-medium tabular-nums">
            {formatar(item.valor)}
          </span>
          <span className="text-texto-3 hidden w-32 shrink-0 text-right text-xs whitespace-nowrap sm:block">
            {item.apoio}
          </span>
        </li>
      ))}
    </ol>
  );
}
