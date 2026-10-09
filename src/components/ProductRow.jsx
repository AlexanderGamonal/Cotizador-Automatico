import { calcProduct, fmt } from '../utils/calculations';

const inputCls =
  'w-full border border-slate-200 rounded-lg px-3 py-2.5 text-base sm:text-sm text-slate-800 placeholder-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition';

export default function ProductRow({ row, index, rates, canRemove, canSaveCatalog, onChange, onRemove, onSaveCatalog }) {
  const { error, finalPrice, lineTotal, profit, realMarginPct } = calcProduct(
    row.costWithIGV,
    row.margin,
    row.qty,
    rates
  );

  const numInput = (key, placeholder, min = '0') => (
    <input
      type="number"
      inputMode="decimal"
      min={min}
      step="0.01"
      value={row[key]}
      onChange={(e) => onChange(index, key, e.target.value)}
      placeholder={placeholder}
      className={inputCls}
    />
  );

  const label = (text) => (
    <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">{text}</label>
  );

  const calc = (text, value) => (
    <div className="flex flex-col">
      <span className="text-xs text-slate-400 mb-0.5">{text}</span>
      <span className="text-sm font-medium text-slate-600">S/ {fmt(value)}</span>
    </div>
  );

  return (
    <div className="bg-white border border-slate-100 rounded-xl p-4 space-y-3 shadow-sm">
      <div className="flex items-center justify-between">
        <span className="text-xs font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">
          Producto {index + 1}
        </span>
        <div className="flex items-center gap-1">
          {canSaveCatalog && (
            <button
              type="button"
              onClick={() => onSaveCatalog(index)}
              className="text-xs text-slate-400 hover:text-blue-600 px-2 py-2 min-h-11"
            >
              Guardar en catálogo
            </button>
          )}
          {canRemove && (
            <button
              type="button"
              onClick={() => onRemove(index)}
              className="text-slate-300 hover:text-red-400 transition text-2xl leading-none w-11 h-11"
              aria-label="Eliminar producto"
            >
              ×
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="col-span-2 lg:col-span-1 flex flex-col gap-1">
          {label('Nombre')}
          <input
            type="text"
            list="products-list"
            autoComplete="off"
            value={row.name}
            onChange={(e) => onChange(index, 'name', e.target.value)}
            placeholder="Descripción del producto"
            className={inputCls}
          />
        </div>
        <div className="flex flex-col gap-1">
          {label('Costo c/ IGV (S/)')}
          {numInput('costWithIGV', '118.00')}
        </div>
        <div className="flex flex-col gap-1">
          {label('Margen (%)')}
          {numInput('margin', '20')}
        </div>
        <div className="col-span-2 lg:col-span-1 flex flex-col gap-1">
          {label('Cantidad')}
          {numInput('qty', '1', '1')}
        </div>
      </div>

      {error && <p className="text-xs text-red-500">{error}</p>}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50 rounded-lg px-3 py-2">
        {calc('Precio unit. c/ IGV', finalPrice)}
        {calc('Utilidad unit.', profit)}
        <div className="flex flex-col">
          <span className="text-xs text-slate-400 mb-0.5">Margen real</span>
          <span className="text-sm font-medium text-slate-600">{fmt(realMarginPct)}%</span>
        </div>
        <div className="flex flex-col">
          <span className="text-xs text-slate-400 mb-0.5">Total línea</span>
          <span className="text-sm font-bold text-blue-700">S/ {fmt(lineTotal)}</span>
        </div>
      </div>
    </div>
  );
}
