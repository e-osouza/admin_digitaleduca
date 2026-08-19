"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";
import { Marca, MarcaIcone } from "@/components/marca";
import { BotaoSair } from "@/components/botao-sair";
import { GRUPOS } from "@/lib/nav";

const CHAVE_RECOLHIDO = "de-admin:menu-recolhido";

/*
 * A preferência de menu recolhido vive no localStorage — uma fonte externa ao
 * React. Lê-la num efeito causaria render em cascata (e o servidor não tem
 * acesso a ela), então usamos uma pequena store com useSyncExternalStore: o
 * servidor renderiza sempre expandido e o cliente sincroniza na hidratação.
 */
const ouvintes = new Set<() => void>();

function assinarRecolhido(aoMudar: () => void) {
  ouvintes.add(aoMudar);
  // 'storage' cobre a mudança feita em outra aba.
  window.addEventListener("storage", aoMudar);
  return () => {
    ouvintes.delete(aoMudar);
    window.removeEventListener("storage", aoMudar);
  };
}

function lerRecolhido() {
  return window.localStorage.getItem(CHAVE_RECOLHIDO) === "1";
}

function gravarRecolhido(valor: boolean) {
  window.localStorage.setItem(CHAVE_RECOLHIDO, valor ? "1" : "0");
  for (const ouvinte of ouvintes) ouvinte();
}

/**
 * Href do item que representa a página atual — no máximo um, já que nenhuma
 * rota do menu é prefixo de outra. O marcador deslizante precisa desse valor
 * único: ele é um elemento só, e não uma marca por item.
 *
 * O Dashboard é a exceção: mora em "/", que é prefixo de tudo, então só casa
 * de forma exata.
 */
function acharAtivo(caminho: string) {
  for (const grupo of GRUPOS) {
    for (const item of grupo.itens) {
      if (item.href === "/") {
        if (caminho === "/") return item.href;
        continue;
      }
      if (caminho === item.href || caminho.startsWith(`${item.href}/`)) {
        return item.href;
      }
    }
  }
  return null;
}

function rotuloDaSecao(caminho: string) {
  const ativo = acharAtivo(caminho);
  if (!ativo) return null;
  for (const grupo of GRUPOS) {
    for (const item of grupo.itens) {
      if (item.href === ativo) return item.rotulo;
    }
  }
  return null;
}

/*
 * O marcador é medido ANTES da pintura, senão ele aparece um quadro fora do
 * lugar. No servidor não há layout para medir — e o React avisa se
 * useLayoutEffect roda lá —, então ali caímos no useEffect, que nunca chega a
 * executar durante a renderização do servidor.
 */
const useEfeitoDeLayout =
  typeof window === "undefined" ? useEffect : useLayoutEffect;

