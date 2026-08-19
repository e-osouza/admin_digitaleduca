"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";

const CAMPO =
  "border-borda bg-superficie text-texto placeholder:text-texto-3 focus:border-acento-claro w-full rounded-lg border px-3.5 py-2.5 text-sm outline-none transition-colors";

export function FormularioLogin({ proximo }: { proximo: string }) {
  const router = useRouter();
  const [erro, setErro] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);
  const [senhaVisivel, setSenhaVisivel] = useState(false);

  async function enviar(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    setErro(null);
    setEnviando(true);

    const dados = new FormData(evento.currentTarget);

    try {
      const resposta = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: dados.get("email"),
          senha: dados.get("senha"),
        }),
      });

      if (!resposta.ok) {
        const corpo = (await resposta.json().catch(() => ({}))) as {
          erro?: string;
        };
        setErro(corpo.erro ?? "Não foi possível entrar.");
        setEnviando(false);
        return;
      }

      // `refresh` antes do push: o layout do painel é server component e
      // precisa reler o cookie recém-gravado.
      router.refresh();
      router.push(proximo);
    } catch {
      setErro("Falha de conexão com o servidor.");
      setEnviando(false);
    }
  }

  return (
    <form onSubmit={enviar} className="flex flex-col gap-4" noValidate>
      <label className="flex flex-col gap-1.5">
        <span className="text-texto-2 text-sm font-medium">E-mail</span>
        <input
          type="email"
          name="email"
          required
          autoComplete="username"
          autoFocus
          placeholder="voce@digitaleduca.com.vc"
          className={CAMPO}
        />
      </label>

      <label className="flex flex-col gap-1.5">
        <span className="text-texto-2 text-sm font-medium">Senha</span>
        {/*
          O botão fica DENTRO do label, sobreposto ao campo. `pr-11` reserva a
          faixa dele para que a senha nunca passe por baixo do ícone.
        */}
        <span className="relative block">
          <input
            type={senhaVisivel ? "text" : "password"}
            name="senha"
            required
            autoComplete="current-password"
            className={`${CAMPO} pr-11`}
          />
          <button
            type="button"
            onClick={() => setSenhaVisivel((v) => !v)}
            aria-label={senhaVisivel ? "Ocultar senha" : "Mostrar senha"}
            title={senhaVisivel ? "Ocultar senha" : "Mostrar senha"}
            className="text-texto-3 hover:text-texto absolute top-1/2 right-1 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-md transition-colors"
          >
            <svg
              viewBox="0 0 20 20"
              aria-hidden="true"
              className="h-5 w-5"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.6"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M1.8 10S4.8 4.5 10 4.5 18.2 10 18.2 10 15.2 15.5 10 15.5 1.8 10 1.8 10Z" />
              <circle cx="10" cy="10" r="2.4" />
              {senhaVisivel && <path d="m3.5 16.5 13-13" />}
            </svg>
          </button>
        </span>
      </label>

      {erro && (
        <p
          role="alert"
          className="border-alerta/30 bg-alerta/10 text-alerta rounded-lg border px-3 py-2 text-sm"
        >
          {erro}
        </p>
      )}

      <button
        type="submit"
        disabled={enviando}
        className="bg-acento hover:bg-acento-hover mt-1 rounded-lg px-4 py-2.5 text-sm font-semibold text-white transition-colors disabled:opacity-60"
      >
        {enviando ? "Entrando…" : "Entrar"}
      </button>
    </form>
  );
}
