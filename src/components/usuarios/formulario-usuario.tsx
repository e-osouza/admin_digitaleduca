"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import {
  atualizarUsuario,
  excluirUsuario,
} from "@/app/(painel)/usuarios/acoes";
import {
  BOTAO_PRIMARIO,
  BOTAO_TEXTO,
  CONTROLE,
  Campo,
  Secao,
} from "@/components/campos-formulario";
import type { UsuarioDetalhe } from "@/types/api";

/**
 * Edição do usuário.
 *
 * Todos os campos que a API aceita em `PUT /usuario/admin/usuarios/:id` estão
 * aqui — inclusive os de perfil profissional, que antes só existiam no
 * cadastro feito pelo próprio aluno.
 */
export function FormularioUsuario({ usuario }: { usuario: UsuarioDetalhe }) {
  const router = useRouter();
  const [erro, setErro] = useState<string | null>(null);
  const [salvando, setSalvando] = useState(false);

  async function salvar(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    setErro(null);
    setSalvando(true);

    const campos = new FormData(evento.currentTarget);

    const texto = (nome: string) => {
      const valor = String(campos.get(nome) ?? "").trim();
      return valor || undefined;
    };

    const dados: Record<string, unknown> = {
      nome: String(campos.get("nome") ?? "").trim(),
      email: String(campos.get("email") ?? "").trim(),
      role: String(campos.get("role") ?? ""),
      emailVerified: campos.get("emailVerified") === "on",
      aceitaNotificacoes: campos.get("aceitaNotificacoes") === "on",
    };

    for (const campo of [
      "celular",
      "cargo",
      "funcao",
      "areaAtuacao",
      "tempoExperiencia",
      "objetivoPlataforma",
      "formatoAprendizado",
    ]) {
      const valor = texto(campo);
      if (valor) dados[campo] = valor;
    }

    // Só vai quando preenchida; o backend faz o hash antes de gravar.
    const senha = texto("senha");
    if (senha) dados.senha = senha;

    const resultado = await atualizarUsuario(usuario.id, dados);
    setSalvando(false);

    if (!resultado.ok) {
      setErro(resultado.erro);
      return;
    }

    router.push("/usuarios?feito=salvo");
    router.refresh();
  }

  return (
    <form onSubmit={salvar} className="flex flex-col gap-6">
      <Secao titulo="Conta">
        <div className="grid gap-4 sm:grid-cols-2">
          <Campo rotulo="Nome" obrigatorio>
            <input
              name="nome"
              required
              defaultValue={usuario.nome}
              className={CONTROLE}
            />
          </Campo>

          <Campo rotulo="E-mail" obrigatorio>
            <input
              name="email"
              type="email"
              required
              defaultValue={usuario.email}
              className={CONTROLE}
            />
          </Campo>

          <Campo rotulo="Celular">
            <input
              name="celular"
              defaultValue={usuario.celular ?? ""}
              className={CONTROLE}
            />
          </Campo>

          <Campo
            rotulo="Papel"
            ajuda="Rebaixar para Usuário encerra as cortesias na hora. Assinatura paga não é afetada."
          >
            <select
              name="role"
              defaultValue={usuario.role}
              className={CONTROLE}
            >
              <option value="USER">Usuário</option>
              <option value="CORTESIA">Cortesia</option>
              <option value="SUPERADMIN">Admin</option>
            </select>
          </Campo>
        </div>

        <Campo
          rotulo="Nova senha"
          ajuda="Em branco mantém a atual. A senha é gravada com hash pelo backend."
        >
          <input
            name="senha"
            type="password"
            autoComplete="new-password"
            className={CONTROLE}
          />
        </Campo>

        <div className="flex flex-wrap gap-5">
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              name="emailVerified"
              defaultChecked={usuario.emailVerified}
              className="accent-acento h-4 w-4"
            />
            <span className="text-texto-2">E-mail verificado</span>
          </label>

          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              name="aceitaNotificacoes"
              defaultChecked={usuario.aceitaNotificacoes}
              className="accent-acento h-4 w-4"
            />
            <span className="text-texto-2">Aceita notificações</span>
          </label>
        </div>
      </Secao>

      <Secao
        titulo="Perfil profissional"
        ajuda="Preenchido pelo próprio aluno no onboarding."
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <Campo rotulo="Cargo">
            <input
              name="cargo"
              defaultValue={usuario.cargo ?? ""}
              className={CONTROLE}
            />
          </Campo>
          <Campo rotulo="Função">
            <input
              name="funcao"
              defaultValue={usuario.funcao ?? ""}
              className={CONTROLE}
            />
          </Campo>
          <Campo rotulo="Área de atuação">
            <input
              name="areaAtuacao"
              defaultValue={usuario.areaAtuacao ?? ""}
              className={CONTROLE}
            />
          </Campo>
          <Campo rotulo="Tempo de experiência">
            <input
              name="tempoExperiencia"
              defaultValue={usuario.tempoExperiencia ?? ""}
              className={CONTROLE}
            />
          </Campo>
          <Campo rotulo="Formato de aprendizado">
            <input
              name="formatoAprendizado"
              defaultValue={usuario.formatoAprendizado ?? ""}
              className={CONTROLE}
            />
          </Campo>
        </div>

        <Campo rotulo="Objetivo na plataforma">
          <textarea
            name="objetivoPlataforma"
            rows={2}
            defaultValue={usuario.objetivoPlataforma ?? ""}
            className={`${CONTROLE} resize-y`}
          />
        </Campo>
      </Secao>

      {erro && (
        <p
          role="alert"
          className="border-alerta/30 bg-alerta/10 text-alerta rounded-lg border px-3 py-2 text-sm"
        >
          {erro}
        </p>
      )}

      <div className="border-borda-suave flex flex-wrap items-center gap-3 border-t pt-5">
        <button type="submit" disabled={salvando} className={BOTAO_PRIMARIO}>
          {salvando ? "Salvando…" : "Salvar alterações"}
        </button>
        <button
          type="button"
          onClick={() => router.push("/usuarios")}
          disabled={salvando}
          className={BOTAO_TEXTO}
        >
          Cancelar
        </button>

        <div className="ml-auto">
          <BotaoExcluirUsuario id={usuario.id} nome={usuario.nome} />
        </div>
      </div>
    </form>
  );
}

function BotaoExcluirUsuario({ id, nome }: { id: number; nome: string }) {
  const router = useRouter();
  const [confirmando, setConfirmando] = useState(false);
  const [ocupado, setOcupado] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  async function excluir() {
    setOcupado(true);
    const resultado = await excluirUsuario(id);

    if (!resultado.ok) {
      setErro(resultado.erro);
      setOcupado(false);
      setConfirmando(false);
      return;
    }

    router.push("/usuarios?feito=excluido");
    router.refresh();
  }

  if (!confirmando) {
    return (
      <div className="flex flex-col items-end gap-1">
        <button
          type="button"
          onClick={() => setConfirmando(true)}
          className="border-borda text-alerta hover:bg-alerta/10 hover:border-alerta/40 rounded-lg border px-3 py-2 text-sm font-medium transition-colors"
        >
          Excluir usuário
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
        Excluir <strong>{nome}</strong>? As assinaturas, o progresso e as listas
        vão junto. Não dá para desfazer.
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
