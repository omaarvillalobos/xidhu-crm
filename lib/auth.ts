export type AuthUser = {
  id: string
  name: string
  email: string
  role: 'admin' | 'ejecutivo'
  avatar: string
}

const CREDENTIALS = [
  { email: 'mariana@xidhu.mx', password: 'mariana123', user: { id: 'u1', name: 'Mariana',  email: 'mariana@xidhu.mx', role: 'ejecutivo' as const, avatar: 'MA' } },
  { email: 'eduardo@xidhu.mx', password: 'eduardo987', user: { id: 'u2', name: 'Eduardo',  email: 'eduardo@xidhu.mx', role: 'ejecutivo' as const, avatar: 'ED' } },
  { email: 'issori@xidhu.mx',  password: 'issori5364', user: { id: 'u3', name: 'Issori',   email: 'issori@xidhu.mx',  role: 'admin'     as const, avatar: 'IS' } },
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
