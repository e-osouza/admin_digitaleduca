"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  atualizarModulo,
  excluirModulo,
} from "@/app/(painel)/conteudos/acoes-aulas";
import {
  salvarItensDoConteudo,
  type ItemDoAgrupador,
} from "@/app/(painel)/conteudos/acoes";
import {
  FormularioModulo,
  ListaAulas,
  NovoModulo,
} from "@/components/gerenciador-aulas";
import { BotaoAdicionarVideo } from "@/components/conteudos/botao-adicionar-video";
import { CONTROLE } from "@/components/campos-formulario";
import { ROTULO_TIPO } from "@/lib/tipos";
import type { ConteudoBusca, Modulo, TipoConteudo, Video } from "@/types/api";

/*
  Estrutura de um curso ou trilha.

  Mesma forma do "Módulos e aulas" da MasterClass — o seletor de organização,
  o cartão por módulo com Editar/Excluir, a lista numerada dentro e os botões
  "Adicionar…" e "Novo módulo". Muda a folha: lá o módulo guarda vídeos, aqui
  guarda MasterClasses.

  Reaproveita `FormularioModulo` e `NovoModulo` daquele componente para os dois
  não divergirem — campo novo no módulo aparece nos dois lugares sozinho.

  Como lá, tudo é salvo na hora, sem depender do formulário acima. O backend
  redefine o vínculo inteiro a cada envio, então cada mudança manda a lista
  completa.
*/

