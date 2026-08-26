import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Secao } from "@/components/campos-formulario";
import { FormularioInstrutor } from "@/components/formulario-instrutor";
import { ApiError } from "@/lib/api";
import { obterInstrutorComConteudos } from "@/lib/queries";
import { ROTULO_TIPO, rotaDeEdicao } from "@/lib/tipos";

export const metadata = { title: "Instrutor · Painel DigitalEduca" };

export default async function PaginaEditarInstrutor({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const numero = Number(id);
  if (!Number.isInteger(numero) || numero <= 0) notFound();

  const perfil = await obterInstrutorComConteudos(numero).catch((erro) => {
    if (erro instanceof ApiError && erro.naoEncontrado) notFound();
    throw erro;
  });

  const { instrutor, data: conteudos, pagination } = perfil;

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-6">
      <div className="flex items-center gap-4">
        <span className="bg-superficie-2 relative h-14 w-14 shrink-0 overflow-hidden rounded-full">
          {instrutor.avatar ? (
            <Image
              src={instrutor.avatar}
              alt=""
              fill
              sizes="56px"
              className="object-cover"
            />
          ) : (
            <span className="text-acento bg-acento/15 absolute inset-0 flex items-center justify-center text-lg font-semibold">
              {instrutor.nome.charAt(0).toUpperCase()}
            </span>
          )}
        </span>

        <div className="min-w-0">
          <Link
            href="/instrutores"
            className="text-texto-3 hover:text-texto text-sm transition-colors"
          >
            ← Instrutores
          </Link>
          <h1 className="text-texto mt-0.5 truncate text-2xl font-semibold">
            {instrutor.nome}
          </h1>
          <p className="text-texto-3 text-sm">
            {instrutor.formacao || "sem formação cadastrada"} ·{" "}
            {pagination.total === 0
              ? "sem conteúdo"
              : `${pagination.total} ${pagination.total === 1 ? "conteúdo" : "conteúdos"}`}
          </p>
        </div>
      </div>

      <FormularioInstrutor instrutor={instrutor} />

      {/*
        Só leitura: quem credita o instrutor é a tela do conteúdo, não esta.
        Está aqui para responder "o que acontece se eu mexer nesta pessoa" sem
        obrigar a caçar isso na listagem de conteúdos.
      */}
      <Secao
        titulo="Conteúdos creditados"
        ajuda="O vínculo é editado na tela de cada conteúdo."
      >
        {conteudos.length === 0 ? (
          <p className="text-texto-3 text-sm">
            Esta pessoa ainda não está creditada em nenhum conteúdo.
          </p>
        ) : (
          <>
            <ul className="border-borda-suave divide-borda-suave divide-y rounded-lg border">
              {conteudos.map((conteudo) => (
                <li key={conteudo.id}>
                  <Link
                    href={rotaDeEdicao(conteudo.tipo, conteudo.id)}
                    className="hover:bg-superficie-2 flex items-center gap-3 px-3 py-2.5 transition-colors"
                  >
                    <span className="text-texto min-w-0 flex-1 truncate text-sm">
                      {conteudo.titulo}
                    </span>
                    <span className="text-texto-3 shrink-0 text-xs">
                      {ROTULO_TIPO[conteudo.tipo] ?? conteudo.tipo}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>

            {pagination.total > conteudos.length && (
              <p className="text-texto-3 text-xs">
                Mostrando {conteudos.length} de {pagination.total}.
              </p>
            )}
          </>
        )}
      </Secao>
    </div>
  );
}
