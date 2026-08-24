import { TelaNovoConteudo } from "@/components/conteudos/tela-novo";

export const metadata = { title: "Nova MasterClass · Painel DigitalEduca" };

export default async function Pagina() {
  return <TelaNovoConteudo tipo="AULA" />;
}
