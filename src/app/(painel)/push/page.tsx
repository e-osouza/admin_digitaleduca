import { FormularioPush } from "@/components/formulario-push";
import { obterAlcancePush } from "@/lib/queries";

export const metadata = { title: "Notificações · Painel DigitalEduca" };

export default async function PaginaPush() {
  const alcance = await obterAlcancePush();

  const desligados = [
    !alcance.configurado.mobile && "Firebase (app)",
    !alcance.configurado.web && "VAPID (web)",
  ].filter(Boolean);

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-6">
      <div>
        <h1 className="text-texto text-2xl font-semibold">Notificações</h1>
        <p className="text-texto-3 mt-0.5 text-sm">
          {alcance.total} destinos · {alcance.mobile} no app (
          {alcance.porPlataforma
            .map((p) => `${p.total} ${p.plataforma}`)
            .join(", ") || "nenhum"}
          ) · {alcance.web} na web
        </p>
      </div>

      {desligados.length > 0 && (
        <p className="border-aviso/40 bg-aviso/10 text-texto-2 rounded-lg border px-3 py-2.5 text-sm">
          <strong>{desligados.join(" e ")}</strong>{" "}
          {desligados.length === 1 ? "não está configurado" : "não estão configurados"}{" "}
          neste ambiente. O disparo é aceito e reportado, mas nada sai daqui —
          as integrações de escrita ficam desligadas no staging.
        </p>
      )}

      <FormularioPush alcance={alcance} />
    </div>
  );
}
