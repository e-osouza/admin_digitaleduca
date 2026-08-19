"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { atualizarPlano, criarPlano } from "@/app/(painel)/planos/acoes";
import {
  BOTAO_PRIMARIO,
  BOTAO_TEXTO,
  Campo,
  CONTROLE,
  Secao,
} from "@/components/campos-formulario";
import { moedaBR } from "@/lib/formato";
import type { Plano } from "@/types/api";

const INTERVALOS = [
  { valor: "month", rotulo: "Mensal — cobra todo mês" },
  { valor: "year", rotulo: "Anual — cobra uma vez por ano" },
  { valor: "week", rotulo: "Semanal" },
  { valor: "day", rotulo: "Diário" },
] as const;

/**
 * Cria ou edita um plano.
 *
 * Os três campos de pagamento (parcelamento, máximo de parcelas e desconto à
 * vista) são a parte perigosa: eles não descrevem o plano, eles definem o que
 * o checkout cobra. Errar um número aqui erra a cobrança de todo mundo que
 * assinar depois — por isso o formulário calcula, ao vivo, exatamente as
 * frases que o aluno vai ver, em vez de deixar a conta na cabeça de quem
 * preenche.
 */
export function FormularioPlano({ plano }: { plano?: Plano }) {
  const router = useRouter();
  const editando = Boolean(plano);

  const [erro, setErro] = useState<string | null>(null);
  const [salvando, setSalvando] = useState(false);

  /* Espelham os campos só para a prévia; a fonte da verdade é o FormData. */
  const [preco, setPreco] = useState(String(plano?.preco ?? ""));
  const [parcela, setParcela] = useState(plano?.permiteParcelamento ?? false);
  const [maxParcelas, setMaxParcelas] = useState(
    String(plano?.maxParcelas ?? 12),
  );
  const [desconto, setDesconto] = useState(
    String(plano?.percentualDescontoAVista ?? 0),
  );

  const valor = Number(preco.replace(",", ".")) || 0;
  const vezes = Math.max(1, Number(maxParcelas) || 1);
  const percentual = Math.min(100, Math.max(0, Number(desconto.replace(",", ".")) || 0));
  const aVista = valor * (1 - percentual / 100);

  async function salvar(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    setErro(null);
    setSalvando(true);

    const dados = new FormData(evento.currentTarget);
    const resultado =
      editando && plano
        ? await atualizarPlano(plano.id, dados)
        : await criarPlano(dados);

    setSalvando(false);

    if (!resultado.ok) {
      setErro(resultado.erro);
      return;
    }

    router.push(editando ? "/planos?feito=salvo" : "/planos?feito=criado");
    router.refresh();
  }

  return (
    <form onSubmit={salvar} className="flex flex-col gap-5">
      {/*
        A chave abre o formulário, e não fica escondida no fim, porque é ela
        que decide se o plano está à venda. Quem entra aqui para tirar um plano
        do ar não deveria ter de procurar.
      */}
      <Secao
        titulo="Circulação"
        ajuda="Desativado, o plano some do checkout e do app. Quem já assinou não é afetado — a assinatura continua valendo."
      >
        <label className="flex items-start gap-3">
          <input
            type="checkbox"
            name="ativo"
            defaultChecked={plano?.ativo ?? true}
            className="accent-acento mt-0.5 size-4"
          />
          <span className="flex flex-col">
            <span className="text-texto text-sm font-medium">
              Plano em circulação
            </span>
            <span className="text-texto-3 text-xs">
              É assim que se tira um plano de venda: excluir não existe, porque
              apagar um plano apagaria junto as assinaturas dele.
            </span>
          </span>
        </label>
      </Secao>

      <Secao titulo="Identificação">
        <Campo rotulo="Nome" obrigatorio ajuda="Precisa ser único.">
          <input
            name="nome"
            required
            maxLength={60}
            defaultValue={plano?.nome ?? ""}
            className={CONTROLE}
            placeholder="Anual"
          />
        </Campo>

        <Campo
          rotulo="Descrição"
          ajuda="Texto que aparece no card do plano, na tela de assinatura."
        >
          <textarea
            name="descricao"
            rows={4}
            defaultValue={plano?.descricao ?? ""}
            className={CONTROLE}
          />
        </Campo>
      </Secao>

      <Secao
        titulo="Cobrança"
        ajuda="Define o que o checkout cobra. Vale para quem assinar a partir de agora — assinaturas em vigor mantêm o valor que já foi contratado."
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <Campo
            rotulo="Preço"
            obrigatorio
            ajuda="Valor cheio do ciclo, em reais. Use 0 para plano gratuito."
          >
            <input
              name="preco"
              required
              inputMode="decimal"
              value={preco}
              onChange={(e) => setPreco(e.target.value)}
              className={CONTROLE}
              placeholder="867,00"
            />
          </Campo>

          <Campo rotulo="Ciclo" obrigatorio>
            <select
              name="intervalo"
              required
              defaultValue={plano?.intervalo ?? "month"}
              className={CONTROLE}
            >
              {INTERVALOS.map((i) => (
                <option key={i.valor} value={i.valor}>
                  {i.rotulo}
                </option>
              ))}
            </select>
          </Campo>
        </div>
      </Secao>

      <Secao
        titulo="Parcelamento e desconto"
        ajuda="Só faz sentido em plano anual: o parcelamento é pagamento avulso no Mercado Pago, não assinatura recorrente."
      >
        <label className="flex items-start gap-3">
          <input
            type="checkbox"
            name="permiteParcelamento"
            checked={parcela}
            onChange={(e) => setParcela(e.target.checked)}
            className="accent-acento mt-0.5 size-4"
          />
          <span className="flex flex-col">
            <span className="text-texto text-sm font-medium">
              Permitir parcelamento no cartão
            </span>
            <span className="text-texto-3 text-xs">
              Desligado, o plano só é vendido em cobrança única ou recorrente.
            </span>
          </span>
        </label>

        <div className="grid gap-4 sm:grid-cols-2">
          <Campo rotulo="Máximo de parcelas" ajuda="De 1 a 24.">
            <input
              name="maxParcelas"
              type="number"
              min={1}
              max={24}
              disabled={!parcela}
              value={maxParcelas}
              onChange={(e) => setMaxParcelas(e.target.value)}
              className={`${CONTROLE} disabled:opacity-50`}
            />
          </Campo>

          <Campo
            rotulo="Desconto à vista (%)"
            ajuda="Aplicado só no pagamento em 1x. Em 2x ou mais cobra o valor cheio."
          >
            <input
              name="percentualDescontoAVista"
              inputMode="decimal"
              value={desconto}
              onChange={(e) => setDesconto(e.target.value)}
              className={CONTROLE}
              placeholder="10"
            />
          </Campo>
        </div>

        {/*
          A prévia existe porque três números soltos não dizem quanto o aluno
          paga. Aqui a conta aparece pronta, na mesma forma em que ela chega
          na tela de checkout.
        */}
        <div className="border-borda-suave bg-superficie-2/50 rounded-lg border p-4">
          <p className="text-texto-3 text-xs font-semibold tracking-wide uppercase">
            O aluno vai ver
          </p>
          {valor <= 0 ? (
            <p className="text-texto-2 mt-2 text-sm">
              Plano gratuito — não passa pelo checkout.
            </p>
          ) : (
            <ul className="mt-2 flex flex-col gap-1 text-sm">
              {parcela && vezes > 1 && (
                <li className="text-texto">
                  <strong className="font-semibold">
                    {vezes}× de {moedaBR(valor / vezes)}
                  </strong>{" "}
                  <span className="text-texto-3">
                    — total {moedaBR(valor)}
                  </span>
                </li>
              )}
              <li className="text-texto">
                <strong className="font-semibold">
                  {moedaBR(aVista)} à vista
                </strong>
                {percentual > 0 && (
                  <span className="text-sucesso">
                    {" "}
                    — {percentual}% de desconto, economia de{" "}
                    {moedaBR(valor - aVista)}
                  </span>
                )}
              </li>
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
          onClick={() => router.push("/planos")}
          className={BOTAO_TEXTO}
        >
          Cancelar
        </button>
        <button type="submit" disabled={salvando} className={BOTAO_PRIMARIO}>
          {salvando ? "Salvando…" : editando ? "Salvar plano" : "Criar plano"}
        </button>
      </div>
    </form>
  );
}
