"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect, useState, type FormEvent } from "react";
import {
  atualizarInstrutor,
  criarInstrutor,
  excluirInstrutor,
} from "@/app/(painel)/instrutores/acoes";
import {
  BOTAO_PRIMARIO,
  BOTAO_TEXTO,
  CAMPO_ARQUIVO,
  CONTROLE,
  Campo,
} from "@/components/campos-formulario";
import type { Instrutor } from "@/types/api";

/**
 * Cria ou edita um instrutor.
 *
 * `nome`, `formacao` e `sobre` são obrigatórios na criação — o backend os
 * declara sem `@IsOptional()`. Na edição só vai o que foi preenchido, para não
 * apagar um texto existente com string vazia.
 */
export function FormularioInstrutor({
  instrutor,
  aoFechar,
}: {
  instrutor?: Instrutor;
  aoFechar: () => void;
}) {
  const router = useRouter();
  const editando = Boolean(instrutor);

  const [erro, setErro] = useState<string | null>(null);
  const [salvando, setSalvando] = useState(false);
  const [previa, setPrevia] = useState<string | null>(null);
  const [removerFoto, setRemoverFoto] = useState(false);

  useEffect(() => {
    return () => {
      if (previa) URL.revokeObjectURL(previa);
    };
  }, [previa]);

  function aoEscolherFoto(evento: React.ChangeEvent<HTMLInputElement>) {
    const arquivo = evento.target.files?.[0];
    if (arquivo) setRemoverFoto(false);
    setPrevia((anterior) => {
      if (anterior) URL.revokeObjectURL(anterior);
      return arquivo ? URL.createObjectURL(arquivo) : null;
    });
  }

  async function enviar(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    setErro(null);
    setSalvando(true);

    const dados = new FormData(evento.currentTarget);

    const resultado =
      editando && instrutor
        ? await atualizarInstrutor(instrutor.id, dados)
        : await criarInstrutor(dados);

    setSalvando(false);

    if (!resultado.ok) {
      setErro(resultado.erro);
      return;
    }

    aoFechar();
    router.refresh();
  }

  const fotoAtual = removerFoto ? null : (instrutor?.avatar ?? null);

  return (
    <form
      onSubmit={enviar}
      className="border-borda bg-superficie-2 flex flex-col gap-4 rounded-xl border p-5"
    >
      <h2 className="text-texto font-semibold">
        {editando ? `Editar ${instrutor?.nome}` : "Novo instrutor"}
      </h2>

      <div className="flex flex-col gap-4 sm:flex-row">
        <div className="flex w-32 shrink-0 flex-col gap-2">
          <span className="bg-superficie border-borda-suave relative block aspect-square w-32 overflow-hidden rounded-full border">
            {previa ? (
              // Blob local fica fora do next/image: o loader manda para o
              // proxy da API tudo que não começa com "/".
              // eslint-disable-next-line @next/next/no-img-element
              <img src={previa} alt="" className="h-full w-full object-cover" />
            ) : fotoAtual ? (
              <Image
                src={fotoAtual}
                alt=""
                fill
                sizes="128px"
                className="object-cover"
              />
            ) : (
              <span className="text-texto-3 absolute inset-0 flex items-center justify-center text-xs">
                Sem foto
              </span>
            )}
          </span>

          <input
            type="file"
            name="avatar"
            accept="image/*"
            onChange={aoEscolherFoto}
            className={CAMPO_ARQUIVO}
          />

          {editando && instrutor?.avatar && !previa && (
            <label className="text-texto-2 flex items-center gap-1.5 text-xs">
              <input
                type="checkbox"
                name="removerAvatar"
                checked={removerFoto}
                onChange={(e) => setRemoverFoto(e.target.checked)}
                className="accent-acento h-3.5 w-3.5"
              />
              Remover a foto atual
            </label>
          )}
        </div>

        <div className="flex min-w-0 flex-1 flex-col gap-4">
          <Campo rotulo="Nome" obrigatorio>
            <input
              name="nome"
              required
              defaultValue={instrutor?.nome ?? ""}
              className={CONTROLE}
            />
          </Campo>

          <Campo
            rotulo="Formação"
            obrigatorio={!editando}
            ajuda="Aparece na vitrine pública da plataforma do aluno."
          >
            <input
              name="formacao"
              required={!editando}
              defaultValue={instrutor?.formacao ?? ""}
              className={CONTROLE}
            />
          </Campo>

          <Campo rotulo="Sobre" obrigatorio={!editando}>
            <textarea
              name="sobre"
              rows={4}
              required={!editando}
              defaultValue={instrutor?.sobre ?? ""}
              className={`${CONTROLE} resize-y`}
            />
          </Campo>
        </div>
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
        <button type="submit" disabled={salvando} className={BOTAO_PRIMARIO}>
          {salvando ? "Salvando…" : editando ? "Salvar" : "Criar instrutor"}
        </button>
        <button
          type="button"
          onClick={aoFechar}
          disabled={salvando}
          className={BOTAO_TEXTO}
        >
          Cancelar
        </button>
      </div>
    </form>
  );
}

/** Confirmação de exclusão, com o efeito real explicado. */
export function BotaoExcluirInstrutor({
  id,
  nome,
  totalConteudos,
}: {
  id: number;
  nome: string;
  totalConteudos: number;
}) {
  const router = useRouter();
  const [confirmando, setConfirmando] = useState(false);
  const [ocupado, setOcupado] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  async function excluir() {
    setOcupado(true);
    const resultado = await excluirInstrutor(id);
    setOcupado(false);

    if (!resultado.ok) {
      setErro(resultado.erro);
      setConfirmando(false);
      return;
    }

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
        Excluir <strong>{nome}</strong> e a foto do servidor?
        {totalConteudos > 0 ? (
          <>
            {" "}
            {totalConteudos}{" "}
            {totalConteudos === 1 ? "conteúdo fica" : "conteúdos ficam"} sem
            essa pessoa creditada — nenhum conteúdo é apagado.
          </>
        ) : (
          " Não há conteúdo vinculado."
        )}
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
