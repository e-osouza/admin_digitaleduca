import { TelaTrilhas } from "@/components/trilhas/tela-trilhas";

export const metadata = { title: "Cursos · Painel DigitalEduca" };

export default async function PaginaCursos({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  return <TelaTrilhas tipo="CURSO" searchParams={await searchParams} />;
}
