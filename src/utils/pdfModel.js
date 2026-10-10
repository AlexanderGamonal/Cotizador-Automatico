import { calcProduct, calcTotals, fmt, DEFAULT_RATES } from './calculations';
import { dateISO, formatDate } from './dates';

const money = (n) => `S/ ${fmt(n)}`;
const clean = (v) => (typeof v === 'string' ? v.trim() : '');

/**
 * Datos ya formateados para el PDF. Si la cotización está guardada se usan sus
 * valores (número, fechas, condiciones); si no, se previsualiza como BORRADOR.
 */
export function buildPdfModel({ company = {}, client = {}, quote = null, rows, rates = DEFAULT_RATES }) {
  const included = rows.filter((r) => parseFloat(r.costWithIGV) > 0);
  const calcs = included.map((r) => calcProduct(r.costWithIGV, r.margin, r.qty, rates));
  const items = included
    .map((r, i) => ({ r, c: calcs[i] }))
    .filter(({ c }) => c.valid)
    .map(({ r, c }, i) => ({
      n: String(i + 1),
      name: clean(r.name) || `Producto ${i + 1}`,
      qty: String(parseFloat(r.qty)),
      unitValue: money(c.saleValue),
      unitPrice: money(c.finalPrice),
      lineTotal: money(c.lineTotal),
    }));
  const totals = calcTotals(included, rates);

  const validez = Number(company.validez_dias) || 7;
  const number = quote?.number || 'BORRADOR';
  const issue = quote?.issue_date || dateISO();
  const validUntil = quote?.valid_until || dateISO(validez);

  const terms = [
    ['Condiciones de pago', clean(quote ? quote.payment_terms : company.condiciones_pago)],
    ['Tiempo de entrega', clean(quote ? quote.delivery_terms : company.tiempo_entrega)],
    ['Garantía', clean(quote ? quote.warranty : company.garantia)],
  ].filter(([, v]) => v);

  const slug = (clean(client.cliente) || 'cliente').replace(/[^A-Za-z0-9]+/g, '_').replace(/^_|_$/g, '');

  return {
    number,
    isDraft: !quote,
    issueDate: formatDate(issue),
    validUntil: formatDate(validUntil),
    companyName: clean(company.empresa) || 'Mi Empresa',
    companyLines: [
      clean(company.ruc) && `RUC: ${clean(company.ruc)}`,
      clean(company.direccion),
      clean(company.telefono) && `Tel: ${clean(company.telefono)}`,
    ].filter(Boolean),
    client: {
      name: clean(client.cliente) || '—',
      ruc: clean(client.ruc) || '—',
      whatsapp: clean(client.whatsapp).replace(/\D/g, ''),
    },
    items,
    totals: { subtotal: money(totals.subtotal), igv: money(totals.igvTotal), total: money(totals.grandTotal) },
    igvLabel: `IGV (${Math.round(rates.igv * 1000) / 10}%)`,
    terms,
    note: `Precios en Soles (S/). Los precios unitarios incluyen IGV. Cotización válida hasta el ${formatDate(validUntil)}.`,
    filename: `Cotizacion_${number}_${slug}.pdf`,
  };
}
