export default function ClientSection({ data, onChange }) {
  const field = (key, label, placeholder, type = 'text') => (
    <div className="flex flex-col gap-1">
      <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
        {label}
      </label>
      <input
        type={type}
        value={data[key]}
        onChange={(e) => onChange(key, e.target.value)}
        placeholder={placeholder}
        className="border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-800 placeholder-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
      />
    </div>
  );

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5 space-y-5">
      <h2 className="text-base font-semibold text-slate-700">Datos de la empresa y cliente</h2>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {field('empresa', 'Tu empresa', 'Nombre de tu empresa')}
        {field('cliente', 'Cliente / Razón social', 'Nombre del cliente')}
        {field('ruc', 'RUC / DNI', '20123456789')}
        {field('whatsapp', 'WhatsApp del cliente', '51999888777', 'tel')}
      </div>
    </div>
  );
}
