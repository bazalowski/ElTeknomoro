// 12 retratos placeholder. IDs neutros (sin género/edad/etnia) para no fijar
// sesgo antes de tener arte real. En H9 se sustituye `placeholder_color` por
// la ruta al asset definitivo, manteniendo los mismos `id`.
//
// Paleta: 12 hues equidistantes en HSL (cada 30°), saturación 65%, luminancia
// 50%. Alto contraste entre vecinos y aceptable accesibilidad de etiqueta sobre
// fondo. La UI pinta un cuadrado del color + el `label` ("01"..."12") encima.

export interface PortraitDefinition {
  id: string;
  // Etiqueta visible mientras el placeholder está activo. En H9 puede vaciarse.
  label: string;
  // Color HSL de relleno del placeholder. Se reemplaza por `asset_path` cuando
  // exista arte real (H9). Conservar siempre uno de los dos.
  placeholder_color: string;
  // Reservado para H9: ruta al asset (PNG/SVG). Vacío en H2.
  asset_path: string;
}

function buildPortrait(index: number): PortraitDefinition {
  const hue = (index - 1) * 30; // 0, 30, 60, ..., 330
  const num = String(index).padStart(2, '0');
  return {
    id: `portrait_${num}`,
    label: num,
    placeholder_color: `hsl(${hue}, 65%, 50%)`,
    asset_path: '',
  };
}

export const PORTRAITS: readonly PortraitDefinition[] = Array.from({ length: 12 }, (_, i) =>
  buildPortrait(i + 1),
);

export const PORTRAITS_BY_ID: Readonly<Record<string, PortraitDefinition>> =
  Object.fromEntries(PORTRAITS.map((p) => [p.id, p]));
