import Link from "next/link";
import { AvisoSemMetricas } from "@/components/aviso-sem-metricas";
import {
  CartaoGrafico,
  GraficoBarras,
  GraficoLinha,
} from "@/components/graficos";
import { GradeIndicadores, Indicador } from "@/components/indicadores";
import { mesLegivel, moedaBR, numeroBR } from "@/lib/formato";
import { alturaBarras } from "@/lib/grafico";
import { obterEstatisticas, resumoVideos } from "@/lib/queries";
import type { DestaqueVideo } from "@/types/api";

export const metadata = { title: "Dashboard · Painel DigitalEduca" };

/*
  O dashboard responde "como estamos?" numa olhada e para por aí. Ele mostra o
  tamanho de hoje e a tendência dos últimos meses — sem filtro de período, sem
  recorte por instrutor, categoria ou plano. Tudo isso mora em Estatísticas.

  A separação é deliberada: uma tela de abertura que pede leitura deixa de ser
  tela de abertura.
*/
export default async function PaginaDashboard() {
  const [estatisticas, videos] = await Promise.all([
    obterEstatisticas(),
    resumoVideos(),
  ]);

  if (!estatisticas && !videos) {
    return (
      <div className="flex flex-col gap-6">
        <Cabecalho />
        <AvisoSemMetricas />
      </div>
    );
  }

  const acervo = estatisticas?.acervo;
  const cadastros = estatisticas?.cadastrosPorPeriodo ?? [];
  const horas = estatisticas?.horasPorPeriodo ?? [];
  const ultimoMes = cadastros.at(-1);

  const topCinco = (estatisticas?.topConteudos ?? []).slice(0, 5).map((linha) => ({
    ...linha,
    rotulo:
      linha.titulo.length > 20
        ? `${linha.titulo.slice(0, 19)}…`
        : linha.titulo,
  }));

  return (
    <div className="flex flex-col gap-8">
      <Cabecalho />

      {acervo ? (
        <GradeIndicadores>
          <Indicador
            rotulo="Usuários"
            valor={numeroBR(acervo.usuarios)}
            apoio={
              ultimoMes
                ? `+${numeroBR(ultimoMes.total)} em ${mesLegivel(ultimoMes.balde)}`
                : undefined
            }
          />
          <Indicador
            rotulo="Assinaturas ativas"
            valor={numeroBR(acervo.assinaturasAtivas)}
            apoio={`${moedaBR(acervo.receitaAtiva)} em vigor`}
          />
          <Indicador
            rotulo="Conteúdos publicados"
            valor={numeroBR(acervo.conteudosPublicados)}
            apoio={`${numeroBR(acervo.videos)} aulas no catálogo`}
          />
          <Indicador
            rotulo="Instrutores"
            valor={numeroBR(acervo.instrutores)}
          />
        </GradeIndicadores>
      ) : null}

      {estatisticas ? (
        <div className="grid items-start gap-4 xl:grid-cols-2">
          <CartaoGrafico
            titulo="Cadastros por mês"
            descricao="Novos usuários."
            dados={cadastros}
            colunas={[
              { cabecalho: "Mês", campo: "balde", formato: "mes" },
              { cabecalho: "Cadastros", campo: "total", formato: "numero" },
            ]}
          >
            <GraficoLinha
              dados={cadastros}
              chaveX="balde"
              series={[
                {
                  chave: "total",
                  rotulo: "Cadastros",
                  slot: 0,
                  formato: "numero",
                },
              ]}
            />
          </CartaoGrafico>

          <CartaoGrafico
            titulo="Horas assistidas por mês"
            descricao="Quanto a base consumiu."
            dados={horas}
            colunas={[
              { cabecalho: "Mês", campo: "balde", formato: "mes" },
              { cabecalho: "Horas", campo: "horas", formato: "horas" },
              {
                cabecalho: "Visualizações",
                campo: "visualizacoes",
                formato: "numero",
              },
            ]}
          >
            <GraficoLinha
              dados={horas}
              chaveX="balde"
              series={[
                { chave: "horas", rotulo: "Horas", slot: 2, formato: "horas" },
              ]}
            />
          </CartaoGrafico>

          <CartaoGrafico
            titulo="Conteúdos mais assistidos"
            descricao="Top 5 por visualizações."
            altura={alturaBarras(topCinco.length)}
            larga
            dados={topCinco}
            colunas={[
              { cabecalho: "Conteúdo", campo: "titulo" },
              { cabecalho: "Tipo", campo: "tipo" },
              {
                cabecalho: "Visualizações",
                campo: "visualizacoes",
                formato: "numero",
              },
              { cabecalho: "Horas", campo: "horas", formato: "horas" },
            ]}
          >
            <GraficoBarras
              dados={topCinco}
              chaveRotulo="rotulo"
              chaveValor="visualizacoes"
              larguraRotulo={168}
            />
          </CartaoGrafico>
        </div>
      ) : null}

      {videos ? (
        <section className="flex flex-col gap-3">
          <h2 className="text-texto-3 text-sm font-semibold tracking-wide uppercase">
            Destaques de vídeo
          </h2>
          <div className="grid gap-3 sm:grid-cols-2">
            <CardVideo titulo="Mais assistido" video={videos.maisAssistido} />
            <CardVideo titulo="Menos assistido" video={videos.menosAssistido} />
            <CardVideo titulo="Melhor avaliado" video={videos.melhorAvaliado} />
            <CardVideo titulo="Pior avaliado" video={videos.piorAvaliado} />
          </div>
        </section>
      ) : null}
    </div>
  );
}

function Cabecalho() {
  return (
    <div className="flex flex-wrap items-end justify-between gap-3">
      <div>
        <h1 className="text-texto text-2xl font-semibold">Dashboard</h1>
        <p className="text-texto-3 mt-0.5 text-sm">
          Resumo da plataforma web e do aplicativo.
        </p>
      </div>
      <Link
        href="/estatisticas"
        className="text-acento-claro hover:text-acento text-sm font-medium transition-colors"
      >
        Ver estatísticas completas →
      </Link>
    </div>
  );
}

function CardVideo({
  titulo,
  video,
}: {
  titulo: string;
  video: DestaqueVideo | null;
}) {
  return (
    <div className="border-borda-suave bg-superficie rounded-xl border p-4">
      <p className="text-texto-3 text-sm">{titulo}</p>

      {video ? (
        <>
          <p className="text-texto mt-1 font-medium">{video.titulo}</p>
          {video.conteudo ? (
            <p className="text-texto-3 text-sm">{video.conteudo}</p>
          ) : null}
          <dl className="text-texto-2 mt-3 flex gap-4 text-sm">
            <div>
              <dt className="text-texto-3">Views</dt>
              <dd className="tabular-nums">{numeroBR(video.visualizacoes)}</dd>
            </div>
            <div>
              <dt className="text-texto-3">Conclusão</dt>
              <dd className="tabular-nums">{video.taxaConclusao}%</dd>
            </div>
            {video.notaMedia !== null ? (
              <div>
                <dt className="text-texto-3">Nota</dt>
                <dd className="tabular-nums">{video.notaMedia.toFixed(1)}</dd>
              </div>
            ) : null}
          </dl>
        </>
      ) : (
        <p className="text-texto-3 mt-1 text-sm">Sem dados ainda.</p>
      )}
    </div>
  );
}