export function EstruturaDoCurso({
  conteudoId,
  tipo,
  modulos,
  videosSoltos,
  biblioteca,
  disponiveis,
  iniciais,
}: {
  conteudoId: number;
  tipo: TipoConteudo;
  modulos: Modulo[];
  /** Aulas penduradas direto no curso, sem módulo. */
  videosSoltos: Video[];
  /** Todos os vídeos da plataforma, para a aba "Já na plataforma" do modal. */
  biblioteca: Video[];
  disponiveis: ConteudoBusca[];
  iniciais: ItemDoAgrupador[];
}) {
  const router = useRouter();
  const [ocupado, comecarTransicao] = useTransition();

  const [itens, setItens] = useState<ItemDoAgrupador[]>(iniciais);
  const [erro, setErro] = useState<string | null>(null);

  const soltos = itens.filter((i) => i.moduloId === null);

  /*
    A escolha inicial vem do que já existe, como na MasterClass: havendo
    módulos é um curso modular; só com itens soltos, lista única. Vazio começa
    em lista única, o caso mais simples.
  */
  const [comModulos, setComModulos] = useState(modulos.length > 0);
  const travado = modulos.length > 0 || soltos.length > 0 || videosSoltos.length > 0;

  const porId = new Map(disponiveis.map((c) => [c.id, c]));
  const jaEscolhidos = new Set(itens.map((i) => i.conteudoId));

  /** Grava a lista inteira; o backend redefine o vínculo a cada envio. */
  function persistir(proximos: ItemDoAgrupador[]) {
    setItens(proximos);
    setErro(null);

    comecarTransicao(async () => {
      const r = await salvarItensDoConteudo(conteudoId, proximos);
      if (!r.ok) {
        setErro(r.erro);
        /* Devolve ao estado anterior: a tela não pode afirmar o que não gravou. */
        setItens(itens);
        return;
      }
      router.refresh();
    });
  }

  function executar(acao: () => Promise<{ ok: boolean; erro?: string }>) {
    setErro(null);
    comecarTransicao(async () => {
      const r = await acao();
      if (!r.ok) {
        setErro(r.erro ?? "Algo falhou.");
        return;
      }
      router.refresh();
    });
  }

  function adicionar(alvo: number, moduloId: number | null) {
    if (jaEscolhidos.has(alvo)) return;
    persistir([...itens, { conteudoId: alvo, moduloId }]);
  }

  function remover(alvo: number) {
    persistir(itens.filter((i) => i.conteudoId !== alvo));
  }

  /** Move dentro do próprio grupo — é o que a ordem significa para o aluno. */
  function mover(alvo: number, direcao: -1 | 1) {
    const item = itens.find((i) => i.conteudoId === alvo);
    if (!item) return;

    const grupo = itens.filter((i) => i.moduloId === item.moduloId);
    const posicao = grupo.findIndex((i) => i.conteudoId === alvo);
    const destino = posicao + direcao;
    if (destino < 0 || destino >= grupo.length) return;

    const trocado = [...grupo];
    [trocado[posicao], trocado[destino]] = [trocado[destino], trocado[posicao]];

    let cursor = 0;
    persistir(
      itens.map((i) => (i.moduloId === item.moduloId ? trocado[cursor++] : i)),
    );
  }

  return (
    <section className="border-borda-suave bg-superficie flex flex-col gap-4 rounded-xl border p-5">
      <div>
        <h2 className="text-texto font-semibold">
          Módulos e conteúdos {tipo === "CURSO" ? "do curso" : "da trilha"}
        </h2>
        <p className="text-texto-3 mt-1 text-sm">
          Salvos na hora, independentemente do formulário acima.
        </p>
      </div>

      <fieldset className="border-borda-suave flex flex-col gap-2 rounded-lg border p-3">
        <legend className="text-texto-2 px-1 text-sm font-medium">
          Como {tipo === "CURSO" ? "este curso" : "esta trilha"} é organizado
        </legend>

        <div className="flex flex-wrap gap-4">
          <label className="flex items-center gap-2 text-sm">
            <input
              type="radio"
              name="organizacao"
              checked={!comModulos}
              onChange={() => setComModulos(false)}
              disabled={travado && modulos.length > 0}
              className="accent-acento h-4 w-4"
            />
            <span className="text-texto-2">Lista única</span>
          </label>

          <label className="flex items-center gap-2 text-sm">
            <input
              type="radio"
              name="organizacao"
              checked={comModulos}
              onChange={() => setComModulos(true)}
              disabled={travado && soltos.length > 0}
              className="accent-acento h-4 w-4"
            />
            <span className="text-texto-2">Dividido em módulos</span>
          </label>
        </div>

        {travado && (
          <p className="text-texto-3 text-xs">
            A estrutura já está definida pelo que foi cadastrado. Para trocar,
            remova primeiro {modulos.length > 0 ? "os módulos" : "os conteúdos"}
            .
          </p>
        )}
      </fieldset>

      {comModulos ? (
        <>
          {modulos.map((modulo) => (
            <CartaoModulo
              key={modulo.id}
              conteudoId={conteudoId}
              modulo={modulo}
              itens={itens.filter((i) => i.moduloId === modulo.id)}
              porId={porId}
              disponiveis={disponiveis}
              jaEscolhidos={jaEscolhidos}
              ocupado={ocupado}
              biblioteca={biblioteca}
              aoAdicionar={(id) => adicionar(id, modulo.id)}
              aoRemover={remover}
              aoMover={mover}
              aoExecutar={executar}
              aoFalhar={(mensagem) => setErro(mensagem)}
            />
          ))}

          <NovoModulo
            conteudoId={conteudoId}
            aoFalhar={(mensagem: string) => setErro(mensagem)}
          />
        </>
      ) : (
        <div className="border-borda-suave rounded-lg border p-4">
          <ListaAulas
            conteudoId={conteudoId}
            videos={videosSoltos}
            aoFalhar={(mensagem) => setErro(mensagem)}
          />
          <ListaItens
            itens={soltos}
            porId={porId}
            aoRemover={remover}
            aoMover={mover}
          />
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <BotaoAdicionarVideo
              conteudoId={conteudoId}
              biblioteca={biblioteca}
              rotulo="Adicionar aula"
            />
            <Adicionar
              disponiveis={disponiveis}
              jaEscolhidos={jaEscolhidos}
              excluir={conteudoId}
              rotulo="Adicionar MasterClass existente"
              aoEscolher={(id) => adicionar(id, null)}
            />
          </div>
        </div>
      )}

      {erro && (
        <p
          role="alert"
          className="border-alerta/40 bg-alerta/10 text-alerta rounded-lg border px-4 py-3 text-sm"
        >
          {erro}
        </p>
      )}
    </section>
  );
}

