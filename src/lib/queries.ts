import "server-only";
import { api, apiOpcional } from "@/lib/api";
import type {
  AlcancePush,
  BuscaConteudos,
  BuscaTrilhas,
  BuscaUsuariosAdmin,
  BuscaVideos,
  Categoria,
  ConfigApp,
  ConteudoAdmin,
  ConteudoBusca,
  Cupom,
  EstatisticasPlataforma,
  HistoricoNotificacoes,
  Instrutor,
  ListaPaginada,
  PerfilInstrutor,
  Plano,
  Propaganda,
  ResumoAssinaturas,
  ResumoUsuarios,
  ResumoVideos,
  Subcategoria,
  Tag,
  TipoTrilha,
  TrilhaDetalhe,
  UsuarioDetalhe,
} from "@/types/api";

/* ---------------- dashboard (token estático) ---------------- */

export function resumoUsuarios() {
  return apiOpcional<ResumoUsuarios>("/dashboard/usuarios", {
    auth: "dashboard",
    revalidar: 300,
  });
}

export function resumoAssinaturas() {
  return apiOpcional<ResumoAssinaturas>("/dashboard/assinaturas", {
    auth: "dashboard",
    revalidar: 300,
  });
}

export function resumoVideos() {
  return apiOpcional<ResumoVideos>("/dashboard/videos", {
    auth: "dashboard",
    revalidar: 300,
  });
}

/**
 * Agregações da tela de estatísticas.
 *
 * Cache de 5 minutos por recorte: são 17 agregações sobre as tabelas de
 * progresso, caras demais para refazer a cada F5, e não é dado que se lê ao
 * segundo. Chaves diferentes de `de`/`ate` viram entradas diferentes no cache,
 * então trocar o período não devolve o número do período anterior.
 */
export function obterEstatisticas(de?: string, ate?: string) {
  const busca = new URLSearchParams();
  if (de) busca.set("de", de);
  if (ate) busca.set("ate", ate);
  const query = busca.size ? `?${busca}` : "";

  return apiOpcional<EstatisticasPlataforma>(`/dashboard/estatisticas${query}`, {
    auth: "dashboard",
    revalidar: 300,
  });
}

/**
 * Configuração da plataforma.
 *
 * Sem cache: é uma tela de uma linha só, lida raramente e logo depois de ser
 * escrita — servir valor velho aqui faria o admin achar que não salvou.
 */
export function obterConfigApp() {
  return apiOpcional<ConfigApp>("/app/config", {
    auth: "jwt",
    revalidar: false,
  });
}

/* ---------------- catálogo de apoio ---------------- */

/**
 * Planos do painel — inclui os desativados.
 *
 * `/planos/todos` e não `/planos`: a rota pública esconde plano desativado,
 * que é justamente o que o painel precisa enxergar para poder reativá-lo.
 * Ativos vêm primeiro, depois por preço.
 */
export function listarPlanos() {
  return api<Plano[]>("/planos/todos", { auth: "jwt", revalidar: 60 });
}

/**
 * Um plano pelo id.
 *
 * A API não expõe `GET /planos/:id` — só a listagem inteira. Filtrar aqui é
 * barato (são três planos) e evita um endpoint novo no backend só para isto;
 * se um dia a lista crescer a ponto de doer, aí vale criar a rota.
 */
export async function obterPlano(id: number) {
  const planos = await listarPlanos();
  return planos.find((plano) => plano.id === id) ?? null;
}

/* ---------------- conteúdos ---------------- */

/** Teto imposto pelo backend em `/conteudos/search`. */
export const LIMITE_MAXIMO_BUSCA = 24;

export type FiltrosConteudo = {
  q?: string;
  tipo?: string;
  /** Tipo a remover do resultado — o painel tira podcast, que tem tela própria. */
  excluirTipo?: string;
  categoriaId?: number;
  subcategoriaId?: number;
  /** `true` só publicados, `false` só rascunhos, ausente = todos. */
  publicado?: boolean;
  destaque?: boolean;
  ordenar?: string;
  page?: number;
  limit?: number;
};

/**
 * Grid administrativo de conteúdos.
 *
 * Usa `/conteudos/search` e não `/conteudos` porque só ele filtra por
 * categoria, subcategoria e texto. O preço é não receber duração nem nota —
 * nenhum dos dois aparece na listagem.
 *
 * `destaque` NÃO é filtrável aqui: o endpoint ignora o parâmetro (confirmado
 * na API). O campo vem no retorno e é exibido como selo em cada linha.
 */
