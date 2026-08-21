import Link from "next/link";
import { AbasStatus } from "@/components/conteudos/abas-status";
import { FiltrosSimples } from "@/components/filtros-simples";
import { Paginacao } from "@/components/paginacao";
import { TabelaTrilhas } from "@/components/trilhas/tabela-trilhas";
import { plural } from "@/lib/formato";
import { listarTrilhas } from "@/lib/queries";
import type { TipoTrilha } from "@/types/api";

/**
 * A tela de Cursos e a de Trilhas são a mesma — mudam o `tipo` consultado e as
 * palavras. Mantê-las como um componente só é o que garante que um recurso
 * novo (uma aba, uma ação em lote) apareça nas duas sem ninguém lembrar.
 */
const TEXTOS: Record<
  TipoTrilha,
  { titulo: string; singular: string; plural: string; novo: string; base: string }
> = {
  CURSO: {
    titulo: "Cursos",
    singular: "curso",
    plural: "cursos",
    novo: "Novo curso",
    base: "/cursos",
  },
  TRILHA: {
    titulo: "Trilhas",
    singular: "trilha",
    plural: "trilhas",
    novo: "Nova trilha",
    base: "/trilhas",
  },
};

const STATUS: Record<string, { publicada?: boolean; destaque?: boolean }> = {
  publicados: { publicada: true },
  rascunhos: { publicada: false },
  destaques: { destaque: true },
};

export async function TelaTrilhas({
  tipo,
  searchParams,
}: {
  tipo: TipoTrilha;
  searchParams: Record<string, string | string[] | undefined>;
}) {
  const t = TEXTOS[tipo];

  const texto = (chave: string) => {
    const valor = searchParams[chave];
    return typeof valor === "string" && valor ? valor : undefined;
  };
  const numero = (chave: string) => {
    const valor = Number(texto(chave));
    return Number.isFinite(valor) && valor > 0 ? valor : undefined;
  };

  const status = texto("status") ?? "";

  const resultado = await listarTrilhas({
    tipo,
    q: texto("q"),
    ...(STATUS[status] ?? {}),
    ordenar: texto("ordenar"),
    page: numero("page") ?? 1,
  });

  const parametros = new URLSearchParams();
  if (texto("q")) parametros.set("q", texto("q")!);
  if (texto("ordenar")) parametros.set("ordenar", texto("ordenar")!);

  const comStatus = new URLSearchParams(parametros);
  if (status) comStatus.set("status", status);

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-texto text-2xl font-semibold">{t.titulo}</h1>
          <p className="text-texto-3 mt-0.5 text-sm">
            {plural(
              resultado.pagination.total,
              `${t.singular} nesta seleção`,
              `${t.plural} nesta seleção`,
            )}
          </p>
        </div>

        {/*
          A criação passa pelo formulário de trilha nos dois casos — é o mesmo
          registro. O `?tipo=` diz ao formulário o que está sendo criado.
        */}
        <Link
          href={`/trilhas/nova?tipo=${tipo}`}
          className="bg-acento hover:bg-acento-hover rounded-lg px-4 py-2.5 text-sm font-semibold text-white transition-colors"
        >
          {t.novo}
        </Link>
      </div>

      <AbasStatus
        contadores={resultado.contadores}
        statusAtual={status}
        parametros={parametros}
        base={t.base}
        rotulos={{ publicados: "Publicadas", rascunhos: "Rascunhos" }}
      />

      <FiltrosSimples base={t.base} placeholder={`Buscar ${t.singular}…`} />

      {resultado.data.length === 0 ? (
        <p className="border-borda-suave bg-superficie text-texto-2 rounded-xl border p-8 text-center text-sm">
          Nenhum {t.singular} encontrado com esses filtros.
        </p>
      ) : (
        <TabelaTrilhas trilhas={resultado.data} tipo={tipo} base={t.base} />
      )}

      <Paginacao
        dados={resultado.pagination}
        base={t.base}
        parametros={comStatus}
      />
    </div>
  );
}
