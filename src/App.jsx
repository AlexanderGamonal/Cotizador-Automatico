import { useState } from 'react';
import ClientSection from './components/ClientSection';
import ProductRow from './components/ProductRow';
import TotalsBar from './components/TotalsBar';
import './index.css';

const emptyRow = () => ({ name: '', costWithIGV: '', margin: '', qty: '1' });

const defaultClient = { empresa: '', cliente: '', ruc: '', whatsapp: '' };

export default function App() {
  const [client, setClient] = useState(defaultClient);
  const [rows, setRows] = useState([emptyRow()]);

  function handleClientChange(key, value) {
    setClient((prev) => ({ ...prev, [key]: value }));
  }

  function handleRowChange(index, key, value) {
    setRows((prev) => prev.map((r, i) => (i === index ? { ...r, [key]: value } : r)));
  }

  function addRow() {
    setRows((prev) => [...prev, emptyRow()]);
  }

  function removeRow(index) {
    setRows((prev) => (prev.length > 1 ? prev.filter((_, i) => i !== index) : prev));
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 py-8 px-4">
      <div className="max-w-4xl mx-auto space-y-5">

        <div className="text-center space-y-1 pb-2">
          <h1 className="text-2xl font-bold text-slate-800">Cotizador Automático</h1>
          <p className="text-sm text-slate-500">
            Calcula precios con IGV separado y genera tu cotización en PDF
          </p>
        </div>

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
              key={i}
              row={row}
              index={i}
              onChange={handleRowChange}
              onRemove={removeRow}
            />
          ))}

          <button
            onClick={addRow}
            className="w-full border-2 border-dashed border-slate-200 hover:border-blue-400 hover:bg-blue-50 text-slate-400 hover:text-blue-500 rounded-xl py-3 text-sm font-medium transition flex items-center justify-center gap-2"
          >
            <span className="text-lg leading-none">+</span> Agregar producto
          </button>
        </div>

        <TotalsBar rows={rows} client={client} />

        <div className="bg-blue-50 border border-blue-100 rounded-xl px-4 py-3 text-xs text-blue-700 space-y-1">
          <p className="font-semibold">Como se calcula el precio:</p>
          <p>1. Costo base = Precio compra / 1.18 (se quita el IGV pagado)</p>
          <p>2. Valor venta = Costo base x (1 + Margen% + 1% renta)</p>
          <p>3. Precio final = Valor venta x 1.18 (se agrega el IGV de venta)</p>
        </div>
      </div>
    </div>
  );
}
