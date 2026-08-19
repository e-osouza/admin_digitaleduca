import Link from "next/link";
import { notFound } from "next/navigation";
import { FormularioPlano } from "@/components/planos/formulario-plano";
import { dataBR, plural } from "@/lib/formato";
import { obterPlano, resumoAssinaturas } from "@/lib/queries";

export const metadata = { title: "Editar plano · Painel DigitalEduca" };

export default async function PaginaEditarPlano({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const numero = Number(id);
  if (!Number.isInteger(numero) || numero <= 0) notFound();

  const [plano, assinaturas] = await Promise.all([
    obterPlano(numero),
    resumoAssinaturas(),
  ]);
  if (!plano) notFound();

  const contratos =
    assinaturas?.assinaturasPorPlano.find((l) => l.planoId === plano.id)?._count
      .planoId ?? 0;

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-5">
      <div className="min-w-0">
        <Link
          href="/planos"
          className="text-texto-3 hover:text-texto text-sm transition-colors"
        >
          ← Planos
        </Link>
        <h1 className="text-texto mt-1 truncate text-2xl font-semibold">
          {plano.nome}
        </h1>
        <p className="text-texto-3 mt-0.5 text-sm">
          {contratos > 0
            ? plural(contratos, "assinatura", "assinaturas")
            : "Nenhuma assinatura"}{" "}
          · criado em {dataBR(plano.createdAt)} · alterado em{" "}
          {dataBR(plano.updatedAt)}
        </p>
      </div>

      {/*
        O alerta só aparece quando há contrato em vigor, porque é aí que mudar
        o preço deixa de ser configuração e passa a ser decisão comercial.
      */}
      {contratos > 0 && (
        <p
          role="status"
          className="border-aviso/40 bg-aviso/10 text-aviso rounded-lg border px-4 py-3 text-sm"
        >
          Este plano tem {plural(contratos, "assinatura", "assinaturas")} em
          vigor. Mudar o preço vale só para quem assinar daqui em diante — quem
          já assinou continua pagando o valor contratado.
        </p>
      )}

      <FormularioPlano plano={plano} />

      {(plano.stripeProductId || plano.priceId) && (
        <div className="border-borda-suave bg-superficie rounded-xl border p-5">
          <h2 className="text-texto text-sm font-semibold">
            Integração antiga (Stripe)
          </h2>
          <p className="text-texto-3 mt-1 text-sm">
            A cobrança hoje corre pelo Mercado Pago e o painel não edita estes
            ids — eles ficam à vista porque ainda são a chave para rastrear uma
            assinatura antiga no painel da Stripe.
          </p>
          <dl className="mt-3 flex flex-col gap-1 text-sm">
            {plano.stripeProductId && (
              <div className="flex gap-2">
                <dt className="text-texto-3">Produto</dt>
                <dd className="text-texto-2 font-mono">
                  {plano.stripeProductId}
                </dd>
              </div>
            )}
            {plano.priceId && (
              <div className="flex gap-2">
                <dt className="text-texto-3">Preço</dt>
                <dd className="text-texto-2 font-mono">{plano.priceId}</dd>
              </div>
            )}
          </dl>
        </div>
      )}
    </div>
  );
}
