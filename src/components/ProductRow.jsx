import { calcProduct, fmt } from '../utils/calculations';

export default function ProductRow({ row, index, onChange, onRemove }) {
  const { costBase, saleValue, igvAmount, finalPrice, lineTotal } = calcProduct(
    row.costWithIGV,
    row.margin,
    row.qty
  );

  const numInput = (key, placeholder, min = '0') => (
    <input
      type="number"
      min={min}
      step="0.01"
      value={row[key]}
      onChange={(e) => onChange(index, key, e.target.value)}
      placeholder={placeholder}
      className="w-full border border-slate-200 rounded-lg px-2 py-1.5 text-sm text-slate-800 placeholder-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
    />
  );

  const calc = (label, value) => (
    <div className="flex flex-col">
      <span className="text-xs text-slate-400 mb-0.5">{label}</span>
      <span className="text-sm font-medium text-slate-600">S/ {fmt(value)}</span>
    </div>
  );

  return (
    <div className="bg-white border border-slate-100 rounded-xl p-4 space-y-3 shadow-sm">
      {/* Row number + remove */}
      <div className="flex items-center justify-between">
        <span className="text-xs font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">
          Producto {index + 1}
        </span>
        <button
          onClick={() => onRemove(index)}
          className="text-slate-300 hover:text-red-400 transition text-lg leading-none"
          aria-label="Eliminar producto"
        >
          ×
        </button>
      </div>

      {/* Editable inputs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="sm:col-span-2 lg:col-span-1 flex flex-col gap-1">
          <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
            Nombre
          </label>
          <input
            type="text"
            value={row.name}
            onChange={(e) => onChange(index, 'name', e.target.value)}
            placeholder="Descripción del producto"
            className="border border-slate-200 rounded-lg px-2 py-1.5 text-sm text-slate-800 placeholder-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
          />
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
            Costo c/ IGV (S/)
          </label>
          {numInput('costWithIGV', '118.00')}
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
            Margen (%)
          </label>
          {numInput('margin', '20')}
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
            Cantidad
          </label>
          {numInput('qty', '1', '1')}
        </div>
      </div>

      {/* Calculated values */}
      <div className="grid grid-cols-2 gap-3 bg-slate-50 rounded-lg px-3 py-2">
        {calc('Precio unit. c/ IGV', finalPrice)}
        <div className="flex flex-col">
          <span className="text-xs text-slate-400 mb-0.5">Total línea</span>
          <span className="text-sm font-bold text-blue-700">S/ {fmt(lineTotal)}</span>
        </div>
      </div>
    </div>
  );
}
