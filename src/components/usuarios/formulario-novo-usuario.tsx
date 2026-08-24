"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { criarUsuario } from "@/app/(painel)/usuarios/acoes";
import {
  BOTAO_PRIMARIO,
  BOTAO_TEXTO,
  Campo,
  CONTROLE,
  Secao,
} from "@/components/campos-formulario";

const PAPEIS = [
  {
    valor: "USER",
    rotulo: "Usuário",
    ajuda: "Acesso só ao que a assinatura dele cobrir.",
  },
  {
    valor: "CORTESIA",
    rotulo: "Cortesia",
    ajuda: "Acesso completo sem pagar, pelo período definido abaixo.",
  },
  {
    valor: "SUPERADMIN",
    rotulo: "Administrador",
    ajuda: "Acesso total, incluindo este painel.",
  },
] as const;

/** Daqui a um ano — período padrão da cortesia. */
function umAnoAFrente() {
  const data = new Date();
  data.setFullYear(data.getFullYear() + 1);
  return data.toISOString().slice(0, 10);
}

function hoje() {
  return new Date().toISOString().slice(0, 10);
}

/**
 * Cadastro de usuário pelo painel.
 *
 * `POST /usuario/admin/create` cria o usuário JÁ com uma assinatura e aceita
 * as datas — é o caminho de cortesia, para liberar acesso sem passar por
 * pagamento. Por isso o período faz parte do cadastro.
 *
 * Os campos de perfil (cargo, área de atuação, objetivo) NÃO entram aqui: o
 * endpoint de criação não os aceita. Por isso, ao terminar, a tela leva direto
 * para a edição do usuário recém-criado, onde eles existem.
 */
export function FormularioNovoUsuario() {
  const router = useRouter();
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [papel, setPapel] = useState<string>("CORTESIA");
  const [verSenha, setVerSenha] = useState(false);

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
      role: papel,
      /*
        A data do campo é `AAAA-MM-DD`, sem hora. `new Date("2026-01-01")` seria
        lida como UTC e voltaria um dia no nosso fuso — daí fixar o meio-dia.
      */
      dataInicio: new Date(
        `${String(campos.get("dataInicio") ?? hoje())}T12:00:00`,
      ).toISOString(),
      dataFim: new Date(
        `${String(campos.get("dataFim") ?? umAnoAFrente())}T12:00:00`,
      ).toISOString(),
    });

    setSalvando(false);

    if (!resultado.ok) {
      setErro(resultado.erro);
      return;
    }

    router.push("/usuarios?feito=criado");
    router.refresh();
  }

  return (
    <form onSubmit={criar} className="flex flex-col gap-5">
      <Secao titulo="Dados de acesso">
        <div className="grid gap-4 sm:grid-cols-2">
          <Campo rotulo="Nome" obrigatorio>
            <input name="nome" required maxLength={120} className={CONTROLE} />
          </Campo>

          <Campo rotulo="E-mail" obrigatorio ajuda="É com ele que a pessoa entra.">
            <input
              name="email"
              type="email"
              required
              autoComplete="off"
              className={CONTROLE}
            />
          </Campo>

          <Campo
            rotulo="Senha"
            obrigatorio
            ajuda="Combine com a pessoa — o painel não envia e-mail de boas-vindas."
          >
            <span className="relative block">
              <input
                name="senha"
                type={verSenha ? "text" : "password"}
                required
                minLength={6}
                autoComplete="new-password"
                className={`${CONTROLE} pr-16`}
              />
              <button
                type="button"
                onClick={() => setVerSenha((v) => !v)}
                className="text-texto-3 hover:text-texto absolute top-1/2 right-2 -translate-y-1/2 text-xs font-medium"
              >
                {verSenha ? "ocultar" : "ver"}
              </button>
            </span>
          </Campo>

          <Campo
            rotulo="Celular"
            obrigatorio
            ajuda="Com DDD, só números. Ex.: 11988887777"
          >
            <input
              name="celular"
              required
              inputMode="numeric"
              minLength={11}
              maxLength={11}
              placeholder="11988887777"
              className={CONTROLE}
            />
          </Campo>
        </div>
      </Secao>

      <Secao
        titulo="Papel"
        ajuda="Define o que a pessoa enxerga. Pode ser trocado depois, na edição."
      >
        <div className="flex flex-col gap-2">
          {PAPEIS.map((item) => (
            <label key={item.valor} className="flex items-start gap-3">
              <input
                type="radio"
                name="role"
                value={item.valor}
                checked={papel === item.valor}
                onChange={() => setPapel(item.valor)}
                className="accent-acento mt-0.5 size-4"
              />
              <span className="flex flex-col">
                <span className="text-texto text-sm font-medium">
                  {item.rotulo}
                </span>
                <span className="text-texto-3 text-xs">{item.ajuda}</span>
              </span>
            </label>
          ))}
        </div>

        {/*
          O aviso aparece só no papel que dá acesso a este painel. Criar um
          administrador é a ação mais poderosa desta tela, e ela não deveria
          passar despercebida entre três opções de aparência igual.
        */}
        {papel === "SUPERADMIN" && (
          <p
            role="status"
            className="border-aviso/40 bg-aviso/10 text-aviso rounded-lg border px-4 py-3 text-sm"
          >
            Administrador entra neste painel e pode criar, editar e excluir
            qualquer conteúdo, usuário, plano e cupom.
          </p>
        )}
      </Secao>

      <Secao
        titulo="Período de acesso"
        ajuda="O cadastro cria uma assinatura junto — é assim que a API libera o acesso sem passar por pagamento."
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <Campo rotulo="Início">
            <input
              name="dataInicio"
              type="date"
              defaultValue={hoje()}
              className={CONTROLE}
            />
          </Campo>

          <Campo rotulo="Fim">
            <input
              name="dataFim"
              type="date"
              defaultValue={umAnoAFrente()}
              className={CONTROLE}
            />
          </Campo>
        </div>
      </Secao>

      <p className="text-texto-3 text-xs">
        Cargo, área de atuação e as demais informações de perfil são
        preenchidas na edição do usuário — o cadastro não as recebe.
      </p>

      {erro && (
        <p
          role="alert"
          className="border-alerta/40 bg-alerta/10 text-alerta rounded-lg border px-4 py-3 text-sm"
        >
          {erro}
        </p>
      )}

      <div className="flex items-center justify-end gap-2">
        <button
          type="button"
          onClick={() => router.push("/usuarios")}
          className={BOTAO_TEXTO}
        >
          Cancelar
        </button>
        <button type="submit" disabled={salvando} className={BOTAO_PRIMARIO}>
          {salvando ? "Criando…" : "Criar usuário"}
        </button>
      </div>
    </form>
  );
}
