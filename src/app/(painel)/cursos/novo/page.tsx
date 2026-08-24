import { TelaNovoConteudo } from "@/components/conteudos/tela-novo";

export const metadata = { title: "Novo curso · Painel DigitalEduca" };

export default async function Pagina() {
  return <TelaNovoConteudo tipo="CURSO" />;
}
