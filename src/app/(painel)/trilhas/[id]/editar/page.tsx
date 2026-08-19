import Link from "next/link";
import { notFound } from "next/navigation";
import { BotaoExcluirTrilha } from "@/components/botao-excluir-trilha";
import { FormularioTrilha } from "@/components/formulario-trilha";
import { ApiError } from "@/lib/api";
import {
  listarCategorias,
  listarConteudosParaTrilha,
  listarInstrutores,
  listarNomesDeTags,
  listarSubcategorias,
  obterTrilha,
} from "@/lib/queries";

export const metadata = { title: "Editar trilha · Painel DigitalEduca" };

export default async function PaginaEditarTrilha({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const numero = Number(id);
  if (!Number.isInteger(numero) || numero <= 0) notFound();

  const trilha = await obterTrilha(numero).catch((erro) => {
    if (erro instanceof ApiError && erro.naoEncontrado) notFound();
    throw erro;
  });

  const [conteudos, categorias, subcategorias, instrutores, nomesDeTags] =
    await Promise.all([
      listarConteudosParaTrilha(),
      listarCategorias(),
      listarSubcategorias(),
      listarInstrutores().catch(() => []),
      listarNomesDeTags().catch(() => []),
    ]);

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-5">
      <div className="min-w-0">
        <Link
          href="/trilhas"
          className="text-texto-3 hover:text-texto text-sm transition-colors"
        >
          ← Trilhas
        </Link>
        <h1 className="text-texto mt-1 truncate text-2xl font-semibold">
          {trilha.titulo}
        </h1>
        <p className="text-texto-3 mt-0.5 text-sm">
          {trilha.modulos.length}{" "}
          {trilha.modulos.length === 1 ? "módulo" : "módulos"} ·{" "}
          {trilha.totalConteudos}{" "}
          {trilha.totalConteudos === 1 ? "conteúdo" : "conteúdos"} ·{" "}
          {trilha.publicada ? "publicada" : "rascunho"}
        </p>
      </div>

      <FormularioTrilha
        trilha={trilha}
        conteudos={conteudos}
        categorias={categorias}
        subcategorias={subcategorias}
        instrutores={instrutores}
        nomesDeTags={nomesDeTags}
        acaoExcluir={
          <BotaoExcluirTrilha
            id={trilha.id}
            titulo={trilha.titulo}
            totalConteudos={trilha.totalConteudos}
          />
        }
      />
    </div>
  );
}
