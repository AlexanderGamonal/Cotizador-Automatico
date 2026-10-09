import { calcProduct, calcTotals } from './calculations';
import { dateISO } from './dates';

/**
 * Convierte el estado del editor en lo que espera cotizador.create_quote.
 * Devuelve { error } si algo no es válido, o { quote, items }.
 */
export function buildQuotePayload({ client, clientId, settings, rows, rates }) {
  const filled = rows
    .map((row, index) => ({ row, index }))
    .filter(({ row }) => parseFloat(row.costWithIGV) > 0 || row.name.trim());

  if (filled.length === 0) return { error: 'Agrega al menos un producto.' };

  const items = [];
  for (const { row, index } of filled) {
    const n = index + 1;
    if (!(parseFloat(row.costWithIGV) > 0)) return { error: `Producto ${n}: ingresa el costo.` };
    const c = calcProduct(row.costWithIGV, row.margin, row.qty, rates);
    if (!c.valid) return { error: `Producto ${n}: ${c.error}` };
    items.push({
      name: row.name.trim() || `Producto ${n}`,
      qty: parseFloat(row.qty),
      cost_with_igv: parseFloat(row.costWithIGV),
      margin_pct: parseFloat(row.margin) || 0,
      renta_rate: rates.renta,
      igv_rate: rates.igv,
      unit_price: c.finalPrice,
      line_total: c.lineTotal,
      line_profit: c.lineProfit,
    });
  }

  const totals = calcTotals(filled.map(({ row }) => row), rates);
  const validez = Number(settings?.validez_dias) || 7;

  return {
    quote: {
      client_id: clientId || null,
      client_name: client.cliente.trim() || null,
      client_ruc: client.ruc.trim() || null,
      client_whatsapp: client.whatsapp.trim() || null,
      status: 'borrador',
      valid_until: dateISO(validez),
      payment_terms: settings?.condiciones_pago || null,
      delivery_terms: settings?.tiempo_entrega || null,
      warranty: settings?.garantia || null,
      subtotal: totals.subtotal,
      igv_total: totals.igvTotal,
      total: totals.grandTotal,
      total_profit: totals.totalProfit,
    },
    items,
  };
}
