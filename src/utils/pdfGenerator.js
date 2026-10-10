import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

const BLUE = [37, 99, 235];
const SLATE = [51, 65, 85];
const MUTED = [148, 163, 184];
const MARGIN = 14;
const PAGE_W = 210;

/** Dibuja el PDF a partir del modelo de pdfModel.js. */
export function buildPDFDocument(model) {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });

  // ── Cabecera ─────────────────────────────────────────────────────────────
  const headerH = model.companyLines.length > 0 ? 38 : 32;
  doc.setFillColor(...BLUE);
  doc.rect(0, 0, PAGE_W, headerH, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(17);
  doc.text(doc.splitTextToSize(model.companyName, 110)[0], MARGIN, 13);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.text('COTIZACIÓN', MARGIN, 20);
  doc.setFontSize(8);
  model.companyLines.slice(0, 3).forEach((line, i) => {
    doc.text(doc.splitTextToSize(line, 110)[0], MARGIN, 26 + i * 4);
  });

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.text(model.number, PAGE_W - MARGIN, 13, { align: 'right' });
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.text(`Fecha: ${model.issueDate}`, PAGE_W - MARGIN, 20, { align: 'right' });
  doc.text(`Válida hasta: ${model.validUntil}`, PAGE_W - MARGIN, 25, { align: 'right' });
  if (model.isDraft) {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.text('BORRADOR (sin guardar)', PAGE_W - MARGIN, 31, { align: 'right' });
  }

  // ── Datos del cliente ────────────────────────────────────────────────────
  const boxY = headerH + 5;
  const hasWhatsapp = Boolean(model.client.whatsapp);
  const boxH = hasWhatsapp ? 24 : 18;
  doc.setFillColor(241, 245, 249);
  doc.roundedRect(MARGIN, boxY, PAGE_W - MARGIN * 2, boxH, 2, 2, 'F');
  doc.setTextColor(...SLATE);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.text('DATOS DEL CLIENTE', MARGIN + 4, boxY + 6);
  doc.setFont('helvetica', 'normal');
  doc.text(doc.splitTextToSize(`Nombre / Razón Social: ${model.client.name}`, 100)[0], MARGIN + 4, boxY + 13);
  doc.text(`RUC / DNI: ${model.client.ruc}`, 126, boxY + 13);
  if (hasWhatsapp) doc.text(`WhatsApp: +${model.client.whatsapp}`, MARGIN + 4, boxY + 19);

  // ── Productos ────────────────────────────────────────────────────────────
  autoTable(doc, {
    startY: boxY + boxH + 6,
    head: [['N°', 'Descripción', 'Cant.', 'V. unit.', 'P. unit. c/ IGV', 'Total']],
    body: model.items.map((i) => [i.n, i.name, i.qty, i.unitValue, i.unitPrice, i.lineTotal]),
    headStyles: { fillColor: BLUE, textColor: 255, fontStyle: 'bold', fontSize: 8.5 },
    bodyStyles: { fontSize: 9, textColor: SLATE },
    alternateRowStyles: { fillColor: [248, 250, 252] },
    columnStyles: {
      0: { halign: 'center', cellWidth: 10 },
      1: { cellWidth: 70 },
      2: { halign: 'center', cellWidth: 16 },
      3: { halign: 'right', cellWidth: 28 },
      4: { halign: 'right', cellWidth: 30 },
      5: { halign: 'right', cellWidth: 28 },
    },
    margin: { left: MARGIN, right: MARGIN },
    didParseCell(data) {
      // El encabezado no hereda la alineación de columnStyles.
      if (data.section === 'head' && data.column.index >= 2) {
        data.cell.styles.halign = data.column.index === 2 ? 'center' : 'right';
      }
    },
  });

  // ── Totales ──────────────────────────────────────────────────────────────
  autoTable(doc, {
    startY: doc.lastAutoTable.finalY + 5,
    body: [
      ['Subtotal', model.totals.subtotal],
      [model.igvLabel, model.totals.igv],
      ['TOTAL', model.totals.total],
    ],
    bodyStyles: { fontSize: 9, textColor: SLATE },
    columnStyles: { 0: { cellWidth: 40, fontStyle: 'bold' }, 1: { cellWidth: 36, halign: 'right' } },
    margin: { left: PAGE_W - MARGIN - 76, right: MARGIN },
    didParseCell(data) {
      if (data.row.index === 2) {
        data.cell.styles.fillColor = BLUE;
        data.cell.styles.textColor = [255, 255, 255];
        data.cell.styles.fontStyle = 'bold';
      }
    },
  });

  // ── Condiciones comerciales ──────────────────────────────────────────────
  if (model.terms.length > 0) {
    autoTable(doc, {
      startY: doc.lastAutoTable.finalY + 8,
      head: [[{ content: 'CONDICIONES COMERCIALES', colSpan: 2 }]],
      body: model.terms,
      theme: 'plain',
      headStyles: { fontStyle: 'bold', fontSize: 9, textColor: SLATE },
      bodyStyles: { fontSize: 9, textColor: SLATE, cellPadding: 1.5 },
      columnStyles: { 0: { cellWidth: 45, fontStyle: 'bold' }, 1: { cellWidth: 137 } },
      margin: { left: MARGIN, right: MARGIN },
    });
  }

  // ── Nota y pie de página ─────────────────────────────────────────────────
  const pages = doc.getNumberOfPages();
  for (let p = 1; p <= pages; p++) {
    doc.setPage(p);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(...MUTED);
    doc.text(model.note, MARGIN, 285);
    doc.text(`Página ${p} de ${pages}`, PAGE_W - MARGIN, 285, { align: 'right' });
  }

  return doc;
}

export function generatePDF(model) {
  const doc = buildPDFDocument(model);
  return { blob: doc.output('blob'), filename: model.filename };
}

export function downloadPDF(model) {
  const { blob, filename } = generatePDF(model);
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 10000);
}

/** En celulares con soporte, abre la hoja de compartir con el PDF adjunto. Devuelve false si no se pudo. */
export async function sharePDF(model, text) {
  if (!navigator.canShare || !window.matchMedia?.('(pointer: coarse)').matches) return false;
  const { blob, filename } = generatePDF(model);
  const file = new File([blob], filename, { type: 'application/pdf' });
  if (!navigator.canShare({ files: [file] })) return false;
  try {
    await navigator.share({ files: [file], title: `Cotización ${model.number}`, text });
    return true;
  } catch (e) {
    if (e.name === 'AbortError') return true; // el usuario cerró la hoja
    return false;
  }
}