function CartaoModulo({
  conteudoId,
  modulo,
  itens,
  porId,
  disponiveis,
  jaEscolhidos,
  ocupado,
  biblioteca,
  aoAdicionar,
  aoRemover,
  aoMover,
  aoExecutar,
  aoFalhar,
}: {
  conteudoId: number;
  modulo: Modulo;
  itens: ItemDoAgrupador[];
  porId: Map<number, ConteudoBusca>;
  disponiveis: ConteudoBusca[];
  jaEscolhidos: Set<number>;
  ocupado: boolean;
  biblioteca: Video[];
  aoAdicionar: (id: number) => void;
  aoRemover: (id: number) => void;
  aoMover: (id: number, direcao: -1 | 1) => void;
  aoExecutar: (acao: () => Promise<{ ok: boolean; erro?: string }>) => void;
  aoFalhar: (mensagem: string) => void;
}) {
  const router = useRouter();
  const [editando, setEditando] = useState(false);
  const [confirmando, setConfirmando] = useState(false);

  const videos = modulo.videos?.length ?? 0;

  return (
    <div className="border-borda-suave rounded-lg border p-4">
      {editando ? (
        <FormularioModulo
          modulo={modulo}
          aoCancelar={() => setEditando(false)}
          aoSalvar={async (dados) => {
            const r = await atualizarModulo(conteudoId, modulo.id, dados);
            if (!r.ok) return false;
            setEditando(false);
            router.refresh();
            return true;
          }}
        />
      ) : (
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <h3 className="text-texto text-sm font-semibold">
              {modulo.titulo}
            </h3>
            {modulo.subtitulo && (
              <p className="text-texto-3 text-xs">{modulo.subtitulo}</p>
            )}
          </div>

          {confirmando ? (
            <div className="flex flex-wrap items-center gap-2">
              {/*
                Duas consequências diferentes no mesmo botão: conteúdo
                vinculado só se solta, mas vídeo herdado de quando isto era
                uma MasterClass é APAGADO em cascata pelo banco.
              */}
              <span className="text-texto-2 text-xs">
                {videos > 0
                  ? `Apaga ${videos} ${videos === 1 ? "vídeo" : "vídeos"} deste módulo.`
                  : "Os conteúdos vinculados voltam a ficar soltos."}
              </span>
              <button
                type="button"
                disabled={ocupado}
                onClick={() =>
                  aoExecutar(() => excluirModulo(conteudoId, modulo.id))
                }
                className="bg-alerta rounded-lg px-2.5 py-1 text-xs font-semibold text-white disabled:opacity-60"
              >
                Confirmar
              </button>
              <button
                type="button"
                onClick={() => setConfirmando(false)}
                className="text-texto-2 text-xs"
              >
                Cancelar
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => setEditando(true)}
                className="text-texto-2 hover:bg-superficie-2 hover:text-texto rounded-lg px-2 py-1 text-xs font-medium transition-colors"
              >
                Editar
              </button>
              <button
                type="button"
                onClick={() => setConfirmando(true)}
                className="text-alerta hover:bg-alerta/10 rounded-lg px-2 py-1 text-xs font-medium transition-colors"
              >
                Excluir
              </button>
            </div>
          )}
        </div>
      )}

      {/*
        Um módulo de curso guarda as duas coisas: vídeos próprios (aulas
        gravadas direto nele) e MasterClasses já publicadas. Mostrar só uma
        delas escondia metade do módulo — foi o que aconteceu com os módulos
        herdados, que exibiam "8 vídeos" e uma lista vazia logo abaixo.
      */}
      <ListaAulas
        conteudoId={conteudoId}
        videos={modulo.videos ?? []}
        aoFalhar={aoFalhar}
      />

      <ListaItens
        itens={itens}
        porId={porId}
        aoRemover={aoRemover}
        aoMover={aoMover}
      />

      <div className="mt-3 flex flex-wrap items-center gap-2">
        <BotaoAdicionarVideo
          conteudoId={conteudoId}
          moduloId={modulo.id}
          biblioteca={biblioteca}
          rotulo="Adicionar aula neste módulo"
        />

        <Adicionar
          disponiveis={disponiveis}
          jaEscolhidos={jaEscolhidos}
          excluir={conteudoId}
          rotulo="Adicionar MasterClass existente"
          aoEscolher={aoAdicionar}
        />
      </div>
    </div>
  );
}

