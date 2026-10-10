import { useState } from 'react';
import ClientSection from '../../components/ClientSection';
import ProductRow from '../../components/ProductRow';
import TotalsBar from '../../components/TotalsBar';
import { buildQuotePayload } from '../../utils/quotePayload';
import { saveQuote } from '../../services/quotes';
import { ensureClient } from '../../services/clients';
import { addProduct } from '../../services/products';
import { emptyClient, newRow } from './rows';

export default function QuoteEditor({ initial, settings, rates, clients, products, onClientsChange, onProductsChange, onSaved }) {
  const [client, setClient] = useState(initial?.client ?? emptyClient);
  const [rows, setRows] = useState(initial?.rows ?? [newRow()]);
  const [saved, setSaved] = useState(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  // Cualquier cambio vuelve la cotización a "sin guardar".
  const touch = () => {
    setSaved(null);
    setError('');
  };

  function handleClientChange(key, value) {
    touch();
    setClient((prev) => {
      const next = { ...prev, [key]: value };
      if (key === 'cliente') {
        const match = clients.find((c) => c.razon_social.toLowerCase() === value.trim().toLowerCase());
        if (match) {
          next.ruc = prev.ruc || match.ruc || '';
          next.whatsapp = prev.whatsapp || match.whatsapp || '';
        }
      }
      return next;
    });
  }

  function handleRowChange(index, key, value) {
    touch();
    setRows((prev) =>
      prev.map((r, i) => {
        if (i !== index) return r;
        const next = { ...r, [key]: value };
        if (key === 'name') {
          const match = products.find((p) => p.name.toLowerCase() === value.trim().toLowerCase());
          if (match && !r.costWithIGV && !r.margin) {
            next.costWithIGV = String(match.cost_with_igv);
            next.margin = String(match.default_margin_pct);
          }
        }
        return next;
      })
    );
  }

  function addRow() {
    setRows((prev) => [...prev, newRow()]);
  }

  function removeRow(index) {
    touch();
    setRows((prev) => (prev.length > 1 ? prev.filter((_, i) => i !== index) : prev));
  }

  async function handleSaveCatalog(index) {
    const r = rows[index];
    const cost = parseFloat(r.costWithIGV);
    if (!r.name.trim() || !(cost > 0)) {
      setError('Para guardar en el catálogo ingresa nombre y costo.');
      return;
    }
    try {
      const p = await addProduct({
        name: r.name.trim(),
        cost_with_igv: cost,
        default_margin_pct: parseFloat(r.margin) || 20,
      });
      onProductsChange([...products, p]);
      setNotice(`"${p.name}" guardado en el catálogo.`);
      setError('');
    } catch (e) {
      setError(e.message);
    }
  }

  async function handleSave() {
    setError('');
    const built = buildQuotePayload({ client, settings, rows, rates });
    if (built.error) {
      setError(built.error);
      return;
    }
    setSaving(true);
    try {
      const c = await ensureClient(client, clients);
      if (c && !clients.some((k) => k.id === c.id)) onClientsChange([...clients, c]);
      const q = await saveQuote({ ...built.quote, client_id: c?.id ?? null }, built.items);
      setSaved(q);
      setNotice('');
      onSaved?.(q);
    } catch (e) {
      setError(`No se pudo guardar: ${e.message}`);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-5 pb-44 sm:pb-0">
      <datalist id="clients-list">
        {clients.map((c) => <option key={c.id} value={c.razon_social} />)}
      </datalist>
      <datalist id="products-list">
        {products.map((p) => <option key={p.id} value={p.name} />)}
      </datalist>

      <ClientSection data={client} onChange={handleClientChange} />

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-semibold text-slate-700">Productos</h2>
          <span className="text-xs text-slate-400">
            {rows.length} {rows.length === 1 ? 'ítem' : 'ítems'}
          </span>
        </div>

        {rows.map((row, i) => (
          <ProductRow
            key={row.id}
            row={row}
            index={i}
            rates={rates}
            canRemove={rows.length > 1}
            canSaveCatalog={Boolean(row.name.trim()) && !products.some((p) => p.name.toLowerCase() === row.name.trim().toLowerCase())}
            onChange={handleRowChange}
            onRemove={removeRow}
            onSaveCatalog={handleSaveCatalog}
          />
        ))}

        <button
          type="button"
          onClick={addRow}
          className="w-full border-2 border-dashed border-slate-200 hover:border-blue-400 hover:bg-blue-50 text-slate-400 hover:text-blue-500 rounded-xl py-3 min-h-12 text-sm font-medium transition flex items-center justify-center gap-2"
        >
          <span className="text-lg leading-none">+</span> Agregar producto
        </button>
      </div>

      {notice && <p className="text-sm text-green-700 bg-green-50 rounded-lg px-3 py-2">{notice}</p>}

      <TotalsBar
        rows={rows}
        client={client}
        company={settings}
        rates={rates}
        saved={saved}
        saving={saving}
        error={error}
        onSave={handleSave}
      />

      <div className="bg-blue-50 border border-blue-100 rounded-xl px-4 py-3 text-xs text-blue-700 space-y-1">
        <p className="font-semibold">Cómo se calcula el precio:</p>
        <p>1. Costo base = Costo con IGV / {(1 + rates.igv).toFixed(2)} (se quita el IGV pagado)</p>
        <p>2. Precio sin IGV = Costo base / (1 − Margen% − {(rates.renta * 100).toFixed(1)}% renta)</p>
        <p>3. Precio final = Precio sin IGV × {(1 + rates.igv).toFixed(2)} (se agrega el IGV de venta)</p>
        <p className="text-blue-500">El margen es sobre el precio de venta. Incluye flete y otros gastos.</p>
      </div>
    </div>
  );
}
