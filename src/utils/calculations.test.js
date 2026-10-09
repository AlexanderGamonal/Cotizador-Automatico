import { describe, it, expect } from 'vitest';
import { calcProduct, calcTotals, fmt } from './calculations';

describe('calcProduct', () => {
  it('calcula con margen sobre precio de venta: costo 118 c/IGV, 20% margen, 1% renta', () => {
    const r = calcProduct('118', '20', '1');
    expect(r.valid).toBe(true);
    expect(r.costBase).toBe(100);
    expect(r.saleValue).toBe(126.58);
    expect(r.finalPrice).toBe(149.37);
    expect(r.igvAmount).toBe(22.79);
    expect(r.profit).toBe(25.31);
    expect(r.realMarginPct).toBeCloseTo(20, 0);
  });

  it('el margen real coincide con el margen pedido (no es markup)', () => {
    const r = calcProduct('1180', '30', '1');
    expect(r.realMarginPct).toBeCloseTo(30, 0);
  });

  it('precio sin IGV + IGV = precio final', () => {
    const r = calcProduct('250.50', '17.5', '3');
    expect(round(r.saleValue + r.igvAmount)).toBe(r.finalPrice);
    expect(r.lineTotal).toBe(round(r.finalPrice * 3));
  });

  it('rechaza margen + renta >= 100%', () => {
    const r = calcProduct('100', '99', '1');
    expect(r.valid).toBe(false);
    expect(r.finalPrice).toBe(0);
    expect(r.error).toMatch(/menor a 100%/);
  });

  it('rechaza margen negativo', () => {
    expect(calcProduct('100', '-5', '1').valid).toBe(false);
  });

  it('rechaza cantidad 0 o vacía en vez de convertirla en 1', () => {
    expect(calcProduct('100', '20', '0').valid).toBe(false);
    expect(calcProduct('100', '20', '').valid).toBe(false);
  });

  it('acepta tasas configurables (RER 1.5%)', () => {
    const r = calcProduct('118', '20', '1', { igv: 0.18, renta: 0.015 });
    expect(r.saleValue).toBeCloseTo(100 / 0.785, 1);
  });

  it('costo vacío da precio 0 sin romper', () => {
    const r = calcProduct('', '20', '1');
    expect(r.finalPrice).toBe(0);
    expect(Number.isFinite(r.lineTotal)).toBe(true);
  });
});

describe('calcTotals', () => {
  it('suma líneas y subtotal + IGV = total', () => {
    const rows = [
      { costWithIGV: '118', margin: '20', qty: '2' },
      { costWithIGV: '59', margin: '25', qty: '3' },
    ];
    const t = calcTotals(rows);
    const a = calcProduct('118', '20', '2');
    const b = calcProduct('59', '25', '3');
    expect(t.grandTotal).toBe(round(a.lineTotal + b.lineTotal));
    expect(round(t.subtotal + t.igvTotal)).toBe(t.grandTotal);
    expect(t.totalProfit).toBe(round(a.lineProfit + b.lineProfit));
  });

  it('ignora filas inválidas en los totales', () => {
    const t = calcTotals([{ costWithIGV: '100', margin: '99', qty: '1' }]);
    expect(t.grandTotal).toBe(0);
  });
});

describe('fmt', () => {
  it('formatea con 2 decimales', () => {
    expect(fmt(149.366)).toBe('149.37');
    expect(fmt(5)).toBe('5.00');
  });
});

function round(n) {
  return Math.round((n + Number.EPSILON) * 100) / 100;
}
