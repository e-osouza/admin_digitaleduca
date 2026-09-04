"use server";

import { revalidatePath } from "next/cache";
import { API_URL } from "@/lib/api";
import { lerToken } from "@/lib/session";
import type { TipoConteudo } from "@/types/api";

export type Resultado =
  | { ok: true; id: number; vimeoUploadLink?: string }
  | { ok: false; erro: string };

/**
 * Campos de texto aceitos pela API. Enviar qualquer coisa fora desta lista
 * derruba a edição com 400: `PUT /conteudos/:id` roda sob a validação estrita
 * global (`whitelist + forbidNonWhitelisted`).
 *
 * Curiosidade que NÃO deve virar hábito: `POST /conteudos/create` tem um
 * `ValidationPipe` local com `whitelist: false`, então lá campo extra passa em
 * silêncio. Filtramos nos dois para o comportamento ser o mesmo.
 */
const CAMPOS_TEXTO = [
  "titulo",
  "descricao",
  "categoriaId",
  "subcategoriaId",
  "tipo",
  "destaque",
  "level",
  "aprendizagem",
  "requisitos",
  "gratuitoTipo",
  "gratuitoAte",
  "apresentador",
  "convidados",
  "publicado",
  // URI de um teaser já enviado ao Vimeo (upload no ato da seleção).
  "videoIntrodutorioUrl",
] as const;

/** Arrays viajam como JSON string no multipart — o backend faz `JSON.parse`. */
const CAMPOS_JSON = ["tags", "instrutorIds", "convidadoIds"] as const;

const ARQUIVOS = [
  "thumbnailDesktop",
  "thumbnailMobile",
  "thumbnailDestaque",
] as const;

function montarCorpo(entrada: FormData): FormData {
  const corpo = new FormData();

  for (const campo of CAMPOS_TEXTO) {
    const valor = entrada.get(campo);
    if (typeof valor === "string" && valor !== "") corpo.set(campo, valor);
  }

  for (const campo of CAMPOS_JSON) {
    const valor = entrada.get(campo);
    if (typeof valor === "string" && valor !== "") corpo.set(campo, valor);
  }

  /*
   * `apresentadorId` é enviado separado porque só faz sentido em podcast e,
   * vazio, precisa sumir do corpo: o backend trata `!= null` como "quis
   * definir" e recriaria os vínculos sem apresentador.
   */
  const apresentador = entrada.get("apresentadorId");
  if (typeof apresentador === "string" && apresentador !== "") {
    corpo.set("apresentadorId", apresentador);
  }

  for (const campo of ARQUIVOS) {
    const valor = entrada.get(campo);
    // Arquivo novo (upload) OU caminho de uma imagem da biblioteca (texto).
    if (valor instanceof File && valor.size > 0) corpo.set(campo, valor);
    else if (typeof valor === "string" && valor !== "") corpo.set(campo, valor);
  }

  return corpo;
}

async function mensagemDeErro(resposta: Response): Promise<string> {
  try {
    const corpo = (await resposta.json()) as { message?: string | string[] };
    if (Array.isArray(corpo.message)) return corpo.message.join(", ");
    if (corpo.message) return corpo.message;
  } catch {
    // resposta sem JSON — cai no texto padrão
  }
  return `A API respondeu ${resposta.status}.`;
}

/**
 * Cria o conteúdo e devolve o link de upload do Vimeo.
 *
 * O vídeo NÃO passa por aqui. A API só precisa do tamanho em bytes para abrir
 * o ticket tus; o arquivo sobe direto do browser para o Vimeo, sem trafegar
 * pelo nosso servidor.
 */
