import type { Client, Quote } from './mock-data'

export function getStoredClients(): Client[] {
  if (typeof window === 'undefined') return []
  const stored = localStorage.getItem('xidhu_clients')
  return stored ? JSON.parse(stored) : []
}

export function saveClients(clients: Client[]) {
  localStorage.setItem('xidhu_clients', JSON.stringify(clients))
}

export function getStoredQuotes(): Quote[] {
  if (typeof window === 'undefined') return []
  const stored = localStorage.getItem('xidhu_quotes')
  return stored ? JSON.parse(stored) : []
}

export function saveQuotes(quotes: Quote[]) {
  localStorage.setItem('xidhu_quotes', JSON.stringify(quotes))
}
