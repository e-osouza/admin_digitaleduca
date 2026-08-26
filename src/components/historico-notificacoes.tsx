import Link from "next/link";
import { Secao } from "@/components/campos-formulario";
import type { NotificacaoEnviada } from "@/types/api";

const dataHora = new Intl.DateTimeFormat("pt-BR", {
  dateStyle: "short",
  timeStyle: "short",
});

const ROTULO: Record<string, string> = {
  CONTEUDO_NOVO: "Conteúdo novo",
  CONTEUDO_ATUALIZADO: "Conteúdo atualizado",
  MANUAL: "Escrita pela equipe",
};

/**
 * O que já foi enviado.
 *
 * Automáticas e manuais na mesma lista de propósito: separá-las esconderia a
 * comparação que interessa — quanto sai sozinho contra quanto a equipe escreve.
 *
 * As duas colunas de número respondem perguntas diferentes. "Push" é quantos
 * aparelhos foram alcançados NO instante do disparo, e fica congelado; se o
 * canal estava desligado, é zero para sempre e o histórico registra isso.
 * "Leituras" continua subindo, porque a notificação segue na caixa de entrada
 * de quem ainda não abriu — é o que mostra que o aviso chegou mesmo sem push.
 */
export function HistoricoNotificacoes({
  itens,
  total,
}: {
  itens: NotificacaoEnviada[];
  total: number;
}) {
  if (itens.length === 0) {
    return (
      <Secao titulo="Histórico">
        <p className="text-texto-3 text-sm">
          Nada enviado ainda. O que sair daqui e o que a plataforma disparar
          sozinha ao publicar conteúdo aparecem nesta lista.
        </p>
      </Secao>
    );
  }

  return (
    <Secao
      titulo="Histórico"
      ajuda={`${total} ${total === 1 ? "notificação enviada" : "notificações enviadas"}. "Push" é o alcance no momento do disparo; "leituras" continua subindo depois.`}
    >
      <ul className="border-borda-suave divide-borda-suave divide-y rounded-lg border">
        {itens.map((n) => (
          <li key={n.id} className="flex flex-col gap-1 px-3 py-2.5">
            <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
              <span className="text-texto text-sm font-medium">{n.titulo}</span>
              <span className="bg-superficie-2 text-texto-3 rounded px-1.5 py-0.5 text-[11px]">
                {ROTULO[n.tipo] ?? n.tipo}
              </span>
              {n.link && (
                <span className="text-texto-3 text-xs">{n.link}</span>
              )}
            </div>

            <p className="text-texto-2 text-sm">{n.mensagem}</p>

            <p className="text-texto-3 flex flex-wrap gap-x-3 text-xs">
              <span>{dataHora.format(new Date(n.createdAt))}</span>
              <span>
                push: {n.enviadosMobile} app · {n.enviadosWeb} web
              </span>
              <span>
                {n.leituras} {n.leituras === 1 ? "leitura" : "leituras"}
              </span>
              {n.criadaPor ? (
                <span>por {n.criadaPor.nome}</span>
              ) : (
                <span>automática</span>
              )}
              {n.conteudoId && (
                <Link
                  href={`/conteudos/${n.conteudoId}/editar`}
                  className="hover:text-acento-claro transition-colors"
                >
                  ver conteúdo
                </Link>
              )}
            </p>
          </li>
        ))}
      </ul>
    </Secao>
  );
}
