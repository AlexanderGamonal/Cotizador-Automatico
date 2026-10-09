import { supabase } from '../lib/supabase';

export async function listClients() {
  const { data, error } = await supabase
    .from('clients')
    .select('id, razon_social, ruc, whatsapp')
    .order('razon_social')
    .limit(500);
  if (error) throw new Error(error.message);
  return data;
}

// Reutiliza el cliente si ya existe (mismo RUC o misma razón social); si no, lo crea.
export async function ensureClient(client, known) {
  const name = client.cliente.trim();
  if (!name) return null;
  const ruc = client.ruc.trim();
  const found = known.find(
    (c) => (ruc && c.ruc === ruc) || c.razon_social.toLowerCase() === name.toLowerCase()
  );
  if (found) return found;
  const { data, error } = await supabase
    .from('clients')
    .insert({ razon_social: name, ruc: ruc || null, whatsapp: client.whatsapp.trim() || null })
    .select('id, razon_social, ruc, whatsapp')
    .single();
  if (error) throw new Error(error.message);
  return data;
}
