export default function ClientSection({ data, onChange }) {
  const field = (key, label, placeholder, props = {}) => (
    <div className="flex flex-col gap-1">
      <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">{label}</label>
      <input
        value={data[key]}
        onChange={(e) => onChange(key, e.target.value)}
        placeholder={placeholder}
        className="border border-slate-200 rounded-lg px-3 py-2.5 text-base sm:text-sm text-slate-800 placeholder-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
        {...props}
      />
    </div>
  );

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-4 sm:p-5 space-y-4">
      <h2 className="text-base font-semibold text-slate-700">Datos del cliente</h2>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {field('cliente', 'Cliente / Razón social', 'Nombre del cliente', { list: 'clients-list', autoComplete: 'off' })}
        {field('ruc', 'RUC / DNI', '20123456789', { inputMode: 'numeric' })}
        {field('whatsapp', 'WhatsApp', '51999888777', { type: 'tel', inputMode: 'tel' })}
      </div>
    </div>
  );
}
