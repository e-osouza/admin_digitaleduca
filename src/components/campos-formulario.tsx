"use client";

import Image from "next/image";
import { useEffect, useState } from "react";

export const CONTROLE =
  "border-borda bg-superficie text-texto placeholder:text-texto-3 focus:border-acento-claro w-full rounded-lg border px-3 py-2 text-sm outline-none transition-colors";

export const BOTAO_PRIMARIO =
  "bg-acento hover:bg-acento-hover rounded-lg px-4 py-2.5 text-sm font-semibold text-white transition-colors disabled:opacity-60";

export const BOTAO_TEXTO =
  "text-texto-2 hover:text-texto hover:bg-superficie-2 rounded-lg px-4 py-2.5 text-sm font-medium transition-colors disabled:opacity-60";

export function Secao({
  titulo,
  ajuda,
  children,
}: {
  titulo: string;
  ajuda?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="border-borda-suave bg-superficie flex flex-col gap-4 rounded-xl border p-5">
      <div>
        <h2 className="text-texto font-semibold">{titulo}</h2>
        {ajuda && <p className="text-texto-3 mt-1 text-sm">{ajuda}</p>}
      </div>
      {children}
    </section>
  );
}

export function Campo({
  rotulo,
  ajuda,
  obrigatorio = false,
  children,
}: {
  rotulo: string;
  ajuda?: string;
  obrigatorio?: boolean;
  children: React.ReactNode;
}) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-texto-2 text-sm font-medium">
        {rotulo}
        {obrigatorio && <span className="text-alerta ml-0.5">*</span>}
      </span>
      {children}
      {ajuda && <span className="text-texto-3 text-xs">{ajuda}</span>}
    </label>
  );
}

/**
 * Campo de imagem com prévia. Mostra a arte atual e troca pela escolhida assim
 * que o arquivo é selecionado — sem isso não há como conferir se veio o
 * arquivo certo antes de salvar.
 */
export function CampoImagem({
  nome,
  rotulo,
  atual,
}: {
  nome: string;
  rotulo: string;
  atual?: string | null;
}) {
  const [previa, setPrevia] = useState<string | null>(null);

  useEffect(() => {
    return () => {
      if (previa) URL.revokeObjectURL(previa);
    };
  }, [previa]);

  function aoEscolher(evento: React.ChangeEvent<HTMLInputElement>) {
    const arquivo = evento.target.files?.[0];
    setPrevia((anterior) => {
      if (anterior) URL.revokeObjectURL(anterior);
      return arquivo ? URL.createObjectURL(arquivo) : null;
    });
  }

  return (
    <div className="flex flex-col gap-2">
      <span className="text-texto-2 text-sm font-medium">{rotulo}</span>

      <span className="border-borda-suave bg-superficie-2 relative block aspect-video w-full overflow-hidden rounded-lg border">
        {previa ? (
          /*
           * Blob local fica fora do next/image de propósito: o loader manda
           * para o proxy da API tudo que não começa com "/".
           */
          // eslint-disable-next-line @next/next/no-img-element
          <img src={previa} alt="" className="h-full w-full object-cover" />
        ) : atual ? (
          <Image src={atual} alt="" fill sizes="200px" className="object-cover" />
        ) : (
          <span className="text-texto-3 absolute inset-0 flex items-center justify-center text-xs">
            Sem imagem
          </span>
        )}
      </span>

      <input
        type="file"
        name={nome}
        accept="image/*"
        onChange={aoEscolher}
        className="text-texto-2 file:border-borda file:bg-superficie-2 file:text-texto file:mr-2 file:rounded-md file:border file:px-2 file:py-1 file:text-xs w-full text-xs"
      />
    </div>
  );
}

/** Barra de progresso do envio ao Vimeo. */
export function ProgressoUpload({ valor }: { valor: number }) {
  return (
    <div className="flex flex-col gap-2">
      <div className="text-texto-2 flex justify-between text-sm">
        <span>Enviando vídeo para o Vimeo…</span>
        <span>{valor}%</span>
      </div>
      <div
        role="progressbar"
        aria-valuenow={valor}
        aria-valuemin={0}
        aria-valuemax={100}
        className="bg-superficie-2 h-2 overflow-hidden rounded-full"
      >
        <div
          className="bg-acento h-full transition-[width] duration-200"
          style={{ width: `${valor}%` }}
        />
      </div>
      <p className="text-texto-3 text-xs">
        Não feche esta aba até o envio terminar.
      </p>
    </div>
  );
}

export const CAMPO_ARQUIVO =
  "text-texto-2 file:border-borda file:bg-superficie-2 file:text-texto file:mr-3 file:rounded-lg file:border file:px-3 file:py-1.5 file:text-sm w-full text-sm";

/**
 * Campo de tags separadas por vírgula, com sugestão da última tag digitada.
 *
 * O autocomplete olha só o trecho depois da última vírgula — é o que a pessoa
 * está escrevendo agora. Sugerir sobre o texto inteiro nunca casaria com nada
 * depois da primeira tag.
 *
 * Existe para conter um problema real: o painel antigo enviava IDs onde a API
 * espera nomes, e o `connectOrCreate` do backend criou centenas de tags
 * chamadas "7", "12", "807". Escolher da lista evita repetir isso.
 */
export function CampoTags({
  nomes,
  valorInicial,
}: {
  nomes: string[];
  valorInicial: string;
}) {
  const [texto, setTexto] = useState(valorInicial);

  const emDigitacao = texto.split(",").pop()?.trim().toLocaleLowerCase("pt-BR") ?? "";

  const sugestoes = emDigitacao
    ? nomes
        .filter((nome) =>
          nome.toLocaleLowerCase("pt-BR").includes(emDigitacao),
        )
        .slice(0, 8)
    : nomes.slice(0, 8);

  /** Troca o trecho em digitação pela sugestão escolhida. */
  function escolher(nome: string) {
    const partes = texto.split(",");
    partes[partes.length - 1] = ` ${nome}`;
    setTexto(`${partes.join(",").replace(/^\s+/, "")}, `);
  }

  return (
    <div className="flex flex-col gap-2">
      <input
        name="tagsTexto"
        value={texto}
        onChange={(evento) => setTexto(evento.target.value)}
        autoComplete="off"
        placeholder="marketing, vendas, gestão"
        className={CONTROLE}
      />

      {sugestoes.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {sugestoes.map((nome) => (
            <button
              key={nome}
              type="button"
              onClick={() => escolher(nome)}
              className="border-borda text-texto-2 hover:border-acento/60 hover:text-texto rounded-full border px-2.5 py-1 text-xs transition-colors"
            >
              {nome}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
