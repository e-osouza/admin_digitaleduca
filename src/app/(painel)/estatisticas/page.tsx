import { AvisoSemMetricas } from "@/components/aviso-sem-metricas";
import { FiltroPeriodo } from "@/components/filtro-periodo";
import {
  CartaoGrafico,
  GraficoBarras,
  GraficoLinha,
  GraficoPizza,
} from "@/components/graficos";
import { GradeIndicadores, Indicador } from "@/components/indicadores";
import { RankingComFoto } from "@/components/ranking-com-foto";
import { dataBR, horasBR, moedaBR, numeroBR, plural } from "@/lib/formato";
import { alturaBarras } from "@/lib/grafico";
import { rotuloDoTipo } from "@/lib/tipos";
import { obterEstatisticas } from "@/lib/queries";

export const metadata = { title: "Estatísticas · Painel DigitalEduca" };

/** Rótulo humano e cor fixa por canal — a cor pertence ao canal, não à ordem. */
const CANAIS: Record<string, { rotulo: string; slot: number }> = {
  android: { rotulo: "App Android", slot: 0 },
  ios: { rotulo: "App iOS", slot: 1 },
  web: { rotulo: "Navegador (web)", slot: 2 },
};

/** Barra deitada só compara bem se o rótulo couber numa linha. */
function encurtar(texto: string, limite = 20) {
  return texto.length > limite ? `${texto.slice(0, limite - 1)}…` : texto;
}

