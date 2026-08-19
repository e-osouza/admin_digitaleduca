"use client";

import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";

/*
  Portado da plataforma do aluno (`new_digitaleduca/src/components/
  filtro-periodo.tsx`). Os dois produtos usam os mesmos tokens de cor, então o
  componente veio inteiro; o que mudou aqui foi `basePath` — o painel podia
  querer o filtro em outra rota — e o estado de "aplicando", porque no painel a
  consulta agrega bem mais coisa e a espera aparece.
*/

/* --------------------------- helpers de data --------------------------- */

const DIAS_CABECALHO = ["D", "S", "T", "Q", "Q", "S", "S"];
const MESES_LONGOS = [
  "janeiro", "fevereiro", "março", "abril", "maio", "junho",
  "julho", "agosto", "setembro", "outubro", "novembro", "dezembro",
];
const MESES_CURTOS = ["jan", "fev", "mar", "abr", "mai", "jun", "jul", "ago", "set", "out", "nov", "dez"];

/** Data local → "YYYY-MM-DD" (sem fuso, é a data que o usuário vê). */
function ymd(d: Date) {
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const dia = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}-${m}-${dia}`;
}
function deYmd(s?: string) {
  if (!s || !/^\d{4}-\d{2}-\d{2}$/.test(s)) return null;
  const [a, m, d] = s.split("-").map(Number);
  return new Date(a, m - 1, d);
}
function addDias(d: Date, n: number) {
  const r = new Date(d);
  r.setDate(r.getDate() + n);
  return r;
}
function inicioMes(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), 1);
}
function fimMes(d: Date) {
  return new Date(d.getFullYear(), d.getMonth() + 1, 0);
}
function mesmoDia(a: Date, b: Date) {
  return ymd(a) === ymd(b);
}
function diasDaGrade(mesVisivel: Date) {
  const primeiro = inicioMes(mesVisivel);
  const comeco = addDias(primeiro, -primeiro.getDay()); // volta até domingo
  return Array.from({ length: 42 }, (_, i) => addDias(comeco, i));
}

/* ------------------------------ atalhos ------------------------------ */

type Atalho = { id: string; label: string; range: () => [Date | null, Date | null] };

function construirAtalhos(hoje: Date): Atalho[] {
  const mesPassado = new Date(hoje.getFullYear(), hoje.getMonth() - 1, 1);
  return [
    { id: "todo", label: "Todo o período", range: () => [null, null] },
    { id: "7d", label: "Últimos 7 dias", range: () => [addDias(hoje, -6), hoje] },
    { id: "30d", label: "Últimos 30 dias", range: () => [addDias(hoje, -29), hoje] },
    { id: "90d", label: "Últimos 90 dias", range: () => [addDias(hoje, -89), hoje] },
    { id: "mes", label: "Este mês", range: () => [inicioMes(hoje), hoje] },
    { id: "mespassado", label: "Mês passado", range: () => [mesPassado, fimMes(mesPassado)] },
  ];
}

/** Rótulo curto do período para o botão. */
function rotularPeriodo(de: Date | null, ate: Date | null, atalhos: Atalho[]) {
  if (!de && !ate) return { titulo: "Todo o período", detalhe: "" };
  for (const a of atalhos) {
    const [ad, aa] = a.range();
    if (ad && aa && de && ate && mesmoDia(ad, de) && mesmoDia(aa, ate)) {
      const dias = Math.round((aa.getTime() - ad.getTime()) / 86400000) + 1;
      return { titulo: a.label, detalhe: `${dias} dias` };
    }
  }
  const fmt = (d: Date) => `${d.getDate()} ${MESES_CURTOS[d.getMonth()]}`;
  if (de && ate) return { titulo: `${fmt(de)} – ${fmt(ate)}`, detalhe: "" };
  return { titulo: "Personalizado", detalhe: "" };
}

/* ------------------------------ componente ------------------------------ */

export function FiltroPeriodo({
  de,
  ate,
  todo,
  basePath = "/estatisticas",
}: {
  de?: string;
  ate?: string;
  todo?: boolean;
  /** Rota que recebe `?de=&ate=` — o filtro não presume onde está montado. */
  basePath?: string;
}) {
  const router = useRouter();
  const [aplicando, comeceATransicao] = useTransition();
  const hoje = useMemo(() => {
    const d = new Date();
    return new Date(d.getFullYear(), d.getMonth(), d.getDate());
  }, []);
  const atalhos = useMemo(() => construirAtalhos(hoje), [hoje]);

  const deInicial = deYmd(de);
  const ateInicial = deYmd(ate);

  const [aberto, setAberto] = useState(false);
  const [ini, setIni] = useState<Date | null>(deInicial);
  const [fim, setFim] = useState<Date | null>(ateInicial);
  const [mesVisivel, setMesVisivel] = useState<Date>(deInicial ?? hoje);
  const ref = useRef<HTMLDivElement>(null);

  const rotulo = todo
    ? { titulo: "Todo o período", detalhe: "" }
    : rotularPeriodo(deInicial, ateInicial, atalhos);

  // Fecha ao clicar fora ou apertar Esc.
  useEffect(() => {
    if (!aberto) return;
    function fora(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setAberto(false);
    }
    function esc(e: KeyboardEvent) {
      if (e.key === "Escape") setAberto(false);
    }
    document.addEventListener("mousedown", fora);
    document.addEventListener("keydown", esc);
    return () => {
      document.removeEventListener("mousedown", fora);
      document.removeEventListener("keydown", esc);
    };
  }, [aberto]);

  function abrir() {
    setIni(deInicial);
    setFim(ateInicial);
    setMesVisivel(deInicial ?? hoje);
    setAberto(true);
  }

  function aplicarAtalho(a: Atalho) {
    const [d, t] = a.range();
    setIni(d);
    setFim(t);
    if (d) setMesVisivel(d);
    navegar(d, t);
  }

  function clicarDia(dia: Date) {
    if (!ini || (ini && fim)) {
      // começa um novo range
      setIni(dia);
      setFim(null);
    } else if (dia < ini) {
      setFim(ini);
      setIni(dia);
    } else {
      setFim(dia);
    }
  }

  function navegar(d: Date | null, t: Date | null) {
    const params = new URLSearchParams();
    if (d && t) {
      params.set("de", ymd(d));
      params.set("ate", ymd(t));
    } else {
      // sem intervalo = "Todo o período" explícito (o padrão da URL é 30 dias)
      params.set("todo", "1");
    }
    comeceATransicao(() => router.push(`${basePath}?${params.toString()}`));
    setAberto(false);
  }

  const podeAplicar = (ini && fim) || (!ini && !fim);
  const atalhoAtivo = rotularPeriodo(ini, fim, atalhos).titulo;

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => (aberto ? setAberto(false) : abrir())}
        aria-expanded={aberto}
        aria-busy={aplicando}
        className="border-borda bg-superficie hover:border-acento/60 flex min-h-11 items-center gap-2.5 rounded-xl border px-4 text-sm transition-colors"
      >
        <svg viewBox="0 0 20 20" aria-hidden="true" className="text-texto-3 h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.6">
          <rect x="3" y="4.5" width="14" height="12" rx="2" />
          <path d="M3 8h14M7 3v3M13 3v3" strokeLinecap="round" />
        </svg>
        <span className="text-texto font-semibold">{rotulo.titulo}</span>
        {rotulo.detalhe && (
          <span className="text-texto-3 font-mono text-xs">· {rotulo.detalhe}</span>
        )}
        {aplicando && (
          <span
            aria-hidden
            className="border-borda border-t-acento size-3.5 animate-spin rounded-full border-2"
          />
        )}
        <svg viewBox="0 0 20 20" aria-hidden="true" className={`text-texto-3 ml-1 h-4 w-4 transition-transform ${aberto ? "rotate-180" : ""}`} fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
          <path d="m5 7.5 5 5 5-5" />
        </svg>
      </button>

      {aberto && (
        <div className="border-borda-suave bg-superficie absolute right-0 z-50 mt-2 flex w-[min(92vw,640px)] flex-col overflow-hidden rounded-2xl border shadow-2xl">
          <div className="flex flex-col sm:flex-row">
            {/* atalhos */}
            <div className="border-borda-suave flex shrink-0 flex-col gap-0.5 border-b p-3 sm:w-52 sm:border-r sm:border-b-0">
              <span className="text-texto-3 px-3 py-1 text-[11px] font-semibold tracking-wider uppercase">
                Atalhos
              </span>
              {atalhos.map((a) => {
                const ativo = a.label === atalhoAtivo;
                return (
                  <button
                    key={a.id}
                    type="button"
                    onClick={() => aplicarAtalho(a)}
                    className={`flex min-h-10 items-center rounded-lg px-3 text-left text-sm transition-colors ${
                      ativo
                        ? "bg-superficie-2 text-texto font-semibold"
                        : "text-texto-2 hover:bg-superficie-2"
                    }`}
                  >
                    {a.label}
                  </button>
                );
              })}
            </div>

            {/* calendário */}
            <div className="flex flex-1 flex-col gap-3 p-4">
              <div className="flex items-center justify-between">
                <span className="font-display text-base font-semibold">
                  {MESES_LONGOS[mesVisivel.getMonth()]} de {mesVisivel.getFullYear()}
                </span>
                <div className="flex gap-1">
                  <BotaoMes onClick={() => setMesVisivel(new Date(mesVisivel.getFullYear(), mesVisivel.getMonth() - 1, 1))} dir="‹" />
                  <BotaoMes onClick={() => setMesVisivel(new Date(mesVisivel.getFullYear(), mesVisivel.getMonth() + 1, 1))} dir="›" />
                </div>
              </div>

              <div className="grid grid-cols-7 gap-y-1">
                {DIAS_CABECALHO.map((d, i) => (
                  <span key={i} className="text-texto-3 flex h-8 items-center justify-center text-xs font-medium">
                    {d}
                  </span>
                ))}
                {diasDaGrade(mesVisivel).map((dia, i) => {
                  const foraDoMes = dia.getMonth() !== mesVisivel.getMonth();
                  const futuro = dia > hoje;
                  const ehIni = ini && mesmoDia(dia, ini);
                  const ehFim = fim && mesmoDia(dia, fim);
                  const noRange = ini && fim && dia >= ini && dia <= fim;
                  const pontaSel = ehIni || ehFim;
                  return (
                    <button
                      key={i}
                      type="button"
                      disabled={futuro}
                      onClick={() => clicarDia(dia)}
                      className={`relative flex h-10 items-center justify-center text-sm transition-colors disabled:cursor-not-allowed disabled:opacity-30 ${
                        noRange && !pontaSel ? "bg-acento/12" : ""
                      } ${pontaSel ? "bg-acento rounded-lg font-bold text-white" : "rounded-lg"} ${
                        !pontaSel && !noRange ? "hover:bg-superficie-2" : ""
                      } ${foraDoMes ? "text-texto-3/50" : "text-texto"}`}
                    >
                      {dia.getDate()}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* rodapé */}
          <div className="border-borda-suave flex items-center justify-between gap-3 border-t px-4 py-3">
            <span className="text-texto-3 text-xs">
              {ini && fim
                ? `${ini.getDate()} ${MESES_CURTOS[ini.getMonth()]} – ${fim.getDate()} ${MESES_CURTOS[fim.getMonth()]}`
                : ini
                  ? "Escolha a data final"
                  : "Todo o período"}
            </span>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setAberto(false)}
                className="text-texto-2 hover:text-texto min-h-10 rounded-lg px-4 text-sm font-semibold transition-colors"
              >
                Cancelar
              </button>
              <button
                type="button"
                disabled={!podeAplicar}
                onClick={() => navegar(ini, fim)}
                className="bg-acento text-white hover:bg-acento-hover min-h-10 rounded-lg px-5 text-sm font-bold transition-colors disabled:opacity-50"
              >
                Aplicar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function BotaoMes({ onClick, dir }: { onClick: () => void; dir: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="border-borda text-texto-2 hover:border-acento/60 hover:text-acento flex h-8 w-8 items-center justify-center rounded-lg border text-sm transition-colors"
    >
      {dir}
    </button>
  );
}
