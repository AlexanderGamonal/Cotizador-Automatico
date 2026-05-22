const IGV_RATE = 0.18;
const RENTA_RATE = 0.01;

export function calcProduct(costWithIGV, marginPct, qty) {
  const cost = parseFloat(costWithIGV) || 0;
  const margin = parseFloat(marginPct) || 0;
  const quantity = parseFloat(qty) || 1;

  const costBase = cost / (1 + IGV_RATE);
  const saleValue = costBase * (1 + margin / 100 + RENTA_RATE);
  const igvAmount = saleValue * IGV_RATE;
  const finalPrice = saleValue * (1 + IGV_RATE);
  const lineTotal = finalPrice * quantity;

  return { costBase, saleValue, igvAmount, finalPrice, lineTotal };
}

export function calcTotals(rows) {
  return rows.reduce(
    (acc, row) => {
      const { saleValue, igvAmount, lineTotal } = calcProduct(
        row.costWithIGV,
        row.margin,
        row.qty
      );
      return {
        subtotal: acc.subtotal + saleValue * (parseFloat(row.qty) || 1),
        igvTotal: acc.igvTotal + igvAmount * (parseFloat(row.qty) || 1),
        grandTotal: acc.grandTotal + lineTotal,
      };
    },
    { subtotal: 0, igvTotal: 0, grandTotal: 0 }
  );
}

export function fmt(n) {
  return (Math.round(n * 100) / 100).toFixed(2);
}
