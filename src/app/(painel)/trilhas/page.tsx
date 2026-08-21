import { TelaTrilhas } from "@/components/trilhas/tela-trilhas";

export const metadata = { title: "Trilhas · Painel DigitalEduca" };

export default async function PaginaTrilhas({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  return <TelaTrilhas tipo="TRILHA" searchParams={await searchParams} />;
}