export function buscarConteudos(filtros: FiltrosConteudo) {
  const busca = new URLSearchParams();
  if (filtros.q) busca.set("q", filtros.q);
  if (filtros.tipo) busca.set("tipo", filtros.tipo);
  if (filtros.excluirTipo) busca.set("excluirTipo", filtros.excluirTipo);
  if (filtros.categoriaId) busca.set("categoriaId", String(filtros.categoriaId));
  if (filtros.subcategoriaId) {
    busca.set("subcategoriaId", String(filtros.subcategoriaId));
  }
  /*
    `!== undefined` e não `if (filtros.publicado)`: o valor útil aqui inclui
    `false` ("só rascunhos"), que a checagem por veracidade descartaria.
  */
  if (filtros.publicado !== undefined) {
    busca.set("publicado", String(filtros.publicado));
  }
  if (filtros.destaque) busca.set("destaque", "true");
  if (filtros.ordenar) busca.set("ordenar", filtros.ordenar);
  busca.set("page", String(filtros.page ?? 1));
  busca.set("limit", String(filtros.limit ?? LIMITE_MAXIMO_BUSCA));

  return api<BuscaConteudos>(`/conteudos/search?${busca}`, {
    auth: "jwt",
    revalidar: false,
  });
}

/** Quantas mídias por página. Grade de 5 colunas fecha em 24 sem sobra feia. */
export const LIMITE_MIDIA = 24;

/**
 * Biblioteca de vídeos — o que já está no Vimeo pela plataforma.
 *
 * Pagina desde 24/08/2026: eram 139 registros vindo de uma vez, e a busca
 * acontecia no cliente sobre a lista inteira. Agora as duas coisas são do
 * servidor.
 *
 * Sem cache: quem abre a biblioteca acabou de enviar algo com frequência, e
 * uma lista velha esconderia justamente o vídeo que a pessoa procura.
 */
export function listarVideos(filtros: { q?: string; page?: number } = {}) {
  const busca = new URLSearchParams();
  if (filtros.q) busca.set("q", filtros.q);
  busca.set("page", String(filtros.page ?? 1));
  busca.set("limit", String(LIMITE_MIDIA));

  return api<BuscaVideos>(`/video?${busca}`, {
    auth: "jwt",
    revalidar: false,
  });
}

/* ---------------- cupons ---------------- */

/**
 * Todos os cupons.
 *
 * A rota não pagina nem filtra — e por ora tudo bem: cupom é cadastro de
 * campanha, medido em dezenas, não em milhares. Abas, busca e ordenação são
 * feitas aqui sobre a lista inteira. Se um dia passar de algumas centenas,
 * vale mover os filtros para o backend, como fiz em conteúdos e trilhas.
 */
export function listarCupons() {
  return api<Cupom[]>("/cupom", { auth: "jwt", revalidar: false });
}

export function obterCupom(id: number) {
  return api<Cupom>(`/cupom/${id}`, { auth: "jwt", revalidar: false });
}

/* ---------------- taxonomia ---------------- */

export function listarCategorias() {
  return api<Categoria[]>("/categorias/list", {
    auth: "publica",
    revalidar: 300,
  });
}

export function listarSubcategorias() {
  return api<Subcategoria[]>("/subcategorias/list", {
    auth: "publica",
    revalidar: 300,
  });
}

/**
 * Detalhe para edição. Usa a rota `/admin` e não `/conteudos/{id}`: a pública
 * passa por `EmailVerifiedGuard` e recusaria um admin com e-mail não
 * confirmado — que é justamente o caso da conta `superadmin@example.com`.
 */
export function obterConteudoAdmin(id: number) {
  return api<ConteudoAdmin>(`/conteudos/${id}/admin`, {
    auth: "jwt",
    revalidar: false,
  });
}

export function listarInstrutores() {
  return api<Instrutor[]>("/instrutor", { auth: "jwt", revalidar: 300 });
}

/**
 * Nomes de tag já usados, para autocompletar.
 *
 * Filtra os puramente numéricos: 523 das 535 tags do banco têm o ID como nome,
 * resquício do painel antigo, que enviava IDs onde a API espera nomes (o
 * `connectOrCreate` então criava uma tag chamada "7"). Sugerir esse lixo
 * perpetuaria o problema.
 */
