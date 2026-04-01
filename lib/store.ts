import { supabase } from './supabase'
import type { Client, Quote } from './mock-data'

export async function getStoredClients(): Promise<Client[]> {
  const { data } = await supabase.from('clients').select('*').order('created_at', { ascending: false })
  return (data as Client[]) ?? []
}

export async function insertClient(client: Client): Promise<void> {
  await supabase.from('clients').insert(client)
}

export async function getStoredQuotes(): Promise<Quote[]> {
  const { data } = await supabase.from('quotes').select('*').order('created_at', { ascending: false })
  return (data as Quote[]) ?? []
}

export async function insertQuote(quote: Quote): Promise<void> {
  await supabase.from('quotes').insert(quote)
}

export async function updateQuoteStatus(id: string, status: string): Promise<void> {
  await supabase.from('quotes').update({ status }).eq('id', id)
}

export async function updateQuote(id: string, fields: Partial<Quote>): Promise<void> {
  await supabase.from('quotes').update(fields).eq('id', id)
}

export async function deleteQuote(id: string): Promise<void> {
  await supabase.from('quotes').delete().eq('id', id)
}

export async function deleteClient(id: string): Promise<void> {
  await supabase.from('clients').delete().eq('id', id)
}
