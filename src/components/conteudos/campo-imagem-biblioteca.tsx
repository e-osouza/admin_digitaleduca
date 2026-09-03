"use client";

import { useState } from "react";
import Image from "next/image";
import { ModalMidia } from "@/components/conteudos/modal-midia";

/*
  Campo de imagem no estilo WordPress: em vez de um <input type="file">, um
  botão que abre a biblioteca de mídia (escolher existente OU enviar nova). O
  valor guardado é o CAMINHO da imagem ("uploads/x.jpg"), enviado ao backend
  como texto — selecionar uma imagem já existente não reenvia nada.

  Usado onde o backend aceita capa por caminho (conteúdo e podcast). Os demais
  formulários continuam com o `CampoImagem` de upload direto.
*/
export function CampoImagemBiblioteca({
  nome,
  rotulo,
  atual,
}: {
  /** Campo do FormData que recebe o caminho da imagem. */
  nome: string;
  rotulo: string;
  atual?: string | null;
}) {
  const [valor, setValor] = useState<string>(atual ?? "");
  const [aberto, setAberto] = useState(false);

  return (
    <div className="flex flex-col gap-2">
      <span className="text-texto-2 text-sm font-medium">{rotulo}</span>

      <button
        type="button"
        onClick={() => setAberto(true)}
        className="border-borda-suave bg-superficie-2 hover:border-acento group relative block aspect-video w-full overflow-hidden rounded-lg border transition-colors"
      >
        {valor ? (
          <Image src={valor} alt="" fill sizes="240px" className="object-cover" />
        ) : (
          <span className="text-texto-3 absolute inset-0 flex items-center justify-center text-xs">
            Escolher imagem
          </span>
        )}
        <span className="ease-suave absolute inset-0 flex items-center justify-center bg-black/0 text-sm font-medium text-white opacity-0 transition-all group-hover:bg-black/40 group-hover:opacity-100">
          {valor ? "Trocar imagem" : "Escolher imagem"}
        </span>
      </button>

      {valor && (
        <button
          type="button"
          onClick={() => setValor("")}
          className="text-texto-3 hover:text-alerta w-fit text-xs"
        >
          Remover
        </button>
      )}

      {/* Vai como texto no FormData; vazio não é enviado (mantém a atual na edição). */}
      <input type="hidden" name={nome} value={valor} />

      <ModalMidia
        aberto={aberto}
        aoFechar={() => setAberto(false)}
        aoEscolher={(src) => {
          setValor(src);
          setAberto(false);
        }}
      />
    </div>
  );
}
