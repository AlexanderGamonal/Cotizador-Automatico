import { createClient } from '@supabase/supabase-js';

const url = import.meta.env.VITE_SUPABASE_URL;
const key = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const isConfigured = Boolean(url && key);

// Todas las tablas del cotizador viven en el esquema "cotizador".
export const supabase = isConfigured
  ? createClient(url, key, { db: { schema: 'cotizador' } })
  : null;
