import Link from "next/link";
import { notFound } from "next/navigation";
import { FormularioCupom } from "@/components/cupons/formulario-cupom";
import { ApiError } from "@/lib/api";
import { ROTULO_SITUACAO, situacaoDoCupom } from "@/lib/cupons";
import { dataBR, numeroBR } from "@/lib/formato";
import { listarPlanos, obterCupom } from "@/lib/queries";

export const metadata = { title: "Editar cupom · Painel DigitalEduca" };

export default async function PaginaEditarCupom({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const numero = Number(id);
  if (!Number.isInteger(numero) || numero <= 0) notFound();

  const cupom = await obterCupom(numero).catch((erro) => {
    if (erro instanceof ApiError && erro.naoEncontrado) notFound();
    throw erro;
  });

  const planos = await listarPlanos().catch(() => []);
  const situacao = situacaoDoCupom(cupom);

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-5">
      <div className="min-w-0">
        <Link
          href="/cupons"
          className="text-texto-3 hover:text-texto text-sm transition-colors"
        >
          ← Cupons
        </Link>
        <h1 className="text-texto mt-1 truncate font-mono text-2xl font-semibold">
          {cupom.codigo}
        </h1>
        <p className="text-texto-3 mt-0.5 text-sm">
          {ROTULO_SITUACAO[situacao]} · usado {numeroBR(cupom.usosAtuais)}
          {cupom.limiteUsos !== null ? ` de ${numeroBR(cupom.limiteUsos)}` : ""}{" "}
          {cupom.usosAtuais === 1 ? "vez" : "vezes"} · criado em{" "}
          {dataBR(cupom.createdAt)}
        </p>
      </div>

      {/*
        O aviso aparece só quando o cupom já circulou. Mudar o percentual não
        reescreve o desconto de quem já assinou — a assinatura guarda o valor
        aplicado no momento — mas quem receber o código daqui em diante verá
        outro preço, e isso costuma pegar a equipe de surpresa.
      */}
      {cupom.usosAtuais > 0 && (
        <p
          role="status"
          className="border-aviso/40 bg-aviso/10 text-aviso rounded-lg border px-4 py-3 text-sm"
        >
          Este cupom já foi usado {numeroBR(cupom.usosAtuais)}{" "}
          {cupom.usosAtuais === 1 ? "vez" : "vezes"}. Alterar o desconto vale
          só para quem resgatar a partir de agora — quem já assinou mantém a
          condição contratada.
        </p>
      )}

      <FormularioCupom cupom={cupom} planos={planos} />
    </div>
  );
}