export async function criarConteudo(entrada: FormData): Promise<Resultado> {
  const token = await lerToken();
  if (!token) return { ok: false, erro: "Sessão expirada." };

  const corpo = montarCorpo(entrada);

  /*
    Vídeo introdutório é OPCIONAL. Havia aqui uma guarda que recusava a
    criação sem ele — sobra de quando era obrigatório, e que contradizia o
    próprio formulário, onde o campo está marcado como opcional desde
    19/08/2026.

    Sem arquivo, `fileSize` não vai no corpo: a API então cria o conteúdo sem
    teaser, e ainda assim cria a pasta no Vimeo, então módulos e aulas
    continuam funcionando. O teaser pode ser enviado depois, na edição.
  */
  const fileSize = entrada.get("fileSize");
  if (typeof fileSize === "string" && Number(fileSize) > 0) {
    corpo.set("fileSize", fileSize);
  }

  /*
   * Obrigatório no DTO de criação. O formulário manda `yyyy-MM-dd`; a API
   * espera string de data, então normalizamos para ISO completo. Sem escolha,
   * o conteúdo nasce com a data de agora.
   *
   * Não existe no DTO de atualização — por isso só aparece aqui.
   */
  const dataEscolhida = entrada.get("dataCriacao");
  corpo.set(
    "dataCriacao",
    typeof dataEscolhida === "string" && dataEscolhida
      ? new Date(`${dataEscolhida}T12:00:00`).toISOString()
      : new Date().toISOString(),
  );

  const resposta = await fetch(`${API_URL}/conteudos/create`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
    body: corpo,
    cache: "no-store",
  });

  if (!resposta.ok) return { ok: false, erro: await mensagemDeErro(resposta) };

  const criado = (await resposta.json()) as {
    conteudo?: { id?: number };
    vimeoUploadLink?: string;
  };

  if (!criado.conteudo?.id) {
    return { ok: false, erro: "A API não devolveu o conteúdo criado." };
  }

  revalidatePath("/conteudos");

  return {
    ok: true,
    id: criado.conteudo.id,
    vimeoUploadLink: criado.vimeoUploadLink,
  };
}

/**
 * Atualiza o conteúdo.
 *
 * Atenção a uma regra do backend: se QUALQUER campo de pessoas
 * (`instrutorIds`, `apresentadorId`, `convidadoIds`) vier no corpo, ele apaga
 * todos os vínculos e recria só com o que foi enviado. O formulário sempre
 * manda os três juntos — mandar um só apagaria os outros dois.
 */
export async function atualizarConteudo(
  id: number,
  entrada: FormData,
): Promise<Resultado> {
  const token = await lerToken();
  if (!token) return { ok: false, erro: "Sessão expirada." };

  const resposta = await fetch(`${API_URL}/conteudos/${id}`, {
    method: "PUT",
    headers: { Authorization: `Bearer ${token}` },
    body: montarCorpo(entrada),
    cache: "no-store",
  });

  if (!resposta.ok) return { ok: false, erro: await mensagemDeErro(resposta) };

  revalidatePath("/conteudos");
  revalidatePath(`/conteudos/${id}/editar`);

  return { ok: true, id };
}

export async function excluirConteudo(id: number): Promise<Resultado> {
  const token = await lerToken();
  if (!token) return { ok: false, erro: "Sessão expirada." };

  const resposta = await fetch(`${API_URL}/conteudos/${id}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${token}` },
    cache: "no-store",
  });

  if (!resposta.ok) return { ok: false, erro: await mensagemDeErro(resposta) };

  revalidatePath("/conteudos");
  return { ok: true, id };
}

/**
 * Abre um ticket para substituir o vídeo de um conteúdo já existente.
 *
 * Rota `POST /conteudos/:id/video`, adicionada ao backend em 19/08/2026 — o
 * DTO de atualização não aceita `videoIntrodutorio`, então não havia como
 * trocar o arquivo sem recriar o conteúdo.
 *
 * O vídeo antigo é apagado do Vimeo pelo backend. Como sempre, o arquivo novo
 * não passa por aqui: sobe direto do browser para o link retornado.
 */
export async function trocarVideo(
  id: number,
  fileSize: number,
): Promise<Resultado> {
  const token = await lerToken();
  if (!token) return { ok: false, erro: "Sessão expirada." };

  const resposta = await fetch(`${API_URL}/conteudos/${id}/video`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ fileSize }),
    cache: "no-store",
  });

  if (!resposta.ok) return { ok: false, erro: await mensagemDeErro(resposta) };

  const dados = (await resposta.json()) as { vimeoUploadLink?: string };

  revalidatePath(`/conteudos/${id}/editar`);
  revalidatePath(`/podcasts/${id}/editar`);

  return { ok: true, id, vimeoUploadLink: dados.vimeoUploadLink };
}

/**
 * Remove o vídeo introdutório e apaga o arquivo no Vimeo.
 *
 * Rota `DELETE /conteudos/:id/video`, adicionada ao backend em 19/08/2026.
 * A pasta do conteúdo e as aulas não são afetadas.
 */
