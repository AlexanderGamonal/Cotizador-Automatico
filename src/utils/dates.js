const pad = (n) => String(n).padStart(2, '0');

// YYYY-MM-DD en hora local, sumando `days` días.
export function dateISO(days = 0, from = new Date()) {
  const d = new Date(from.getFullYear(), from.getMonth(), from.getDate() + days);
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

// "2026-10-09" -> "09/10/2026" (sin pasar por Date para evitar desfases de zona horaria)
export function formatDate(iso) {
  if (!iso) return '—';
  const [y, m, d] = iso.slice(0, 10).split('-');
  return `${d}/${m}/${y}`;
}
