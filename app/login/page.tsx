'use client'

import { useRouter } from 'next/navigation'
import { useState, useEffect } from 'react'
import Image from 'next/image'
import { login } from '@/lib/auth'

type Phase = 'black' | 'flash' | 'zoom' | 'glow' | 'bg-transition' | 'form-in'

export default function LoginPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [phase, setPhase] = useState<Phase>('black')

  useEffect(() => {
    const t1 = setTimeout(() => setPhase('flash'), 200)
    const t2 = setTimeout(() => setPhase('zoom'), 500)
    const t3 = setTimeout(() => setPhase('glow'), 1200)
    const t4 = setTimeout(() => setPhase('bg-transition'), 1800)
    const t5 = setTimeout(() => setPhase('form-in'), 2200)
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); clearTimeout(t4); clearTimeout(t5) }
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

  const isDark = phase === 'black' || phase === 'flash' || phase === 'zoom' || phase === 'glow'
  const splashVisible = phase !== 'form-in'
  const logoVisible = phase !== 'black' && phase !== 'flash'

  return (
    <>
      <style>{`
        @keyframes glowPulse {
          0%, 100% { filter: drop-shadow(0 0 20px #2DC4C4) drop-shadow(0 0 40px rgba(45,196,196,0.6)); }
          50%       { filter: drop-shadow(0 0 30px #2DC4C4) drop-shadow(0 0 80px #2DC4C4) drop-shadow(0 0 120px rgba(45,196,196,0.35)); }
        }
        @keyframes flashExpand {
          0%   { transform: translate(-50%, -50%) scale(0);  opacity: 0.9; }
          60%  { opacity: 0.5; }
          100% { transform: translate(-50%, -50%) scale(16); opacity: 0; }
        }
      `}</style>

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

        {/* Dark overlay — fades out at bg-transition */}
        <div
          style={{
            position: 'absolute', inset: 0,
            background: '#1A1A2E',
            opacity: isDark ? 1 : 0,
            transition: 'opacity 1.2s ease-out',
            zIndex: 2,
            pointerEvents: 'none',
          }}
        />

        {/* Teal flash burst */}
        {phase === 'flash' && (
          <div
            style={{
              position: 'absolute',
              top: '50%', left: '50%',
              width: 140, height: 140,
              borderRadius: '50%',
              background: 'radial-gradient(circle, rgba(45,196,196,0.95) 0%, rgba(45,196,196,0.4) 45%, transparent 100%)',
              animation: 'flashExpand 0.5s ease-out forwards',
              pointerEvents: 'none',
              zIndex: 3,
            }}
          />
        )}

        {/* Splash logo */}
        {splashVisible && (
          <div
            style={{
              position: 'absolute', inset: 0,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              zIndex: 4, pointerEvents: 'none',
              opacity: phase === 'bg-transition' ? 0 : 1,
              transition: phase === 'bg-transition' ? 'opacity 0.35s ease-out' : 'none',
            }}
          >
            <div
              style={{
                width: 'min(55vw, 280px)', height: 'min(55vw, 280px)',
                position: 'relative',
                opacity: logoVisible ? 1 : 0,
                transform: logoVisible ? 'scale(1)' : 'scale(1.8)',
                transition: 'opacity 0.6s ease-out, transform 0.7s cubic-bezier(0.34, 1.56, 0.64, 1)',
                animation: phase === 'glow' ? 'glowPulse 0.75s ease-in-out infinite' : 'none',
                filter: phase === 'zoom' ? 'drop-shadow(0 0 30px #2DC4C4)' : undefined,
              }}
            >
              <Image src="/Logo-XIDHU.png" alt="Xidhu" fill priority style={{ objectFit: 'contain' }} />
            </div>
          </div>
        )}

        {/* ── LOGIN FORM ── */}
        <div
          style={{
            minHeight: '100vh', display: 'flex', alignItems: 'center',
            justifyContent: 'center', padding: 24,
            position: 'relative', zIndex: 5,
            opacity: phase === 'form-in' ? 1 : 0,
            transform: phase === 'form-in' ? 'translateY(0)' : 'translateY(24px)',
            transition: 'opacity 0.7s ease-out, transform 0.7s ease-out',
            pointerEvents: phase === 'form-in' ? 'auto' : 'none',
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
    </>
  )
}
