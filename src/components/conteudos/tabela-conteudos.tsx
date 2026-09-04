"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState, useTransition } from "react";
import {
  excluirDefinitivo,
  excluirDefinitivoEmLote,
  excluirEmLote,
  publicarEmLote,
  restaurarConteudo,
  restaurarEmLote,
} from "@/app/(painel)/conteudos/acoes";
import { ROTULO_TIPO, rotaDeEdicao } from "@/lib/tipos";
import type { ConteudoBusca } from "@/types/api";

const DATA = new Intl.DateTimeFormat("pt-BR", { dateStyle: "short" });

/*
  Endereço da plataforma do aluno, para o link "Ver na plataforma".

  Fica em variável de ambiente e não cravado no código porque o painel roda
  contra staging e contra produção, que têm domínios diferentes — um endereço
  fixo mandaria o admin de staging conferir o site de produção. Sem a variável
  o link simplesmente não aparece: melhor não oferecer do que oferecer quebrado.
*/
const PLATAFORMA = process.env.NEXT_PUBLIC_PLATAFORMA_URL?.replace(/\/+$/, "");



/**
 * Cabeçalho clicável. Alterna entre as duas direções da mesma coluna e mostra
 * a seta só na que está ordenando — duas setas acesas fariam parecer que a
 * lista está ordenada por dois critérios.
 *
 * Mora fora do componente da tabela de propósito: declarado lá dentro, ele
 * seria recriado a cada render e perderia o estado a cada digitação no filtro.
 */
function Ordenavel({
  rotulo,
  ascendente,
  descendente,
  ordenar,
  parametros,
  base,
}: {
  rotulo: string;
  ascendente: string;
  descendente: string;
  ordenar: string;
  parametros: URLSearchParams;
  base: string;
}) {
  const ativoAsc = ordenar === ascendente;
  const ativoDesc = ordenar === descendente;
  const ativo = ativoAsc || ativoDesc;

  const alvo = new URLSearchParams(parametros);
  alvo.set("ordenar", ativoAsc ? descendente : ascendente);
  alvo.delete("page");

  return (
    <Link
      href={`${base}?${alvo}`}
      aria-sort={ativoAsc ? "ascending" : ativoDesc ? "descending" : "none"}
      className={`hover:text-texto inline-flex items-center gap-1 transition-colors ${
        ativo ? "text-texto font-semibold" : ""
      }`}
    >
      {rotulo}
      <span aria-hidden className="text-xs">
        {ativoAsc ? "▲" : ativoDesc ? "▼" : "↕"}
      </span>
    </Link>
  );
}

