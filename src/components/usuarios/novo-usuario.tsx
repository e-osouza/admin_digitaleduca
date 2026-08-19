"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { criarUsuario } from "@/app/(painel)/usuarios/acoes";
import { CONTROLE } from "@/components/campos-formulario";

/** Daqui a um ano — período padrão da cortesia. */
function umAnoAFrente() {
  const data = new Date();
  data.setFullYear(data.getFullYear() + 1);
  return data.toISOString().slice(0, 10);
}

/**
 * Criação de usuário pelo painel.
 *
 * `POST /usuario/admin/create` cria o usuário JÁ com uma assinatura e exige as
 * datas — é o caminho de cortesia, para liberar acesso sem passar por
 * pagamento. Por isso o período aparece no formulário.
 */
export function NovoUsuario() {
  const router = useRouter();
  const [aberto, setAberto] = useState(false);
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  async function criar(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    setErro(null);
    setSalvando(true);

    const campos = new FormData(evento.currentTarget);
    const resultado = await criarUsuario({
      nome: String(campos.get("nome") ?? "").trim(),
      email: String(campos.get("email") ?? "").trim(),
      senha: String(campos.get("senha") ?? ""),
      celular: String(campos.get("celular") ?? "").trim(),
      role: String(campos.get("role") ?? "CORTESIA"),
      dataInicio: new Date(
        `${campos.get("dataInicio")}T12:00:00`,
      ).toISOString(),
      dataFim: new Date(`${campos.get("dataFim")}T12:00:00`).toISOString(),
    });

    setSalvando(false);

    if (!resultado.ok) {
      setErro(resultado.erro);
      return;
    }

    setAberto(false);
    router.refresh();
  }

  if (!aberto) {
    return (
      <button
        type="button"
        onClick={() => setAberto(true)}
        className="bg-acento hover:bg-acento-hover shrink-0 rounded-lg px-4 py-2.5 text-sm font-semibold text-white transition-colors"
      >
        Novo usuário
      </button>
    );
  }

  return (
    <form
      onSubmit={criar}
      className="border-borda bg-superficie-2 flex w-full flex-col gap-3 rounded-xl border p-4"
    >
      <h2 className="text-texto font-semibold">Novo usuário</h2>

      <div className="grid gap-3 sm:grid-cols-2">
        <input name="nome" required placeholder="Nome" className={CONTROLE} />
        <input
          name="email"
          type="email"
          required
          placeholder="E-mail"
          className={CONTROLE}
        />
        <input
          name="celular"
          required
          placeholder="Celular"
          className={CONTROLE}
        />
        <input
          name="senha"
          type="password"
          required
          autoComplete="new-password"
          placeholder="Senha"
          className={CONTROLE}
        />
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <label className="flex flex-col gap-1">
          <span className="text-texto-2 text-xs font-medium">Papel</span>
          <select name="role" defaultValue="CORTESIA" className={CONTROLE}>
            <option value="CORTESIA">Cortesia</option>
            <option value="USER">Usuário</option>
            <option value="SUPERADMIN">Admin</option>
          </select>
        </label>

        <label className="flex flex-col gap-1">
          <span className="text-texto-2 text-xs font-medium">Acesso de</span>
          <input
            type="date"
            name="dataInicio"
            required
            defaultValue={new Date().toISOString().slice(0, 10)}
            className={CONTROLE}
          />
        </label>

        <label className="flex flex-col gap-1">
          <span className="text-texto-2 text-xs font-medium">até</span>
          <input
            type="date"
            name="dataFim"
            required
            defaultValue={umAnoAFrente()}
            className={CONTROLE}
          />
        </label>
      </div>

      <p className="text-texto-3 text-xs">
        A API cria o usuário já com uma assinatura no período informado — é o
        caminho de cortesia, sem passar por pagamento.
      </p>

      {erro && (
        <p role="alert" className="text-alerta text-sm">
          {erro}
        </p>
      )}

      <div className="flex gap-2">
        <button
          type="submit"
          disabled={salvando}
          className="bg-acento hover:bg-acento-hover rounded-lg px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
        >
          {salvando ? "Criando…" : "Criar usuário"}
        </button>
        <button
          type="button"
          onClick={() => setAberto(false)}
          disabled={salvando}
          className="text-texto-2 hover:text-texto rounded-lg px-3 py-2 text-sm font-medium"
        >
          Cancelar
        </button>
      </div>
    </form>
  );
}
