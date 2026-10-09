import { useCallback, useEffect, useState } from 'react';
import { getQuoteItems, listQuotes, updateQuoteStatus } from '../../services/quotes';
import { fmt } from '../../utils/calculations';
import { formatDate } from '../../utils/dates';
import { newRow } from './rows';

const STATUSES = ['borrador', 'enviada', 'aceptada', 'rechazada'];
const BADGE = {
  borrador: 'bg-slate-100 text-slate-600',
  enviada: 'bg-blue-100 text-blue-700',
  aceptada: 'bg-green-100 text-green-700',
  rechazada: 'bg-red-100 text-red-700',
};

export default function QuoteHistory({ clients, onDuplicate }) {
  const [quotes, setQuotes] = useState([]);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      setQuotes(await listQuotes({ search, status }));
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [search, status]);

  useEffect(() => {
    const t = setTimeout(load, 250);
    return () => clearTimeout(t);
  }, [load]);

  async function changeStatus(id, next) {
    const prev = quotes;
    setQuotes((qs) => qs.map((q) => (q.id === id ? { ...q, status: next } : q)));
    try {
      await updateQuoteStatus(id, next);
    } catch (e) {
      setQuotes(prev);
      setError(e.message);
    }
  }

  async function duplicate(q) {
    try {
      const items = await getQuoteItems(q.id);
      const known = clients.find((c) => c.razon_social === q.client_name);
      onDuplicate({
        client: { cliente: q.client_name || '', ruc: q.client_ruc || known?.ruc || '', whatsapp: known?.whatsapp || '' },
        rows: items.map((i) =>
          newRow({
            name: i.name,
            costWithIGV: String(i.cost_with_igv),
            margin: String(i.margin_pct),
            qty: String(i.qty),
          })
        ),
      });
    } catch (e) {
      setError(e.message);
    }
  }

  const statusSelect = (q) => (
    <select
      value={q.status}
      onChange={(e) => changeStatus(q.id, e.target.value)}
      aria-label={`Estado de ${q.number}`}
      className={`text-xs font-semibold rounded-full px-3 py-2 min-h-11 border-0 ${BADGE[q.status]}`}
    >
      {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
    </select>
  );

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-3">
        <input
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar por número o cliente"
          className="flex-1 border border-slate-200 rounded-lg px-3 py-2.5 text-base sm:text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          aria-label="Filtrar por estado"
          className="border border-slate-200 rounded-lg px-3 py-2.5 text-base sm:text-sm bg-white"
        >
          <option value="">Todos los estados</option>
          {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
      </div>

      {error && <p role="alert" className="text-sm text-red-600">{error}</p>}
      {loading && <p className="text-sm text-slate-400">Cargando…</p>}
      {!loading && !error && quotes.length === 0 && (
        <p className="text-sm text-slate-400 text-center py-8">Aún no hay cotizaciones.</p>
      )}

      {/* Móvil: tarjetas */}
      <div className="space-y-3 md:hidden">
        {quotes.map((q) => (
          <div key={q.id} className="bg-white border border-slate-100 rounded-xl p-4 shadow-sm space-y-2">
            <div className="flex justify-between items-start gap-2">
              <div>
                <p className="font-semibold text-slate-800">{q.number}</p>
                <p className="text-sm text-slate-500">{q.client_name || 'Sin cliente'}</p>
              </div>
              <p className="font-bold text-blue-700">S/ {fmt(q.total)}</p>
            </div>
            <p className="text-xs text-slate-400">
              {formatDate(q.issue_date)} · vence {formatDate(q.valid_until)}
            </p>
            <div className="flex items-center justify-between">
              {statusSelect(q)}
              <button type="button" onClick={() => duplicate(q)} className="text-sm text-blue-600 font-medium px-3 min-h-11">
                Duplicar
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Escritorio: tabla */}
      {quotes.length > 0 && (
        <div className="hidden md:block bg-white border border-slate-100 rounded-xl shadow-sm overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-xs uppercase text-slate-500 whitespace-nowrap">
              <tr>
                <th className="text-left px-3 py-3">Número</th>
                <th className="text-left px-3 py-3">Cliente</th>
                <th className="text-left px-3 py-3">Fecha</th>
                <th className="text-right px-3 py-3">Total</th>
                <th className="text-right px-3 py-3">Utilidad</th>
                <th className="px-3 py-3">Estado</th>
                <th className="px-3 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {quotes.map((q) => (
                <tr key={q.id} className="whitespace-nowrap">
                  <td className="px-3 py-2 font-medium">{q.number}</td>
                  <td className="px-3 py-2 text-slate-600">{q.client_name || '—'}</td>
                  <td className="px-3 py-2 text-slate-500">{formatDate(q.issue_date)}</td>
                  <td className="px-3 py-2 text-right font-semibold">S/ {fmt(q.total)}</td>
                  <td className="px-3 py-2 text-right text-slate-500">S/ {fmt(q.total_profit)}</td>
                  <td className="px-3 py-2">{statusSelect(q)}</td>
                  <td className="px-3 py-2 text-right">
                    <button type="button" onClick={() => duplicate(q)} className="text-blue-600 font-medium">Duplicar</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
