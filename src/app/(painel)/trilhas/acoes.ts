"use server";

import { revalidatePath } from "next/cache";
import { API_URL } from "@/lib/api";
import { lerToken } from "@/lib/session";

export type Resultado =
  | { ok: true; id: number; vimeoUploadLink?: string }
  | { ok: false; erro: string };

export type ModuloEnviado = {
  titulo: string;
  subtitulo?: string;
  descricao?: string;
  conteudoIds: number[];
};

export type DadosTrilha = {
  /**
   * CURSO ou TRILHA — o mesmo registro, papéis diferentes. Vai no corpo
   * porque o `create` do backend monta os campos um a um: omitir aqui grava
   * TRILHA em silêncio, mesmo tendo vindo da tela de Cursos.
   */
  tipo?: "CURSO" | "TRILHA";
  titulo: string;
  descricao?: string;
  nivel?: string;
  destaque: boolean;
  publicada: boolean;
  conteudoIds: number[];
  modulos: ModuloEnviado[];

  /* Paridade com conteúdo. */
  categoriaId?: number;
  subcategoriaId?: number;
  aprendizagem?: string;
  requisitos?: string;
  gratuitoTipo?: string;
  gratuitoAte?: string;
  dataCriacao?: string;
  tags: string[];
  instrutorIds: number[];
  /** Tamanho do vídeo introdutório. Só na criação. */
  fileSize?: number;
  /** URL de um teaser já enviado ao Vimeo (biblioteca de vídeos). */
  videoIntrodutorioUrl?: string;
};

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

/**
 * Monta o corpo multipart.
 *
 * Arrays e objetos viajam como JSON string — o backend faz `JSON.parse` neles.
 * Booleanos vão como "true"/"false"; o DTO lê o valor cru para escapar da
 * conversão implícita, que transformaria "false" em `true`.
 */
function montarCorpo(dados: DadosTrilha, arquivos: FormData): FormData {
  const corpo = new FormData();

  if (dados.tipo) corpo.set("tipo", dados.tipo);
  corpo.set("titulo", dados.titulo);
  if (dados.descricao) corpo.set("descricao", dados.descricao);
  if (dados.nivel) corpo.set("nivel", dados.nivel);

  corpo.set("destaque", dados.destaque ? "true" : "false");
  corpo.set("publicada", dados.publicada ? "true" : "false");

  corpo.set("conteudoIds", JSON.stringify(dados.conteudoIds));
  corpo.set("modulos", JSON.stringify(dados.modulos));
  corpo.set("tags", JSON.stringify(dados.tags));
  corpo.set("instrutorIds", JSON.stringify(dados.instrutorIds));

  if (dados.categoriaId) corpo.set("categoriaId", String(dados.categoriaId));
  if (dados.subcategoriaId) {
    corpo.set("subcategoriaId", String(dados.subcategoriaId));
  }
  if (dados.aprendizagem) corpo.set("aprendizagem", dados.aprendizagem);
  if (dados.requisitos) corpo.set("requisitos", dados.requisitos);
  if (dados.gratuitoTipo) corpo.set("gratuitoTipo", dados.gratuitoTipo);
  if (dados.gratuitoAte) corpo.set("gratuitoAte", dados.gratuitoAte);
  if (dados.dataCriacao) corpo.set("dataCriacao", dados.dataCriacao);
  if (dados.fileSize) corpo.set("fileSize", String(dados.fileSize));
  if (dados.videoIntrodutorioUrl)
    corpo.set("videoIntrodutorioUrl", dados.videoIntrodutorioUrl);

  for (const campo of [
    "thumbnailDesktop",
    "thumbnailMobile",
    "thumbnailDestaque",
  ]) {
    const valor = arquivos.get(campo);
    // Arquivo novo (upload) OU caminho de uma imagem da biblioteca (texto).
    if (valor instanceof File && valor.size > 0) corpo.set(campo, valor);
    else if (typeof valor === "string" && valor !== "") corpo.set(campo, valor);
  }

  return corpo;
}

