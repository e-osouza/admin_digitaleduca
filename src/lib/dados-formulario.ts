/** IDs dos checkboxes marcados com um dado `name`. */
export function idsMarcados(formulario: HTMLFormElement, nome: string) {
  return Array.from(
    formulario.querySelectorAll<HTMLInputElement>(
      `input[name="${nome}"]:checked`,
    ),
  ).map((campo) => Number(campo.value));
}

/** "a, b, ,c" → ["a","b","c"] */
export function separarTags(texto: string) {
  return texto
    .split(",")
    .map((t) => t.trim())
    .filter(Boolean);
}

/** ISO completo → `yyyy-MM-dd`, formato do `<input type="date">`. */
export function paraData(iso: string | null | undefined) {
  return iso ? iso.slice(0, 10) : "";
}
