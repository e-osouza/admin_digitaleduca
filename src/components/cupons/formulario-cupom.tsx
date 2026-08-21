"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { atualizarCupom, criarCupom } from "@/app/(painel)/cupons/acoes";
import {
  BOTAO_PRIMARIO,
  BOTAO_TEXTO,
  Campo,
  CONTROLE,
  Secao,
} from "@/components/campos-formulario";
import { moedaBR } from "@/lib/formato";
import type { Cupom, Plano } from "@/types/api";

const DURACOES = [
  { valor: "ONCE", rotulo: "Só na 1ª cobrança" },
  { valor: "FOREVER", rotulo: "Em todas as renovações" },
  { valor: "REPEATING", rotulo: "Por um número de ciclos" },
] as const;

/** ISO → `AAAA-MM-DDTHH:MM` local, que é o formato do `datetime-local`. */
function paraCampoLocal(iso: string | null): string {
  if (!iso) return "";
  const d = new Date(iso);
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}`;
}

/**
 * Cria ou edita um cupom.
 *
 * Como no formulário de plano, o miolo é dinheiro: percentual e duração
 * decidem quanto a empresa deixa de receber por assinante. Por isso a prévia
 * calcula, ao vivo, o valor que o aluno pagará em cada plano — a conta não
 * fica na cabeça de quem preenche.
 */
export function FormularioCupom({
  cupom,
  planos,
}: {
  cupom?: Cupom;
  planos: Plano[];
}) {
  const router = useRouter();
  const editando = Boolean(cupom);

  const [erro, setErro] = useState<string | null>(null);
  const [salvando, setSalvando] = useState(false);

  const [percentual, setPercentual] = useState(String(cupom?.percentual ?? ""));
  const [duracao, setDuracao] = useState<string>(cupom?.duracao ?? "ONCE");
  const [ciclos, setCiclos] = useState(String(cupom?.duracaoCiclos ?? 3));
  const [planoId, setPlanoId] = useState(String(cupom?.planoId ?? ""));

  const pct = Math.min(
    100,
    Math.max(0, Number(percentual.replace(",", ".")) || 0),
  );

  /* Cupom não se aplica a plano gratuito — o backend recusa, então nem oferece. */
  const pagos = planos.filter((p) => p.preco > 0);
  const alvo = planoId
    ? pagos.filter((p) => String(p.id) === planoId)
    : pagos;

  async function salvar(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    setErro(null);
    setSalvando(true);

    const dados = new FormData(evento.currentTarget);
    const resultado =
      editando && cupom
        ? await atualizarCupom(cupom.id, dados)
        : await criarCupom(dados);

    setSalvando(false);

    if (!resultado.ok) {
      setErro(resultado.erro);
      return;
    }

    router.push(editando ? "/cupons?feito=salvo" : "/cupons?feito=criado");
    router.refresh();
  }

  return (
    <form onSubmit={salvar} className="flex flex-col gap-5">
      <Secao titulo="Identificação">
        <div className="grid gap-4 sm:grid-cols-2">
          <Campo
            rotulo="Código"
            obrigatorio
            ajuda="É o que o aluno digita. Salvo sempre em CAIXA ALTA."
          >
            <input
              name="codigo"
              required
              maxLength={40}
              defaultValue={cupom?.codigo ?? ""}
              placeholder="BLACKFRIDAY"
              className={`${CONTROLE} font-mono uppercase`}
            />
          </Campo>

          <Campo rotulo="Desconto (%)" obrigatorio ajuda="De 1 a 100.">
            <input
              name="percentual"
              required
              inputMode="decimal"
              value={percentual}
              onChange={(e) => setPercentual(e.target.value)}
              placeholder="20"
              className={CONTROLE}
            />
          </Campo>
        </div>

        <Campo rotulo="Descrição" ajuda="Só para a equipe. O aluno não vê.">
          <input
            name="descricao"
            maxLength={160}
            defaultValue={cupom?.descricao ?? ""}
            placeholder="Campanha de Black Friday 2026"
            className={CONTROLE}
          />
        </Campo>

        <label className="flex items-start gap-3">
          <input
            type="checkbox"
            name="ativo"
            defaultChecked={cupom?.ativo ?? true}
            className="accent-acento mt-0.5 size-4"
          />
          <span className="flex flex-col">
            <span className="text-texto text-sm font-medium">Cupom ativo</span>
            <span className="text-texto-3 text-xs">
              Desmarcado, o cupom é recusado no checkout mesmo dentro da
              validade. Cupons não são excluídos — quem já usou continua
              vinculado a ele.
            </span>
          </span>
        </label>
      </Secao>

      <Secao
        titulo="Por quanto tempo o desconto vale"
        ajuda="Decide se o desconto some na primeira renovação ou acompanha o assinante."
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <Campo rotulo="Duração" obrigatorio>
            <select
              name="duracao"
              required
              value={duracao}
              onChange={(e) => setDuracao(e.target.value)}
              className={CONTROLE}
            >
              {DURACOES.map((d) => (
                <option key={d.valor} value={d.valor}>
                  {d.rotulo}
                </option>
              ))}
            </select>
          </Campo>

          {/* Só aparece onde significa algo — em ONCE e FOREVER o número de
              ciclos não é lido por ninguém. */}
          {duracao === "REPEATING" && (
            <Campo
              rotulo="Quantos ciclos"
              obrigatorio
              ajuda="Cobranças com desconto antes de voltar ao preço cheio."
            >
              <input
                name="duracaoCiclos"
                type="number"
                min={1}
                required
                value={ciclos}
                onChange={(e) => setCiclos(e.target.value)}
                className={CONTROLE}
              />
            </Campo>
          )}
        </div>
      </Secao>

      <Secao
        titulo="Limites"
        ajuda="Todos opcionais. Em branco, o cupom vale para qualquer plano pago, desde já e sem teto de usos."
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <Campo rotulo="Válido a partir de" ajuda="Vazio = vale imediatamente.">
            <input
              name="validoDe"
              type="datetime-local"
              defaultValue={paraCampoLocal(cupom?.validoDe ?? null)}
              className={CONTROLE}
            />
          </Campo>

          <Campo rotulo="Válido até" ajuda="Vazio = não expira.">
            <input
              name="validoAte"
              type="datetime-local"
              defaultValue={paraCampoLocal(cupom?.validoAte ?? null)}
              className={CONTROLE}
            />
          </Campo>

          <Campo
            rotulo="Limite de usos"
            ajuda={
              cupom
                ? `Vazio = ilimitado. Já usado ${cupom.usosAtuais}×.`
                : "Vazio = ilimitado."
            }
          >
            <input
              name="limiteUsos"
              type="number"
              min={1}
              defaultValue={cupom?.limiteUsos ?? ""}
              className={CONTROLE}
            />
          </Campo>

          <Campo rotulo="Restringir a um plano" ajuda="Vazio = qualquer plano pago.">
            <select
              name="planoId"
              value={planoId}
              onChange={(e) => setPlanoId(e.target.value)}
              className={CONTROLE}
            >
              <option value="">Qualquer plano pago</option>
              {pagos.map((plano) => (
                <option key={plano.id} value={plano.id}>
                  {plano.nome}
                </option>
              ))}
            </select>
          </Campo>
        </div>

        {/*
          A prévia existe porque "20%" não diz quanto o aluno paga nem quanto
          a empresa deixa de receber. Aqui a conta aparece pronta, plano a
          plano — que é como a decisão é realmente tomada.
        */}
        <div className="border-borda-suave bg-superficie-2/50 rounded-lg border p-4">
          <p className="text-texto-3 text-xs font-semibold tracking-wide uppercase">
            Com este cupom
          </p>

          {pct <= 0 || alvo.length === 0 ? (
            <p className="text-texto-2 mt-2 text-sm">
              Informe o desconto para ver o efeito.
            </p>
          ) : (
            <ul className="mt-2 flex flex-col gap-1 text-sm">
              {alvo.map((plano) => {
                const comDesconto = plano.preco * (1 - pct / 100);
                return (
                  <li key={plano.id} className="text-texto">
                    <span className="text-texto-3">{plano.nome}:</span>{" "}
                    <strong className="font-semibold">
                      {moedaBR(comDesconto)}
                    </strong>{" "}
                    <span className="text-texto-3">
                      em vez de {moedaBR(plano.preco)} — abre mão de{" "}
                      {moedaBR(plano.preco - comDesconto)}
                      {duracao === "FOREVER"
                        ? " em toda renovação"
                        : duracao === "REPEATING"
                          ? ` por ${Number(ciclos) || 1} ${Number(ciclos) === 1 ? "ciclo" : "ciclos"}`
                          : " na 1ª cobrança"}
                    </span>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </Secao>

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
          onClick={() => router.push("/cupons")}
          className={BOTAO_TEXTO}
        >
          Cancelar
        </button>
        <button type="submit" disabled={salvando} className={BOTAO_PRIMARIO}>
          {salvando ? "Salvando…" : editando ? "Salvar cupom" : "Criar cupom"}
        </button>
      </div>
    </form>
  );
}
