export type ItemNav = {
  href: string;
  rotulo: string;
  /** Traçado do ícone, desenhado num viewBox 0 0 20 20. */
  icone: React.ReactNode;
  /**
   * Telas ainda não implementadas aparecem desabilitadas em vez de dar 404.
   * O menu completo desde o começo mostra o escopo e evita navegação quebrada
   * durante o desenvolvimento.
   */
  pronta?: boolean;
};

export type GrupoNav = {
  titulo: string | null;
  itens: ItemNav[];
};

/**
 * Navegação do painel. A ordem reflete a frequência de uso esperada:
 * conteúdo no topo (é o trabalho do dia a dia), sistema no fim.
 */
export const GRUPOS: GrupoNav[] = [
  {
    titulo: null,
    itens: [
      {
        href: "/",
        rotulo: "Dashboard",
        pronta: true,
        icone: <path d="M3 17V9M8 17V4M13 17v-6M18 17V7" />,
      },
      {
        href: "/estatisticas",
        rotulo: "Estatísticas",
        pronta: true,
        icone: (
          <>
            <path d="M3 16.5h14" />
            <path d="M4.5 13.5 8 9l3.5 3 5-6.5" />
            <circle cx="8" cy="9" r="1" />
            <circle cx="11.5" cy="12" r="1" />
          </>
        ),
      },
    ],
  },
  {
    titulo: "Conteúdo",
    itens: [
      {
        href: "/cursos",
        rotulo: "Cursos",
        pronta: true,
        icone: (
          <>
            <path d="M3.5 5.5A1.5 1.5 0 0 1 5 4h4.5v12H5a1.5 1.5 0 0 0-1.5 1.5v-12Z" />
            <path d="M16.5 5.5A1.5 1.5 0 0 0 15 4h-4.5v12H15a1.5 1.5 0 0 1 1.5 1.5v-12Z" />
          </>
        ),
      },
      {
        href: "/trilhas",
        rotulo: "Trilhas",
        pronta: true,
        icone: (
          <>
            <circle cx="5" cy="5" r="2" />
            <circle cx="15" cy="15" r="2" />
            <path d="M7 5h4a3 3 0 0 1 0 6H9a3 3 0 0 0 0 6h4" />
          </>
        ),
      },
      {
        href: "/conteudos",
        rotulo: "MasterClass",
        pronta: true,
        icone: (
          <>
            <rect x="2.5" y="4" width="15" height="12" rx="1.5" />
            <path d="m8.5 8 4 2-4 2V8Z" />
          </>
        ),
      },
      {
        href: "/podcasts",
        rotulo: "Podcasts",
        pronta: true,
        icone: (
          <>
            <rect x="7.5" y="2.5" width="5" height="9" rx="2.5" />
            <path d="M4.5 9.5a5.5 5.5 0 0 0 11 0M10 15v2.5" />
          </>
        ),
      },
      {
        href: "/taxonomia",
        rotulo: "Categorias e tags",
        pronta: true,
        icone: (
          <>
            <path d="M3 3.5h6l8 8-5.5 5.5-8-8v-5.5Z" />
            <circle cx="6.2" cy="6.7" r="1" />
          </>
        ),
      },
    ],
  },
  {
    titulo: "Pessoas",
    itens: [
      {
        href: "/instrutores",
        rotulo: "Instrutores",
        pronta: true,
        icone: (
          <>
            <circle cx="10" cy="6.5" r="3" />
            <path d="M3.5 17c0-3.3 2.9-5.5 6.5-5.5s6.5 2.2 6.5 5.5" />
          </>
        ),
      },
      {
        href: "/usuarios",
        rotulo: "Usuários",
        pronta: true,
        icone: (
          <>
            <circle cx="7.5" cy="6.5" r="2.6" />
            <path d="M2 16.5c0-2.8 2.5-4.6 5.5-4.6s5.5 1.8 5.5 4.6" />
            <path d="M13.5 5.2a2.6 2.6 0 0 1 0 5M15 11.6c1.9.5 3 1.9 3 4" />
          </>
        ),
      },
    ],
  },
  {
    titulo: "Comercial",
    itens: [
      {
        href: "/planos",
        rotulo: "Planos",
        pronta: true,
        icone: (
          <>
            <path d="M2.5 7.5h15M2.5 7.5A1.5 1.5 0 0 1 4 6h12a1.5 1.5 0 0 1 1.5 1.5v7A1.5 1.5 0 0 1 16 16H4a1.5 1.5 0 0 1-1.5-1.5v-7Z" />
            <path d="M5.5 12h3" />
          </>
        ),
      },
      {
        href: "/cupons",
        rotulo: "Cupons",
        pronta: true,
        icone: (
          <>
            <path d="M3 6.5A1.5 1.5 0 0 1 4.5 5h11A1.5 1.5 0 0 1 17 6.5V8a2 2 0 0 0 0 4v1.5a1.5 1.5 0 0 1-1.5 1.5h-11A1.5 1.5 0 0 1 3 13.5V12a2 2 0 0 0 0-4V6.5Z" />
            <path d="m8.5 11.5 3-3" />
          </>
        ),
      },
    ],
  },
  {
    titulo: "Comunicação",
    itens: [
      {
        href: "/propagandas",
        rotulo: "Propagandas",
        pronta: true,
        icone: (
          <>
            <path d="M4 8v4a1 1 0 0 0 1 1h2l5 3.5V4.5L7 8H5a1 1 0 0 0-1 1Z" />
            <path d="M15 7.5a4 4 0 0 1 0 5" />
          </>
        ),
      },
      {
        href: "/push",
        rotulo: "Notificações",
        pronta: true,
        icone: (
          <>
            <path d="M6 8.5a4 4 0 0 1 8 0c0 3 1 4.5 1.5 5h-11C5 13 6 11.5 6 8.5Z" />
            <path d="M8.5 16a1.7 1.7 0 0 0 3 0" />
          </>
        ),
      },
    ],
  },
  {
    titulo: "Sistema",
    itens: [
      {
        href: "/configuracoes",
        rotulo: "Configurações do app",
        pronta: true,
        icone: (
          <>
            <circle cx="10" cy="10" r="2.5" />
            <path d="M10 2.5v2M10 15.5v2M17.5 10h-2M4.5 10h-2M15.3 4.7l-1.4 1.4M6.1 13.9l-1.4 1.4M15.3 15.3l-1.4-1.4M6.1 6.1 4.7 4.7" />
          </>
        ),
      },
    ],
  },
];
