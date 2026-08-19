import Link from "next/link";
import { AvisoAcao } from "@/components/aviso-acao";
import { ListaPlanos } from "@/components/planos/lista-planos";
import { plural } from "@/lib/formato";
import { listarPlanos, resumoAssinaturas } from "@/lib/queries";

export const metadata = { title: "Planos · Painel DigitalEduca" };

export default async function PaginaPlanos() {
  const [planos, assinaturas] = await Promise.all([
    listarPlanos(),
    resumoAssinaturas(),
  ]);

  /*
    A agregação vem crua do Prisma (`groupBy`), sem o nome do plano — só o id e
    a contagem. Vira mapa aqui para a lista não varrer o array a cada linha.
  */
  const assinantes = new Map(
    (assinaturas?.assinaturasPorPlano ?? []).map((linha) => [
      linha.planoId,
      linha._count.planoId,
    ]),
  );

  const emCirculacao = planos.filter((plano) => plano.ativo).length;

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-texto text-2xl font-semibold">Planos</h1>
          <p className="text-texto-3 mt-0.5 text-sm">
            {plural(planos.length, "plano", "planos")} · {emCirculacao} em
            circulação
          </p>
        </div>

        <Link
          href="/planos/novo"
          className="bg-acento hover:bg-acento-hover rounded-lg px-4 py-2.5 text-sm font-semibold text-white transition-colors"
        >
          Novo plano
        </Link>
      </div>

      <AvisoAcao />

      <ListaPlanos planos={planos} assinantes={assinantes} />

      {/*
        O aviso é sobre uma ausência, e ausência não se explica sozinha: quem
        procura o botão de excluir precisa saber que ele não existe de
        propósito, e qual é o caminho no lugar dele.
      */}
      <p className="text-texto-3 text-xs">
        Planos não são excluídos: no banco, apagar um plano apaga junto as
        assinaturas dele e o histórico de cobrança. Para tirar um plano de
        venda, desmarque <strong className="font-medium">Plano em
        circulação</strong> na edição — ele some do checkout e do app, e quem
        já assinou continua com a assinatura valendo.
      </p>
    </div>
  );
}
