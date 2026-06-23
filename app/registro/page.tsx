'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { addUser, getUsers, getSession, setSession, generateId } from '@/lib/controlCenter/store'
import { isUserBlocked } from '@/lib/controlCenter/normas'
import { addReport } from '@/lib/controlCenter/store'
import { User } from '@/lib/controlCenter/types'

export default function RegistroPage() {
  const [mode, setMode] = useState<'login' | 'register'>('login')
  const [session, setSessionState] = useState<{ username: string; role: string } | null>(null)

  useEffect(() => {
    const s = getSession()
    if (s) setSessionState(s)
  }, [])

  if (session) {
    return <UserProfile session={session} onLogout={() => { 
      localStorage.removeItem('c8l_session')
      setSessionState(null) 
    }} />
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-c8l-black via-purple-950/10 to-c8l-black flex items-center justify-center p-6">
      <div className="glass rounded-2xl p-8 max-w-md w-full border border-c8l-purple/30">
        <div className="text-center mb-8">
          <Link href="/" className="inline-block">
            <h1 className="text-4xl font-outfit font-black text-c8l-gold mb-2">C8L</h1>
          </Link>
          <p className="text-gray-400 text-sm">Corazones Locos Family</p>
        </div>

        {/* Toggle */}
        <div className="flex bg-gray-800 rounded-lg p-1 mb-6">
          <button onClick={() => setMode('login')}
            className={`flex-1 py-2 rounded-md text-sm font-medium transition ${mode === 'login' ? 'bg-c8l-purple text-white' : 'text-gray-400'}`}>
            Iniciar Sesión
          </button>
          <button onClick={() => setMode('register')}
            className={`flex-1 py-2 rounded-md text-sm font-medium transition ${mode === 'register' ? 'bg-c8l-purple text-white' : 'text-gray-400'}`}>
            Registrarse
          </button>
        </div>

        {mode === 'login' ? (
          <LoginForm onSuccess={(username, role) => {
            setSession(username, role)
            setSessionState({ username, role })
          }} />
        ) : (
          <RegisterForm onSuccess={(username) => {
            setSession(username, 'user')
            setSessionState({ username, role: 'user' })
          }} />
        )}
      </div>
    </div>
  )
}

function LoginForm({ onSuccess }: { onSuccess: (username: string, role: string) => void }) {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')

  const handleLogin = () => {
    setError('')
    if (!username || !password) { setError('Completa todos los campos'); return }

    // Check if user is blocked
    const blocked = isUserBlocked(username.toLowerCase())
    if (blocked) {
      setError(`🚫 Cuenta bloqueada (${blocked.nivel}). ${blocked.fechaFin ? `Hasta: ${new Date(blocked.fechaFin).toLocaleDateString('es')}` : 'Permanente.'}`)
      return
    }

    const users = getUsers()
    const user = users.find(u => u.username === username.toLowerCase())
    
    if (!user) {
      setError('❌ Usuario no encontrado. ¿Quieres registrarte?')
      return
    }

    // Simple password check (stored in localStorage for demo)
    const passwords = JSON.parse(localStorage.getItem('c8l_passwords') || '{}')
    if (passwords[username.toLowerCase()] && passwords[username.toLowerCase()] !== password) {
      setError('❌ Contraseña incorrecta.')
      return
    }

    // Report login
    addReport({
      id: generateId(),
      type: 'user_activity',
      severity: 'info',
      message: `@${username} inició sesión`,
      userId: user.id,
      username: user.username,
      section: 'Registro',
      timestamp: new Date().toISOString(),
      resolved: true,
    })

    onSuccess(user.username, user.role)
  }

  return (
    <div className="space-y-4">
      <div>
        <label className="text-xs text-gray-400 block mb-1">Usuario</label>
        <input value={username} onChange={e => setUsername(e.target.value)}
          className="w-full bg-black border border-gray-700 rounded-lg p-3 text-white focus:outline-none focus:border-c8l-purple"
          placeholder="tu_nombre" onKeyDown={e => e.key === 'Enter' && handleLogin()} />
      </div>
      <div>
        <label className="text-xs text-gray-400 block mb-1">Contraseña</label>
        <input type="password" value={password} onChange={e => setPassword(e.target.value)}
          className="w-full bg-black border border-gray-700 rounded-lg p-3 text-white focus:outline-none focus:border-c8l-purple"
          placeholder="••••••••" onKeyDown={e => e.key === 'Enter' && handleLogin()} />
      </div>
      {error && <p className="text-red-400 text-sm text-center">{error}</p>}
      <button onClick={handleLogin}
        className="w-full py-4 bg-gradient-to-r from-c8l-purple to-c8l-gold text-white rounded-xl font-bold text-lg hover:scale-105 transition">
        🔑 Entrar
      </button>
    </div>
  )
}

