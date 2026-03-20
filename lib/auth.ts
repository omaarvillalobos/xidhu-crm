export type AuthUser = {
  id: string
  name: string
  email: string
  role: 'admin' | 'ejecutivo'
  avatar: string
}

const CREDENTIALS = [
  { email: 'ana@xidhu.mx',    password: 'ana2024',    user: { id: 'u1', name: 'Ana García',    email: 'ana@xidhu.mx',    role: 'admin'     as const, avatar: 'AG' } },
  { email: 'carlos@xidhu.mx', password: 'carlos2024', user: { id: 'u2', name: 'Carlos López',  email: 'carlos@xidhu.mx', role: 'ejecutivo' as const, avatar: 'CL' } },
  { email: 'maria@xidhu.mx',  password: 'maria2024',  user: { id: 'u3', name: 'María Torres',  email: 'maria@xidhu.mx',  role: 'ejecutivo' as const, avatar: 'MT' } },
]

export function login(email: string, password: string): AuthUser | null {
  const match = CREDENTIALS.find((c) => c.email === email && c.password === password)
  if (!match) return null
  localStorage.setItem('xidhu_user', JSON.stringify(match.user))
  return match.user
}

export function getCurrentUser(): AuthUser | null {
  if (typeof window === 'undefined') return null
  const stored = localStorage.getItem('xidhu_user')
  return stored ? JSON.parse(stored) : null
}

export function logout() {
  localStorage.removeItem('xidhu_user')
}
