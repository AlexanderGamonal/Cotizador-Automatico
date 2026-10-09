export const DEFAULT_RATES = { igv: 0.18, renta: 0.01 };

const round2 = (n) => Math.round((n + Number.EPSILON) * 100) / 100;

/**
 * Calcula el precio de una línea.
 *
 * El margen es sobre el precio de venta (no markup sobre el costo):
 *   precio sin IGV = costo base / (1 - margen - renta)
 * El pago a cuenta de renta se calcula sobre la venta, por eso resta del divisor.
 * Flete y otros gastos van dentro del % de margen.
 */
export function calcProduct(costWithIGV, marginPct, qty, rates = DEFAULT_RATES) {
  const cost = parseFloat(costWithIGV) || 0;
  const margin = (parseFloat(marginPct) || 0) / 100;
  const quantity = parseFloat(qty);

  const costBase = round2(cost / (1 + rates.igv));
  const divisor = 1 - margin - rates.renta;

  let error = null;
  if (margin < 0) error = 'El margen no puede ser negativo.';
  else if (divisor <= 1e-9) {
    error = `Margen + renta (${round2((margin + rates.renta) * 100)}%) debe ser menor a 100%.`;
  } else if (!(quantity >= 1)) error = 'La cantidad debe ser al menos 1.';

  const valid = error === null;
  const qtyUsed = valid ? quantity : 0;

  const finalPrice = valid ? round2((cost / (1 + rates.igv) / divisor) * (1 + rates.igv)) : 0;
  const saleValue = valid ? round2(finalPrice / (1 + rates.igv)) : 0;
  const igvAmount = round2(finalPrice - saleValue);
  const profit = valid ? round2(saleValue * (1 - rates.renta) - costBase) : 0;

  return {
    valid,
    error,
    costBase,
    saleValue,
    igvAmount,
    finalPrice,
    profit,
    realMarginPct: saleValue > 0 ? round2((profit / saleValue) * 100) : 0,
    lineTotal: round2(finalPrice * qtyUsed),
    lineSubtotal: round2(saleValue * qtyUsed),
    lineIgv: round2(igvAmount * qtyUsed),
    lineProfit: round2(profit * qtyUsed),
  };
}

export function calcTotals(rows, rates = DEFAULT_RATES) {
  return rows.reduce(
    (acc, row) => {
      const c = calcProduct(row.costWithIGV, row.margin, row.qty, rates);
      return {
        subtotal: round2(acc.subtotal + c.lineSubtotal),
        igvTotal: round2(acc.igvTotal + c.lineIgv),
        grandTotal: round2(acc.grandTotal + c.lineTotal),
        totalProfit: round2(acc.totalProfit + c.lineProfit),
      };
    },
    { subtotal: 0, igvTotal: 0, grandTotal: 0, totalProfit: 0 }
  );
}

export function fmt(n) {
  return round2(n).toFixed(2);
}
