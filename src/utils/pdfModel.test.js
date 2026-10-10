import { describe, it, expect } from 'vitest';
import { buildPdfModel } from './pdfModel';
import { buildPDFDocument } from './pdfGenerator';

const rates = { igv: 0.18, renta: 0.01 };
const rows = [
  { id: 1, name: 'Laptop', costWithIGV: '118', margin: '20', qty: '1' },
  { id: 2, name: '', costWithIGV: '59', margin: '25', qty: '2' },
  { id: 3, name: 'Vacío', costWithIGV: '', margin: '', qty: '1' },
];
const company = { empresa: 'AG Solutions', ruc: '20123456789', direccion: 'Av. Lima 123', telefono: '999', validez_dias: 7, condiciones_pago: 'Contado' };
const client = { cliente: 'ACME S.A.C.', ruc: '20999999999', whatsapp: '+51 999-888-777' };

describe('buildPdfModel', () => {
  it('previsualiza como BORRADOR con condiciones por defecto cuando no hay cotización guardada', () => {
    const m = buildPdfModel({ company, client, quote: null, rows, rates });
    expect(m.number).toBe('BORRADOR');
    expect(m.isDraft).toBe(true);
    expect(m.items).toHaveLength(2); // la fila sin costo se omite
    expect(m.items[0]).toMatchObject({ n: '1', name: 'Laptop', unitValue: 'S/ 126.58', unitPrice: 'S/ 149.37', lineTotal: 'S/ 149.37' });
    expect(m.items[1].name).toBe('Producto 2');
    expect(m.terms).toEqual([['Condiciones de pago', 'Contado']]);
    expect(m.client.whatsapp).toBe('51999888777');
    expect(m.companyLines).toEqual(['RUC: 20123456789', 'Av. Lima 123', 'Tel: 999']);
    expect(m.igvLabel).toBe('IGV (18%)');
  });

  it('usa número, fechas y condiciones guardados en la cotización', () => {
    const quote = { number: 'COT-2026-0007', issue_date: '2026-10-09', valid_until: '2026-10-16', payment_terms: '50% adelanto', delivery_terms: '3 días', warranty: '12 meses' };
    const m = buildPdfModel({ company, client, quote, rows, rates });
    expect(m.number).toBe('COT-2026-0007');
    expect(m.isDraft).toBe(false);
    expect(m.issueDate).toBe('09/10/2026');
    expect(m.validUntil).toBe('16/10/2026');
    expect(m.terms.map(([k]) => k)).toEqual(['Condiciones de pago', 'Tiempo de entrega', 'Garantía']);
    expect(m.terms[0][1]).toBe('50% adelanto');
    expect(m.filename).toBe('Cotizacion_COT-2026-0007_ACME_S_A_C.pdf');
    expect(m.note).toContain('16/10/2026');
  });

  it('subtotal + IGV = total y respeta tasas configuradas', () => {
    const m = buildPdfModel({ company, client, quote: null, rows, rates: { igv: 0.18, renta: 0.015 } });
    const n = (s) => parseFloat(s.replace('S/ ', ''));
    expect(Math.round((n(m.totals.subtotal) + n(m.totals.igv)) * 100) / 100).toBe(n(m.totals.total));
  });

  it('no rompe sin datos de empresa ni cliente', () => {
    const m = buildPdfModel({ rows, rates });
    expect(m.companyName).toBe('Mi Empresa');
    expect(m.client.name).toBe('—');
    expect(m.filename).toMatch(/_cliente\.pdf$/);
  });
});

describe('buildPDFDocument', () => {
  it('genera un PDF válido de una página', () => {
    const doc = buildPDFDocument(buildPdfModel({ company, client, quote: null, rows, rates }));
    const bytes = new Uint8Array(doc.output('arraybuffer'));
    expect(String.fromCharCode(...bytes.slice(0, 5))).toBe('%PDF-');
    expect(doc.getNumberOfPages()).toBe(1);
  });

  it('pagina cuando hay muchos productos', () => {
    const many = Array.from({ length: 60 }, (_, i) => ({ id: i, name: `Producto ${i}`, costWithIGV: '100', margin: '20', qty: '1' }));
    const doc = buildPDFDocument(buildPdfModel({ company, client, quote: null, rows: many, rates }));
    expect(doc.getNumberOfPages()).toBeGreaterThan(1);
  });
});
