"use client";

import { useState, type FormEvent } from "react";
import { enviarPush } from "@/app/(painel)/push/acoes";
import {
  BOTAO_PRIMARIO,
  CONTROLE,
  Campo,
  Secao,
} from "@/components/campos-formulario";
import type { AlcancePush, ResultadoPush } from "@/types/api";

/**
 * Disparo de notificação para app e web.
 *
 * Fica atrás de confirmação porque não tem desfazer, não tem agendamento e não
 * tem segmentação: sai para todos os destinos na hora.
 */
export function FormularioPush({ alcance }: { alcance: AlcancePush }) {
  const [confirmando, setConfirmando] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [resultado, setResultado] = useState<ResultadoPush | null>(null);

  const [titulo, setTitulo] = useState("");
  const [texto, setTexto] = useState("");
  const [link, setLink] = useState("");
  const [imagem, setImagem] = useState("");

  async function disparar(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault();

    if (!confirmando) {
      setConfirmando(true);
      return;
    }

    setErro(null);
    setEnviando(true);

    const saida = await enviarPush({
      title: titulo.trim(),
      body: texto.trim(),
      link: link.trim() || undefined,
      imageUrl: imagem.trim() || undefined,
    });

    setEnviando(false);
    setConfirmando(false);

    if (!saida.ok) {
      setErro(saida.erro);
      return;
    }

    setResultado(saida.resultado);
    setTitulo("");
    setTexto("");
    setLink("");
    setImagem("");
  }

  return (
    <form onSubmit={disparar} className="flex flex-col gap-6">
      <Secao titulo="Mensagem">
        <Campo rotulo="Título" obrigatorio>
          <input
            required
            maxLength={65}
            value={titulo}
            onChange={(e) => setTitulo(e.target.value)}
            placeholder="Novidade na plataforma"
            className={CONTROLE}
          />
        </Campo>

        <Campo
          rotulo="Texto"
          obrigatorio
          ajuda="No celular, o sistema corta o que passar de duas linhas."
        >
          <textarea
            required
            rows={3}
            maxLength={180}
            value={texto}
            onChange={(e) => setTexto(e.target.value)}
            placeholder="Um novo conteúdo acabou de sair. Confira agora."
            className={`${CONTROLE} resize-y`}
          />
        </Campo>

        <div className="grid gap-4 sm:grid-cols-2">
          <Campo
            rotulo="Link ao tocar"
            ajuda="Caminho interno, como /conteudo/123, ou URL completa."
          >
            <input
              value={link}
              onChange={(e) => setLink(e.target.value)}
              placeholder="/inicio"
              className={CONTROLE}
            />
          </Campo>

          <Campo rotulo="Imagem" ajuda="URL completa. Opcional.">
            <input
              value={imagem}
              onChange={(e) => setImagem(e.target.value)}
              placeholder="https://…"
              className={CONTROLE}
            />
          </Campo>
        </div>
      </Secao>

      <Secao titulo="Prévia" ajuda="Aproximação de como chega no aparelho.">
        <div className="border-borda bg-superficie-2 flex gap-3 rounded-xl border p-3">
          <span className="bg-acento/15 text-acento flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-xs font-bold">
            DE
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-texto truncate text-sm font-semibold">
              {titulo || "Título da notificação"}
            </p>
            <p className="text-texto-2 line-clamp-2 text-sm">
              {texto || "O texto aparece aqui, em até duas linhas."}
            </p>
          </div>
        </div>
      </Secao>

      {erro && (
        <p
          role="alert"
          className="border-alerta/30 bg-alerta/10 text-alerta rounded-lg border px-3 py-2 text-sm"
        >
          {erro}
        </p>
      )}

      {resultado && (
        <div
          role="status"
          className="border-sucesso/30 bg-sucesso/10 flex flex-col gap-1 rounded-lg border px-3 py-2.5 text-sm"
        >
          <p className="text-sucesso font-medium">Disparo concluído.</p>
          <p className="text-texto-2">
            App: {resultado.sent}{" "}
            {resultado.sent === 1 ? "aparelho" : "aparelhos"}
            {resultado.reason === "FCM_NOT_CONFIGURED" &&
              " (Firebase não configurado neste ambiente)"}
          </p>
          <p className="text-texto-2">
            Web: {resultado.web?.enviadas ?? 0}{" "}
            {resultado.web?.enviadas === 1 ? "navegador" : "navegadores"}
            {resultado.web?.motivo === "VAPID_NAO_CONFIGURADO" &&
              " (VAPID não configurado neste ambiente)"}
            {resultado.web?.removidas
              ? ` · ${resultado.web.removidas} inscrição(ões) expirada(s) removida(s)`
              : ""}
          </p>
        </div>
      )}

      {confirmando ? (
        <div className="border-aviso/40 bg-aviso/10 flex flex-col gap-3 rounded-lg border p-4">
          <p className="text-texto text-sm">
            Enviar para <strong>{alcance.total} destinos</strong> agora?
            Não tem agendamento, não dá para segmentar e não tem desfazer.
          </p>
          <div className="flex gap-2">
            <button type="submit" disabled={enviando} className={BOTAO_PRIMARIO}>
              {enviando ? "Enviando…" : "Confirmar disparo"}
            </button>
            <button
              type="button"
              onClick={() => setConfirmando(false)}
              disabled={enviando}
              className="text-texto-2 hover:text-texto rounded-lg px-4 py-2.5 text-sm font-medium"
            >
              Cancelar
            </button>
          </div>
        </div>
      ) : (
        <div className="border-borda-suave flex items-center gap-3 border-t pt-5">
          <button
            type="submit"
            disabled={!titulo.trim() || !texto.trim()}
            className={BOTAO_PRIMARIO}
          >
            Enviar notificação
          </button>
        </div>
      )}
    </form>
  );
}
