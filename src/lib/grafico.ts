/**
 * Altura que N barras deitadas ocupam sem sobrar espaço morto.
 *
 * Altura fixa num gráfico de barras é sempre errada para alguém: com duas
 * categorias sobra metade do cartão vazio, com dez as barras se espremem. A
 * altura é consequência da quantidade, não uma escolha por cartão.
 *
 * Mora aqui, e não em `components/graficos.tsx`, porque as páginas que a
 * chamam são Server Components — e função exportada de um módulo `"use client"`
 * só pode ser renderizada, nunca executada no servidor.
 */
export function alturaBarras(quantidade: number): number {
  return 28 + quantidade * 34;
}
