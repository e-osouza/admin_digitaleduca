/**
 * Tipos da API DigitalEduca usados pelo painel administrativo.
 *
 * Derivados do schema Prisma do backend (`digital_educa`), não da spec
 * OpenAPI: vários DTOs não têm `@ApiProperty` e aparecem vazios no Swagger.
 */

/**
 * Os quatro tipos do enum do banco.
 *
 * `AULA` é exibida como **MasterClass** em toda interface, mas o valor
 * gravado continua `AULA`: ele viaja na API para o app mobile já instalado,
 * que compara a string. A troca de nome é de apresentação, não de dado —
 * por isso o rótulo mora nos mapas de exibição, e nunca no valor.
 */
export type TipoConteudo =
  | "PALESTRA"
  | "PODCAST"
  | "AULA"
  | "CURSO"
  | "TRILHA";
export type GratuitoTipo = "NENHUM" | "PERMANENTE" | "TEMPORARIO";
export type Role = "USER" | "SUPERADMIN" | "CORTESIA" | "CLUB";
export type IntervaloPlano = "day" | "week" | "month" | "year";
export type CupomDuracao = "ONCE" | "FOREVER" | "REPEATING";
export type PapelInstrutor = "INSTRUTOR" | "APRESENTADOR" | "CONVIDADO";

