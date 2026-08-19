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

  for (const campo of [
    "thumbnailDesktop",
    "thumbnailMobile",
    "thumbnailDestaque",
  ]) {
    const arquivo = arquivos.get(campo);
    if (arquivo instanceof File && arquivo.size > 0) corpo.set(campo, arquivo);
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