export async function listarNomesDeTags() {
  const tags = await api<Tag[]>("/tags", { auth: "publica", revalidar: 300 });
  return tags
    .map((tag) => tag.nome)
    .filter((nome) => !/^\d+$/.test(nome.trim()))
    .sort((a, b) => a.localeCompare(b, "pt-BR"));
}

/** Link reproduzível de um vídeo do Vimeo — usado para pré-visualizar. */
export function obterLinkVideo(vimeoId: string) {
  return apiOpcional<{
    url: string;
    sources?: { id: string; type: string; url: string; quality?: string }[];
  }>(`/vimeo-client/video/${vimeoId}/link`, { auth: "jwt", revalidar: false });
}

/* ---------------- taxonomia ---------------- */

export function listarTags() {
  return api<Tag[]>("/tags", { auth: "publica", revalidar: 60 });
}

/**
 * Categorias com quantos conteúdos cada uma tem.
 *
 * A API não devolve essa contagem em `/categorias/list`, e ela é essencial:
 * `Conteudo.categoria` é uma FK sem cascata, então excluir uma categoria em
 * uso simplesmente falha. Mostrar o número antes evita a tentativa frustrada.
 *
 * Uma chamada por categoria, pedindo `limit=1` e lendo só o total. São poucas
 * categorias e a resposta é cacheada.
 */
export async function listarCategoriasComUso() {
  const categorias = await listarCategorias();

  return Promise.all(
    categorias.map(async (categoria) => {
      const busca = await apiOpcional<ListaPaginada<unknown>>(
        `/conteudos/search?categoriaId=${categoria.id}&page=1&limit=1`,
        { auth: "jwt", revalidar: 60 },
      );

      return { ...categoria, conteudos: busca?.pagination.total ?? 0 };
    }),
  );
}

/* ---------------- instrutores ---------------- */

/**
 * Instrutores com quantos conteúdos cada um tem.
 *
 * `GET /instrutor` traz todos, mas sem contagem. `GET /instrutor/lista` traz a
 * contagem, mas só de quem JÁ tem conteúdo. Cruzamos os dois: a lista completa
 * manda, e quem não aparece na segunda fica com zero.
 */
export async function listarInstrutoresComUso() {
  const [todos, comConteudo] = await Promise.all([
    listarInstrutores(),
    apiOpcional<Instrutor[]>("/instrutor/lista?limit=500", {
      auth: "publica",
      revalidar: 60,
    }),
  ]);

  const usoPorId = new Map(
    (comConteudo ?? []).map((i) => [i.id, i.totalConteudos ?? 0]),
  );

  return todos.map((instrutor) => ({
    ...instrutor,
    totalConteudos: usoPorId.get(instrutor.id) ?? 0,
  }));
}

/**
 * Um instrutor e os conteúdos que ele assina.
 *
 * `GET /instrutor/:id/perfil` é público — é a mesma vitrine que a plataforma do
 * aluno usa. Serve aqui porque traz, de uma vez, o cadastro e a lista de
 * conteúdos: sem ela a tela de edição precisaria de duas chamadas para dizer o
 * que essa pessoa já assina.
 */
export function obterInstrutorComConteudos(id: number, limit = 24) {
  return api<PerfilInstrutor>(
    `/instrutor/${id}/perfil?limit=${limit}`,
    { auth: "publica", revalidar: false },
  );
}

/**
 * O que já foi enviado, do mais recente para o mais antigo.
 *
 * Inclui automáticas e manuais: as duas passam pelo mesmo registro, e separar
 * as telas esconderia justamente a comparação que interessa — quanto sai
 * sozinho contra quanto a equipe escreve.
 */
export function obterHistoricoNotificacoes(page = 1, limit = 20) {
  return api<HistoricoNotificacoes>(
    `/notificacoes/admin/historico?page=${page}&limit=${limit}`,
    { auth: "jwt", revalidar: false },
  );
}

/* ---------------- trilhas ---------------- */

/** Todas as trilhas, inclusive rascunhos. Só SUPERADMIN. */
export type FiltrosTrilha = {
  tipo?: TipoTrilha;
  q?: string;
  publicada?: boolean;
  destaque?: boolean;
  categoriaId?: number;
  ordenar?: string;
  page?: number;
  limit?: number;
};

