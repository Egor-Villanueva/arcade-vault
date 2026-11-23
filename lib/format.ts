const numberFormatter = new Intl.NumberFormat("es-ES");

/** Único punto de formateo numérico (evita diferencias servidor/cliente). */
export function formatNumber(n: number): string {
  return numberFormatter.format(n);
}
