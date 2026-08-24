"use server";

import { revalidatePath } from "next/cache";
import { API_URL } from "@/lib/api";
import { obterLinkVideo } from "@/lib/queries";
import { lerToken } from "@/lib/session";

export type ResultadoSimples = { ok: true } | { ok: false; erro: string };

export type ResultadoUpload =
  | { ok: true; id: number; vimeoUploadLink?: string }
  | { ok: false; erro: string };

async function mensagemDeErro(resposta: Response): Promise<string> {
  try {
    const corpo = (await resposta.json()) as { message?: string | string[] };
    if (Array.isArray(corpo.message)) return corpo.message.join(", ");
    if (corpo.message) return corpo.message;
  } catch {
    // sem corpo JSON
  }
  return `A API respondeu ${resposta.status}.`;
}

async function chamar(
  rota: string,
  metodo: string,
  corpo?: unknown,
): Promise<{ ok: true; dados: unknown } | { ok: false; erro: string }> {
  const token = await lerToken();
  if (!token) return { ok: false, erro: "Sessão expirada." };

  const resposta = await fetch(`${API_URL}${rota}`, {
    method: metodo,
    headers: {
      Authorization: `Bearer ${token}`,
      ...(corpo ? { "Content-Type": "application/json" } : {}),
    },
    body: corpo ? JSON.stringify(corpo) : undefined,
    cache: "no-store",
  });

  if (!resposta.ok) return { ok: false, erro: await mensagemDeErro(resposta) };

  const texto = await resposta.text();
  return { ok: true, dados: texto ? JSON.parse(texto) : null };
}

function atualizarTela(conteudoId: number) {
  revalidatePath(`/conteudos/${conteudoId}/editar`);
  revalidatePath("/conteudos");
}

/* ---------------- módulos ---------------- */

/**
 * Cria um módulo. Os três textos são obrigatórios no backend (`@IsString()`
 * sem `@IsOptional()`), e o conteúdo precisa já ter pasta no Vimeo — o módulo
 * nasce como subpasta dela.
 */
export async function criarModulo(
  conteudoId: number,
  dados: { titulo: string; subtitulo: string; descricao: string },
): Promise<ResultadoSimples> {
  const resultado = await chamar("/modulo-conteudo/create", "POST", {
    ...dados,
    conteudoId,
  });

  if (!resultado.ok) return resultado;
  atualizarTela(conteudoId);
  return { ok: true };
}

export async function atualizarModulo(
  conteudoId: number,
  moduloId: number,
  dados: { titulo?: string; subtitulo?: string; descricao?: string },
): Promise<ResultadoSimples> {
  const resultado = await chamar(`/modulo-conteudo/${moduloId}`, "PUT", dados);
  if (!resultado.ok) return resultado;
  atualizarTela(conteudoId);
  return { ok: true };
}

/** Remove o módulo, seus vídeos e a subpasta no Vimeo. */
export async function excluirModulo(
  conteudoId: number,
  moduloId: number,
): Promise<ResultadoSimples> {
  const resultado = await chamar(`/modulo-conteudo/${moduloId}`, "DELETE");
  if (!resultado.ok) return resultado;
  atualizarTela(conteudoId);
  return { ok: true };
}

/* ---------------- aulas (vídeos) ---------------- */

/**
 * Registra a aula e devolve o link de upload do Vimeo.
 *
 * Mesmo desenho do vídeo introdutório: o arquivo não passa pelo painel, só o
 * tamanho. `moduloId` ausente pendura a aula direto no conteúdo — o backend
 * cria (uma vez) a pasta "Videos" para esse caso.
 */
export async function criarAula(
  conteudoId: number,
  dados: {
    titulo: string;
    fileSize: number;
    duracao?: number;
    moduloId?: number;
  },
): Promise<ResultadoUpload> {
  const corpo: Record<string, unknown> = {
    titulo: dados.titulo,
    fileSize: dados.fileSize,
  };

  if (dados.duracao && dados.duracao > 0) corpo.duracao = dados.duracao;
  if (dados.moduloId) corpo.moduloId = dados.moduloId;
  else corpo.conteudoId = conteudoId;

  const resultado = await chamar("/video/create", "POST", corpo);
  if (!resultado.ok) return resultado;

  const dadosRetorno = resultado.dados as {
    video?: { id?: number };
    vimeoUploadLink?: string;
  };

  if (!dadosRetorno.video?.id) {
    return { ok: false, erro: "A API não devolveu a aula criada." };
  }

  atualizarTela(conteudoId);

  return {
    ok: true,
    id: dadosRetorno.video.id,
    vimeoUploadLink: dadosRetorno.vimeoUploadLink,
  };
}

export async function atualizarAula(
  conteudoId: number,
  videoId: number,
  dados: { titulo?: string; duracao?: number },
): Promise<ResultadoSimples> {
  const resultado = await chamar(`/video/${videoId}`, "PATCH", dados);
  if (!resultado.ok) return resultado;
  atualizarTela(conteudoId);
  return { ok: true };
}

/**
 * Remove a aula. Diferente do módulo, esta rota FALHA se o Vimeo recusar a
 * exclusão — o backend lança em vez de engolir o erro. A mensagem que volta
 * é a da API, então vale mostrá-la inteira.
 */
export async function excluirAula(
  conteudoId: number,
  videoId: number,
): Promise<ResultadoSimples> {
  const resultado = await chamar(`/video/${videoId}`, "DELETE");
  if (!resultado.ok) return resultado;
  atualizarTela(conteudoId);
  return { ok: true };
}

/**
 * Cria uma aula apontando para um vídeo QUE JÁ ESTÁ no Vimeo.
 *
 * Não envia arquivo: só cria o vínculo com a mesma URI. É o que permite a
 * mesma aula aparecer em mais de um curso sem duplicar o arquivo lá.
 */
export async function vincularVideoExistente(
  conteudoId: number,
  dados: {
    titulo: string;
    videoUrl: string;
    duracao?: number;
    moduloId?: number;
  },
): Promise<ResultadoSimples> {
  const corpo: Record<string, unknown> = {
    titulo: dados.titulo,
    videoUrl: dados.videoUrl,
  };

  if (dados.duracao && dados.duracao > 0) corpo.duracao = dados.duracao;
  if (dados.moduloId) corpo.moduloId = dados.moduloId;
  else corpo.conteudoId = conteudoId;

  const resultado = await chamar("/video/create", "POST", corpo);
  if (!resultado.ok) return resultado;

  atualizarTela(conteudoId);
  return { ok: true };
}

/**
 * Link tocável de um vídeo, para a prévia dentro do modal.
 *
 * Existe como ação porque `obterLinkVideo` é `server-only` — o modal roda no
 * cliente e não pode chamá-la direto. Buscar sob demanda, e não para a lista
 * inteira, evita 139 chamadas ao Vimeo só para abrir a biblioteca.
 *
 * Prefere MP4 como a prévia do servidor: o link padrão é HLS, que só toca
 * nativamente no Safari, e trazer o hls.js para o painel por causa de uma
 * prévia não se paga.
 */
export async function obterLinkDoVideo(
  vimeoUri: string,
): Promise<{ mp4: string | null; original: string | null }> {
  const id = vimeoUri.replace("/videos/", "").trim();
  if (!id) return { mp4: null, original: null };

  const link = await obterLinkVideo(id);
  if (!link) return { mp4: null, original: null };

  const mp4 =
    link.sources?.find((fonte) => fonte.type?.includes("mp4"))?.url ?? null;

  return { mp4, original: link.url ?? null };
}
