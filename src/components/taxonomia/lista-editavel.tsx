"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent, type ReactNode } from "react";
import { CONTROLE } from "@/components/campos-formulario";

export type Resultado = { ok: true } | { ok: false; erro: string };

export type ItemTaxonomia = {
  id: number;
  nome: string;
  /** Quantos conteúdos dependem deste item. */
  uso: number;
};

/**
 * Lista com renomear e excluir em linha, compartilhada pelas três abas da
 * taxonomia. O que muda entre elas é a CONSEQUÊNCIA da exclusão — por isso o
 * aviso vem de fora, e não é montado aqui.
 */
export function ListaEditavel({
  itens,
  aoRenomear,
  aoExcluir,
  avisoExclusao,
  rotuloUso,
  vazio,
  extra,
}: {
  itens: ItemTaxonomia[];
  aoRenomear: (id: number, nome: string) => Promise<Resultado>;
  aoExcluir: (id: number) => Promise<Resultado>;
  /** Texto de confirmação. Recebe o item para poder citar o número de usos. */
  avisoExclusao: (item: ItemTaxonomia) => ReactNode;
  rotuloUso: (uso: number) => string;
  vazio: string;
  /** Coluna adicional, ex.: a categoria de uma subcategoria. */
  extra?: (item: ItemTaxonomia) => ReactNode;
}) {
  const [erro, setErro] = useState<string | null>(null);

  if (itens.length === 0) {
    return <p className="text-texto-3 text-sm">{vazio}</p>;
  }

  return (
    <div className="flex flex-col gap-2">
      {erro && (
        <p
          role="alert"
          className="border-alerta/30 bg-alerta/10 text-alerta rounded-lg border px-3 py-2 text-sm"
        >
          {erro}
        </p>
      )}

      {/*
        `bg-superficie` e não branco literal: no tema escuro o token vira
        #141e30, então a lista continua legível em vez de virar um bloco
        branco no meio do escuro.
      */}
      <ul className="border-borda-suave divide-borda-suave bg-superficie divide-y overflow-hidden rounded-lg border">
        {itens.map((item) => (
          <Linha
            key={item.id}
            item={item}
            aoRenomear={aoRenomear}
            aoExcluir={aoExcluir}
            avisoExclusao={avisoExclusao}
            rotuloUso={rotuloUso}
            extra={extra}
            aoFalhar={setErro}
          />
        ))}
      </ul>
    </div>
  );
}

