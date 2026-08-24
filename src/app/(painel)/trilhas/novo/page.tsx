import { TelaNovoConteudo } from "@/components/conteudos/tela-novo";

export const metadata = { title: "Nova trilha · Painel DigitalEduca" };

export default async function Pagina() {
  return <TelaNovoConteudo tipo="TRILHA" />;
}