export async function removerVideoIntrodutorio(
  id: number,
): Promise<Resultado> {
  const token = await lerToken();
  if (!token) return { ok: false, erro: "Sessão expirada." };

  const resposta = await fetch(`${API_URL}/conteudos/${id}/video`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${token}` },
    cache: "no-store",
  });

  if (!resposta.ok) return { ok: false, erro: await mensagemDeErro(resposta) };

  revalidatePath(`/conteudos/${id}/editar`);
  revalidatePath(`/podcasts/${id}/editar`);

  return { ok: true, id };
}

/* ---------------- ações em lote ---------------- */

export type ResultadoLote =
  | { ok: true; afetados: number }
  | { ok: false; erro: string; afetados: number };

/**
 * Aplica uma mudança de estado a vários conteúdos.
 *
 * A API não tem rota de lote, então são N requisições. Elas vão em série de
 * propósito: uma rajada de 24 PUTs simultâneos no mesmo backend é a forma mais
 * fácil de derrubá-lo, e a seleção da tela é limitada à página visível.
 *
 * Parcial conta como sucesso parcial, não como falha: se 20 dos 24 mudaram,
 * dizer "deu erro" faria o admin repetir tudo — inclusive o que já funcionou.
 * O retorno diz quantos foram, e a tela mostra os dois números.
 */
async function emLote(
  ids: number[],
  aplicar: (id: number, token: string) => Promise<Response>,
): Promise<ResultadoLote> {
  const token = await lerToken();
  if (!token) return { ok: false, erro: "Sessão expirada.", afetados: 0 };

  let afetados = 0;
  let primeiroErro: string | null = null;

  for (const id of ids) {
    const resposta = await aplicar(id, token);
    if (resposta.ok) afetados += 1;
    else if (!primeiroErro) primeiroErro = await mensagemDeErro(resposta);
  }

  revalidatePath("/conteudos");

  if (primeiroErro) {
    return { ok: false, erro: primeiroErro, afetados };
  }
  return { ok: true, afetados };
}

/** Publica ou volta para rascunho os conteúdos selecionados. */
export async function publicarEmLote(
  ids: number[],
  publicado: boolean,
): Promise<ResultadoLote> {
  return emLote(ids, (id, token) => {
    /*
      Multipart com um campo só. O backend recebe tudo por `FormData` nesta
      rota, e o DTO é parcial — mandar apenas `publicado` deixa o resto do
      conteúdo intocado.
    */
    const corpo = new FormData();
    corpo.set("publicado", publicado ? "true" : "false");

    return fetch(`${API_URL}/conteudos/${id}`, {
      method: "PUT",
      headers: { Authorization: `Bearer ${token}` },
      body: corpo,
      cache: "no-store",
    });
  });
}

export async function excluirEmLote(ids: number[]): Promise<ResultadoLote> {
  return emLote(ids, (id, token) =>
    fetch(`${API_URL}/conteudos/${id}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store",
    }),
  );
}

/**
 * Move um conteúdo entre os quatro tipos do menu.
 *
 * É troca de `tipo` na mesma tabela — nada é copiado nem apagado. O que muda
 * é o formulário que passa a editá-lo e a tela onde ele aparece.
 */
export async function moverConteudo(
  id: number,
  /*
    Aceita qualquer tipo do enum, inclusive PALESTRA — que não está no menu
    mas ainda existe na API. Restringir aqui só faria o painel recusar um
    movimento que o backend aceita.
  */
  tipo: TipoConteudo,
): Promise<Resultado> {
  const token = await lerToken();
  if (!token) return { ok: false, erro: "Sessão expirada." };

  /* Multipart com um campo só: a rota recebe FormData e o DTO é parcial. */
  const corpo = new FormData();
  corpo.set("tipo", tipo);

  const resposta = await fetch(`${API_URL}/conteudos/${id}`, {
    method: "PUT",
    headers: { Authorization: `Bearer ${token}` },
    body: corpo,
    cache: "no-store",
  });

  if (!resposta.ok) return { ok: false, erro: await mensagemDeErro(resposta) };

  revalidatePath("/conteudos");
  revalidatePath("/podcasts");
  revalidatePath("/cursos");
  revalidatePath("/trilhas");
  return { ok: true, id };
}

/** Um conteúdo dentro de um curso, opcionalmente dentro de um módulo dele. */
export type ItemDoAgrupador = {
  conteudoId: number;
  moduloId: number | null;
};

/**
 * Redefine quais conteúdos um curso ou trilha agrupa, e em que módulo.
 *
 * A ordem enviada É a ordem final: o backend apaga os vínculos e regrava.
 * Casar item a item deixaria a numeração imprevisível quando o admin
 * reordena e remove na mesma edição.
 */
