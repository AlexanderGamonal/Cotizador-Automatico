import { supabase } from '../lib/supabase';

export const DEFAULT_SETTINGS = {
  empresa: '',
  ruc: '',
  direccion: '',
  telefono: '',
  igv_rate: 0.18,
  renta_rate: 0.01,
  validez_dias: 7,
  condiciones_pago: '',
  tiempo_entrega: '',
  garantia: '',
};

export async function getSettings() {
  const { data, error } = await supabase.from('company_settings').select('*').maybeSingle();
  if (error) throw new Error(error.message);
  return { ...DEFAULT_SETTINGS, ...(data || {}) };
}

export async function saveSettings(userId, values) {
  const { data, error } = await supabase
    .from('company_settings')
    .upsert({ ...values, user_id: userId }, { onConflict: 'user_id' })
    .select()
    .single();
  if (error) throw new Error(error.message);
  return { ...DEFAULT_SETTINGS, ...data };
}
