import { calcTotals, fmt } from '../utils/calculations';
import { buildPdfModel } from '../utils/pdfModel';
import { downloadPDF, sharePDF } from '../utils/pdfGenerator';

const IconWhatsApp = () => (
  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
  </svg>
);

const btn = 'flex-1 whitespace-nowrap flex items-center justify-center gap-2 font-semibold py-3 px-4 rounded-xl transition text-sm min-h-12 disabled:bg-slate-200 disabled:text-slate-400';

export default function TotalsBar({ rows, client, company, rates, saved, saving, error, onSave }) {
  const { subtotal, igvTotal, grandTotal } = calcTotals(rows, rates);
  const hasRows = rows.some((r) => parseFloat(r.costWithIGV) > 0);
  const total = saved ? saved.total : grandTotal;

  const pdfModel = () => buildPdfModel({ company, client, quote: saved, rows, rates });

  async function handleWhatsApp() {
    const num = client.whatsapp.replace(/\D/g, '');
    const msg =
      `Hola ${client.cliente || 'estimado cliente'}, le saluda ${company.empresa || 'nuestra empresa'}.\n` +
      `Adjunto encontrará la cotización${saved ? ` ${saved.number}` : ''} solicitada.\n` +
      `*Total: S/ ${fmt(total)}*\n` +
      `Quedo a su disposición para cualquier consulta. ¡Que tenga un excelente día!`;
    // En celular se comparte el PDF directamente; si no es posible, se abre el chat con el texto.
    if (await sharePDF(pdfModel(), msg)) return;
    if (!num) {
      alert('Ingresa el número de WhatsApp del cliente.');
      return;
    }
    window.open(`https://wa.me/${num}?text=${encodeURIComponent(msg)}`, '_blank');
  }

  function handlePDF() {
    downloadPDF(pdfModel());
  }

  return (
    <div className="fixed bottom-0 inset-x-0 z-10 sm:static bg-white sm:rounded-2xl shadow-[0_-4px_12px_rgba(0,0,0,0.06)] sm:shadow-sm border-t sm:border border-slate-100 p-3 sm:p-5">
      <div className="flex items-end justify-between sm:justify-end sm:gap-8 mb-3">
        <div className="hidden sm:block text-right">
          <p className="text-xs text-slate-400 uppercase tracking-wide">Subtotal</p>
          <p className="text-lg font-semibold text-slate-700">S/ {fmt(subtotal)}</p>
        </div>
        <div className="hidden sm:block text-right">
          <p className="text-xs text-slate-400 uppercase tracking-wide">IGV ({Math.round(rates.igv * 100)}%)</p>
          <p className="text-lg font-semibold text-slate-700">S/ {fmt(igvTotal)}</p>
        </div>
        <div className="text-left sm:text-right">
          <p className="text-xs text-slate-400 uppercase tracking-wide">
            Total{saved ? ` · ${saved.number}` : ''}
          </p>
          <p className="text-xl sm:text-2xl font-bold text-blue-700">S/ {fmt(total)}</p>
        </div>
      </div>

      {error && <p role="alert" className="text-sm text-red-600 mb-2">{error}</p>}

      <div className="flex gap-2 sm:gap-3">
        <button type="button" onClick={onSave} disabled={!hasRows || saving || Boolean(saved)} className={`${btn} bg-slate-800 hover:bg-slate-900 text-white`}>
          {saving ? 'Guardando…' : saved ? 'Guardada' : 'Guardar'}
        </button>
        <button type="button" onClick={handlePDF} disabled={!hasRows} className={`${btn} bg-blue-600 hover:bg-blue-700 text-white`}>
          PDF
        </button>
        <button type="button" onClick={handleWhatsApp} disabled={!hasRows} className={`${btn} bg-green-500 hover:bg-green-600 text-white`}>
          <IconWhatsApp /> <span className="hidden min-[400px]:inline">WhatsApp</span>
        </button>
      </div>
    </div>
  );
}