export function TabelaConteudos({
  conteudos,
  base = "/conteudos",
  lixeira = false,
}: {
  conteudos: ConteudoBusca[];
  /** Rota da listagem — os links de ordenação escrevem nela. */
  base?: string;
  /** Aba Lixeira: troca as ações por Restaurar / Excluir definitivamente. */
  lixeira?: boolean;
}) {
  const router = useRouter();
  const parametros = useSearchParams();
  const [processando, comecarTransicao] = useTransition();

  const [selecionados, setSelecionados] = useState<number[]>([]);
  const [erro, setErro] = useState<string | null>(null);
  const [aviso, setAviso] = useState<string | null>(null);

  const todosMarcados =
    conteudos.length > 0 && selecionados.length === conteudos.length;
  /* Estado indeterminado: alguns marcados, nem todos — o mesmo do WordPress. */
  const parcial = selecionados.length > 0 && !todosMarcados;

  function alternar(id: number) {
    setSelecionados((atual) =>
      atual.includes(id) ? atual.filter((i) => i !== id) : [...atual, id],
    );
  }

  function alternarTodos() {
    setSelecionados(todosMarcados ? [] : conteudos.map((c) => c.id));
  }

  const ordenar = parametros.get("ordenar") ?? "recentes";

  function executar(
    acao: () => Promise<{ ok: boolean; erro?: string; afetados: number }>,
    descricao: (n: number) => string,
  ) {
    setErro(null);
    setAviso(null);

    comecarTransicao(async () => {
      const resultado = await acao();

      if (resultado.afetados > 0) setAviso(descricao(resultado.afetados));
      if (!resultado.ok) setErro(resultado.erro ?? "Algo falhou.");

      setSelecionados([]);
      router.refresh();
    });
  }

  return (
    <div className="flex flex-col gap-3">
      {/*
        A barra de lote só ocupa espaço quando há seleção. Fixa e vazia, ela
        seria um controle desabilitado permanente no topo da tela.
      */}
      {selecionados.length > 0 && (
        <div className="border-acento/30 bg-acento/8 flex flex-wrap items-center gap-3 rounded-lg border px-4 py-2.5">
          <span className="text-texto text-sm font-medium">
            {selecionados.length}{" "}
            {selecionados.length === 1 ? "selecionado" : "selecionados"}
          </span>

          <div className="ml-auto flex flex-wrap gap-2">
            {lixeira ? (
              <>
                <BotaoLote
                  disabled={processando}
                  onClick={() =>
                    executar(
                      () => restaurarEmLote(selecionados),
                      (n) =>
                        `${n} ${n === 1 ? "restaurado" : "restaurados"}.`,
                    )
                  }
                >
                  Restaurar
                </BotaoLote>

                <BotaoLote
                  perigo
                  disabled={processando}
                  onClick={() => {
                    const quantos = selecionados.length;
                    if (
                      !window.confirm(
                        `Excluir definitivamente ${quantos} ${quantos === 1 ? "conteúdo" : "conteúdos"}? Isso apaga o vídeo no Vimeo e NÃO há como desfazer.`,
                      )
                    ) {
                      return;
                    }
                    executar(
                      () => excluirDefinitivoEmLote(selecionados),
                      (n) => `${n} ${n === 1 ? "excluído" : "excluídos"}.`,
                    );
                  }}
                >
                  Excluir definitivamente
                </BotaoLote>
              </>
            ) : (
              <>
                <BotaoLote
                  disabled={processando}
                  onClick={() =>
                    executar(
                      () => publicarEmLote(selecionados, true),
                      (n) => `${n} ${n === 1 ? "publicado" : "publicados"}.`,
                    )
                  }
                >
                  Publicar
                </BotaoLote>

                <BotaoLote
                  disabled={processando}
                  onClick={() =>
                    executar(
                      () => publicarEmLote(selecionados, false),
                      (n) =>
                        `${n} ${n === 1 ? "movido" : "movidos"} para rascunho.`,
                    )
                  }
                >
                  Passar para rascunho
                </BotaoLote>

                <BotaoLote
                  perigo
                  disabled={processando}
                  onClick={() => {
                    /*
                      Mover para a lixeira tem volta (dá para restaurar), mas o
                      número no aviso ainda separa "os 3 que escolhi" dos "24 da
                      página".
                    */
                    executar(
                      () => excluirEmLote(selecionados),
                      (n) =>
                        `${n} ${n === 1 ? "movido" : "movidos"} para a lixeira.`,
                    );
                  }}
                >
                  Mover para a lixeira
                </BotaoLote>
              </>
            )}
          </div>
        </div>
      )}

      {aviso && (
        <p role="status" className="text-sucesso text-sm font-medium">
          {aviso}
        </p>
      )}
      {erro && (
        <p
          role="alert"
          className="border-alerta/40 bg-alerta/10 text-alerta rounded-lg border px-4 py-3 text-sm"
        >
          {erro}
        </p>
      )}

      <div className="border-borda-suave bg-superficie overflow-hidden rounded-xl border">
        {/*
          A tabela rola sozinha no horizontal. Sem este contêiner, uma linha
          larga empurraria a página inteira e criaria rolagem lateral no corpo.
        */}
        <div className="overflow-x-auto">
          <table className="w-full min-w-[58rem] text-sm">
            <thead>
              <tr className="border-borda-suave text-texto-3 border-b text-left">
                <th scope="col" className="w-10 px-4 py-3">
                  <input
                    type="checkbox"
                    checked={todosMarcados}
                    ref={(no) => {
                      if (no) no.indeterminate = parcial;
                    }}
                    onChange={alternarTodos}
                    aria-label="Selecionar todos desta página"
                    className="accent-acento size-4 align-middle"
                  />
                </th>
                <th scope="col" className="px-4 py-3 font-medium">
                  <Ordenavel
                    rotulo="Conteúdo"
                    ascendente="titulo"
                    descendente="titulo_desc"
                    ordenar={ordenar}
                    parametros={parametros}
                    base={base}
                  />
                </th>
                <th scope="col" className="px-4 py-3 font-medium">
                  Tipo
                </th>
                <th scope="col" className="px-4 py-3 font-medium">
                  Categoria
                </th>
                <th scope="col" className="px-4 py-3 font-medium">
                  Instrutores
                </th>
                <th scope="col" className="px-4 py-3 font-medium">
                  <Ordenavel
                    rotulo="Criado em"
                    ascendente="antigos"
                    descendente="recentes"
                    ordenar={ordenar}
                    parametros={parametros}
                    base={base}
                  />
                </th>
              </tr>
            </thead>

            <tbody>
              {conteudos.map((conteudo) => (
                <Linha
                  key={conteudo.id}
                  conteudo={conteudo}
                  marcado={selecionados.includes(conteudo.id)}
                  aoMarcar={() => alternar(conteudo.id)}
                  lixeira={lixeira}
                />
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function BotaoLote({
  children,
  perigo,
  ...resto
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { perigo?: boolean }) {
  return (
    <button
      type="button"
      {...resto}
      className={`rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors disabled:opacity-50 ${
        perigo
          ? "border-alerta/40 text-alerta hover:bg-alerta/10"
          : "border-borda text-texto-2 hover:bg-superficie hover:text-texto"
      }`}
    >
      {children}
    </button>
  );
}

function Linha({
  conteudo,
  marcado,
  aoMarcar,
  lixeira = false,
}: {
  conteudo: ConteudoBusca;
  marcado: boolean;
  aoMarcar: () => void;
  lixeira?: boolean;
}) {
  const router = useRouter();
  const [processando, comecarTransicao] = useTransition();
  const miniatura = conteudo.thumbnailMobile ?? conteudo.thumbnailDesktop;
  const instrutores = conteudo.instrutores.map((i) => i.nome).join(", ");

  function agir(acao: () => Promise<{ ok: boolean }>) {
    comecarTransicao(async () => {
      await acao();
      router.refresh();
    });
  }

  return (
    <tr
      className={`border-borda-suave group border-b last:border-b-0 transition-colors ${
        marcado ? "bg-acento/8" : "hover:bg-superficie-2"
      }`}
    >
      <td className="px-4 py-3 align-top">
        <input
          type="checkbox"
          checked={marcado}
          onChange={aoMarcar}
          aria-label={`Selecionar ${conteudo.titulo}`}
          className="accent-acento mt-1 size-4"
        />
      </td>

      <td className="px-4 py-3">
        <div className="flex items-start gap-3">
          <span className="bg-superficie-2 relative mt-0.5 h-10 w-16 shrink-0 overflow-hidden rounded-md">
            {miniatura && (
              <Image
                src={miniatura}
                alt=""
                fill
                sizes="64px"
                className="object-cover"
              />
            )}
          </span>

          <span className="flex min-w-0 flex-col">
            {lixeira ? (
              /* Na lixeira o título não leva à edição — as ações são só duas. */
              <span className="text-texto truncate font-medium">
                {conteudo.titulo}
              </span>
            ) : (
              <Link
                href={rotaDeEdicao(conteudo.tipo, conteudo.id)}
                className="text-texto hover:text-acento-claro truncate font-medium transition-colors"
              >
                {conteudo.titulo}
              </Link>
            )}

            <span className="flex flex-wrap items-center gap-x-2">
              {conteudo.publicado === false && !lixeira && (
                <span className="text-aviso text-xs font-medium">Rascunho</span>
              )}
              {conteudo.destaque && !lixeira && (
                <span className="text-acento-claro text-xs font-medium">
                  Em destaque
                </span>
              )}
            </span>

            {/*
              Ações da linha, como no WordPress: discretas até o cursor ou o
              teclado chegarem. `focus-within` é o que as mantém alcançáveis
              por teclado — sem ele, quem navega com Tab nunca as veria.
              Em telas de toque ficam sempre visíveis, porque ali não há hover.
            */}
            <span className="mt-1 flex gap-2 text-xs opacity-100 transition-opacity sm:opacity-0 sm:group-focus-within:opacity-100 sm:group-hover:opacity-100">
              {lixeira ? (
                <>
                  <button
                    type="button"
                    disabled={processando}
                    onClick={() => agir(() => restaurarConteudo(conteudo.id))}
                    className="text-texto-3 hover:text-acento-claro transition-colors disabled:opacity-50"
                  >
                    Restaurar
                  </button>
                  <span aria-hidden className="text-borda">
                    |
                  </span>
                  <button
                    type="button"
                    disabled={processando}
                    onClick={() => {
                      if (
                        !window.confirm(
                          `Excluir definitivamente "${conteudo.titulo}"? Isso apaga o vídeo no Vimeo e NÃO há como desfazer.`,
                        )
                      ) {
                        return;
                      }
                      agir(() => excluirDefinitivo(conteudo.id));
                    }}
                    className="text-alerta hover:text-alerta/80 transition-colors disabled:opacity-50"
                  >
                    Excluir definitivamente
                  </button>
                </>
              ) : (
                <>
                  <Link
                    href={rotaDeEdicao(conteudo.tipo, conteudo.id)}
                    className="text-texto-3 hover:text-acento-claro transition-colors"
                  >
                    Editar
                  </Link>
                  {PLATAFORMA && (
                    <>
                      <span aria-hidden className="text-borda">
                        |
                      </span>
                      <a
                        href={`${PLATAFORMA}/conteudo/${conteudo.id}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-texto-3 hover:text-acento-claro transition-colors"
                      >
                        Ver na plataforma
                      </a>
                    </>
                  )}
                </>
              )}
            </span>
          </span>
        </div>
      </td>

      <td className="text-texto-2 px-4 py-3 align-top">
        {ROTULO_TIPO[conteudo.tipo]}
      </td>

      {/* Teto de largura: há subcategoria com quase 50 caracteres, e sem o
          corte ela sozinha alargava a tabela até empurrar a data para fora. */}
      <td className="text-texto-2 px-4 py-3 align-top">
        <span className="flex max-w-48 flex-col">
          <span className="truncate">{conteudo.categoria?.nome ?? "—"}</span>
          {conteudo.subcategoria && (
            <span
              className="text-texto-3 truncate text-xs"
              title={conteudo.subcategoria.nome}
            >
              {conteudo.subcategoria.nome}
            </span>
          )}
        </span>
      </td>

      <td className="text-texto-2 max-w-56 truncate px-4 py-3 align-top">
        {instrutores || "—"}
      </td>

      <td className="text-texto-3 px-4 py-3 align-top whitespace-nowrap">
        {DATA.format(new Date(conteudo.createdAt))}
      </td>
    </tr>
  );
}
