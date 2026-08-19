import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Secao } from "@/components/campos-formulario";
import { FormularioUsuario } from "@/components/usuarios/formulario-usuario";
import { ApiError } from "@/lib/api";
import { obterUsuario } from "@/lib/queries";

export const metadata = { title: "Usuário · Painel DigitalEduca" };

const dataHora = new Intl.DateTimeFormat("pt-BR", {
  dateStyle: "short",
  timeStyle: "short",
});
const data = new Intl.DateTimeFormat("pt-BR", { dateStyle: "short" });
const moeda = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
});

export default async function PaginaEditarUsuario({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const numero = Number(id);
  if (!Number.isInteger(numero) || numero <= 0) notFound();

  const usuario = await obterUsuario(numero).catch((erro) => {
    if (erro instanceof ApiError && erro.naoEncontrado) notFound();
    throw erro;
  });

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-6">
      <div className="flex items-center gap-4">
        <span className="bg-superficie-2 relative h-14 w-14 shrink-0 overflow-hidden rounded-full">
          {usuario.avatar ? (
            <Image
              src={usuario.avatar}
              alt=""
              fill
              sizes="56px"
              className="object-cover"
            />
          ) : (
            <span className="text-acento bg-acento/15 absolute inset-0 flex items-center justify-center text-lg font-semibold">
              {usuario.nome.charAt(0).toUpperCase()}
            </span>
          )}
        </span>

        <div className="min-w-0">
          <Link
            href="/usuarios"
            className="text-texto-3 hover:text-texto text-sm transition-colors"
          >
            ← Usuários
          </Link>
          <h1 className="text-texto mt-0.5 truncate text-2xl font-semibold">
            {usuario.nome}
          </h1>
          <p className="text-texto-3 text-sm">
            {usuario.email} · cadastrado em{" "}
            {data.format(new Date(usuario.createdAt))}
          </p>
        </div>
      </div>

      <FormularioUsuario usuario={usuario} />

      {/*
        Daqui para baixo é só leitura: são dados que o aluno preenche na
        plataforma ou que o sistema registra. O painel não os edita.
      */}
      <Secao
        titulo="Assinaturas"
        ajuda="Histórico completo, da mais recente para a mais antiga."
      >
        {usuario.assinaturas.length === 0 ? (
          <p className="text-texto-3 text-sm">Nenhuma assinatura registrada.</p>
        ) : (
          <ul className="border-borda-suave divide-borda-suave divide-y rounded-lg border">
            {usuario.assinaturas.map((assinatura) => (
              <li key={assinatura.id} className="flex flex-col gap-1 px-3 py-2.5">
                <div className="flex flex-wrap items-center gap-2 text-sm">
                  <span className="text-texto font-medium">
                    {assinatura.plano?.nome ?? "Sem plano"}
                  </span>
                  <span
                    className={
                      assinatura.status === "ATIVA"
                        ? "text-sucesso text-xs font-medium"
                        : "text-texto-3 text-xs font-medium"
                    }
                  >
                    {assinatura.status.toLowerCase()}
                  </span>
                  {assinatura.metodoPagamento && (
                    <span className="text-texto-3 text-xs">
                      {assinatura.metodoPagamento.toLowerCase()}
                    </span>
                  )}
                  {assinatura.valorPago > 0 && (
                    <span className="text-texto-2 text-xs">
                      {moeda.format(assinatura.valorPago)}
                    </span>
                  )}
                </div>
                <p className="text-texto-3 text-xs">
                  {data.format(new Date(assinatura.dataInicio))}
                  {assinatura.dataFim
                    ? ` até ${data.format(new Date(assinatura.dataFim))}`
                    : " · sem data de término"}
                  {assinatura.canceladaEm &&
                    ` · cancelada em ${data.format(new Date(assinatura.canceladaEm))}`}
                </p>
              </li>
            ))}
          </ul>
        )}
      </Secao>

      <div className="grid gap-6 sm:grid-cols-2">
        <Secao titulo="Negócio">
          {usuario.negocio ? (
            <Definicoes
              itens={[
                ["Empresa", usuario.negocio.nomeEmpresa],
                ["Setor", usuario.negocio.setorAtuacao],
                ["Colaboradores", usuario.negocio.numeroColaboradores],
                ["Faturamento anual", usuario.negocio.faixaFaturamentoAnual],
                ["Fase atual", usuario.negocio.faseAtual],
                ["Desafios", usuario.negocio.desafiosNegocio],
              ]}
            />
          ) : (
            <p className="text-texto-3 text-sm">Não preencheu.</p>
          )}
        </Secao>

        <Secao titulo="Interesses">
          {usuario.interesse ? (
            <Definicoes
              itens={[
                ["Temas", usuario.interesse.temasAprender],
                ["Dificuldade atual", usuario.interesse.dificuldadeAtual],
                ["Nível", usuario.interesse.nivelConhecimento],
                ["Tempo por semana", usuario.interesse.tempoDisponivelSemana],
                ["Estilo", usuario.interesse.estiloAprendizado],
              ]}
            />
          ) : (
            <p className="text-texto-3 text-sm">Não preencheu.</p>
          )}
        </Secao>
      </div>

      <Secao titulo="Atividade na plataforma">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
          <Indicador rotulo="Vídeos" valor={usuario.atividade.videosComProgresso} />
          <Indicador rotulo="Módulos" valor={usuario.atividade.modulosComProgresso} />
          <Indicador rotulo="Salvos" valor={usuario.atividade.salvos} />
          <Indicador rotulo="Listas" valor={usuario.atividade.listas} />
          <Indicador rotulo="Avaliações" valor={usuario.atividade.avaliacoes} />
        </div>
      </Secao>

      <Secao titulo="Sistema">
        <Definicoes
          itens={[
            ["ID", String(usuario.id)],
            ["Cliente Stripe", usuario.stripeCustomerId],
            [
              "Dispositivos com push",
              usuario.dispositivos.length > 0
                ? usuario.dispositivos
                    .map((d) => d.plataforma)
                    .join(", ")
                : "nenhum",
            ],
            ["Criado em", dataHora.format(new Date(usuario.createdAt))],
            ["Atualizado em", dataHora.format(new Date(usuario.updatedAt))],
          ]}
        />
      </Secao>
    </div>
  );
}

function Definicoes({ itens }: { itens: [string, string | null | undefined][] }) {
  return (
    <dl className="flex flex-col gap-2 text-sm">
      {itens.map(([rotulo, valor]) => (
        <div key={rotulo} className="flex flex-wrap gap-x-2">
          <dt className="text-texto-3 min-w-36">{rotulo}</dt>
          <dd className="text-texto-2 min-w-0 flex-1">{valor || "—"}</dd>
        </div>
      ))}
    </dl>
  );
}

function Indicador({ rotulo, valor }: { rotulo: string; valor: number }) {
  return (
    <div className="border-borda-suave rounded-lg border p-3 text-center">
      <p className="text-texto text-xl font-semibold">{valor}</p>
      <p className="text-texto-3 text-xs">{rotulo}</p>
    </div>
  );
}