function Linha({
  item,
  aoRenomear,
  aoExcluir,
  avisoExclusao,
  rotuloUso,
  extra,
  aoFalhar,
}: {
  item: ItemTaxonomia;
  aoRenomear: (id: number, nome: string) => Promise<Resultado>;
  aoExcluir: (id: number) => Promise<Resultado>;
  avisoExclusao: (item: ItemTaxonomia) => ReactNode;
  rotuloUso: (uso: number) => string;
  extra?: (item: ItemTaxonomia) => ReactNode;
  aoFalhar: (mensagem: string) => void;
}) {
  const router = useRouter();
  const [editando, setEditando] = useState(false);
  const [confirmando, setConfirmando] = useState(false);
  const [ocupado, setOcupado] = useState(false);

  async function salvar(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    const nome = String(
      new FormData(evento.currentTarget).get("nome") ?? "",
    ).trim();

    if (!nome || nome === item.nome) {
      setEditando(false);
      return;
    }

    setOcupado(true);
    const resultado = await aoRenomear(item.id, nome);
    setOcupado(false);

    if (!resultado.ok) {
      aoFalhar(resultado.erro);
      return;
    }

    setEditando(false);
    router.refresh();
  }

  async function excluir() {
    setOcupado(true);
    const resultado = await aoExcluir(item.id);
    setOcupado(false);

    if (!resultado.ok) {
      aoFalhar(resultado.erro);
      setConfirmando(false);
      return;
    }

    router.refresh();
  }

  if (editando) {
    return (
      <li className="p-2">
        <form onSubmit={salvar} className="flex items-center gap-2">
          <input
            name="nome"
            defaultValue={item.nome}
            autoFocus
            required
            className={`${CONTROLE} flex-1`}
          />
          <button
            type="submit"
            disabled={ocupado}
            className="text-acento shrink-0 text-sm font-semibold disabled:opacity-60"
          >
            {ocupado ? "Salvando…" : "Salvar"}
          </button>
          <button
            type="button"
            onClick={() => setEditando(false)}
            disabled={ocupado}
            className="text-texto-2 shrink-0 text-sm"
          >
            Cancelar
          </button>
        </form>
      </li>
    );
  }

  if (confirmando) {
    return (
      <li className="bg-alerta/5 p-3">
        <div className="text-texto text-sm">{avisoExclusao(item)}</div>
        <div className="mt-2 flex gap-2">
          <button
            type="button"
            onClick={excluir}
            disabled={ocupado}
            className="bg-alerta rounded-lg px-3 py-1.5 text-xs font-semibold text-white disabled:opacity-60"
          >
            {ocupado ? "Excluindo…" : "Confirmar exclusão"}
          </button>
          <button
            type="button"
            onClick={() => setConfirmando(false)}
            disabled={ocupado}
            className="text-texto-2 hover:bg-superficie-2 rounded-lg px-3 py-1.5 text-xs font-medium"
          >
            Cancelar
          </button>
        </div>
      </li>
    );
  }

  return (
    <li className="hover:bg-superficie-2 flex items-center gap-3 px-3 py-2.5 text-sm">
      <span className="text-texto min-w-0 flex-1 truncate font-medium">
        {item.nome}
      </span>

      {extra && (
        <span className="text-texto-3 shrink-0 text-xs">{extra(item)}</span>
      )}

      <span className="text-texto-3 shrink-0 text-xs">{rotuloUso(item.uso)}</span>

      <button
        type="button"
        onClick={() => setEditando(true)}
        className="text-texto-2 hover:text-texto shrink-0 text-xs font-medium"
      >
        Renomear
      </button>
      <button
        type="button"
        onClick={() => setConfirmando(true)}
        className="text-alerta shrink-0 text-xs font-medium"
      >
        Excluir
      </button>
    </li>
  );
}

/** Formulário de criação, em uma linha. */
export function NovoItem({
  rotulo,
  espaco,
  aoCriar,
  children,
}: {
  rotulo: string;
  espaco: string;
  aoCriar: (nome: string, formulario: HTMLFormElement) => Promise<Resultado>;
  /** Campos extras, ex.: o seletor de categoria da subcategoria. */
  children?: ReactNode;
}) {
  const router = useRouter();
  const [erro, setErro] = useState<string | null>(null);
  const [salvando, setSalvando] = useState(false);

  async function criar(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    const formulario = evento.currentTarget;
    const nome = String(new FormData(formulario).get("nome") ?? "").trim();
    if (!nome) return;

    setErro(null);
    setSalvando(true);
    const resultado = await aoCriar(nome, formulario);
    setSalvando(false);

    if (!resultado.ok) {
      setErro(resultado.erro);
      return;
    }

    formulario.reset();
    router.refresh();
  }

  return (
    <form onSubmit={criar} className="flex flex-col gap-2">
      <div className="flex flex-wrap items-center gap-2">
        <input
          name="nome"
          required
          placeholder={espaco}
          className={`${CONTROLE} min-w-48 flex-1`}
        />
        {children}
        <button
          type="submit"
          disabled={salvando}
          className="bg-acento hover:bg-acento-hover shrink-0 rounded-lg px-4 py-2 text-sm font-semibold text-white transition-colors disabled:opacity-60"
        >
          {salvando ? "Criando…" : rotulo}
        </button>
      </div>

      {erro && (
        <p role="alert" className="text-alerta text-sm">
          {erro}
        </p>
      )}
    </form>
  );
}
