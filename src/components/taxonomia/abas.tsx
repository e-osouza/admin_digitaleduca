"use client";

import { useState } from "react";
import { CONTROLE } from "@/components/campos-formulario";
import {
  ListaEditavel,
  NovoItem,
  type ItemTaxonomia,
} from "@/components/taxonomia/lista-editavel";
import {
  atualizarSubcategoria,
  criarCategoria,
  criarSubcategoria,
  criarTag,
  excluirCategoria,
  excluirSubcategoria,
  excluirTag,
  renomearCategoria,
  renomearTag,
} from "@/app/(painel)/taxonomia/acoes";

type Categoria = ItemTaxonomia;
type Subcategoria = ItemTaxonomia & { categorias: string[] };

const contarConteudos = (uso: number) =>
  uso === 0 ? "sem conteúdo" : `${uso} ${uso === 1 ? "conteúdo" : "conteúdos"}`;

export function AbaCategorias({ categorias }: { categorias: Categoria[] }) {
  return (
    <div className="flex flex-col gap-4">
      <NovoItem
        rotulo="Criar categoria"
        espaco="Nome da categoria"
        comSlug
        aoCriar={(nome, form) =>
          criarCategoria(
            nome,
            String(new FormData(form).get("slug") ?? "").trim() || undefined,
          )
        }
      />

      <ListaEditavel
        itens={categorias}
        comSlug
        aoRenomear={(id, dados) => renomearCategoria(id, dados)}
        aoExcluir={excluirCategoria}
        rotuloUso={contarConteudos}
        vazio="Nenhuma categoria cadastrada."
        avisoExclusao={(item) =>
          item.uso > 0 ? (
            <>
              <strong>{item.nome}</strong> tem {item.uso}{" "}
              {item.uso === 1 ? "conteúdo" : "conteúdos"}. A API vai recusar a
              exclusão — mova os conteúdos antes.
            </>
          ) : (
            <>
              Excluir <strong>{item.nome}</strong>?
            </>
          )
        }
      />
    </div>
  );
}

export function AbaSubcategorias({
  subcategorias,
  categorias,
}: {
  subcategorias: Subcategoria[];
  categorias: { id: number; nome: string }[];
}) {
  return (
    <div className="flex flex-col gap-4">
      <NovoItem
        rotulo="Criar subcategoria"
        espaco="Nome da subcategoria"
        comSlug
        aoCriar={(nome, formulario) =>
          criarSubcategoria(
            nome,
            Number(new FormData(formulario).get("categoriaId")),
            String(new FormData(formulario).get("slug") ?? "").trim() ||
              undefined,
          )
        }
      >
        <select name="categoriaId" required className={`${CONTROLE} w-auto`}>
          <option value="">Categoria…</option>
          {categorias.map((categoria) => (
            <option key={categoria.id} value={categoria.id}>
              {categoria.nome}
            </option>
          ))}
        </select>
      </NovoItem>

      <ListaEditavel
        itens={subcategorias}
        comSlug
        aoRenomear={(id, dados) => atualizarSubcategoria(id, dados)}
        aoExcluir={excluirSubcategoria}
        extra={(item) =>
          (item as Subcategoria).categorias.join(", ") || "sem categoria"
        }
        rotuloUso={contarConteudos}
        vazio="Nenhuma subcategoria cadastrada."
        avisoExclusao={(item) =>
          item.uso > 0 ? (
            <>
              Excluir <strong>{item.nome}</strong> apaga junto{" "}
              <strong>
                {item.uso} {item.uso === 1 ? "conteúdo" : "conteúdos"}
              </strong>
              , com os vídeos. Não dá para desfazer.
            </>
          ) : (
            <>
              Excluir <strong>{item.nome}</strong>?
            </>
          )
        }
      />
    </div>
  );
}

export function AbaTags({ tags }: { tags: ItemTaxonomia[] }) {
  const [busca, setBusca] = useState("");

  const filtro = busca.trim().toLocaleLowerCase("pt-BR");
  const filtradas = filtro
    ? tags.filter((tag) => tag.nome.toLocaleLowerCase("pt-BR").includes(filtro))
    : tags;

  return (
    <div className="flex flex-col gap-4">
      <NovoItem
        rotulo="Criar tag"
        espaco="Nome da tag"
        comSlug
        aoCriar={(nome, form) =>
          criarTag(
            nome,
            String(new FormData(form).get("slug") ?? "").trim() || undefined,
          )
        }
      />

      {/* São centenas de tags: sem busca a lista é inutilizável. */}
      <input
        type="search"
        value={busca}
        onChange={(evento) => setBusca(evento.target.value)}
        placeholder="Filtrar tags…"
        className={CONTROLE}
      />

      <ListaEditavel
        itens={filtradas}
        comSlug
        aoRenomear={(id, dados) => renomearTag(id, dados)}
        aoExcluir={excluirTag}
        rotuloUso={(uso) =>
          uso === 0 ? "sem uso" : `${uso} ${uso === 1 ? "uso" : "usos"}`
        }
        vazio="Nenhuma tag encontrada."
        avisoExclusao={(item) => (
          <>
            Excluir <strong>{item.nome}</strong>?{" "}
            {item.uso > 0
              ? "Ela sai dos registros que a usam, mas nada é apagado."
              : "Não está em uso."}
          </>
        )}
      />
    </div>
  );
}
