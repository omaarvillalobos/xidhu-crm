'use client'

import { useRouter } from 'next/navigation'
import { useState, useEffect } from 'react'
import Image from 'next/image'
import { login } from '@/lib/auth'

type Phase = 'blurred' | 'focused' | 'fade-out' | 'login'

export default function LoginPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [phase, setPhase] = useState<Phase>('blurred')

  useEffect(() => {
    const t1 = setTimeout(() => setPhase('focused'), 300)
    const t2 = setTimeout(() => setPhase('fade-out'), 2000)
    const t3 = setTimeout(() => setPhase('login'), 2800)
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3) }
  }, [])

  const handleLogin = () => {
    setError('')
    const user = login(email.trim(), password)
    if (!user) {
      setError('Correo o contraseña incorrectos.')
      return
    }
    setLoading(true)
    setTimeout(() => router.push('/dashboard'), 600)
  }

  const splashVisible = phase !== 'login'

  return (
    <div
      style={{
        minHeight: '100vh',
        background: 'linear-gradient(150deg, #e8f9f9 0%, #fff8f2 50%, #fef3fb 100%)',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Decorative blobs */}
      <div style={{ position: 'absolute', top: '-80px', right: '-80px', width: 320, height: 320, borderRadius: '50%', background: 'rgba(45,196,196,0.12)', pointerEvents: 'none' }} />
      <div style={{ position: 'absolute', bottom: '-60px', left: '-60px', width: 260, height: 260, borderRadius: '50%', background: 'rgba(255,150,80,0.10)', pointerEvents: 'none' }} />
      <div style={{ position: 'absolute', top: '40%', left: '-40px', width: 180, height: 180, borderRadius: '50%', background: 'rgba(236,72,153,0.07)', pointerEvents: 'none' }} />

      {/* ── SPLASH SCREEN ── */}
      {splashVisible && (
        <div
          style={{
            position: 'absolute', inset: 0, display: 'flex', alignItems: 'center',
            justifyContent: 'center', zIndex: 10, overflow: 'hidden',
            opacity: phase === 'fade-out' ? 0 : 1,
            transition: phase === 'fade-out' ? 'opacity 0.8s ease-out' : 'none',
            pointerEvents: 'none',
          }}
        >
          <div
            style={{
              filter: phase === 'blurred' ? 'blur(32px)' : 'blur(0px)',
              opacity: phase === 'blurred' ? 0.3 : 1,
              transform: phase === 'blurred' ? 'scale(0.88)' : 'scale(1)',
              transition: 'filter 1.4s ease-out, opacity 1.4s ease-out, transform 1.4s ease-out',
              width: '100vw', height: '100vh', position: 'relative',
            }}
          >
            <Image src="/Logo-XIDHU.png" alt="Xidhu" fill priority style={{ objectFit: 'contain', padding: '5vw', mixBlendMode: 'multiply' }} />
          </div>
        </div>
      )}

      {/* ── LOGIN FORM ── */}
      <div
        style={{
          minHeight: '100vh', display: 'flex', alignItems: 'center',
          justifyContent: 'center', padding: 24,
          opacity: phase === 'login' ? 1 : 0,
          transform: phase === 'login' ? 'translateY(0)' : 'translateY(16px)',
          transition: 'opacity 0.7s ease-out, transform 0.7s ease-out',
          pointerEvents: phase === 'login' ? 'auto' : 'none',
        }}
      >
        <div style={{ width: '100%', maxWidth: 420 }}>
          <div style={{ textAlign: 'center', marginBottom: 28 }}>
            <Image src="/Logo-XIDHU.png" alt="Xidhu" width={90} height={90} style={{ display: 'inline-block', mixBlendMode: 'multiply' }} />
            <p style={{ color: '#2DC4C4', fontSize: '0.7rem', letterSpacing: '5px', textTransform: 'uppercase', marginTop: 4, fontFamily: "'DM Sans', sans-serif", fontWeight: 600 }}>
              Travel · CRM
            </p>
          </div>

          <div
            style={{
              background: 'rgba(255,255,255,0.85)', backdropFilter: 'blur(12px)',
              borderRadius: 24, padding: 36,
              boxShadow: '0 8px 40px rgba(45,196,196,0.15), 0 2px 12px rgba(0,0,0,0.06)',
              border: '1px solid rgba(45,196,196,0.15)',
            }}
          >
            <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: '1.4rem', color: '#1a4a4a', marginBottom: 6, marginTop: 0 }}>
              Bienvenida
            </h2>
            <p style={{ color: '#7cb5b5', fontSize: '0.875rem', marginBottom: 28, marginTop: 0 }}>
              Ingresa a tu cuenta para continuar.
            </p>

            {error && (
              <div style={{ background: '#FDEEEE', border: '1px solid #E63329', borderRadius: 10, padding: '10px 14px', marginBottom: 18, color: '#c0221a', fontSize: '0.85rem', fontWeight: 500 }}>
                {error}
              </div>
            )}

            <div style={{ marginBottom: 18 }}>
              <label style={{ display: 'block', fontSize: '0.68rem', letterSpacing: '3px', textTransform: 'uppercase', fontWeight: 700, color: '#2DC4C4', marginBottom: 6 }}>
                Correo electrónico
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="correo@xidhu.mx"
                style={{ width: '100%', padding: '12px 16px', border: '1.5px solid #d1f0f0', borderRadius: 12, fontSize: '0.95rem', outline: 'none', fontFamily: "'DM Sans', sans-serif", color: '#1a4a4a', background: 'rgba(255,255,255,0.8)', transition: 'border-color 0.15s, box-shadow 0.15s', boxSizing: 'border-box' }}
                onFocus={(e) => { e.target.style.borderColor = '#2DC4C4'; e.target.style.boxShadow = '0 0 0 3px rgba(45,196,196,0.12)' }}
                onBlur={(e) => { e.target.style.borderColor = '#d1f0f0'; e.target.style.boxShadow = 'none' }}
                onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
              />
            </div>

            <div style={{ marginBottom: 28 }}>
              <label style={{ display: 'block', fontSize: '0.68rem', letterSpacing: '3px', textTransform: 'uppercase', fontWeight: 700, color: '#2DC4C4', marginBottom: 6 }}>
                Contraseña
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                style={{ width: '100%', padding: '12px 16px', border: '1.5px solid #d1f0f0', borderRadius: 12, fontSize: '0.95rem', outline: 'none', fontFamily: "'DM Sans', sans-serif", color: '#1a4a4a', background: 'rgba(255,255,255,0.8)', transition: 'border-color 0.15s, box-shadow 0.15s', boxSizing: 'border-box' }}
                onFocus={(e) => { e.target.style.borderColor = '#2DC4C4'; e.target.style.boxShadow = '0 0 0 3px rgba(45,196,196,0.12)' }}
                onBlur={(e) => { e.target.style.borderColor = '#d1f0f0'; e.target.style.boxShadow = 'none' }}
                onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
              />
            </div>

            <button
              onClick={handleLogin}
              disabled={loading}
              style={{
                width: '100%', padding: '13px',
                background: loading ? 'linear-gradient(90deg, #a8e6e6, #f9c5a0)' : 'linear-gradient(90deg, #2DC4C4 0%, #FF9650 100%)',
                color: 'white', border: 'none', borderRadius: 9999, fontSize: '1rem', fontWeight: 700,
                cursor: loading ? 'not-allowed' : 'pointer', fontFamily: "'DM Sans', sans-serif",
                transition: 'opacity 0.2s', letterSpacing: '0.5px',
                boxShadow: loading ? 'none' : '0 4px 18px rgba(45,196,196,0.35)',
              }}
            >
              {loading ? 'Ingresando...' : 'Entrar →'}
            </button>
          </div>

          <p style={{ textAlign: 'center', color: '#9dd4d4', fontSize: '0.72rem', marginTop: 20, letterSpacing: '1px' }}>
            Solo acceso por invitación · Xidhu Travel
          </p>
        </div>
      </div>
    </div>
  )
}