function ymd(d: Date) {
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const dia = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}-${m}-${dia}`;
}

export default async function PaginaEstatisticas({
  searchParams,
}: {
  searchParams: Promise<{ de?: string; ate?: string; todo?: string }>;
}) {
  const params = await searchParams;

  /*
    Sem parâmetro na URL, o padrão são os últimos 30 dias — abrir a tela em
    "todo o período" mistura o mês passado com 2025 e some com qualquer
    tendência recente. "Todo o período" continua a um clique, via `?todo=1`.
  */
  const semRecorte = params.todo === "1";
  const hoje = new Date();
  const trintaDias = new Date(hoje);
  trintaDias.setDate(trintaDias.getDate() - 29);

  const de = semRecorte ? undefined : (params.de ?? ymd(trintaDias));
  const ate = semRecorte ? undefined : (params.ate ?? ymd(hoje));

  const dados = await obterEstatisticas(de, ate);

  const cabecalho = (
    <div className="flex flex-wrap items-end justify-between gap-3">
      <div>
        <h1 className="text-texto text-2xl font-semibold">Estatísticas</h1>
        <p className="text-texto-3 mt-0.5 text-sm">
          Plataforma web e aplicativo. Atualizadas a cada 5 minutos.
        </p>
      </div>
      <FiltroPeriodo de={de} ate={ate} todo={semRecorte} />
    </div>
  );

  if (!dados) {
    return (
      <div className="flex flex-col gap-6">
        {cabecalho}
        <AvisoSemMetricas />
      </div>
    );
  }

  const {
    periodo,
    acervo,
    resumo,
    cadastrosPorPeriodo,
    assinaturasPorPeriodo,
    horasPorPeriodo,
    cancelamentosPorPeriodo,
    statusAssinaturas,
    porPlano,
    consumoPorTipo,
    consumoPorCategoria,
    consumoPorSubcategoria,
    topInstrutores,
    topUsuarios,
    topTags,
    topConteudos,
    topAulas,
    maisSalvos,
    avaliacoesPorNota,
    dispositivos,
  } = dados;

  /* O eixo do tempo muda de forma com o recorte: 21/07 num mês, ago/25 num ano. */
  const formatoX = periodo.granularidade === "dia" ? "dia" : "mes";
  const rotuloDoBalde = periodo.rotuloDoBalde;

  const canais = dispositivos.map((linha) => ({
    ...linha,
    rotulo: CANAIS[linha.canal]?.rotulo ?? linha.canal,
    slot: CANAIS[linha.canal]?.slot ?? 3,
  }));
  const totalDispositivos = canais.reduce((soma, c) => soma + c.total, 0);
  const emMobile = canais
    .filter((c) => c.canal === "android" || c.canal === "ios")
    .reduce((soma, c) => soma + c.total, 0);

  const cancelamentos = cancelamentosPorPeriodo.reduce(
    (soma, linha) => soma + linha.total,
    0,
  );

  const situacoes = statusAssinaturas.map((linha, indice) => ({
    ...linha,
    slot: indice,
  }));

  /*
    Tipo de acesso agora: a cor pertence ao tipo, não à ordem (slot fixo).
    Pagante de verdade = cartão + manual; cortesia e club são gratuitos.
  */
  const acesso = acervo.acessoAtivo;
  const tipoAcesso = [
    { rotulo: "Cartão", total: acesso.gateway.total, slot: 0 },
    { rotulo: "Manual", total: acesso.manual.total, slot: 1 },
    { rotulo: "Cortesia", total: acesso.cortesia.total, slot: 2 },
    { rotulo: "Club", total: acesso.club.total, slot: 3 },
  ].filter((linha) => linha.total > 0);
  const gratuitosTotal = acesso.cortesia.total + acesso.club.total;

  const instrutores = topInstrutores.map((l) => ({
    ...l,
    nome: l.instrutor,
    valor: l.visualizacoes,
    apoio: `${horasBR(l.horas)} · ${plural(l.conteudos, "conteúdo", "conteúdos")}`,
  }));
  /* O banco guarda AULA; a interface inteira diz MasterClass. */
  const tipos = consumoPorTipo.map((l) => ({ ...l, tipo: rotuloDoTipo(l.tipo) }));

  const conteudos = topConteudos.map((l) => ({
    ...l,
    tipo: rotuloDoTipo(l.tipo),
    rotulo: encurtar(l.titulo),
  }));
  const aulas = topAulas.map((l) => ({ ...l, rotulo: encurtar(l.titulo) }));

  const usuarios = topUsuarios.map((l) => ({
    ...l,
    valor: l.horas,
    apoio: `${plural(l.aulas, "aula", "aulas")} · ${numeroBR(l.concluidas)} ok`,
    /* Conta interna aparece marcada em vez de ser removida da lista: sumir com
       o número sem avisar esconderia que boa parte do consumo é teste. */
    marca: l.role === "USER" ? undefined : l.role,
    visto: dataBR(l.ultimoAcesso),
  }));
  const salvos = maisSalvos.map((l) => ({ ...l, rotulo: encurtar(l.titulo) }));
  const notas = avaliacoesPorNota.map((l) => ({
    ...l,
    rotulo: `${l.nota} ${l.nota === 1 ? "estrela" : "estrelas"}`,
    /* Nota 1 no degrau mais claro, nota 5 no mais escuro — a régua é a cor. */
    degrau: l.nota - 1,
  }));

  return (
    <div className="flex flex-col gap-8">
      {cabecalho}

      {/*
        Oito números em duas fileiras, um por linha de leitura: quem chegou,
        quem pagou, quanto entrou, quem saiu — depois quanto se assistiu, por
        quantos, e o que acharam. Empilhar dois deles no mesmo cartão
        economizaria espaço e esconderia um dos dois.
      */}
      <GradeIndicadores titulo="No período">
        <Indicador
          rotulo="Novos usuários"
          valor={numeroBR(resumo.usuariosNovos)}
        />
        <Indicador
          rotulo="Novas assinaturas"
          valor={numeroBR(resumo.assinaturasNovas)}
        />
        <Indicador rotulo="Receita" valor={moedaBR(resumo.receita)} />
        <Indicador rotulo="Cancelamentos" valor={numeroBR(cancelamentos)} />
        <Indicador
          rotulo="Horas assistidas"
          valor={horasBR(resumo.horasAssistidas)}
        />
        <Indicador
          rotulo="Visualizações"
          valor={numeroBR(resumo.visualizacoes)}
          apoio={`${resumo.taxaConclusao}% de conclusão`}
        />
        <Indicador
          rotulo="Quem assistiu"
          valor={numeroBR(resumo.espectadores)}
          apoio="usuários distintos"
        />
        <Indicador
          rotulo="Nota média"
          valor={resumo.notaMedia.toFixed(1)}
          apoio={plural(resumo.avaliacoes, "avaliação", "avaliações")}
        />
      </GradeIndicadores>

      {/*
        O acervo fica em bloco separado e com o aviso explícito: estes números
        não obedecem ao filtro. Misturá-los com os de cima levaria alguém a ler
        "83 conteúdos publicados" como "83 publicados nos últimos 30 dias".
      */}
      <GradeIndicadores titulo="Acervo · independente do período">
        <Indicador rotulo="Usuários" valor={numeroBR(acervo.usuarios)} />
        <Indicador
          rotulo="Conteúdos publicados"
          valor={numeroBR(acervo.conteudosPublicados)}
          apoio={plural(acervo.videos, "aula", "aulas")}
        />
        <Indicador
          rotulo="Assinantes pagantes"
          valor={numeroBR(acesso.pagantesTotal)}
          apoio={`${moedaBR(acesso.receitaPagante)} em vigor · exclui cortesia e club`}
        />
        <Indicador
          rotulo="Horas de conteúdo"
          valor={horasBR(acervo.horasConteudo)}
          apoio={plural(acervo.videos, "vídeo", "vídeos")}
        />
        <Indicador rotulo="Instrutores" valor={numeroBR(acervo.instrutores)} />
      </GradeIndicadores>

      {/*
        Tipo de acesso: "Assinaturas ativas" sozinho engana, porque mistura quem
        paga com cortesia e club (gratuitos). Aqui a separação é explícita — e a
        soma dos quatro é igual ao total de assinaturas ativas.
      */}
      <GradeIndicadores titulo="Tipo de acesso · agora">
        <Indicador
          rotulo="Pagantes — cartão"
          valor={numeroBR(acesso.gateway.total)}
          apoio={`${moedaBR(acesso.gateway.receita)} · gateway`}
        />
        <Indicador
          rotulo="Pagantes — manual"
          valor={numeroBR(acesso.manual.total)}
          apoio={`${moedaBR(acesso.manual.receita)} · PIX/transf./offline`}
        />
        <Indicador
          rotulo="Cortesia"
          valor={numeroBR(acesso.cortesia.total)}
          apoio="acesso gratuito"
        />
        <Indicador
          rotulo="Club"
          valor={numeroBR(acesso.club.total)}
          apoio="acesso gratuito"
        />
      </GradeIndicadores>

      <Bloco titulo="Divisão do acesso ativo">
        <CartaoGrafico
          titulo="Pagante x gratuito"
          descricao={`${numeroBR(acesso.pagantesTotal)} pagantes · ${numeroBR(
            gratuitosTotal,
          )} gratuitos (cortesia + club)`}
          larga
          altura={alturaBarras(tipoAcesso.length)}
          dados={tipoAcesso}
          colunas={[
            { cabecalho: "Tipo", campo: "rotulo" },
            { cabecalho: "Ativas", campo: "total", formato: "numero" },
          ]}
        >
          <GraficoBarras
            dados={tipoAcesso}
            chaveRotulo="rotulo"
            chaveValor="total"
            chaveSlot="slot"
            larguraRotulo={96}
          />
        </CartaoGrafico>
      </Bloco>

      {/* ------------------------------ público ----------------------------- */}

      <Bloco titulo="Público">
        <CartaoGrafico
          titulo="Cadastros"
          descricao="Novos usuários no período."
          dados={cadastrosPorPeriodo}
          colunas={[
            { cabecalho: rotuloDoBalde, campo: "balde", formato: formatoX },
            { cabecalho: "Cadastros", campo: "total", formato: "numero" },
          ]}
        >
          <GraficoLinha
            dados={cadastrosPorPeriodo}
            chaveX="balde"
            formatoX={formatoX}
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
          titulo="Onde a plataforma é usada"
          descricao={
            totalDispositivos > 0
              ? `${Math.round((emMobile / totalDispositivos) * 100)}% dos dispositivos registrados são do app mobile.`
              : undefined
          }          dados={canais}
          colunas={[
            { cabecalho: "Canal", campo: "rotulo" },
            { cabecalho: "Dispositivos", campo: "total", formato: "numero" },
          ]}
        >
          <GraficoPizza
            dados={canais}
            chaveRotulo="rotulo"
            chaveValor="total"
            chaveSlot="slot"
            rotuloTotal="dispositivos"
          />
        </CartaoGrafico>
      </Bloco>

      {/* ------------------------ assinaturas e receita ---------------------- */}

      <Bloco titulo="Assinaturas e receita">
        {/*
          Assinaturas e receita andam juntas mas têm escalas incomparáveis —
          unidades contra milhares de reais. Dois gráficos, cada um com o seu
          eixo, em vez de um só com dois eixos Y: eixo duplo faz as curvas se
          cruzarem em pontos que não significam nada.
        */}
        <CartaoGrafico
          titulo="Novas assinaturas"
          dados={assinaturasPorPeriodo}
          colunas={[
            { cabecalho: rotuloDoBalde, campo: "balde", formato: formatoX },
            { cabecalho: "Assinaturas", campo: "total", formato: "numero" },
          ]}
        >
          <GraficoLinha
            dados={assinaturasPorPeriodo}
            chaveX="balde"
            formatoX={formatoX}
            series={[
              {
                chave: "total",
                rotulo: "Assinaturas",
                slot: 0,
                formato: "numero",
              },
            ]}
          />
        </CartaoGrafico>

        <CartaoGrafico
          titulo="Receita"
          descricao={`${moedaBR(resumo.receita)} no período.`}
          dados={assinaturasPorPeriodo}
          colunas={[
            { cabecalho: rotuloDoBalde, campo: "balde", formato: formatoX },
            { cabecalho: "Receita", campo: "receita", formato: "moeda" },
          ]}
        >
          <GraficoLinha
            dados={assinaturasPorPeriodo}
            chaveX="balde"
            formatoX={formatoX}
            series={[
              {
                chave: "receita",
                rotulo: "Receita",
                slot: 1,
                formato: "moedaCurta",
              },
            ]}
          />
        </CartaoGrafico>

        <CartaoGrafico
          titulo="Cancelamentos"
          descricao="Assinaturas canceladas no período."
          dados={cancelamentosPorPeriodo}
          colunas={[
            { cabecalho: rotuloDoBalde, campo: "balde", formato: formatoX },
            { cabecalho: "Cancelamentos", campo: "total", formato: "numero" },
          ]}
        >
          <GraficoLinha
            dados={cancelamentosPorPeriodo}
            chaveX="balde"
            formatoX={formatoX}
            series={[
              {
                chave: "total",
                rotulo: "Cancelamentos",
                slot: 1,
                formato: "numero",
              },
            ]}
          />
        </CartaoGrafico>

        <div className="flex flex-col gap-4">
          <CartaoGrafico
            titulo="Situação das assinaturas"
            descricao="Foto do momento."
            altura={alturaBarras(situacoes.length)}
            dados={situacoes}
            colunas={[
              { cabecalho: "Situação", campo: "status" },
              { cabecalho: "Assinaturas", campo: "total", formato: "numero" },
            ]}
          >
            <GraficoBarras
              dados={situacoes}
              chaveRotulo="status"
              chaveValor="total"
              chaveSlot="slot"
            />
          </CartaoGrafico>

          <CartaoGrafico
            titulo="Assinaturas por plano"
            descricao="Foto do momento."
            altura={alturaBarras(porPlano.length)}
            dados={porPlano}
            colunas={[
              { cabecalho: "Plano", campo: "plano" },
              { cabecalho: "Assinaturas", campo: "total", formato: "numero" },
            ]}
          >
            <GraficoBarras
              dados={porPlano}
              chaveRotulo="plano"
              chaveValor="total"
            />
          </CartaoGrafico>
        </div>
      </Bloco>

      {/* ------------------------------ consumo ----------------------------- */}

      <Bloco titulo="Consumo">
        <CartaoGrafico
          titulo="Horas assistidas"
          descricao={`${horasBR(resumo.horasAssistidas)} no período.`}
          dados={horasPorPeriodo}
          colunas={[
            { cabecalho: rotuloDoBalde, campo: "balde", formato: formatoX },
            { cabecalho: "Horas", campo: "horas", formato: "horas" },
            {
              cabecalho: "Visualizações",
              campo: "visualizacoes",
              formato: "numero",
            },
          ]}
        >
          <GraficoLinha
            dados={horasPorPeriodo}
            chaveX="balde"
            formatoX={formatoX}
            series={[
              { chave: "horas", rotulo: "Horas", slot: 2, formato: "horas" },
            ]}
          />
        </CartaoGrafico>

        <CartaoGrafico
          titulo="Tipos de conteúdo mais acessados"
          descricao="Horas e conclusões de cada tipo estão na tabela."          dados={tipos}
          colunas={[
            { cabecalho: "Tipo", campo: "tipo" },
            {
              cabecalho: "Visualizações",
              campo: "visualizacoes",
              formato: "numero",
            },
            { cabecalho: "Horas", campo: "horas", formato: "horas" },
            { cabecalho: "Concluídos", campo: "concluidos", formato: "numero" },
          ]}
        >
          <GraficoPizza
            dados={tipos}
            chaveRotulo="tipo"
            chaveValor="visualizacoes"
            rotuloTotal="visualizações"
          />
        </CartaoGrafico>

        <CartaoGrafico
          titulo="Categorias mais acessadas"
          descricao="Horas de cada categoria estão na tabela."
          altura={alturaBarras(consumoPorCategoria.length)}
          dados={consumoPorCategoria}
          colunas={[
            { cabecalho: "Categoria", campo: "categoria" },
            {
              cabecalho: "Visualizações",
              campo: "visualizacoes",
              formato: "numero",
            },
            { cabecalho: "Horas", campo: "horas", formato: "horas" },
          ]}
        >
          <GraficoBarras
            dados={consumoPorCategoria}
            chaveRotulo="categoria"
            chaveValor="visualizacoes"
            larguraRotulo={168}
          />
        </CartaoGrafico>

        <CartaoGrafico
          titulo="Subcategorias mais acessadas"
          altura={alturaBarras(consumoPorSubcategoria.length)}
          dados={consumoPorSubcategoria}
          colunas={[
            { cabecalho: "Subcategoria", campo: "subcategoria" },
            {
              cabecalho: "Visualizações",
              campo: "visualizacoes",
              formato: "numero",
            },
          ]}
        >
          <GraficoBarras
            dados={consumoPorSubcategoria}
            chaveRotulo="subcategoria"
            chaveValor="visualizacoes"
            larguraRotulo={180}
          />
        </CartaoGrafico>

        <CartaoGrafico
          titulo="Tags mais acessadas"
          altura={alturaBarras(topTags.length)}
          dados={topTags}
          colunas={[
            { cabecalho: "Tag", campo: "tag" },
            {
              cabecalho: "Visualizações",
              campo: "visualizacoes",
              formato: "numero",
            },
          ]}
        >
          <GraficoBarras
            dados={topTags}
            chaveRotulo="tag"
            chaveValor="visualizacoes"
            larguraRotulo={168}
          />
        </CartaoGrafico>

        <CartaoGrafico
          titulo="Como avaliam as aulas"
          descricao={`Nota média ${resumo.notaMedia.toFixed(1)} em ${plural(resumo.avaliacoes, "avaliação", "avaliações")}.`}          dados={notas}
          colunas={[
            { cabecalho: "Nota", campo: "rotulo" },
            { cabecalho: "Avaliações", campo: "total", formato: "numero" },
          ]}
        >
          {/*
            Nota é escala ordenada, não identidade: a cor sai da rampa
            sequencial, e não da paleta categórica. Cinco matizes diferentes
            diriam que nota 3 e nota 5 são coisas distintas, quando são dois
            pontos da mesma régua — na rampa, quem lê enxerga a ordem.
          */}
          <GraficoPizza
            dados={notas}
            chaveRotulo="rotulo"
            chaveValor="total"
            paleta="rampa"
            chaveSlot="degrau"
            rotuloTotal="avaliações"
          />
        </CartaoGrafico>
      </Bloco>

      {/* ------------------------------ rankings ---------------------------- */}

      <Bloco titulo="Quem e o quê são mais assistidos">
        <CartaoGrafico
          titulo="Instrutores mais acessados"
          descricao="Conteúdo com dois instrutores conta a visualização para os dois."
          altura={instrutores.length * 44}
          larga
          dados={instrutores}
          colunas={[
            { cabecalho: "Instrutor", campo: "instrutor" },
            {
              cabecalho: "Visualizações",
              campo: "visualizacoes",
              formato: "numero",
            },
            { cabecalho: "Horas", campo: "horas", formato: "horas" },
            { cabecalho: "Conteúdos", campo: "conteudos", formato: "numero" },
          ]}
        >
          <RankingComFoto itens={instrutores} formatar={numeroBR} />
        </CartaoGrafico>

        <CartaoGrafico
          titulo="Usuários que mais acessaram"
          descricao="Ordenados por tempo assistido — abrir uma aula e fechar não é usar a plataforma."
          altura={usuarios.length * 44}
          larga
          dados={usuarios}
          colunas={[
            { cabecalho: "Usuário", campo: "nome" },
            { cabecalho: "E-mail", campo: "email" },
            { cabecalho: "Papel", campo: "role" },
            { cabecalho: "Horas", campo: "horas", formato: "horas" },
            { cabecalho: "Aulas", campo: "aulas", formato: "numero" },
            { cabecalho: "Concluídas", campo: "concluidas", formato: "numero" },
            { cabecalho: "Último acesso", campo: "visto" },
          ]}
        >
          <RankingComFoto itens={usuarios} formatar={horasBR} />
        </CartaoGrafico>

        <CartaoGrafico
          titulo="Conteúdos mais assistidos"
          altura={alturaBarras(conteudos.length)}
          larga
          dados={conteudos}
          colunas={[
            { cabecalho: "Conteúdo", campo: "titulo" },
            { cabecalho: "Tipo", campo: "tipo" },
            {
              cabecalho: "Visualizações",
              campo: "visualizacoes",
              formato: "numero",
            },
            { cabecalho: "Horas", campo: "horas", formato: "horas" },
            { cabecalho: "Concluídos", campo: "concluidos", formato: "numero" },
          ]}
        >
          <GraficoBarras
            dados={conteudos}
            chaveRotulo="rotulo"
            chaveValor="visualizacoes"
            larguraRotulo={168}
          />
        </CartaoGrafico>

        <CartaoGrafico
          titulo="Aulas com mais tempo assistido"
          descricao="Ordenadas por horas, não por cliques — é o que mede atenção."
          altura={alturaBarras(aulas.length)}
          larga
          dados={aulas}
          colunas={[
            { cabecalho: "Aula", campo: "titulo" },
            { cabecalho: "Conteúdo", campo: "conteudo" },
            { cabecalho: "Horas", campo: "horas", formato: "horas" },
            {
              cabecalho: "Visualizações",
              campo: "visualizacoes",
              formato: "numero",
            },
            { cabecalho: "Concluídos", campo: "concluidos", formato: "numero" },
          ]}
        >
          <GraficoBarras
            dados={aulas}
            chaveRotulo="rotulo"
            chaveValor="horas"
            formato="horas"
            slot={2}
            larguraRotulo={168}
          />
        </CartaoGrafico>

        <CartaoGrafico
          titulo="Conteúdos mais salvos"
          descricao="Guardados para assistir depois."
          altura={alturaBarras(salvos.length)}
          larga
          dados={salvos}
          colunas={[
            { cabecalho: "Conteúdo", campo: "titulo" },
            { cabecalho: "Vezes salvo", campo: "total", formato: "numero" },
          ]}
        >
          <GraficoBarras
            dados={salvos}
            chaveRotulo="rotulo"
            chaveValor="total"
            slot={3}
            larguraRotulo={168}
          />
        </CartaoGrafico>
      </Bloco>
    </div>
  );
}

function Bloco({
  titulo,
  children,
}: {
  titulo: string;
  children: React.ReactNode;
}) {
  return (
    <section className="flex flex-col gap-3">
      <h2 className="text-texto-3 text-sm font-semibold tracking-wide uppercase">
        {titulo}
      </h2>
      <div className="grid items-start gap-4 xl:grid-cols-2">{children}</div>
    </section>
  );
}
