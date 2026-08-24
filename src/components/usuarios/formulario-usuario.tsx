"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import {
  atualizarPeriodoCortesia,
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
/** ISO → "YYYY-MM-DD", que é o que <input type="date"> entende. */
function paraCampoData(iso: string | null | undefined) {
  if (!iso) return "";
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? "" : d.toISOString().slice(0, 10);
}

/** "YYYY-MM-DD" → ISO completo, que é o que a API grava. */
function paraIso(valor: string, fimDoDia = false) {
  return new Date(
    `${valor}T${fimDoDia ? "23:59:59" : "00:00:00"}`,
  ).toISOString();
}

/**
 * O período concedido vigente, se houver — é dele que saem as datas já
 * preenchidas. Cortesia e Club são gravados com métodos diferentes, mas os
 * dois são períodos que a equipe concede e edita por aqui.
 */
function periodoConcedido(usuario: UsuarioDetalhe) {
  return usuario.assinaturas.find((a) => {
    const metodo = (a.metodoPagamento ?? "").toUpperCase();
    return metodo.startsWith("CORTE") || metodo === "CLUB";
  });
}

export function FormularioUsuario({ usuario }: { usuario: UsuarioDetalhe }) {
  const router = useRouter();
  const [erro, setErro] = useState<string | null>(null);
  const [salvando, setSalvando] = useState(false);

  /*
   * O papel vira estado porque os campos de período só existem quando ele é
   * CORTESIA ou CLUB. Antes o <select> era não controlado e o formulário não
   * tinha como reagir à escolha.
   */
  const [papel, setPapel] = useState<string>(usuario.role);
  const comPeriodo = papel === "CORTESIA" || papel === "CLUB";
  const nomeDoPapel = papel === "CLUB" ? "Club" : "Cortesia";
  const vigente = periodoConcedido(usuario);

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

    /*
     * Cortesia e Club são papel MAIS período: sem as datas o acesso não abre.
     * `PUT /usuario/admin/usuarios/:id` só troca a role — não existe
     * `dataInicio`/`dataFim` no DTO dele —, e era por isso que promover
     * alguém a Cortesia não liberava nada: gravava um rótulo e nenhuma
     * assinatura. Quem grava o período é `PUT /assinatura/admin/periodo/:id`,
     * que carimba o método conforme o papel já gravado — por isso ele vai
     * DEPOIS de `atualizarUsuario`, nunca antes.
     */
    const temPeriodo = dados.role === "CORTESIA" || dados.role === "CLUB";
    const rotulo = dados.role === "CLUB" ? "Club" : "Cortesia";
    const inicio = String(campos.get("dataInicio") ?? "");
    const fim = String(campos.get("dataFim") ?? "");

    if (temPeriodo) {
      if (!inicio || !fim) {
        setSalvando(false);
        setErro(`Informe o início e o fim do período de ${rotulo}.`);
        return;
      }
      if (paraIso(fim, true) <= paraIso(inicio)) {
        setSalvando(false);
        setErro("O fim do período precisa ser depois do início.");
        return;
      }
    }

    const resultado = await atualizarUsuario(usuario.id, dados);

    if (!resultado.ok) {
      setSalvando(false);
      setErro(resultado.erro);
      return;
    }

    if (temPeriodo) {
      const periodo = await atualizarPeriodoCortesia(usuario.id, {
        dataInicio: paraIso(inicio),
        dataFim: paraIso(fim, true),
      });

      setSalvando(false);

      if (!periodo.ok) {
        /*
         * O papel já foi gravado, mas o período não — e é o período que abre o
         * acesso. Dizer isso em voz alta importa: sem o aviso, a tela voltaria
         * "salvo" e o aluno continuaria vendo a tela de assinar, exatamente o
         * sintoma que este formulário existe para resolver.
         */
        setErro(
          `O papel foi alterado para ${rotulo}, mas o período NÃO foi gravado — o acesso segue bloqueado. ${periodo.erro}`,
        );
        return;
      }
    } else {
      setSalvando(false);
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
            ajuda="Club e Cortesia veem todo o conteúdo, cada um pelo período definido abaixo. Rebaixar para Usuário encerra esse período na hora, sem afetar assinatura paga."
          >
            <select
              name="role"
              value={papel}
              onChange={(e) => setPapel(e.target.value)}
              className={CONTROLE}
            >
              <option value="USER">Usuário</option>
              <option value="CORTESIA">Cortesia</option>
              <option value="CLUB">Club</option>
              <option value="SUPERADMIN">Admin</option>
            </select>
          </Campo>
        </div>

        {/*
          O período só aparece — e só é exigido — quando o papel é Cortesia ou
          Club. É ele que abre o acesso: o papel sozinho não libera nada.
        */}
        {comPeriodo && (
          <div className="border-borda-suave bg-fundo-2 flex flex-col gap-4 rounded-lg border border-dashed p-4 sm:flex-row">
            <Campo
              rotulo={`Início d${papel === "CLUB" ? "o" : "a"} ${nomeDoPapel}`}
              obrigatorio
            >
              <input
                name="dataInicio"
                type="date"
                required
                /*
                 * `||`, e não `??`: `paraCampoData` devolve string VAZIA
                 * quando não há período anterior, e vazio não é nulo — com
                 * `??` o campo abriria em branco em vez de hoje.
                 */
                defaultValue={
                  paraCampoData(vigente?.dataInicio) ||
                  new Date().toISOString().slice(0, 10)
                }
                className={CONTROLE}
              />
            </Campo>

            <Campo
              rotulo={`Fim d${papel === "CLUB" ? "o" : "a"} ${nomeDoPapel}`}
              obrigatorio
              ajuda="Depois desta data o acesso fecha sozinho."
            >
              <input
                name="dataFim"
                type="date"
                required
                defaultValue={paraCampoData(vigente?.dataFim)}
                className={CONTROLE}
              />
            </Campo>
          </div>
        )}

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