function ListaItens({
  itens,
  porId,
  aoRemover,
  aoMover,
}: {
  itens: ItemDoAgrupador[];
  porId: Map<number, ConteudoBusca>;
  aoRemover: (id: number) => void;
  aoMover: (id: number, direcao: -1 | 1) => void;
}) {
  if (itens.length === 0) {
    return <p className="text-texto-3 mt-3 text-xs">Nenhum conteúdo aqui ainda.</p>;
  }

  return (
    <ol className="mt-3 flex flex-col">
      {itens.map((item, indice) => {
        const conteudo = porId.get(item.conteudoId);

        return (
          <li
            key={item.conteudoId}
            className="border-borda-suave/60 flex items-center gap-3 border-b py-2 last:border-b-0"
          >
            <span className="text-texto-3 w-6 shrink-0 text-sm tabular-nums">
              {indice + 1}
            </span>
            <span className="text-texto-2 min-w-0 flex-1 truncate text-sm">
              {conteudo?.titulo ?? `Conteúdo ${item.conteudoId}`}
            </span>

            <span className="text-texto-3 shrink-0 text-xs">
              {conteudo ? ROTULO_TIPO[conteudo.tipo] : ""}
            </span>

            <button
              type="button"
              onClick={() => aoMover(item.conteudoId, -1)}
              disabled={indice === 0}
              aria-label="Subir"
              className="text-texto-3 hover:text-texto shrink-0 px-1 text-xs disabled:opacity-30"
            >
              ↑
            </button>
            <button
              type="button"
              onClick={() => aoMover(item.conteudoId, 1)}
              disabled={indice === itens.length - 1}
              aria-label="Descer"
              className="text-texto-3 hover:text-texto shrink-0 px-1 text-xs disabled:opacity-30"
            >
              ↓
            </button>
            <button
              type="button"
              onClick={() => aoRemover(item.conteudoId)}
              className="text-alerta hover:bg-alerta/10 shrink-0 rounded px-2 py-0.5 text-xs font-medium transition-colors"
            >
              Excluir
            </button>
          </li>
        );
      })}
    </ol>
  );
}

/**
 * Botão que abre a busca, como o "Adicionar aula neste módulo" da MasterClass.
 *
 * Botão e não campo sempre visível: em repouso a lista fica limpa, e o campo
 * só ocupa espaço quando alguém vai de fato acrescentar algo.
 */
function Adicionar({
  disponiveis,
  jaEscolhidos,
  excluir,
  rotulo,
  aoEscolher,
}: {
  disponiveis: ConteudoBusca[];
  jaEscolhidos: Set<number>;
  /** O próprio curso — conter a si mesmo seria um laço. */
  excluir: number;
  rotulo: string;
  aoEscolher: (id: number) => void;
}) {
  const [aberto, setAberto] = useState(false);
  const [busca, setBusca] = useState("");

  if (!aberto) {
    return (
      <button
        type="button"
        onClick={() => setAberto(true)}
        className="border-borda text-texto-2 hover:border-acento/60 hover:text-acento rounded-lg border px-3 py-2 text-sm font-medium transition-colors"
      >
        {rotulo}
      </button>
    );
  }

  const termo = busca.trim().toLocaleLowerCase("pt-BR");
  const resultados = disponiveis
    .filter(
      (c) =>
        c.id !== excluir &&
        !jaEscolhidos.has(c.id) &&
        (!termo || c.titulo.toLocaleLowerCase("pt-BR").includes(termo)),
    )
    .slice(0, 8);

  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center gap-2">
        <input
          type="search"
          autoFocus
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
          placeholder="Buscar por título…"
          className={`${CONTROLE} text-sm`}
        />
        <button
          type="button"
          onClick={() => {
            setAberto(false);
            setBusca("");
          }}
          className="text-texto-2 hover:text-texto shrink-0 px-2 text-sm"
        >
          Cancelar
        </button>
      </div>

      {resultados.length > 0 ? (
        <ul className="border-borda-suave bg-superficie divide-borda-suave/60 max-h-56 divide-y overflow-y-auto rounded-lg border">
          {resultados.map((conteudo) => (
            <li key={conteudo.id}>
              <button
                type="button"
                onClick={() => {
                  aoEscolher(conteudo.id);
                  setBusca("");
                  setAberto(false);
                }}
                className="hover:bg-superficie-2 flex w-full items-center gap-2 px-3 py-2 text-left transition-colors"
              >
                <span className="text-texto-2 min-w-0 flex-1 truncate text-sm">
                  {conteudo.titulo}
                </span>
                <span className="text-texto-3 shrink-0 text-xs">
                  {ROTULO_TIPO[conteudo.tipo]}
                </span>
              </button>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-texto-3 text-xs">Nenhum conteúdo disponível.</p>
      )}
    </div>
  );
}