export async function criarTrilha(
  dados: DadosTrilha,
  arquivos: FormData,
): Promise<Resultado> {
  const token = await lerToken();
  if (!token) return { ok: false, erro: "Sessão expirada." };

  const resposta = await fetch(`${API_URL}/trilhas`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
    body: montarCorpo(dados, arquivos),
    cache: "no-store",
  });

  if (!resposta.ok) return { ok: false, erro: await mensagemDeErro(resposta) };

  const trilha = (await resposta.json()) as {
    id?: number;
    vimeoUploadLink?: string | null;
  };
  if (!trilha.id) {
    return { ok: false, erro: "A API não devolveu a trilha criada." };
  }

  revalidatePath("/trilhas");
  return {
    ok: true,
    id: trilha.id,
    vimeoUploadLink: trilha.vimeoUploadLink ?? undefined,
  };
}

/**
 * Atualiza a trilha.
 *
 * Enviar `conteudoIds` ou `modulos` redefine a estrutura inteira — é assim que
 * a ordem fica previsível: a sequência enviada é a sequência final.
 */
export async function atualizarTrilha(
  id: number,
  dados: DadosTrilha,
  arquivos: FormData,
): Promise<Resultado> {
  const token = await lerToken();
  if (!token) return { ok: false, erro: "Sessão expirada." };

  const resposta = await fetch(`${API_URL}/trilhas/${id}`, {
    method: "PATCH",
    headers: { Authorization: `Bearer ${token}` },
    body: montarCorpo(dados, arquivos),
    cache: "no-store",
  });

  if (!resposta.ok) return { ok: false, erro: await mensagemDeErro(resposta) };

  revalidatePath("/trilhas");
  revalidatePath(`/trilhas/${id}/editar`);
  return { ok: true, id };
}

export async function excluirTrilha(id: number): Promise<Resultado> {
  const token = await lerToken();
  if (!token) return { ok: false, erro: "Sessão expirada." };

  const resposta = await fetch(`${API_URL}/trilhas/${id}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${token}` },
    cache: "no-store",
  });

  if (!resposta.ok) return { ok: false, erro: await mensagemDeErro(resposta) };

  revalidatePath("/trilhas");
  return { ok: true, id };
}

/* ---------------- ações em lote ---------------- */

export type ResultadoLote =
  | { ok: true; afetados: number }
  | { ok: false; erro: string; afetados: number };

/**
 * Mesma mecânica do lote de conteúdos: N requisições em série, porque a API
 * não tem rota de lote e uma rajada simultânea é a forma mais fácil de
 * derrubar o backend. Sucesso parcial conta como parcial — dizer "falhou"
 * quando 20 de 24 mudaram faria o admin repetir o que já deu certo.
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

  revalidatePath("/trilhas");
  revalidatePath("/cursos");

  if (primeiroErro) return { ok: false, erro: primeiroErro, afetados };
  return { ok: true, afetados };
}

export async function publicarTrilhasEmLote(
  ids: number[],
  publicada: boolean,
): Promise<ResultadoLote> {
  return emLote(ids, (id, token) => {
    /*
      Multipart com um campo só. A rota recebe tudo por FormData e o DTO é
      parcial, então mandar apenas `publicada` não toca no resto da trilha —
      nem na estrutura de conteúdos, que é redefinida por inteiro quando
      `conteudoIds` ou `modulos` aparecem no corpo.
    */
    const corpo = new FormData();
    corpo.set("publicada", publicada ? "true" : "false");

    return fetch(`${API_URL}/trilhas/${id}`, {
      method: "PATCH",
      headers: { Authorization: `Bearer ${token}` },
      body: corpo,
      cache: "no-store",
    });
  });
}

export async function excluirTrilhasEmLote(
  ids: number[],
): Promise<ResultadoLote> {
  return emLote(ids, (id, token) =>
    fetch(`${API_URL}/trilhas/${id}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store",
    }),
  );
}

/**
 * Move entre Curso e Trilha.
 *
 * Aqui a conversão é limpa de verdade: os dois são o mesmo registro, com a
 * mesma estrutura de conteúdos e módulos. Só o papel muda.
 */
export async function moverTrilha(
  id: number,
  tipo: "CURSO" | "TRILHA",
): Promise<Resultado> {
  const token = await lerToken();
  if (!token) return { ok: false, erro: "Sessão expirada." };

  const corpo = new FormData();
  corpo.set("tipo", tipo);

  const resposta = await fetch(`${API_URL}/trilhas/${id}`, {
    method: "PATCH",
    headers: { Authorization: `Bearer ${token}` },
    body: corpo,
    cache: "no-store",
  });

  if (!resposta.ok) return { ok: false, erro: await mensagemDeErro(resposta) };

  revalidatePath("/trilhas");
  revalidatePath("/cursos");
  return { ok: true, id };
}
