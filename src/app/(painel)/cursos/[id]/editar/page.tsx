import { TelaEditarConteudo } from "@/components/conteudos/tela-editar";

export const metadata = { title: "Editar curso · Painel DigitalEduca" };

export default async function Pagina({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <TelaEditarConteudo id={id} esperado="CURSO" />;
}
