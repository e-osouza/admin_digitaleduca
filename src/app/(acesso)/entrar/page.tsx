import { redirect } from "next/navigation";
import { FormularioLogin } from "@/components/formulario-login";
import { Marca } from "@/components/marca";
import { estaAutenticado } from "@/lib/session";

export const metadata = { title: "Entrar · Painel DigitalEduca" };

/**
 * Motivos de redirecionamento vindos do proxy e do layout do painel. Sem isto,
 * quem era expulso por sessão expirada voltava para um formulário mudo, sem
 * saber por que tinha caído.
 */
const MOTIVOS: Record<string, string> = {
  "sessao-expirada": "Sua sessão expirou. Entre novamente para continuar.",
  "sem-permissao": "Esta conta não tem acesso ao painel administrativo.",
};

export default async function PaginaEntrar({
  searchParams,
}: {
  searchParams: Promise<{ proximo?: string; motivo?: string }>;
}) {
  if (await estaAutenticado()) redirect("/");

  const { proximo, motivo } = await searchParams;

  /*
   * Só aceitamos caminho interno como destino pós-login. Sem isso, um link
   * com `?proximo=https://…` transformaria o painel em redirecionador aberto.
   */
  const destino =
    proximo?.startsWith("/") && !proximo.startsWith("//") ? proximo : "/";

  const aviso = motivo ? MOTIVOS[motivo] : null;

  return (
    <main className="bg-fundo flex min-h-dvh items-center justify-center p-6">
      <div className="w-full max-w-sm">
        <div className="border-borda-suave bg-superficie rounded-2xl border p-8 shadow-sm sm:p-9">
          {/* Marca centrada: `justify-center` porque o componente renderiza
              duas imagens irmãs (clara e escura), sem elemento envolvente. */}
          <div className="mb-7 flex justify-center">
            <Marca altura={32} />
          </div>

          <div className="mb-6 text-center">
            <h1 className="text-texto text-xl font-semibold">
              Painel administrativo
            </h1>
            <p className="text-texto-3 mt-1.5 text-sm">
              Acesso restrito à equipe.
            </p>
          </div>

          {aviso && (
            <p
              role="status"
              className="border-borda bg-superficie-2 text-texto-2 mb-5 rounded-lg border px-3 py-2.5 text-sm"
            >
              {aviso}
            </p>
          )}

          <FormularioLogin proximo={destino} />
        </div>
      </div>
    </main>
  );
}
