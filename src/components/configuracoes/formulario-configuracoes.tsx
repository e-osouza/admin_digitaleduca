"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { salvarConfigApp } from "@/app/(painel)/configuracoes/acoes";
import {
  BOTAO_PRIMARIO,
  Campo,
  CONTROLE,
  Secao,
} from "@/components/campos-formulario";
import type { ConfigApp } from "@/types/api";

/**
 * Configuração da plataforma.
 *
 * Duas seções com pesos muito diferentes: o carrossel da home é reversível a
 * qualquer momento; a versão mínima do app **tranca fora** todo mundo que
 * ainda não atualizou. Por isso a segunda seção avisa em voz alta, e o
 * formulário confere sozinho a combinação que quebra na prática — exigir
 * atualização sem ter o link da loja para onde mandar a pessoa.
 */
export function FormularioConfiguracoes({ config }: { config: ConfigApp }) {
  const router = useRouter();

  const [erro, setErro] = useState<string | null>(null);
  const [salvo, setSalvo] = useState(false);
  const [salvando, setSalvando] = useState(false);

  const [slide, setSlide] = useState(config.slideDestaqueAtivo);
  const [buildAndroid, setBuildAndroid] = useState(
    String(config.minBuildAndroid),
  );
  const [buildIos, setBuildIos] = useState(String(config.minBuildIos));
  const [urlAndroid, setUrlAndroid] = useState(config.storeUrlAndroid ?? "");
  const [urlIos, setUrlIos] = useState(config.storeUrlIos ?? "");

  /* Exigir atualização sem link de loja deixa o usuário numa tela sem saída. */
  const semSaidaAndroid = Number(buildAndroid) > 0 && urlAndroid === "";
  const semSaidaIos = Number(buildIos) > 0 && urlIos === "";

  async function salvar(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    setErro(null);
    setSalvo(false);
    setSalvando(true);

    const resultado = await salvarConfigApp(new FormData(evento.currentTarget));
    setSalvando(false);

    if (!resultado.ok) {
      setErro(resultado.erro);
      return;
    }

    setSalvo(true);
    router.refresh();
  }

  return (
    <form onSubmit={salvar} className="flex flex-col gap-5">
      <Secao
        titulo="Página inicial"
        ajuda="Vale para a plataforma web e para o aplicativo."
      >
        <label className="flex items-start gap-3">
          <input
            type="checkbox"
            name="slideDestaqueAtivo"
            checked={slide}
            onChange={(e) => setSlide(e.target.checked)}
            className="accent-acento mt-0.5 size-4"
          />
          <span className="flex flex-col">
            <span className="text-texto text-sm font-medium">
              Mostrar o slide de destaque no topo
            </span>
            <span className="text-texto-3 text-xs">
              O carrossel com os até 3 conteúdos marcados como destaque.
              Desligado, a home abre direto nos trilhos de conteúdo.
            </span>
          </span>
        </label>

        {/*
          Sem este aviso, alguém tentaria esconder o slide desmarcando os
          destaques um por um — e ele continuaria lá, com outro conteúdo.
        */}
        {slide && (
          <p className="border-borda-suave bg-superficie-2/50 text-texto-3 rounded-lg border p-3 text-xs">
            Quando nenhum conteúdo está marcado como destaque, o slide se
            preenche sozinho com os mais assistidos — ele só some de fato
            desmarcando esta opção.
          </p>
        )}
      </Secao>

      <Secao
        titulo="Atualização obrigatória do app"
        ajuda="Usuários com build menor que o mínimo são bloqueados e enviados para a loja. Deixe 0 para não exigir nada."
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <Campo
            rotulo="Build mínimo · Android"
            ajuda="0 desliga a obrigatoriedade."
          >
            <input
              name="minBuildAndroid"
              type="number"
              min={0}
              value={buildAndroid}
              onChange={(e) => setBuildAndroid(e.target.value)}
              className={CONTROLE}
            />
          </Campo>

          <Campo rotulo="Build mínimo · iOS" ajuda="0 desliga a obrigatoriedade.">
            <input
              name="minBuildIos"
              type="number"
              min={0}
              value={buildIos}
              onChange={(e) => setBuildIos(e.target.value)}
              className={CONTROLE}
            />
          </Campo>

          <Campo rotulo="Link da Play Store">
            <input
              name="storeUrlAndroid"
              type="url"
              value={urlAndroid}
              onChange={(e) => setUrlAndroid(e.target.value)}
              placeholder="https://play.google.com/store/apps/details?id=…"
              className={CONTROLE}
            />
          </Campo>

          <Campo rotulo="Link da App Store">
            <input
              name="storeUrlIos"
              type="url"
              value={urlIos}
              onChange={(e) => setUrlIos(e.target.value)}
              placeholder="https://apps.apple.com/br/app/…"
              className={CONTROLE}
            />
          </Campo>
        </div>

        <Campo
          rotulo="Mensagem da tela de atualização"
          ajuda="Opcional. Em branco, o app usa o texto padrão dele."
        >
          <textarea
            name="mensagemUpdate"
            rows={3}
            defaultValue={config.mensagemUpdate ?? ""}
            className={CONTROLE}
            placeholder="Temos novidades esperando por você! Atualize para continuar."
          />
        </Campo>

        {(semSaidaAndroid || semSaidaIos) && (
          <p
            role="alert"
            className="border-aviso/40 bg-aviso/10 text-aviso rounded-lg border px-4 py-3 text-sm"
          >
            {semSaidaAndroid && semSaidaIos
              ? "Android e iOS exigem atualização, mas nenhum dos dois tem link de loja."
              : semSaidaAndroid
                ? "O Android exige atualização e não tem link da Play Store."
                : "O iOS exige atualização e não tem link da App Store."}{" "}
            Quem for bloqueado vai parar numa tela sem botão para sair.
          </p>
        )}
      </Secao>

      {erro && (
        <p
          role="alert"
          className="border-alerta/40 bg-alerta/10 text-alerta rounded-lg border px-4 py-3 text-sm"
        >
          {erro}
        </p>
      )}

      <div className="flex items-center justify-end gap-3">
        {salvo && !salvando && (
          <span role="status" className="text-sucesso text-sm font-medium">
            Configuração salva.
          </span>
        )}
        <button type="submit" disabled={salvando} className={BOTAO_PRIMARIO}>
          {salvando ? "Salvando…" : "Salvar configuração"}
        </button>
      </div>
    </form>
  );
}