export function AppShell({
  nome,
  email,
  children,
}: {
  nome: string | null;
  email: string | null;
  children: React.ReactNode;
}) {
  const caminho = usePathname();
  const [gavetaAberta, setGavetaAberta] = useState(false);
  const recolhido = useSyncExternalStore(
    assinarRecolhido,
    lerRecolhido,
    () => false,
  );

  // Esc fecha a gaveta; enquanto aberta, o fundo não rola.
  useEffect(() => {
    if (!gavetaAberta) return;

    function aoTeclar(evento: KeyboardEvent) {
      if (evento.key === "Escape") setGavetaAberta(false);
    }

    document.addEventListener("keydown", aoTeclar);
    document.body.dataset.gaveta = "aberta";

    return () => {
      document.removeEventListener("keydown", aoTeclar);
      delete document.body.dataset.gaveta;
    };
  }, [gavetaAberta]);

  const secao = rotuloDaSecao(caminho);

  return (
    <div className="flex h-dvh overflow-hidden">
      {/* ---------- menu lateral fixo (lg+) ---------- */}
      <Navegacao
        caminho={caminho}
        nome={nome}
        email={email}
        recolhido={recolhido}
        aoAlternarRecolhido={() => gravarRecolhido(!recolhido)}
        className={`border-borda-suave bg-cromo ease-saida relative z-30 hidden shrink-0 border-r transition-[width] duration-300 lg:flex ${
          recolhido ? "w-[4.5rem]" : "w-60 xl:w-64"
        }`}
      />

      {/*
        Gaveta do mobile. Fica sempre montada e apenas deslizando: assim a
        transição acontece nos dois sentidos, sem depender de desmontagem.
      */}
      <div className="pointer-events-none fixed inset-0 z-50 lg:hidden">
        <button
          type="button"
          tabIndex={gavetaAberta ? 0 : -1}
          aria-label="Fechar menu"
          onClick={() => setGavetaAberta(false)}
          className={`bg-fundo/75 absolute inset-0 backdrop-blur-sm transition-opacity duration-300 ${
            gavetaAberta ? "pointer-events-auto opacity-100" : "opacity-0"
          }`}
        />

        <Navegacao
          caminho={caminho}
          nome={nome}
          email={email}
          inerte={!gavetaAberta}
          aoNavegar={() => setGavetaAberta(false)}
          className={`border-borda-suave bg-cromo ease-saida relative flex h-full w-[min(19rem,85vw)] border-r shadow-2xl transition-transform duration-300 ${
            gavetaAberta
              ? "pointer-events-auto translate-x-0"
              : "-translate-x-full"
          }`}
        />
      </div>

      {/* ---------- área principal ---------- */}
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="border-borda-suave bg-cromo/80 flex h-14 shrink-0 items-center gap-2 border-b px-3 backdrop-blur-md sm:h-16 sm:gap-3 sm:px-5 lg:px-6">
          <button
            type="button"
            onClick={() => setGavetaAberta(true)}
            aria-label="Abrir menu"
            aria-expanded={gavetaAberta}
            className="text-texto-2 hover:text-texto hover:bg-superficie-2 active:bg-borda-suave flex h-11 w-11 items-center justify-center rounded-lg transition-colors lg:hidden"
          >
            <IconeMenu />
          </button>

          <Link
            href="/"
            className="flex h-11 items-center px-1 lg:hidden"
            aria-label="Dashboard"
          >
            <Marca altura={20} />
          </Link>

          {/*
            No lugar da saudação da plataforma do aluno: o nome da seção atual.
            Num painel de trabalho, saber onde se está vale mais que um "bom
            dia". Só a partir de `lg`, onde a esquerda não disputa espaço com
            o botão do menu e a marca.
          */}
          {secao && (
            <p className="text-texto hidden truncate text-base font-semibold lg:block">
              {secao}
            </p>
          )}
        </header>

        <main className="flex flex-1 flex-col overflow-x-hidden overflow-y-auto overscroll-contain p-4 sm:p-6">
          {children}
        </main>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */

function Navegacao({
  caminho,
  nome,
  email,
  className,
  aoNavegar,
  inerte = false,
  recolhido = false,
  aoAlternarRecolhido,
}: {
  caminho: string;
  nome: string | null;
  email: string | null;
  className: string;
  /** Só a gaveta do mobile precisa reagir: navegar deve fechá-la. */
  aoNavegar?: () => void;
  /** Tira a gaveta fechada da ordem de foco e dos leitores de tela. */
  inerte?: boolean;
  /** Modo trilha de ícones — só no menu fixo do desktop. */
  recolhido?: boolean;
  aoAlternarRecolhido?: () => void;
}) {
  const ativo = acharAtivo(caminho);
  const navRef = useRef<HTMLElement | null>(null);
  const itensRef = useRef(new Map<string, HTMLAnchorElement>());
  const [marcador, setMarcador] = useState<{
    x: number;
    y: number;
    largura: number;
    altura: number;
  } | null>(null);

  /*
   * Posição do fundo do item ativo. Medimos o próprio link em vez de calcular
   * a altura pela contagem de itens: os grupos têm títulos que somem no modo
   * recolhido, e um rótulo pode crescer.
   *
   * O ResizeObserver cobre o que não passa por este efeito — a animação de
   * largura ao recolher, a troca de breakpoint e o instante em que o menu sai
   * de `display:none` (no celular ele nasce escondido e mede zero).
   */
  useEfeitoDeLayout(() => {
    const nav = navRef.current;
    const alvo = ativo ? itensRef.current.get(ativo) : null;
    if (!nav || !alvo) return;

    function medir() {
      // Escondido, o link mede zero; guardar isso jogaria o marcador no canto.
      if (!alvo || !alvo.offsetHeight) return;

      setMarcador({
        x: alvo.offsetLeft,
        y: alvo.offsetTop,
        largura: alvo.offsetWidth,
        altura: alvo.offsetHeight,
      });
    }

    medir();

    const observador = new ResizeObserver(medir);
    observador.observe(nav);
    return () => observador.disconnect();
  }, [ativo, recolhido]);

  /*
   * Há dois menus na página: o fixo do desktop e a gaveta do mobile. Sem nome
   * acessível, um leitor de tela anuncia "navegação" duas vezes sem
   * distinguir qual é qual.
   */
  return (
    <aside
      className={`flex-col ${className}`}
      inert={inerte}
      aria-label={aoAlternarRecolhido ? "Menu principal" : "Menu (gaveta)"}
    >
      <div
        className={`border-borda-suave relative flex h-14 shrink-0 items-center border-b sm:h-16 ${
          recolhido ? "justify-center px-2" : "px-4 sm:px-5"
        }`}
      >
        <Link
          href="/"
          onClick={aoNavegar}
          className="flex h-11 min-w-0 items-center"
          aria-label="Dashboard — Digital Educa"
        >
          {recolhido ? <MarcaIcone altura={26} /> : <Marca altura={24} />}
        </Link>

        {/*
          Botão de recolher, montado SOBRE a borda direita. Recolhido, a trilha
          de ícones não tem largura para o símbolo e o botão lado a lado —
          tirá-lo do fluxo resolve isso e deixa a marca centrada nos dois
          estados. O `z` vem do <aside>, senão a barra superior da área de
          conteúdo passaria por cima da metade que fica para fora.
        */}
        {aoAlternarRecolhido && (
          <button
            type="button"
            onClick={aoAlternarRecolhido}
            aria-label={recolhido ? "Expandir menu" : "Recolher menu"}
            title={recolhido ? "Expandir menu" : "Recolher menu"}
            className="border-borda-suave bg-cromo text-texto-2 hover:border-acento/60 hover:text-acento absolute top-1/2 right-0 flex h-6 w-6 -translate-y-1/2 translate-x-1/2 items-center justify-center rounded-full border shadow-md"
          >
            <svg
              viewBox="0 0 20 20"
              aria-hidden="true"
              className={`ease-saida h-3 w-3 transition-transform duration-300 ${
                recolhido ? "" : "rotate-180"
              }`}
              fill="none"
              stroke="currentColor"
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="m8 5.5 4.5 4.5L8 14.5" />
            </svg>
          </button>
        )}
      </div>

      <nav
        ref={navRef}
        className="relative flex flex-1 flex-col gap-4 overflow-x-hidden overflow-y-auto p-3"
      >
        {/*
          Fundo do item ativo. É um elemento SÓ, movido de um item para o
          outro — daí ele deslizar em vez de piscar no lugar novo. Fica antes
          dos links no DOM e os links são posicionados, então eles pintam por
          cima sem precisar de z-index.
        */}
        {marcador && (
          <span
            aria-hidden="true"
            style={{
              transform: `translate3d(${marcador.x}px, ${marcador.y}px, 0)`,
              width: marcador.largura,
              height: marcador.altura,
            }}
            className={`bg-acento shadow-acento/35 ease-saida absolute top-0 left-0 rounded-lg shadow-lg transition-[transform,width,height,opacity] duration-300 ${
              ativo ? "opacity-100" : "opacity-0"
            }`}
          />
        )}

        {GRUPOS.map((grupo, indiceGrupo) => (
          <div
            key={grupo.titulo ?? `grupo-${indiceGrupo}`}
            className="flex flex-col gap-1"
          >
            {grupo.titulo && !recolhido && (
              <h2 className="text-texto-3 px-3 pt-1 pb-1 text-[10px] font-semibold tracking-[0.12em] uppercase">
                {grupo.titulo}
              </h2>
            )}
            {grupo.titulo && recolhido && (
              <span
                aria-hidden="true"
                className="bg-borda-suave mx-3 my-1 h-px"
              />
            )}

            {grupo.itens.map((item) => {
              const daPagina = item.href === ativo;

              /*
                Tela ainda não construída. Vira <span> e não <a>: um link
                desabilitado continua focável e navegável, e levaria a um 404.
              */
              if (!item.pronta) {
                return (
                  <span
                    key={item.href}
                    aria-disabled="true"
                    title={`${item.rotulo} — ainda não implementada`}
                    className={`text-texto-3 relative flex min-h-11 items-center rounded-lg text-sm font-medium opacity-40 ${
                      recolhido ? "justify-center px-0" : "gap-3 px-3"
                    } py-2.5`}
                  >
                    <IconeItem>{item.icone}</IconeItem>
                    {!recolhido && (
                      <span className="truncate">{item.rotulo}</span>
                    )}
                    {recolhido && (
                      <span className="sr-only">
                        {item.rotulo} (ainda não implementada)
                      </span>
                    )}
                  </span>
                );
              }

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  ref={(no) => {
                    if (no) itensRef.current.set(item.href, no);
                    else itensRef.current.delete(item.href);
                  }}
                  onClick={aoNavegar}
                  aria-current={daPagina ? "page" : undefined}
                  title={recolhido ? item.rotulo : undefined}
                  className={`group relative flex min-h-11 items-center rounded-lg text-sm font-medium duration-200 ${
                    recolhido ? "justify-center px-0" : "gap-3 px-3"
                  } py-2.5 ${
                    daPagina
                      ? /*
                         * Só a COR transiciona aqui, e não o fundo. O item
                         * clicado está sob o ponteiro, então carrega o fundo
                         * de hover — opaco e pintado por cima do marcador. Com
                         * `transition-colors` esse retângulo desbotava por
                         * 200ms bem em cima do marcador que chegava: era a
                         * piscada.
                         */
                        "text-white transition-[color] delay-100"
                      : "text-texto-2 hover:bg-superficie-2 hover:text-texto active:bg-borda-suave transition-colors"
                  }`}
                >
                  <IconeItem className="transition-transform duration-200 group-hover:scale-110">
                    {item.icone}
                  </IconeItem>
                  {!recolhido && <span className="truncate">{item.rotulo}</span>}
                  {recolhido && <span className="sr-only">{item.rotulo}</span>}
                </Link>
              );
            })}
          </div>
        ))}
      </nav>

      <div className="border-borda-suave flex shrink-0 flex-col gap-3 border-t p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] sm:p-4 sm:pb-[max(1rem,env(safe-area-inset-bottom))]">
        {(nome || email) && (
          /*
            Cartão do usuário. Diferente da plataforma do aluno, aqui NÃO é
            link: o painel não tem tela de perfil — a conta é gerida na própria
            plataforma.
          */
          <div
            title={recolhido ? (nome ?? email ?? "Conta") : undefined}
            className={`flex items-center ${
              recolhido ? "justify-center p-1" : "gap-3 p-1"
            }`}
          >
            <span className="bg-acento/15 text-acento flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-semibold">
              {(nome ?? email ?? "?").charAt(0).toUpperCase()}
            </span>
            {!recolhido && (
              <span className="flex min-w-0 flex-col">
                {nome && (
                  <span className="truncate text-sm font-semibold">{nome}</span>
                )}
                {email && (
                  <span className="text-texto-3 truncate text-xs">{email}</span>
                )}
              </span>
            )}
          </div>
        )}
        <BotaoSair compacto={recolhido} />
      </div>
    </aside>
  );
}

/* ------------------------------------------------------------------ */

function IconeItem({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <svg
      viewBox="0 0 20 20"
      aria-hidden="true"
      className={`h-5 w-5 shrink-0 ${className}`}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {children}
    </svg>
  );
}

function IconeMenu() {
  return (
    <svg
      viewBox="0 0 20 20"
      className="h-5 w-5"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
    >
      <path d="M3 5.5h14M3 10h14M3 14.5h14" strokeLinecap="round" />
    </svg>
  );
}
