import { ListaInstrutores } from "@/components/lista-instrutores";
import { listarInstrutoresComUso } from "@/lib/queries";

export const metadata = { title: "Instrutores · Painel DigitalEduca" };

export default async function PaginaInstrutores() {
  const instrutores = await listarInstrutoresComUso();

  const semFormacao = instrutores.filter((i) => !i.formacao?.trim()).length;

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h1 className="text-texto text-2xl font-semibold">Instrutores</h1>
        <p className="text-texto-3 mt-0.5 text-sm">
          {instrutores.length}{" "}
          {instrutores.length === 1 ? "cadastrado" : "cadastrados"}
        </p>
      </div>

      {semFormacao > 0 && (
        <p className="border-aviso/40 bg-aviso/10 text-texto-2 rounded-lg border px-3 py-2.5 text-sm">
          {semFormacao}{" "}
          {semFormacao === 1
            ? "instrutor está sem formação"
            : "instrutores estão sem formação"}
          . A formação aparece na vitrine pública da plataforma do aluno — quem
          está em branco fica com o espaço vazio lá.
        </p>
      )}

      <ListaInstrutores instrutores={instrutores} />
    </div>
  );
}
