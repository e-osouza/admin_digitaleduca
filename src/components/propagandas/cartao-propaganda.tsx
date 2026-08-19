"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect, useState, type FormEvent } from "react";
import {
  atualizarPropaganda,
  criarPropaganda,
  excluirPropaganda,
} from "@/app/(painel)/propagandas/acoes";
import { CAMPO_ARQUIVO, CONTROLE } from "@/components/campos-formulario";
import type { Propaganda } from "@/types/api";

/**
 * Cria ou edita um banner.
 *
 * A imagem é obrigatória na criação e opcional na edição — enviar uma nova
 * substitui e o backend apaga a anterior do disco. Ele também comprime para
 * WebP com largura máxima de 1600px, então não é preciso otimizar antes.
 */
export function FormularioPropaganda({
  propaganda,
}: {
  propaganda?: Propaganda;
}) {
  const router = useRouter();
  const editando = Boolean(propaganda);

  const [erro, setErro] = useState<string | null>(null);
  const [salvando, setSalvando] = useState(false);
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

  async function salvar(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    setErro(null);
    setSalvando(true);

    const dados = new FormData(evento.currentTarget);
    const resultado =
      editando && propaganda
        ? await atualizarPropaganda(propaganda.id, dados)
        : await criarPropaganda(dados);

    setSalvando(false);

    if (!resultado.ok) {
      setErro(resultado.erro);
      return;
    }

    router.push(
      editando ? "/propagandas?feito=salvo" : "/propagandas?feito=criado",
    );
    router.refresh();
  }

  return (
    <form
      onSubmit={salvar}
      className="border-borda-suave bg-superficie flex flex-col gap-4 rounded-xl border p-5"
    >
      <span className="border-borda-suave bg-superficie relative block aspect-[16/6] w-full overflow-hidden rounded-lg border">
        {previa ? (
          // Blob local fica fora do next/image: o loader manda para o proxy da
          // API tudo que não começa com "/".
          // eslint-disable-next-line @next/next/no-img-element
          <img src={previa} alt="" className="h-full w-full object-cover" />
        ) : propaganda?.imagem ? (
          <Image
            src={propaganda.imagem}
            alt=""
            fill
            sizes="(min-width: 640px) 600px, 100vw"
            className="object-cover"
          />
        ) : (
          <span className="text-texto-3 absolute inset-0 flex items-center justify-center text-sm">
            Sem imagem
          </span>
        )}
      </span>

      <label className="flex flex-col gap-1.5">
        <span className="text-texto-2 text-sm font-medium">
          Imagem do banner
          {!editando && <span className="text-alerta ml-0.5">*</span>}
        </span>
        <input
          type="file"
          name="imagem"
          accept="image/*"
          required={!editando}
          onChange={aoEscolher}
          className={CAMPO_ARQUIVO}
        />
        <span className="text-texto-3 text-xs">
          {editando
            ? "Envie um arquivo só para substituir a atual."
            : "Obrigatória. É comprimida para WebP com até 1600px de largura."}
        </span>
      </label>

      <label className="flex flex-col gap-1.5">
        <span className="text-texto-2 text-sm font-medium">
          Link de destino<span className="text-alerta ml-0.5">*</span>
        </span>
        <input
          name="link"
          required
          defaultValue={propaganda?.link ?? ""}
          placeholder="https://digitaleduca.com.vc/planos ou /planos"
          className={CONTROLE}
        />
      </label>

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="flex flex-col gap-1.5">
          <span className="text-texto-2 text-sm font-medium">Título</span>
          <input
            name="titulo"
            defaultValue={propaganda?.titulo ?? ""}
            className={CONTROLE}
          />
        </label>

        <label className="flex flex-col gap-1.5">
          <span className="text-texto-2 text-sm font-medium">Ordem</span>
          <input
            type="number"
            name="ordem"
            min={0}
            defaultValue={propaganda?.ordem ?? 0}
            className={CONTROLE}
          />
          <span className="text-texto-3 text-xs">
            Menor aparece primeiro no app.
          </span>
        </label>
      </div>

      <div className="flex flex-col gap-2">
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            name="ativo"
            defaultChecked={propaganda?.ativo ?? true}
            className="accent-acento h-4 w-4"
          />
          <span className="text-texto-2">
            Ativo — só os ativos aparecem no app
          </span>
        </label>

        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            name="novaAba"
            defaultChecked={propaganda?.novaAba ?? false}
            className="accent-acento h-4 w-4"
          />
          <span className="text-texto-2">Abrir em uma nova aba</span>
        </label>

        <p className="text-texto-3 text-xs">
          Faz sentido para destinos externos. Um link interno da plataforma
          normalmente abre na mesma aba, para não perder o contexto.
        </p>
      </div>

      {erro && (
        <p
          role="alert"
          className="border-alerta/30 bg-alerta/10 text-alerta rounded-lg border px-3 py-2 text-sm"
        >
          {erro}
        </p>
      )}

      <div className="border-borda-suave flex items-center gap-3 border-t pt-4">
        <button
          type="submit"
          disabled={salvando}
          className="bg-acento hover:bg-acento-hover rounded-lg px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-60"
        >
          {salvando ? "Salvando…" : editando ? "Salvar" : "Criar banner"}
        </button>
        <button
          type="button"
          onClick={() => router.push("/propagandas")}
          disabled={salvando}
          className="text-texto-2 hover:text-texto rounded-lg px-4 py-2.5 text-sm font-medium disabled:opacity-60"
        >
          Cancelar
        </button>

        {propaganda && (
          <div className="ml-auto">
            <BotaoExcluirPropaganda
              id={propaganda.id}
              titulo={propaganda.titulo || "este banner"}
            />
          </div>
        )}
      </div>
    </form>
  );
}

export function BotaoExcluirPropaganda({
  id,
  titulo,
}: {
  id: number;
  titulo: string;
}) {
  const router = useRouter();
  const [confirmando, setConfirmando] = useState(false);
  const [ocupado, setOcupado] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  async function excluir() {
    setOcupado(true);
    const resultado = await excluirPropaganda(id);
    setOcupado(false);

    if (!resultado.ok) {
      setErro(resultado.erro);
      setConfirmando(false);
      return;
    }

    router.push("/propagandas?feito=excluido");
    router.refresh();
  }

  if (!confirmando) {
    return (
      <div className="flex flex-col items-end gap-1">
        <button
          type="button"
          onClick={() => setConfirmando(true)}
          className="text-alerta text-xs font-medium"
        >
          Excluir
        </button>
        {erro && (
          <p role="alert" className="text-alerta text-xs">
            {erro}
          </p>
        )}
      </div>
    );
  }

  return (
    <div className="border-alerta/40 bg-alerta/5 flex flex-col gap-2 rounded-lg border p-3">
      <p className="text-texto text-sm">
        Excluir <strong>{titulo}</strong>? A imagem é apagada do servidor.
      </p>
      <div className="flex gap-2">
        <button
          type="button"
          onClick={excluir}
          disabled={ocupado}
          className="bg-alerta rounded-lg px-3 py-1.5 text-xs font-semibold text-white disabled:opacity-60"
        >
          {ocupado ? "Excluindo…" : "Confirmar"}
        </button>
        <button
          type="button"
          onClick={() => setConfirmando(false)}
          disabled={ocupado}
          className="text-texto-2 rounded-lg px-3 py-1.5 text-xs font-medium"
        >
          Cancelar
        </button>
      </div>
    </div>
  );
}
