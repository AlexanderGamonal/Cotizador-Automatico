import { supabase } from '../lib/supabase';

export async function listProducts() {
  const { data, error } = await supabase
    .from('products')
    .select('id, name, cost_with_igv, default_margin_pct')
    .eq('active', true)
    .order('name')
    .limit(1000);
  if (error) throw new Error(error.message);
  return data;
}

export async function addProduct({ name, cost_with_igv, default_margin_pct }) {
  const { data, error } = await supabase
    .from('products')
    .insert({ name, cost_with_igv, default_margin_pct })
    .select('id, name, cost_with_igv, default_margin_pct')
    .single();
  if (error) throw new Error(error.message);
  return data;
}