/** Envelope `{ data, pagination }` de `/conteudos`, `/conteudos/search`… */
export interface Paginacao {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface ListaPaginada<T> {
  data: T[];
  pagination: Paginacao;
}

/**
 * Resultado de `/conteudos/search`.
 *
 * `contadores` só vem para SUPERADMIN — quem não enxerga rascunho não tem aba
 * de rascunho. Eles refletem os OUTROS filtros ativos, mas não o recorte de
 * status: é o que faz a aba "Rascunhos" continuar mostrando 5 enquanto você
 * está vendo os publicados.
 */
export interface BuscaConteudos extends ListaPaginada<ConteudoBusca> {
  contadores: {
    todos: number;
    publicados: number;
    rascunhos: number;
    destaques: number;
    lixeira: number;
  } | null;
}

/** Envelope `{ data }` sem paginação (`/trilhas`, `/conteudos/tipos`…). */
export interface Envelope<T> {
  data: T[];
}

export interface LoginResponse {
  access_token: string;
}

export interface Categoria {
  id: number;
  nome: string;
  /** Slug para URL amigável, gerado do nome. */
  slug: string;
  createdAt: string;
  updatedAt: string;
}

export interface Subcategoria {
  id: number;
  nome: string;
  /** Slug para URL amigável, gerado do nome. */
  slug: string;
  createdAt: string;
  updatedAt: string;
  categorias?: {
    categoriaId: number;
    subcategoriaId: number;
    categoria: Pick<Categoria, "id" | "nome">;
  }[];
  _count?: { conteudos: number };
}

export interface Tag {
  id: number;
  nome: string;
  slug: string;
  createdAt: string;
  updatedAt: string;
  /** Presente em `GET /tags` desde 19/08/2026. */
  totalConteudos?: number;
  totalTrilhas?: number;
}

export interface Instrutor {
  id: number;
  nome: string;
  avatar: string | null;
  formacao: string;
  sobre?: string;
  totalConteudos?: number;
}

export type TipoNotificacao =
  | "CONTEUDO_NOVO"
  | "CONTEUDO_ATUALIZADO"
  | "MANUAL";

/** Uma linha do histórico — `GET /notificacoes/admin/historico`. */
export interface NotificacaoEnviada {
  id: number;
  tipo: TipoNotificacao;
  titulo: string;
  mensagem: string;
  link: string | null;
  imagemUrl: string | null;
  conteudoId: number | null;
  /** Quantos aparelhos e navegadores o push alcançou NO momento do disparo. */
  enviadosMobile: number;
  enviadosWeb: number;
  createdAt: string;
  /** Nulo nas automáticas — elas não têm autor. */
  criadaPor: { id: number; nome: string } | null;
  /** Quantas pessoas já abriram. */
  leituras: number;
}

export interface HistoricoNotificacoes {
  data: NotificacaoEnviada[];
  pagination: { total: number; page: number; limit: number; totalPages: number };
}

/** Um conteúdo em que o instrutor está creditado. */
export interface ConteudoDoInstrutor {
  id: number;
  titulo: string;
  tipo: TipoConteudo;
  thumbnailMobile: string | null;
  thumbnailDesktop: string | null;
  rating: number | null;
}

/** `GET /instrutor/:id/perfil` — o instrutor e o que ele assina. */
export interface PerfilInstrutor {
  instrutor: Instrutor & { totalConteudos: number };
  data: ConteudoDoInstrutor[];
  pagination: { total: number; page: number; limit: number; totalPages: number };
}

export interface Video {
  id: number;
  titulo: string;
  url?: string;
  duracao: number | null;
  moduloId?: number | null;
  conteudoId?: number | null;
  thumbnailUrl?: string | null;
}

/** `GET /video` — passou a paginar em 24/08/2026. */
export type BuscaVideos = ListaPaginada<Video>;

export interface Modulo {
  id: number;
  titulo: string;
  subtitulo?: string | null;
  descricao?: string | null;
  conteudoId?: number;
  vimeoFolderUri?: string | null;
  videos?: Video[];
}

export interface Conteudo {
  id: number;
  titulo: string;
  descricao: string | null;
  tipo: TipoConteudo;
  level: string | null;
  dataCriacao: string;
  videoIntrodutorio: string | null;
  thumbnailDesktop: string | null;
  thumbnailMobile: string | null;
  thumbnailDestaque: string | null;
  destaque: boolean;
  aprendizagem: string | null;
  requisitos: string | null;
  gratuitoTipo: GratuitoTipo;
  gratuitoAte: string | null;
  /** Rascunho quando `false`: some do app, mas continua no painel. */
  publicado: boolean;
  /** Nome de quem apresenta (podcast). Texto livre, não é vínculo. */
  apresentador: string | null;
  /** Convidados do episódio (podcast). Texto livre, separados por vírgula. */
  convidados: string | null;
  categoriaId: number;
  subcategoriaId: number;
  vimeoFolderUri: string | null;
  createdAt: string;
  updatedAt: string;
  videos?: Video[];
  modulos?: Modulo[];
  instrutores?: { papel: PapelInstrutor; instrutor: Instrutor }[];
}

/**
 * Retorno de `POST /conteudos/create`. O upload do vídeo NÃO passa pela API:
 * o backend abre um ticket tus no Vimeo e devolve o link para o browser
 * enviar o arquivo direto.
 */
export interface ConteudoCriado {
  conteudo: Conteudo;
  vimeoUploadLink: string;
}

export interface Usuario {
  id: number;
  nome: string;
  email: string;
  celular: string | null;
  avatar: string | null;
  role: Role;
  emailVerified: boolean;
  cargo?: string | null;
  funcao?: string | null;
  areaAtuacao?: string | null;
  tempoExperiencia?: string | null;
  objetivoPlataforma?: string | null;
  formatoAprendizado?: string | null;
  aceitaNotificacoes?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Plano {
  id: number;
  nome: string;
  preco: number;
  descricao: string | null;
  intervalo: IntervaloPlano | null;
  priceId: string | null;
  stripeProductId: string | null;
  permiteParcelamento: boolean;
  maxParcelas: number;
  percentualDescontoAVista: number;
  /** `false` tira o plano do checkout sem apagá-lo. Só vem de `/planos/todos`. */
  ativo: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Cupom {
  id: number;
  codigo: string;
  descricao: string | null;
  percentual: number;
  duracao: CupomDuracao;
  duracaoCiclos: number | null;
  validoDe: string | null;
  validoAte: string | null;
  limiteUsos: number | null;
  usosAtuais: number;
  planoId: number | null;
  ativo: boolean;
  createdAt: string;
  updatedAt: string;
}

/** Conteúdo dentro de uma trilha, no formato achatado que a API devolve. */
export interface ItemTrilha {
  ordem: number;
  id: number;
  titulo: string;
  descricao: string | null;
  tipo: TipoConteudo;
  level: string | null;
  gratuitoTipo: GratuitoTipo;
  thumbnailMobile: string | null;
  thumbnailDesktop: string | null;
  thumbnailDestaque: string | null;
}

/**
 * Módulo de uma trilha — agrupa CONTEÚDOS inteiros.
 *
 * Não confundir com `Modulo`, que pertence a um conteúdo e agrupa vídeos.
 */
export interface ModuloTrilha {
  id: number;
  titulo: string;
  subtitulo: string | null;
  descricao: string | null;
  ordem: number;
  conteudos: ItemTrilha[];
}

export type TipoTrilha = "CURSO" | "TRILHA";

/**
 * Curso e trilha são o MESMO registro, separados por `tipo`.
 *
 * Os dois são uma sequência ordenada de conteúdos, opcionalmente agrupada em
 * módulos — o curso reúne MasterClasses numa formação fechada, a trilha
 * encadeia formações num percurso maior. Duplicar a estrutura daria duas
 * implementações da mesma ideia.
 */
export interface Trilha {
  id: number;
  tipo: TipoTrilha;
  titulo: string;
  descricao: string | null;
  thumbnailDesktop: string | null;
  thumbnailMobile: string | null;
  thumbnailDestaque: string | null;
  nivel: string | null;
  destaque: boolean;
  publicada: boolean;
  totalConteudos: number;
  createdAt: string;
  updatedAt: string;
}

/** `GET /trilhas/admin/all` — mesma forma do resultado de conteúdos. */
export interface BuscaTrilhas {
  data: Trilha[];
  pagination: Paginacao;
  contadores: {
    todos: number;
    publicados: number;
    rascunhos: number;
    destaques: number;
  };
}

export interface TrilhaDetalhe extends Trilha {
  modulos: ModuloTrilha[];
  /** Conteúdos que não pertencem a módulo nenhum. */
  conteudos: ItemTrilha[];

  /* Paridade com Conteudo — adicionados em 19/08/2026. */
  categoriaId: number | null;
  subcategoriaId: number | null;
  categoria: { id: number; nome: string } | null;
  subcategoria: { id: number; nome: string } | null;
  aprendizagem: string | null;
  requisitos: string | null;
  gratuitoTipo: GratuitoTipo;
  gratuitoAte: string | null;
  dataCriacao: string;
  videoIntrodutorio: string | null;
  tags: Tag[];
  instrutores: { papel: PapelInstrutor; instrutor: Instrutor }[];
}

export interface Propaganda {
  id: number;
  titulo: string | null;
  imagem: string;
  link: string;
  /** Ausente na rota pública, que já filtra só as ativas. */
  ativo?: boolean;
  ordem?: number;
  /** Abrir o link numa aba nova. */
  novaAba?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface AppConfig {
  id: number;
  minBuildAndroid: number;
  minBuildIos: number;
  storeUrlAndroid: string | null;
  storeUrlIos: string | null;
  mensagemUpdate: string | null;
}

/**
 * Item devolvido por `GET /conteudos/search`.
 *
 * É um `select` mais enxuto que o de `GET /conteudos`: não traz vídeos,
 * módulos, duração nem rating. Em compensação é o único com filtro por
 * categoria, subcategoria, tags e busca textual — por isso é a fonte do grid
 * administrativo.
 *
 * `instrutores` e `tags` já vêm achatados pelo backend (sem a tabela pivô).
 */
export interface ConteudoBusca {
  id: number;
  titulo: string;
  /** Só vem para SUPERADMIN — o `search` filtra rascunho para os demais. */
  publicado?: boolean;
  tipo: TipoConteudo;
  destaque: boolean;
  thumbnailDesktop: string | null;
  thumbnailMobile: string | null;
  createdAt: string;
  categoria: { id: number; nome: string } | null;
  subcategoria: { id: number; nome: string } | null;
  instrutores: Pick<Instrutor, "id" | "nome" | "avatar" | "formacao">[];
  tags: { id: number; nome: string }[];
}

/**
 * Retorno de `GET /conteudos/{id}/admin` — o objeto cru do banco com as
 * relações completas. Diferente da versão pública, não passa por checagem de
 * acesso nem por `EmailVerifiedGuard`.
 */
export interface ConteudoAdmin extends Conteudo {
  /**
   * Conteúdos que ESTE agrupa, quando é CURSO ou TRILHA. Vem sempre da API —
   * nos demais tipos chega vazio, o que é mais barato que o painel ter de
   * perguntar duas vezes.
   */
  itens?: {
    id: number;
    ordem: number;
    /** Módulo do próprio agrupador, ou `null` para item solto. */
    modulo: { id: number; titulo: string } | null;
    filho: {
      id: number;
      titulo: string;
      tipo: TipoConteudo;
      thumbnailMobile: string | null;
      thumbnailDesktop: string | null;
      publicado: boolean;
    };
  }[];

  categoria: Categoria | null;
  subcategoria: Subcategoria | null;
  tags: { tag: Tag }[];
}

/** Assinatura resumida, como vem na listagem administrativa de usuários. */
export interface AssinaturaResumo {
  id: number;
  status: string;
  metodoPagamento: string | null;
  valorPago: number;
  dataInicio: string;
  dataFim: string | null;
  canceladaEm: string | null;
  plano: { id: number; nome: string } | null;
}

/**
 * Usuário na listagem administrativa.
 *
 * O campo `senha` NÃO vem — o backend passou a selecionar os campos
 * explicitamente em 19/08/2026, depois de eu descobrir que o hash bcrypt de
 * todos os usuários estava sendo enviado ao navegador.
 */
export interface UsuarioAdmin {
  id: number;
  nome: string;
  email: string;
  celular: string | null;
  avatar: string | null;
  role: Role;
  emailVerified: boolean;
  cargo: string | null;
  createdAt: string;
  assinaturas: AssinaturaResumo[];
}

/** `GET /usuario/admin/usuarios` — lista com os contadores das abas de papel. */
export interface BuscaUsuariosAdmin extends ListaPaginada<UsuarioAdmin> {
  contadores: {
    todos: number;
    USER: number;
    SUPERADMIN: number;
    CORTESIA: number;
    CLUB: number;
  };
}

/** Detalhe completo de um usuário — `GET /usuario/admin/usuarios/:id`. */
export interface UsuarioDetalhe {
  id: number;
  nome: string;
  email: string;
  celular: string | null;
  avatar: string | null;
  role: Role;
  emailVerified: boolean;
  stripeCustomerId: string | null;
  createdAt: string;
  updatedAt: string;

  cargo: string | null;
  funcao: string | null;
  areaAtuacao: string | null;
  tempoExperiencia: string | null;
  objetivoPlataforma: string | null;
  formatoAprendizado: string | null;
  aceitaNotificacoes: boolean;

  negocio: Negocio | null;
  interesse: Interesse | null;

  /*
    Club. Um usuário é dono OU membro, nunca os dois: `clubMembros` só tem
    conteúdo em quem tem papel CLUB, e `clubDono` só em quem foi convidado
    para um time.
  */
  clubLimiteMembros: number | null;
  clubDono: { id: number; nome: string; role: Role } | null;
  clubMembros: { id: number; nome: string; email: string; avatar: string | null }[];
  clubConvites: {
    id: number;
    nome: string;
    email: string;
    expiraEm: string;
    emailEnviado: boolean;
  }[];

  assinaturas: (AssinaturaResumo & { cardLast4?: string | null })[];
  dispositivos: { id: number; plataforma: string; createdAt: string }[];

  atividade: {
    videosComProgresso: number;
    modulosComProgresso: number;
    salvos: number;
    listas: number;
    avaliacoes: number;
  };
}

/** Onboarding complementar — 1 registro por usuário. */
export interface Negocio {
  id: number;
  nomeEmpresa: string;
  setorAtuacao: string | null;
  numeroColaboradores: string | null;
  faixaFaturamentoAnual: string | null;
  faseAtual: string | null;
  desafiosNegocio: string | null;
}

export interface Interesse {
  id: number;
  temasAprender: string | null;
  dificuldadeAtual: string | null;
  nivelConhecimento: string | null;
  tempoDisponivelSemana: string | null;
  estiloAprendizado: string | null;
}

/** Quantos destinos o push vai atingir, por canal. */
export interface AlcancePush {
  mobile: number;
  web: number;
  total: number;
  porPlataforma: { plataforma: string; total: number }[];
  configurado: { mobile: boolean; web: boolean };
}

/** Resultado de um disparo — os canais são independentes. */
export interface ResultadoPush {
  ok: boolean;
  sent: number;
  reason?: string;
  web?: { enviadas: number; removidas: number; motivo?: string };
}

/* ---------------- dashboard (token estático, não JWT) ---------------- */

/*
 * Atenção: os `schema.example` do Swagger para `/dashboard/*` estão
 * desatualizados e não batem com o retorno real. Os tipos abaixo vêm do
 * `dashboard.service.ts` do backend.
 */

export interface ResumoUsuarios {
  totalUsuarios: number;
  usuariosComAssinatura: number;
  usuariosCancelados: number;
  usuariosFree: number;
}

export interface ResumoAssinaturas {
  receitaTotal: number;
  /** Agregação bruta do Prisma (`groupBy`) — o nome do plano não vem junto. */
  assinaturasPorPlano: { planoId: number; _count: { planoId: number } }[];
}

/** Destaque de vídeo no dashboard. `null` quando ainda não há dados. */
export interface DestaqueVideo {
  videoId: number | undefined;
  titulo: string | undefined;
  conteudo: string | null;
  visualizacoes: number;
  notaMedia: number | null;
  taxaConclusao: number;
}

export interface ResumoVideos {
  maisAssistido: DestaqueVideo | null;
  menosAssistido: DestaqueVideo | null;
  melhorAvaliado: DestaqueVideo | null;
  piorAvaliado: DestaqueVideo | null;
}

/** `/dashboard/usuarios/cancelados`, `/free` e `/videos/{id}/usuarios-concluintes`. */
export interface UsuarioResumido {
  id: number;
  nome: string;
  email: string;
  createdAt: string;
}

/** `/dashboard/usuarios/ativos` traz também a assinatura vigente. */
export interface UsuarioAtivo extends UsuarioResumido {
  avatar: string | null;
  assinaturas: {
    id: number;
    status: string;
    metodoPagamento: string | null;
    valorPago: number;
    dataInicio: string;
    dataFim: string | null;
    canceladaEm: string | null;
    plano: { id: number; nome: string };
  }[];
}

/**
 * `GET /dashboard/estatisticas?de=&ate=` — agregações da plataforma inteira.
 *
 * O recorte `de`/`ate` (AAAA-MM-DD) vale só para o que é EVENTO: cadastro,
 * assinatura, minuto assistido, avaliação. O que é ACERVO — quantos conteúdos
 * existem, quantas assinaturas estão ativas agora — é foto do momento e ignora
 * o recorte, porque "83 conteúdos publicados nos últimos 7 dias" seria uma
 * leitura errada do mesmo número.
 *
 * `dispositivos` é o único corte que separa web de mobile: `canal` vale
 * `android`, `ios` (tokens de push do app) ou `web` (inscrições do navegador).
 */
export interface EstatisticasPlataforma {
  periodo: {
    de: string | null;
    ate: string | null;
    /** Tamanho do balde das séries. Dia até ~2 meses de recorte; mês acima. */
    granularidade: "dia" | "mes";
    rotuloDoBalde: string;
  };

  acervo: {
    usuarios: number;
    conteudosPublicados: number;
    videos: number;
    /** Soma da duração de todas as aulas/vídeos, em horas. */
    horasConteudo: number;
    instrutores: number;
    /** Todas as assinaturas ATIVAS (pagante + cortesia + club), menos sandbox. */
    assinaturasAtivas: number;
    receitaAtiva: number;
    /**
     * Assinaturas ativas separadas pelo que são de fato. `gateway` e `manual`
     * são pagantes; `cortesia` e `club` são acesso gratuito (R$ 0). A soma dos
     * quatro `total` é igual a `assinaturasAtivas`.
     */
    acessoAtivo: {
      /** Cartão pelo gateway automático (e qualquer método não etiquetado). */
      gateway: { total: number; receita: number };
      /** Registrado à mão: PIX, transferência, boleto, offline. */
      manual: { total: number; receita: number };
      cortesia: { total: number; receita: number };
      club: { total: number; receita: number };
      /** gateway + manual. */
      pagantesTotal: number;
      /** Receita em vigor só dos pagantes. */
      receitaPagante: number;
    };
  };

  resumo: {
    usuariosNovos: number;
    assinaturasNovas: number;
    receita: number;
    visualizacoes: number;
    /** Usuários distintos que assistiram algo no período. */
    espectadores: number;
    horasAssistidas: number;
    /** Percentual 0–100. */
    taxaConclusao: number;
    avaliacoes: number;
    notaMedia: number;
  };

  /* Séries: `balde` é `AAAA-MM-DD` ou `AAAA-MM`, conforme a granularidade.
     Baldes sem registro vêm zerados — o backend preenche as lacunas para a
     linha não ligar dois pontos distantes e inventar uma queda suave. */
  cadastrosPorPeriodo: { balde: string; total: number }[];
  assinaturasPorPeriodo: { balde: string; total: number; receita: number }[];
  horasPorPeriodo: { balde: string; horas: number; visualizacoes: number }[];
  cancelamentosPorPeriodo: { balde: string; total: number }[];

  statusAssinaturas: { status: string; total: number }[];
  porPlano: { plano: string; total: number }[];

  consumoPorTipo: {
    tipo: string;
    visualizacoes: number;
    horas: number;
    concluidos: number;
  }[];
  consumoPorCategoria: {
    categoria: string;
    visualizacoes: number;
    horas: number;
  }[];
  consumoPorSubcategoria: { subcategoria: string; visualizacoes: number }[];

  /** Um conteúdo com dois instrutores conta a visualização para os dois. */
  topInstrutores: {
    id: number;
    instrutor: string;
    /** Caminho relativo (`uploads/...`) ou `null`. 19 dos 79 têm foto. */
    avatar: string | null;
    visualizacoes: number;
    horas: number;
    conteudos: number;
  }[];
  /**
   * Quem mais consumiu, por TEMPO assistido. Contas ADMIN/SUPERADMIN não são
   * excluídas — `role` vem junto para o painel poder sinalizá-las.
   */
  topUsuarios: {
    id: number;
    nome: string;
    email: string;
    avatar: string | null;
    role: string;
    horas: number;
    aulas: number;
    concluidas: number;
    /** ISO do progresso mais recente, ou `null`. */
    ultimoAcesso: string | null;
  }[];

  topTags: { tag: string; visualizacoes: number }[];

  topConteudos: {
    id: number;
    titulo: string;
    tipo: string;
    visualizacoes: number;
    concluidos: number;
    horas: number;
  }[];
  topAulas: {
    id: number;
    titulo: string;
    conteudo: string | null;
    visualizacoes: number;
    horas: number;
    concluidos: number;
  }[];
  maisSalvos: { id: number; titulo: string; total: number }[];
  avaliacoesPorNota: { nota: number; total: number }[];
  dispositivos: { canal: string; total: number }[];
}

/**
 * Registro único de configuração da plataforma — `GET /app/config`.
 *
 * Junta duas coisas de naturezas diferentes: a trava de versão mínima do app
 * mobile e o interruptor do carrossel da home. É uma tabela de uma linha só
 * (`id = 1`), criada sob demanda pelo backend.
 */
export interface ConfigApp {
  id: number;
  /** Build mínimo aceito. `0` desliga a obrigatoriedade de atualizar. */
  minBuildAndroid: number;
  minBuildIos: number;
  storeUrlAndroid: string | null;
  storeUrlIos: string | null;
  mensagemUpdate: string | null;
  /** Carrossel de destaques do topo da página inicial, web e app. */
  slideDestaqueAtivo: boolean;
  createdAt: string;
  updatedAt: string;
}

/**
 * Cupom de desconto percentual — `GET /cupom`.
 *
 * Atenção ao campo `ativo`: ele é só UMA das condições de validade. Um cupom
 * com `ativo: true` pode estar agendado, expirado ou esgotado e ser recusado
 * no checkout. A situação real se calcula em `situacaoDoCupom`.
 */
export interface Cupom {
  id: number;
  codigo: string;
  descricao: string | null;
  /** 1 a 100, sobre o preço do plano. */
  percentual: number;
  duracao: CupomDuracao;
  /** Obrigatório quando `duracao` é REPEATING. */
  duracaoCiclos: number | null;
  validoDe: string | null;
  validoAte: string | null;
  /** `null` = ilimitado. */
  limiteUsos: number | null;
  usosAtuais: number;
  /** `null` = vale para qualquer plano pago. */
  planoId: number | null;
  ativo: boolean;
  createdAt: string;
  updatedAt: string;
}