export async function salvarItensDoConteudo(
  id: number,
  itens: ItemDoAgrupador[],
): Promise<Resultado> {
  const token = await lerToken();
  if (!token) return { ok: false, erro: "Sessão expirada." };

  /*
    Multipart com um campo só, e a lista como JSON — é o formato que o
    `@Transform` do DTO espera nesta rota.
  */
  const corpo = new FormData();
  corpo.set("itens", JSON.stringify(itens));

  const resposta = await fetch(`${API_URL}/conteudos/${id}`, {
    method: "PUT",
    headers: { Authorization: `Bearer ${token}` },
    body: corpo,
    cache: "no-store",
  });

  if (!resposta.ok) return { ok: false, erro: await mensagemDeErro(resposta) };

  revalidatePath(`/cursos/${id}/editar`);
  revalidatePath(`/trilhas/${id}/editar`);
  revalidatePath("/cursos");
  revalidatePath("/trilhas");
  return { ok: true, id };
}

/**
 * Estado de prontidão dos vídeos de um conteúdo (para liberar o "Publicado").
 * Retorna `null` se a sessão expirou ou a rota falhar — o chamador trata como
 * "ainda não sei", sem travar a tela.
 */
export async function obterProntidao(id: number): Promise<{
  pronto: boolean;
  total: number;
  prontos: number;
  semVideo: boolean;
  pendentes: { id: number; titulo: string }[];
} | null> {
  const token = await lerToken();
  if (!token) return null;
  try {
    const resposta = await fetch(`${API_URL}/conteudos/${id}/prontidao`, {
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store",
    });
    if (!resposta.ok) return null;
    return await resposta.json();
  } catch {
    return null;
  }
}

/**
 * Abre um ticket de upload no Vimeo (tus) para subir um vídeo ANTES de o
 * conteúdo existir. Devolve a URL de upload e a URI final do vídeo, ou null.
 */
export async function criarTicketUpload(
  fileSize: number,
): Promise<{ uri: string; uploadLink: string } | null> {
  const token = await lerToken();
  if (!token) return null;
  try {
    const resposta = await fetch(`${API_URL}/vimeo-client/upload-ticket`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ fileSize }),
      cache: "no-store",
    });
    if (!resposta.ok) return null;
    const dados = await resposta.json();
    return dados?.uri && dados?.uploadLink
      ? { uri: dados.uri, uploadLink: dados.uploadLink }
      : null;
  } catch {
    return null;
  }
}

/** Apaga um vídeo no Vimeo (usado ao cancelar/trocar um upload). */
export async function apagarVideoVimeo(uri: string): Promise<void> {
  const token = await lerToken();
  if (!token) return;
  const id = uri.replace("/videos/", "").trim();
  if (!id) return;
  try {
    await fetch(`${API_URL}/vimeo-client/video/${id}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store",
    });
  } catch {
    /* melhor esforço: um vídeo órfão no Vimeo não pode travar a tela */
  }
}

/**
 * Lista as imagens da biblioteca de mídia (arquivos em public/uploads).
 * Mais recentes primeiro; paginada e com busca por nome.
 */
export async function listarImagensMidia(
  q?: string,
  page = 1,
): Promise<{
  data: { src: string; nome: string; tamanho: number }[];
  total: number;
  page: number;
  totalPages: number;
}> {
  const token = await lerToken();
  const vazio = { data: [], total: 0, page: 1, totalPages: 0 };
  if (!token) return vazio;
  const params = new URLSearchParams({ page: String(page), limit: "40" });
  if (q?.trim()) params.set("q", q.trim());
  try {
    const resposta = await fetch(`${API_URL}/media/imagens?${params}`, {
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store",
    });
    if (!resposta.ok) return vazio;
    return await resposta.json();
  } catch {
    return vazio;
  }
}

/** Envia uma imagem para a biblioteca. Devolve o caminho ("uploads/x.jpg"). */
export async function enviarImagemMidia(
  formData: FormData,
): Promise<{ ok: true; src: string } | { ok: false; erro: string }> {
  const token = await lerToken();
  if (!token) return { ok: false, erro: "Sessão expirada." };
  try {
    const resposta = await fetch(`${API_URL}/media/imagens`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
      body: formData,
      cache: "no-store",
    });
    if (!resposta.ok) {
      return { ok: false, erro: await mensagemDeErro(resposta) };
    }
    const dados = await resposta.json();
    return { ok: true, src: dados.src };
  } catch {
    return { ok: false, erro: "Falha ao enviar a imagem." };
  }
}
