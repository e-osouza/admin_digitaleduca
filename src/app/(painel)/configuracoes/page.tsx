import { FormularioConfiguracoes } from "@/components/configuracoes/formulario-configuracoes";
import { dataBR } from "@/lib/formato";
import { obterConfigApp } from "@/lib/queries";

export const metadata = {
  title: "Configurações do app · Painel DigitalEduca",
};

export default async function PaginaConfiguracoes() {
  const config = await obterConfigApp();

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-5">
      <div>
        <h1 className="text-texto text-2xl font-semibold">
          Configurações do app
        </h1>
        <p className="text-texto-3 mt-0.5 text-sm">
          {config
            ? `Alterado em ${dataBR(config.updatedAt)}.`
            : "Ajustes que valem para a plataforma web e para o aplicativo."}
        </p>
      </div>

      {config ? (
        <FormularioConfiguracoes config={config} />
      ) : (
        <p
          role="alert"
          className="border-borda bg-superficie text-texto-2 rounded-xl border p-4 text-sm"
        >
          A configuração não carregou. A rota <code>/app/config</code> exige
          SUPERADMIN — se a sessão expirou, entre de novo.
        </p>
      )}
    </div>
  );
}
