import { useState } from 'react';
import { saveSettings } from '../../services/settings';

const input =
  'w-full border border-slate-200 rounded-lg px-3 py-2.5 text-base sm:text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent';

export default function SettingsForm({ userId, settings, onSaved }) {
  const [form, setForm] = useState({
    ...settings,
    igv_pct: String(+(settings.igv_rate * 100).toFixed(2)),
    renta_pct: String(+(settings.renta_rate * 100).toFixed(2)),
  });
  const [msg, setMsg] = useState({ type: '', text: '' });
  const [saving, setSaving] = useState(false);

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  async function handleSubmit(e) {
    e.preventDefault();
    const igv = parseFloat(form.igv_pct);
    const renta = parseFloat(form.renta_pct);
    const dias = parseInt(form.validez_dias, 10);
    if (!(igv >= 0 && igv < 100) || !(renta >= 0 && renta < 100) || !(dias > 0)) {
      setMsg({ type: 'error', text: 'Revisa IGV, renta (0–99.99) y días de validez (mayor a 0).' });
      return;
    }
    setSaving(true);
    try {
      const saved = await saveSettings(userId, {
        empresa: form.empresa, ruc: form.ruc, direccion: form.direccion, telefono: form.telefono,
        condiciones_pago: form.condiciones_pago, tiempo_entrega: form.tiempo_entrega, garantia: form.garantia,
        igv_rate: igv / 100, renta_rate: renta / 100, validez_dias: dias,
      });
      onSaved(saved);
      setMsg({ type: 'ok', text: 'Ajustes guardados.' });
    } catch (err) {
      setMsg({ type: 'error', text: err.message });
    } finally {
      setSaving(false);
    }
  }

  const field = (key, label, props = {}) => (
    <label className="block space-y-1">
      <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">{label}</span>
      <input value={form[key] ?? ''} onChange={set(key)} className={input} {...props} />
    </label>
  );

  return (
    <form onSubmit={handleSubmit} className="space-y-5 pb-6">
      <section className="bg-white rounded-2xl shadow-sm border border-slate-100 p-4 sm:p-5 space-y-4">
        <h2 className="text-base font-semibold text-slate-700">Tu empresa</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {field('empresa', 'Nombre de la empresa')}
          {field('ruc', 'RUC', { inputMode: 'numeric' })}
          {field('direccion', 'Dirección')}
          {field('telefono', 'Teléfono', { type: 'tel', inputMode: 'tel' })}
        </div>
      </section>

      <section className="bg-white rounded-2xl shadow-sm border border-slate-100 p-4 sm:p-5 space-y-4">
        <h2 className="text-base font-semibold text-slate-700">Impuestos</h2>
        <div className="grid grid-cols-2 gap-4">
          {field('igv_pct', 'IGV (%)', { type: 'number', inputMode: 'decimal', step: '0.01' })}
          {field('renta_pct', 'Renta sobre ventas (%)', { type: 'number', inputMode: 'decimal', step: '0.01' })}
        </div>
        <p className="text-xs text-slate-400">
          Confirma con tu contador el % de renta de tu régimen (por ejemplo, 1% en RMT o 1.5% en RER).
        </p>
      </section>

      <section className="bg-white rounded-2xl shadow-sm border border-slate-100 p-4 sm:p-5 space-y-4">
        <h2 className="text-base font-semibold text-slate-700">Condiciones por defecto</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {field('validez_dias', 'Validez (días)', { type: 'number', inputMode: 'numeric', min: 1 })}
          {field('condiciones_pago', 'Condiciones de pago')}
          {field('tiempo_entrega', 'Tiempo de entrega')}
          {field('garantia', 'Garantía')}
        </div>
      </section>

      {msg.text && (
        <p role="status" className={`text-sm ${msg.type === 'error' ? 'text-red-600' : 'text-green-700'}`}>{msg.text}</p>
      )}
      <button type="submit" disabled={saving} className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 text-white font-semibold py-3 px-8 rounded-xl min-h-12">
        {saving ? 'Guardando…' : 'Guardar ajustes'}
      </button>
    </form>
  );
}
