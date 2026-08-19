"use server";

import { revalidatePath } from "next/cache";
import { API_URL } from "@/lib/api";
import { lerToken } from "@/lib/session";

export type Resultado = { ok: true } | { ok: false; erro: string };

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
 * Monta o corpo do plano.
 *
 * Vai como JSON, e não multipart como o resto do painel, porque plano não tem
 * arquivo. Isso resolve de graça a armadilha do `enableImplicitConversion`:
 * em multipart o `"false"` chegava como string não-vazia e virava `true` por
 * veracidade; aqui o booleano é booleano dos dois lados.
 *
 * A validação do backend é `whitelist + forbidNonWhitelisted`: campo fora do
 * DTO derruba a requisição inteira. Por isso `priceId` e `stripeProductId`,
 * que existem no banco, não são enviados — eles são resquício da integração
 * com a Stripe e hoje ninguém os edita pelo painel.
 */
function montarCorpo(entrada: FormData) {
  const texto = (campo: string) => {
    const valor = entrada.get(campo);
    return typeof valor === "string" ? valor.trim() : "";
  };

  const parcela = entrada.get("permiteParcelamento") ? true : false;

  return {
    nome: texto("nome"),
    preco: Number(texto("preco").replace(",", ".")),
    /*
      Vai sempre, mesmo vazio. `undefined` sai do JSON.stringify, e sem a
      chave o backend simplesmente não toca no campo — o admin apagava o texto,
      salvava, e a descrição antiga continuava lá. String vazia limpa de fato.
    */
    descricao: texto("descricao"),
    intervalo: texto("intervalo"),
    permiteParcelamento: parcela,
    /*
      Sem parcelamento o máximo é 1, não o que ficou no campo. Salvar
      `maxParcelas: 12` com o parcelamento desligado deixa uma bomba armada
      para quem religar a chave meses depois sem reconferir o número.
    */
    maxParcelas: parcela ? Number(texto("maxParcelas") || 1) : 1,
    percentualDescontoAVista: Number(
      texto("percentualDescontoAVista").replace(",", ".") || 0,
    ),
    /* Checkbox ausente é desmarcado — o valor vai sempre explícito. */
    ativo: entrada.get("ativo") ? true : false,
  };
}

async function enviar(
  rota: string,
  metodo: string,
  corpo: unknown,
): Promise<Resultado> {
  const token = await lerToken();
  if (!token) return { ok: false, erro: "Sessão expirada." };

  const resposta = await fetch(`${API_URL}${rota}`, {
    method: metodo,
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(corpo),
    cache: "no-store",
  });

  if (!resposta.ok) return { ok: false, erro: await mensagemDeErro(resposta) };

  revalidatePath("/planos");
  /* O checkout do aluno lê os planos da mesma rota pública em cache. */
  revalidatePath("/");
  return { ok: true };
}

export async function criarPlano(entrada: FormData): Promise<Resultado> {
  return enviar("/planos/create", "POST", montarCorpo(entrada));
}

export async function atualizarPlano(
  id: number,
  entrada: FormData,
): Promise<Resultado> {
  return enviar(`/planos/update/${id}`, "PUT", montarCorpo(entrada));
}
