import { describe, it, expect } from 'vitest';
import { buildQuotePayload } from './quotePayload';

const rates = { igv: 0.18, renta: 0.01 };
const client = { cliente: ' ACME SAC ', ruc: '20123456789', whatsapp: '51999888777' };
const row = (o = {}) => ({ id: 1, name: 'Laptop', costWithIGV: '118', margin: '20', qty: '1', ...o });

describe('buildQuotePayload', () => {
  it('arma cotización e ítems con los totales calculados', () => {
    const r = buildQuotePayload({ client, settings: { validez_dias: 7 }, rows: [row(), row({ id: 2, name: 'Mouse', costWithIGV: '59', qty: '2' })], rates });
    expect(r.error).toBeUndefined();
    expect(r.items).toHaveLength(2);
    expect(r.items[0]).toMatchObject({ name: 'Laptop', unit_price: 149.37, line_total: 149.37, renta_rate: 0.01, igv_rate: 0.18 });
    expect(r.quote.client_name).toBe('ACME SAC');
    expect(r.quote.total).toBe(r.items.reduce((s, i) => Math.round((s + i.line_total) * 100) / 100, 0));
    expect(Math.round((r.quote.subtotal + r.quote.igv_total) * 100) / 100).toBe(r.quote.total);
    expect(r.quote.valid_until).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  it('ignora filas totalmente vacías', () => {
    const r = buildQuotePayload({ client, settings: {}, rows: [row(), row({ id: 2, name: '', costWithIGV: '', margin: '' })], rates });
    expect(r.items).toHaveLength(1);
  });

  it('error si no hay productos', () => {
    const r = buildQuotePayload({ client, settings: {}, rows: [row({ name: '', costWithIGV: '' })], rates });
    expect(r.error).toMatch(/al menos un producto/);
  });

  it('error con número de producto si falta costo o el margen es inválido', () => {
    expect(buildQuotePayload({ client, settings: {}, rows: [row(), row({ id: 2, costWithIGV: '' })], rates }).error).toMatch(/Producto 2: ingresa el costo/);
    expect(buildQuotePayload({ client, settings: {}, rows: [row({ margin: '99' })], rates }).error).toMatch(/Producto 1/);
  });

  it('usa validez por defecto de 7 días y deja vacíos los campos opcionales', () => {
    const r = buildQuotePayload({ client: { cliente: '', ruc: '', whatsapp: '' }, settings: undefined, rows: [row()], rates });
    expect(r.quote.client_name).toBeNull();
    expect(r.quote.payment_terms).toBeNull();
  });
});