/**
 * Listagem administrativa de trilhas e cursos — a mesma tabela, separada por
 * `tipo`. Devolve paginação e os contadores das abas, como a de conteúdos.
 */
export function listarTrilhas(filtros: FiltrosTrilha = {}) {
  const busca = new URLSearchParams();
  if (filtros.tipo) busca.set("tipo", filtros.tipo);
  if (filtros.q) busca.set("q", filtros.q);
  /* `!== undefined` porque `false` ("só rascunhos") é um valor útil aqui. */
  if (filtros.publicada !== undefined) {
    busca.set("publicada", String(filtros.publicada));
  }
  if (filtros.destaque) busca.set("destaque", "true");
  if (filtros.categoriaId) busca.set("categoriaId", String(filtros.categoriaId));
  if (filtros.ordenar) busca.set("ordenar", filtros.ordenar);
  busca.set("page", String(filtros.page ?? 1));
  busca.set("limit", String(filtros.limit ?? 24));

  return api<BuscaTrilhas>(`/trilhas/admin/all?${busca}`, {
    auth: "jwt",
    revalidar: false,
  });
}

export function obterTrilha(id: number) {
  return api<TrilhaDetalhe>(`/trilhas/${id}`, { auth: "jwt", revalidar: false });
}

/**
 * Todos os conteúdos, para montar a trilha.
 *
 * `/conteudos/search` limita a 24 por página, então paginamos até o fim. São
 * ~4 requisições para o acervo atual, todas cacheadas — melhor que usar
 * `/conteudos`, que traz vídeos, módulos e instrutores de cada item e pesaria
 * dezenas de vezes mais.
 */
/**
 * Todos os conteúdos, para escolher o que entra num curso ou trilha.
 *
 * Pagina até o fim porque o seletor precisa da lista inteira para buscar —
 * filtrar no servidor a cada tecla faria a escolha depender da rede.
 */
export async function listarConteudosParaAgrupar() {
  const itens: ConteudoBusca[] = [];
  let pagina = 1;
  let totalPaginas = 1;

  do {
    const resposta = await api<ListaPaginada<ConteudoBusca>>(
      `/conteudos/search?page=${pagina}&limit=${LIMITE_MAXIMO_BUSCA}`,
      { auth: "jwt", revalidar: 120 },
    );
    itens.push(...resposta.data);
    totalPaginas = resposta.pagination.totalPages;
    pagina += 1;
    // Trava de segurança: um totalPages absurdo não pode virar laço infinito.
  } while (pagina <= totalPaginas && pagina <= 40);

  return itens;
}

/* ---------------- usuários ---------------- */

export const LIMITE_USUARIOS = 25;

export function listarUsuarios(filtros: {
  q?: string;
  role?: string;
  ordenar?: string;
  page?: number;
}) {
  const busca = new URLSearchParams();
  if (filtros.q) busca.set("q", filtros.q);
  if (filtros.role) busca.set("role", filtros.role);
  if (filtros.ordenar) busca.set("ordenar", filtros.ordenar);
  busca.set("page", String(filtros.page ?? 1));
  busca.set("limit", String(LIMITE_USUARIOS));

  return api<BuscaUsuariosAdmin>(`/usuario/admin/usuarios?${busca}`, {
    auth: "jwt",
    revalidar: false,
  });
}

/** Detalhe completo de um usuário, para a tela de edição. */
export function obterUsuario(id: number) {
  return api<UsuarioDetalhe>(`/usuario/admin/usuarios/${id}`, {
    auth: "jwt",
    revalidar: false,
  });
}

/* ---------------- propagandas ---------------- */

/** Todas, inclusive as inativas. Já vem na ordem de exibição. */
export function listarPropagandas() {
  return api<Propaganda[]>("/propagandas/admin/all", {
    auth: "jwt",
    revalidar: false,
  });
}

/**
 * Uma propaganda pelo id.
 *
 * A API não tem rota de detalhe — só a listagem. Como são poucos banners e a
 * listagem já é enxuta, filtrar aqui evita um endpoint novo no backend só
 * para isso.
 */
export async function obterPropaganda(id: number) {
  const todas = await listarPropagandas();
  return todas.find((p) => p.id === id) ?? null;
}

/* ---------------- notificações ---------------- */

export function obterAlcancePush() {
  return api<AlcancePush>("/notificacoes/alcance", {
    auth: "jwt",
    revalidar: false,
  });
}