function RegisterForm({ onSuccess }: { onSuccess: (username: string) => void }) {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [acceptTerms, setAcceptTerms] = useState(false)
  const [error, setError] = useState('')

  const handleRegister = () => {
    setError('')
    if (!username || !password || !confirmPassword) { setError('Completa todos los campos'); return }
    if (username.length < 3) { setError('El usuario debe tener al menos 3 caracteres'); return }
    if (password.length < 6) { setError('La contraseña debe tener al menos 6 caracteres'); return }
    if (password !== confirmPassword) { setError('Las contraseñas no coinciden'); return }
    if (!acceptTerms) { setError('Debes aceptar las normas de la comunidad'); return }
    if (/[^a-z0-9_]/.test(username.toLowerCase())) { setError('Solo letras, números y _'); return }

    const users = getUsers()
    const exists = users.find(u => u.username === username.toLowerCase())
    if (exists) { setError('❌ Ese nombre de usuario ya existe'); return }

    // Create user
    const newUser: User = {
      id: generateId(),
      username: username.toLowerCase(),
      role: 'user',
      createdAt: new Date().toISOString(),
      lastActive: new Date().toISOString(),
      status: 'active',
      warnings: 0,
      coins: 100, // Welcome bonus
    }
    addUser(newUser)

    // Store password
    const passwords = JSON.parse(localStorage.getItem('c8l_passwords') || '{}')
    passwords[username.toLowerCase()] = password
    localStorage.setItem('c8l_passwords', JSON.stringify(passwords))

    // Report to Control Center
    addReport({
      id: generateId(),
      type: 'user_activity',
      severity: 'info',
      message: `Nuevo registro: @${username.toLowerCase()} se unió a C8L`,
      userId: newUser.id,
      username: newUser.username,
      section: 'Registro',
      timestamp: new Date().toISOString(),
      resolved: true,
    })

    onSuccess(username.toLowerCase())
  }

  return (
    <div className="space-y-4">
      <div>
        <label className="text-xs text-gray-400 block mb-1">Nombre de usuario</label>
        <input value={username} onChange={e => setUsername(e.target.value)}
          className="w-full bg-black border border-gray-700 rounded-lg p-3 text-white focus:outline-none focus:border-c8l-purple"
          placeholder="elige_un_nombre" />
        <p className="text-[10px] text-gray-600 mt-1">Solo letras minúsculas, números y _</p>
      </div>
      <div>
        <label className="text-xs text-gray-400 block mb-1">Contraseña</label>
        <input type="password" value={password} onChange={e => setPassword(e.target.value)}
          className="w-full bg-black border border-gray-700 rounded-lg p-3 text-white focus:outline-none focus:border-c8l-purple"
          placeholder="Mínimo 6 caracteres" />
      </div>
      <div>
        <label className="text-xs text-gray-400 block mb-1">Confirmar contraseña</label>
        <input type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)}
          className="w-full bg-black border border-gray-700 rounded-lg p-3 text-white focus:outline-none focus:border-c8l-purple"
          placeholder="Repite la contraseña" onKeyDown={e => e.key === 'Enter' && handleRegister()} />
      </div>
      <label className="flex items-start gap-2 cursor-pointer">
        <input type="checkbox" checked={acceptTerms} onChange={e => setAcceptTerms(e.target.checked)}
          className="mt-1 accent-c8l-purple" />
        <span className="text-xs text-gray-400">
          Acepto las <Link href="/legal" className="text-c8l-gold hover:underline">normas de la comunidad</Link>,
          la política de privacidad y soy mayor de 18 años (RGPD Art. 6.1.a)
        </span>
      </label>
      {error && <p className="text-red-400 text-sm text-center">{error}</p>}
      <button onClick={handleRegister}
        className="w-full py-4 bg-gradient-to-r from-c8l-gold to-c8l-pink text-black rounded-xl font-bold text-lg hover:scale-105 transition">
        🎉 Crear Cuenta
      </button>
      <p className="text-xs text-center text-gray-600">
        🎁 Bonus de bienvenida: 100 C8L Coins
      </p>
    </div>
  )
}

