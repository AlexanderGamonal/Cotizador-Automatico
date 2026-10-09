import { supabase } from '../lib/supabase';

function check({ data, error }) {
  if (error) throw new Error(error.message);
  return data;
}

export async function saveQuote(quote, items) {
  return check(await supabase.rpc('create_quote', { p_quote: quote, p_items: items }));
}

export async function listQuotes({ search = '', status = '' } = {}) {
  let q = supabase
    .from('quotes')
    .select('id, number, client_name, status, total, total_profit, issue_date, valid_until')
    .order('created_at', { ascending: false })
    .limit(100);
  if (status) q = q.eq('status', status);
  // Quitamos caracteres con significado en el filtro .or() de PostgREST.
  const term = search.replace(/[,()%*\\]/g, ' ').trim();
  if (term) q = q.or(`number.ilike.%${term}%,client_name.ilike.%${term}%`);
  return check(await q);
}

export async function getQuoteItems(quoteId) {
  return check(
    await supabase.from('quote_items').select('*').eq('quote_id', quoteId).order('position')
  );
}

export async function updateQuoteStatus(id, status) {
  return check(await supabase.from('quotes').update({ status }).eq('id', id).select('id').single());
}
