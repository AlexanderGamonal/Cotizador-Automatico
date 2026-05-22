import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { calcProduct, calcTotals, fmt } from './calculations';

export function generatePDF({ empresa, cliente, ruc, whatsapp, rows }) {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const totals = calcTotals(rows);
  const today = new Date().toLocaleDateString('es-PE', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });

  // ── Header background strip ──────────────────────────────────────────────
  doc.setFillColor(37, 99, 235);
  doc.rect(0, 0, 210, 32, 'F');

  // Company name
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.text(empresa || 'Mi Empresa', 14, 13);

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text('COTIZACIÓN', 14, 20);

  // Date on the right
  doc.setFontSize(9);
  doc.text(`Fecha: ${today}`, 196, 13, { align: 'right' });

  // ── Client info box ──────────────────────────────────────────────────────
  doc.setFillColor(241, 245, 249);
  doc.roundedRect(14, 37, 182, 22, 2, 2, 'F');

  doc.setTextColor(51, 65, 85);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.text('DATOS DEL CLIENTE', 18, 44);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.text(`Nombre / Razón Social: ${cliente || '—'}`, 18, 51);
  doc.text(`RUC / DNI: ${ruc || '—'}`, 120, 51);
  if (whatsapp) doc.text(`WhatsApp: +${whatsapp}`, 18, 57);

  // ── Products table ───────────────────────────────────────────────────────
  const tableRows = rows.map((row, i) => {
    const { saleValue, igvAmount, finalPrice, lineTotal } = calcProduct(
      row.costWithIGV,
      row.margin,
      row.qty
    );
    return [
      i + 1,
      row.name || '—',
      parseFloat(row.qty) || 1,
      `S/ ${fmt(saleValue)}`,
      `S/ ${fmt(igvAmount)}`,
      `S/ ${fmt(finalPrice)}`,
      `S/ ${fmt(lineTotal)}`,
    ];
  });

  autoTable(doc, {
    startY: 65,
    head: [['N°', 'Descripción', 'Cant.', 'V.Venta s/IGV', 'IGV (18%)', 'P.Final c/IGV', 'Total']],
    body: tableRows,
    headStyles: {
      fillColor: [37, 99, 235],
      textColor: 255,
      fontStyle: 'bold',
      fontSize: 8.5,
    },
    bodyStyles: { fontSize: 8.5, textColor: [51, 65, 85] },
    alternateRowStyles: { fillColor: [248, 250, 252] },
    columnStyles: {
      0: { halign: 'center', cellWidth: 10 },
      1: { cellWidth: 55 },
      2: { halign: 'center', cellWidth: 14 },
      3: { halign: 'right', cellWidth: 27 },
      4: { halign: 'right', cellWidth: 22 },
      5: { halign: 'right', cellWidth: 28 },
      6: { halign: 'right', cellWidth: 26 },
    },
    margin: { left: 14, right: 14 },
  });

  // ── Totals section ───────────────────────────────────────────────────────
  const finalY = doc.lastAutoTable.finalY + 6;

  autoTable(doc, {
    startY: finalY,
    body: [
      ['Subtotal sin IGV', `S/ ${fmt(totals.subtotal)}`],
      ['IGV (18%)', `S/ ${fmt(totals.igvTotal)}`],
      ['TOTAL GENERAL', `S/ ${fmt(totals.grandTotal)}`],
    ],
    bodyStyles: { fontSize: 9, textColor: [51, 65, 85] },
    columnStyles: {
      0: { cellWidth: 60, fontStyle: 'bold' },
      1: { cellWidth: 30, halign: 'right' },
    },
    margin: { left: 116, right: 14 },
    didParseCell(data) {
      if (data.row.index === 2) {
        data.cell.styles.fillColor = [37, 99, 235];
        data.cell.styles.textColor = [255, 255, 255];
        data.cell.styles.fontStyle = 'bold';
      }
    },
  });

  // ── Footer note ──────────────────────────────────────────────────────────
  const noteY = doc.lastAutoTable.finalY + 10;
  doc.setFontSize(8);
  doc.setTextColor(148, 163, 184);
  doc.text(
    'Precios en Soles (S/). IGV 18% incluido. Esta cotización tiene una validez de 15 días.',
    14,
    noteY
  );

  doc.save(`Cotizacion_${(cliente || 'cliente').replace(/\s+/g, '_')}_${today.replace(/\//g, '-')}.pdf`);
}