function UserProfile({ session, onLogout }: { session: { username: string; role: string }; onLogout: () => void }) {
  const [user, setUser] = useState<User | null>(null)

  useEffect(() => {
    const users = getUsers()
    const found = users.find(u => u.username === session.username)
    if (found) setUser(found)
  }, [session])

  return (
    <div className="min-h-screen bg-gradient-to-b from-c8l-black via-purple-950/10 to-c8l-black">
      <header className="glass border-b border-c8l-purple/20 p-4">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/" className="text-2xl font-outfit font-bold text-c8l-gold">C8L</Link>
            <span className="text-gray-500">|</span>
            <h1 className="text-xl font-outfit font-semibold">👤 Mi Perfil</h1>
          </div>
          <button onClick={onLogout} className="text-xs text-gray-400 hover:text-red-400 transition">
            Cerrar sesión
          </button>
        </div>
      </header>

      <main className="max-w-4xl mx-auto p-6">
        <div className="glass rounded-2xl p-8 text-center mb-6">
          <div className="w-24 h-24 mx-auto rounded-full bg-gradient-to-br from-c8l-purple to-c8l-gold flex items-center justify-center text-4xl mb-4">
            {session.role === 'owner' ? '👑' : session.role === 'bot' ? '🤖' : '👤'}
          </div>
          <h2 className="text-2xl font-outfit font-bold text-white">@{session.username}</h2>
          <p className="text-sm text-gray-400 capitalize mt-1">
            {session.role === 'owner' ? '👑 Propietario' : session.role === 'bot' ? '🤖 Bot' : session.role === 'admin' ? '⭐ Admin' : session.role === 'moderator' ? '🛡️ Moderador' : '👤 Miembro'}
          </p>
        </div>

        {user && (
          <div className="grid md:grid-cols-3 gap-4 mb-6">
            <div className="glass rounded-xl p-4 text-center">
              <div className="text-2xl font-bold text-c8l-gold">💰 {user.coins.toLocaleString()}</div>
              <div className="text-xs text-gray-500">C8L Coins</div>
            </div>
            <div className="glass rounded-xl p-4 text-center">
              <div className="text-2xl font-bold text-green-400">
                {user.warnings === 0 ? '✅' : `⚠️ ${user.warnings}`}
              </div>
              <div className="text-xs text-gray-500">Avisos</div>
            </div>
            <div className="glass rounded-xl p-4 text-center">
              <div className="text-2xl font-bold text-c8l-purple">
                {new Date(user.createdAt).toLocaleDateString('es')}
              </div>
              <div className="text-xs text-gray-500">Miembro desde</div>
            </div>
          </div>
        )}

        <div className="grid md:grid-cols-2 gap-4">
          <Link href="/casino" className="glass rounded-xl p-6 hover:border-c8l-purple/50 transition group">
            <div className="text-3xl mb-2">🎰</div>
            <h3 className="font-bold group-hover:text-c8l-gold transition">Casino Quantum</h3>
            <p className="text-xs text-gray-500">Juega con tus coins</p>
          </Link>
          <Link href="/studio" className="glass rounded-xl p-6 hover:border-c8l-purple/50 transition group">
            <div className="text-3xl mb-2">🎵</div>
            <h3 className="font-bold group-hover:text-c8l-gold transition">Estudio Musical</h3>
            <p className="text-xs text-gray-500">Crea música con IA</p>
          </Link>
          <Link href="/tv" className="glass rounded-xl p-6 hover:border-c8l-purple/50 transition group">
            <div className="text-3xl mb-2">📺</div>
            <h3 className="font-bold group-hover:text-c8l-gold transition">C8L TV</h3>
            <p className="text-xs text-gray-500">Mira contenido</p>
          </Link>
          <Link href="/bandos" className="glass rounded-xl p-6 hover:border-c8l-purple/50 transition group">
            <div className="text-3xl mb-2">⚔️</div>
            <h3 className="font-bold group-hover:text-c8l-gold transition">Bandos</h3>
            <p className="text-xs text-gray-500">Únete a una familia</p>
          </Link>
        </div>
      </main>
    </div>
  )
}
