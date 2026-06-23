'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { ADMIN_CREDENTIALS, BOT_CREDENTIALS } from '@/lib/firebase/config'
import { getUsers, getReports, getMessages, getStats, resolveReport, addUser, updateUser, generateId, getSession, setSession, clearSession } from '@/lib/controlCenter/store'
import { User, BotReport, ChatMessage, SystemStats } from '@/lib/controlCenter/types'
import { NORMAS, SANCIONES, getBloqueos, addBloqueo, removeBloqueo, calcularFechaFin, Bloqueo } from '@/lib/controlCenter/normas'

type Tab = 'dashboard' | 'users' | 'reports' | 'chat' | 'normas' | 'config'

export default function ControlCenterPage() {
  const [isAuth, setIsAuth] = useState(false)
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [loginError, setLoginError] = useState('')
  const [currentUser, setCurrentUser] = useState<{ username: string; role: string } | null>(null)

  useEffect(() => {
    const session = getSession()
    if (session) {
      setIsAuth(true)
      setCurrentUser(session)
    }
  }, [])

  const handleLogin = () => {
    setLoginError('')
    if (
      (username === ADMIN_CREDENTIALS.username && password === ADMIN_CREDENTIALS.password) ||
      (username === BOT_CREDENTIALS.username && password === BOT_CREDENTIALS.password)
    ) {
      const role = username === ADMIN_CREDENTIALS.username ? ADMIN_CREDENTIALS.role : BOT_CREDENTIALS.role
      setSession(username, role)
      setCurrentUser({ username, role })
      setIsAuth(true)
    } else {
      setLoginError('❌ Credenciales inválidas. Solo personal autorizado.')
    }
  }

  const handleLogout = () => {
    clearSession()
    setIsAuth(false)
    setCurrentUser(null)
    setUsername('')
    setPassword('')
  }

  if (!isAuth) {
    return <LoginScreen username={username} password={password} error={loginError}
      onUsernameChange={setUsername} onPasswordChange={setPassword} onLogin={handleLogin} />
  }

  return <Dashboard currentUser={currentUser!} onLogout={handleLogout} />
}

function LoginScreen({ username, password, error, onUsernameChange, onPasswordChange, onLogin }: any) {
  return (
    <div className="min-h-screen bg-c8l-black flex items-center justify-center p-6">
      <div className="glass rounded-2xl p-8 max-w-md w-full border border-c8l-gold/30">
        <div className="text-center mb-8">
          <div className="text-5xl mb-4">🛡️</div>
          <h1 className="text-3xl font-outfit font-bold text-c8l-gold">Control Center</h1>
          <p className="text-gray-400 text-sm mt-2">Acceso restringido. Solo personal autorizado.</p>
        </div>
        <div className="space-y-4">
          <div>
            <label className="text-xs text-gray-400 block mb-1">Usuario</label>
            <input value={username} onChange={e => onUsernameChange(e.target.value)}
              className="w-full bg-black border border-gray-700 rounded-lg p-3 text-white focus:outline-none focus:border-c8l-gold"
              placeholder="tu_usuario" onKeyDown={e => e.key === 'Enter' && onLogin()} />
          </div>
          <div>
            <label className="text-xs text-gray-400 block mb-1">Contraseña</label>
            <input type="password" value={password} onChange={e => onPasswordChange(e.target.value)}
              className="w-full bg-black border border-gray-700 rounded-lg p-3 text-white focus:outline-none focus:border-c8l-gold"
              placeholder="••••••••••" onKeyDown={e => e.key === 'Enter' && onLogin()} />
          </div>
          {error && <p className="text-red-400 text-sm text-center">{error}</p>}
          <button onClick={onLogin}
            className="w-full py-4 bg-gradient-to-r from-c8l-gold to-amber-600 text-black rounded-xl font-bold text-lg hover:scale-105 transition">
            🔐 Acceder
          </button>
        </div>
        <p className="text-xs text-gray-600 text-center mt-6">
          🛡️ C8L Agency — Sistema de Control Interno
        </p>
      </div>
    </div>
  )
}

function Dashboard({ currentUser, onLogout }: { currentUser: { username: string; role: string }; onLogout: () => void }) {
  const [tab, setTab] = useState<Tab>('dashboard')
  const [stats, setStats] = useState<SystemStats | null>(null)
  const [users, setUsers] = useState<User[]>([])
  const [reports, setReports] = useState<BotReport[]>([])
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [bloqueos, setBloqueos] = useState<Bloqueo[]>([])

  useEffect(() => {
    refreshData()
    const iv = setInterval(refreshData, 5000)
    return () => clearInterval(iv)
  }, [])

  const refreshData = () => {
    setStats(getStats())
    setUsers(getUsers())
    setReports(getReports())
    setMessages(getMessages())
    setBloqueos(getBloqueos())
  }

  return (
    <div className="min-h-screen bg-c8l-black">
      {/* Top Bar */}
      <header className="glass border-b border-c8l-gold/30 p-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/" className="text-2xl font-outfit font-bold text-c8l-gold">C8L</Link>
            <span className="text-gray-500">|</span>
            <h1 className="text-lg font-outfit font-semibold text-red-400">🛡️ Control Center</h1>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-xs text-gray-400">
              {currentUser.role === 'owner' ? '👑' : '🤖'} @{currentUser.username}
            </span>
            <button onClick={onLogout} className="text-xs text-gray-500 hover:text-red-400 transition">Salir</button>
          </div>
        </div>
      </header>

      {/* Tabs */}
      <div className="max-w-7xl mx-auto px-6 pt-4">
        <div className="flex gap-2 border-b border-gray-800 pb-2 overflow-x-auto">
          {([
            ['dashboard', '📊 Dashboard'],
            ['users', '👥 Usuarios'],
            ['reports', '🚨 Reportes'],
            ['normas', '⚖️ Normas & Bloqueos'],
            ['chat', '💬 Chat Log'],
            ['config', '⚙️ Config'],
          ] as [Tab, string][]).map(([id, label]) => (
            <button key={id} onClick={() => setTab(id)}
              className={`px-4 py-2 rounded-lg text-sm font-bold whitespace-nowrap transition ${
                tab === id ? 'bg-c8l-gold text-black' : 'text-gray-400 hover:text-white hover:bg-gray-800'
              }`}>
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <main className="max-w-7xl mx-auto p-6">
        {tab === 'dashboard' && stats && <DashboardView stats={stats} reports={reports} />}
        {tab === 'users' && <UsersView users={users} onRefresh={refreshData} />}
        {tab === 'reports' && <ReportsView reports={reports} onRefresh={refreshData} />}
        {tab === 'normas' && <NormasView users={users} bloqueos={bloqueos} onRefresh={refreshData} />}
        {tab === 'chat' && <ChatLogView messages={messages} />}
        {tab === 'config' && <ConfigView />}
      </main>
    </div>
  )
}

function DashboardView({ stats, reports }: { stats: SystemStats; reports: BotReport[] }) {
  return (
    <div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <StatCard icon="👥" label="Usuarios" value={stats.totalUsers.toString()} color="purple" />
        <StatCard icon="🟢" label="Activos" value={stats.activeNow.toString()} color="green" />
        <StatCard icon="💬" label="Mensajes" value={stats.totalMessages.toString()} color="cyan" />
        <StatCard icon="🚨" label="Reportes" value={stats.totalReports.toString()} color="red" />
      </div>
      <div className="grid md:grid-cols-2 gap-6">
        <div className="glass rounded-xl p-6">
          <h3 className="font-outfit font-bold text-lg mb-4 text-c8l-gold">🤖 Estado del Bot</h3>
          <div className="space-y-3">
            <div className="flex justify-between"><span className="text-gray-400">Status</span><span className="text-green-400 font-bold">🟢 Online</span></div>
            <div className="flex justify-between"><span className="text-gray-400">Uptime</span><span>{stats.uptime}</span></div>
            <div className="flex justify-between"><span className="text-gray-400">Infracciones</span><span className="text-red-400">{stats.infractions}</span></div>
            <div className="flex justify-between"><span className="text-gray-400">Modelo</span><span className="text-xs text-gray-300">qwen3-30b-a3b</span></div>
          </div>
        </div>
        <div className="glass rounded-xl p-6">
          <h3 className="font-outfit font-bold text-lg mb-4 text-red-400">🚨 Últimos Reportes</h3>
          <div className="space-y-2 max-h-60 overflow-y-auto">
            {reports.slice(0, 8).map(r => (
              <div key={r.id} className={`p-2 rounded text-xs border-l-2 ${
                r.severity === 'high' ? 'border-red-500 bg-red-900/10' :
                r.severity === 'medium' ? 'border-yellow-500 bg-yellow-900/10' :
                'border-gray-600 bg-gray-800/30'
              }`}>
                <p className="text-gray-300 truncate">{r.message}</p>
                <p className="text-gray-600 mt-1">{new Date(r.timestamp).toLocaleTimeString('es')}</p>
              </div>
            ))}
            {reports.length === 0 && <p className="text-gray-600 text-sm">Sin reportes aún. El bot está vigilando.</p>}
          </div>
        </div>
      </div>
    </div>
  )
}

function StatCard({ icon, label, value, color }: { icon: string; label: string; value: string; color: string }) {
  const colors: Record<string, string> = {
    purple: 'border-c8l-purple/30 text-c8l-purple',
    green: 'border-green-500/30 text-green-400',
    cyan: 'border-c8l-cyan/30 text-c8l-cyan',
    red: 'border-red-500/30 text-red-400',
    gold: 'border-c8l-gold/30 text-c8l-gold'
  }
  return (
    <div className={`glass rounded-xl p-4 border ${colors[color]}`}>
      <div className="text-2xl mb-1">{icon}</div>
      <div className="text-2xl font-mono font-bold">{value}</div>
      <div className="text-xs text-gray-500">{label}</div>
    </div>
  )
}

function UsersView({ users, onRefresh }: { users: User[]; onRefresh: () => void }) {
  const [newUsername, setNewUsername] = useState('')
  const [newRole, setNewRole] = useState<'admin' | 'moderator' | 'user'>('user')

  const handleAdd = () => {
    if (!newUsername.trim()) return
    addUser({
      id: generateId(),
      username: newUsername.trim().toLowerCase(),
      role: newRole,
      createdAt: new Date().toISOString(),
      lastActive: new Date().toISOString(),
      status: 'active',
      warnings: 0,
      coins: 100,
    })
    setNewUsername('')
    onRefresh()
  }

  return (
    <div>
      {/* Add User */}
      <div className="glass rounded-xl p-4 mb-6 flex gap-3 items-end">
        <div className="flex-1">
          <label className="text-xs text-gray-400 block mb-1">Nuevo usuario</label>
          <input value={newUsername} onChange={e => setNewUsername(e.target.value)} placeholder="nombre_usuario"
            className="w-full bg-black border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-c8l-gold" />
        </div>
        <div>
          <label className="text-xs text-gray-400 block mb-1">Rol</label>
          <select value={newRole} onChange={e => setNewRole(e.target.value as any)}
            className="bg-black border border-gray-700 rounded-lg px-3 py-2 text-sm text-white">
            <option value="user">Usuario</option>
            <option value="moderator">Moderador</option>
            <option value="admin">Admin</option>
          </select>
        </div>
        <button onClick={handleAdd} className="px-4 py-2 bg-c8l-gold text-black rounded-lg font-bold text-sm hover:scale-105 transition">
          ➕ Añadir
        </button>
      </div>

      {/* Users Table */}
      <div className="glass rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-800/50">
            <tr>
              <th className="text-left p-3 text-gray-400">Usuario</th>
              <th className="text-left p-3 text-gray-400">Rol</th>
              <th className="text-left p-3 text-gray-400">Estado</th>
              <th className="text-left p-3 text-gray-400">Avisos</th>
              <th className="text-left p-3 text-gray-400">Coins</th>
              <th className="text-left p-3 text-gray-400">Último activo</th>
            </tr>
          </thead>
          <tbody>
            {users.map(u => (
              <tr key={u.id} className="border-t border-gray-800 hover:bg-gray-800/30">
                <td className="p-3 font-medium">
                  {u.role === 'owner' ? '👑' : u.role === 'bot' ? '🤖' : u.role === 'admin' ? '⭐' : u.role === 'moderator' ? '🛡️' : '👤'} @{u.username}
                </td>
                <td className="p-3"><span className={`px-2 py-0.5 rounded text-xs ${
                  u.role === 'owner' ? 'bg-amber-900/50 text-amber-400' :
                  u.role === 'bot' ? 'bg-purple-900/50 text-purple-400' :
                  u.role === 'admin' ? 'bg-blue-900/50 text-blue-400' :
                  'bg-gray-800 text-gray-400'
                }`}>{u.role}</span></td>
                <td className="p-3"><span className={`text-xs ${u.status === 'active' ? 'text-green-400' : u.status === 'banned' ? 'text-red-400' : 'text-yellow-400'}`}>{u.status}</span></td>
                <td className="p-3 text-center">{u.warnings > 0 ? <span className="text-yellow-400">⚠️ {u.warnings}</span> : '✅'}</td>
                <td className="p-3 font-mono text-c8l-gold">{u.coins.toLocaleString()}</td>
                <td className="p-3 text-xs text-gray-500">{new Date(u.lastActive).toLocaleDateString('es')}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function ReportsView({ reports, onRefresh }: { reports: BotReport[]; onRefresh: () => void }) {
  const handleResolve = (id: string) => {
    resolveReport(id)
    onRefresh()
  }
  return (
    <div className="space-y-3">
      {reports.length === 0 && (
        <div className="glass rounded-xl p-8 text-center">
          <div className="text-4xl mb-3">✅</div>
          <p className="text-gray-400">No hay reportes pendientes. Todo en orden.</p>
        </div>
      )}
      {reports.map(r => (
        <div key={r.id} className={`glass rounded-xl p-4 border-l-4 ${
          r.severity === 'critical' ? 'border-red-600' :
          r.severity === 'high' ? 'border-red-400' :
          r.severity === 'medium' ? 'border-yellow-400' :
          r.severity === 'low' ? 'border-blue-400' :
          'border-gray-600'
        } ${r.resolved ? 'opacity-50' : ''}`}>
          <div className="flex justify-between items-start">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs px-2 py-0.5 rounded bg-gray-800">{r.type}</span>
                <span className={`text-xs font-bold ${
                  r.severity === 'high' || r.severity === 'critical' ? 'text-red-400' :
                  r.severity === 'medium' ? 'text-yellow-400' : 'text-gray-400'
                }`}>{r.severity.toUpperCase()}</span>
                <span className="text-xs text-gray-500">• {r.section}</span>
              </div>
              <p className="text-sm text-gray-200">{r.message}</p>
              <p className="text-xs text-gray-600 mt-1">{new Date(r.timestamp).toLocaleString('es')}</p>
            </div>
            {!r.resolved && (
              <button onClick={() => handleResolve(r.id)}
                className="text-xs px-3 py-1 bg-green-900/50 text-green-400 rounded hover:bg-green-900 transition">
                ✓ Resolver
              </button>
            )}
          </div>
        </div>
      ))}
    </div>
  )
}

function ChatLogView({ messages }: { messages: ChatMessage[] }) {
  return (
    <div className="glass rounded-xl p-6">
      <h3 className="font-outfit font-bold text-lg mb-4">💬 Registro de Conversaciones</h3>
      <div className="space-y-2 max-h-[600px] overflow-y-auto">
        {messages.length === 0 && <p className="text-gray-600 text-sm">Sin mensajes registrados aún.</p>}
        {messages.slice(-100).map(m => (
          <div key={m.id} className="flex gap-3 p-2 rounded hover:bg-gray-800/30">
            <span className="text-lg">{m.role === 'bot' ? '🤖' : '👤'}</span>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-c8l-gold">@{m.username}</span>
                <span className="text-xs text-gray-600">{m.section}</span>
                <span className="text-xs text-gray-700">{new Date(m.timestamp).toLocaleTimeString('es')}</span>
              </div>
              <p className="text-sm text-gray-300 truncate">{m.content}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}



function NormasView({ users, bloqueos, onRefresh }: { users: User[]; bloqueos: Bloqueo[]; onRefresh: () => void }) {
  const [selectedUser, setSelectedUser] = useState('')
  const [selectedNivel, setSelectedNivel] = useState<'leve' | 'media' | 'grave' | 'permanente'>('leve')
  const [selectedNorma, setSelectedNorma] = useState(1)
  const [motivo, setMotivo] = useState('')

  const handleBloquear = () => {
    if (!selectedUser || !motivo) return
    const bloqueo: Bloqueo = {
      id: generateId(),
      userId: selectedUser,
      username: selectedUser,
      nivel: selectedNivel,
      normaViolada: selectedNorma,
      motivo,
      fechaInicio: new Date().toISOString(),
      fechaFin: calcularFechaFin(selectedNivel),
      activo: true,
      ejecutadoPor: 'admin',
    }
    addBloqueo(bloqueo)
    // Update user status
    const user = users.find(u => u.username === selectedUser)
    if (user) {
      updateUser(user.id, {
        status: selectedNivel === 'permanente' ? 'banned' : 'suspended',
        warnings: user.warnings + 1,
      })
    }
    setSelectedUser('')
    setMotivo('')
    onRefresh()
  }

  const handleDesbloquear = (id: string, username: string) => {
    removeBloqueo(id)
    const user = users.find(u => u.username === username)
    if (user) {
      updateUser(user.id, { status: 'active' })
    }
    onRefresh()
  }

  return (
    <div className="space-y-8">
      {/* Normas de la Comunidad */}
      <div className="glass rounded-xl p-6">
        <h3 className="font-outfit font-bold text-xl mb-4 text-c8l-gold">📜 Normas de la Comunidad</h3>
        <div className="grid md:grid-cols-2 gap-3">
          {NORMAS.map(n => (
            <div key={n.id} className="flex items-start gap-3 p-3 rounded-lg bg-gray-800/30 border border-gray-700/50">
              <span className="text-lg font-bold text-c8l-gold">{n.id}.</span>
              <div>
                <p className="font-semibold text-sm text-white">{n.titulo}</p>
                <p className="text-xs text-gray-400">{n.descripcion}</p>
                <span className={`text-[10px] px-2 py-0.5 rounded mt-1 inline-block ${
                  n.categoria === 'comportamiento' ? 'bg-blue-900/50 text-blue-400' :
                  n.categoria === 'contenido' ? 'bg-purple-900/50 text-purple-400' :
                  n.categoria === 'seguridad' ? 'bg-red-900/50 text-red-400' :
                  'bg-green-900/50 text-green-400'
                }`}>{n.categoria}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Sistema de Sanciones */}
      <div className="glass rounded-xl p-6">
        <h3 className="font-outfit font-bold text-xl mb-4 text-red-400">⚖️ Sistema de Sanciones</h3>
        <div className="grid md:grid-cols-4 gap-3">
          {SANCIONES.map(s => (
            <div key={s.nivel} className={`p-4 rounded-xl border-l-4 ${
              s.color === 'blue' ? 'border-blue-500 bg-blue-900/10' :
              s.color === 'yellow' ? 'border-yellow-500 bg-yellow-900/10' :
              s.color === 'orange' ? 'border-orange-500 bg-orange-900/10' :
              'border-red-500 bg-red-900/10'
            }`}>
              <div className="text-2xl mb-2">{s.emoji}</div>
              <h4 className="font-bold text-sm capitalize mb-1">{s.nivel}</h4>
              <p className="text-xs text-gray-400 mb-1">{s.duracion}</p>
              <p className="text-xs text-gray-500">{s.descripcion}</p>
              <p className="text-[10px] text-gray-600 mt-2">{s.articulos}</p>
              <p className="text-[10px] text-gray-600">Apelación: {s.apelacion}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Bloquear Usuario */}
      <div className="glass rounded-xl p-6 border border-red-500/20">
        <h3 className="font-outfit font-bold text-xl mb-4 text-red-400">🚫 Bloquear Cuenta</h3>
        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <label className="text-xs text-gray-400 block mb-1">Usuario a sancionar</label>
            <select value={selectedUser} onChange={e => setSelectedUser(e.target.value)}
              className="w-full bg-black border border-gray-700 rounded-lg px-3 py-2 text-sm text-white">
              <option value="">-- Seleccionar --</option>
              {users.filter(u => u.role === 'user' || u.role === 'moderator').map(u => (
                <option key={u.id} value={u.username}>@{u.username}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-xs text-gray-400 block mb-1">Nivel de sanción</label>
            <select value={selectedNivel} onChange={e => setSelectedNivel(e.target.value as any)}
              className="w-full bg-black border border-gray-700 rounded-lg px-3 py-2 text-sm text-white">
              {SANCIONES.map(s => (
                <option key={s.nivel} value={s.nivel}>{s.emoji} {s.nivel.toUpperCase()} ({s.duracion})</option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-xs text-gray-400 block mb-1">Norma violada</label>
            <select value={selectedNorma} onChange={e => setSelectedNorma(Number(e.target.value))}
              className="w-full bg-black border border-gray-700 rounded-lg px-3 py-2 text-sm text-white">
              {NORMAS.map(n => (
                <option key={n.id} value={n.id}>{n.id}. {n.titulo}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-xs text-gray-400 block mb-1">Motivo detallado</label>
            <input value={motivo} onChange={e => setMotivo(e.target.value)}
              placeholder="Descripción de la infracción..."
              className="w-full bg-black border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-red-500" />
          </div>
        </div>
        <button onClick={handleBloquear} disabled={!selectedUser || !motivo}
          className="mt-4 px-6 py-3 bg-red-600 hover:bg-red-700 text-white rounded-xl font-bold text-sm transition disabled:opacity-30 disabled:cursor-not-allowed">
          🚫 Ejecutar Bloqueo
        </button>
      </div>

      {/* Bloqueos Activos */}
      <div className="glass rounded-xl p-6">
        <h3 className="font-outfit font-bold text-xl mb-4 text-orange-400">🔒 Bloqueos Activos</h3>
        {bloqueos.filter(b => b.activo).length === 0 ? (
          <p className="text-gray-500 text-sm text-center py-4">✅ No hay usuarios bloqueados actualmente.</p>
        ) : (
          <div className="space-y-3">
            {bloqueos.filter(b => b.activo).map(b => {
              const sancion = SANCIONES.find(s => s.nivel === b.nivel)
              const norma = NORMAS.find(n => n.id === b.normaViolada)
              return (
                <div key={b.id} className={`p-4 rounded-xl border-l-4 flex justify-between items-center ${
                  b.nivel === 'permanente' ? 'border-red-500 bg-red-900/10' :
                  b.nivel === 'grave' ? 'border-orange-500 bg-orange-900/10' :
                  b.nivel === 'media' ? 'border-yellow-500 bg-yellow-900/10' :
                  'border-blue-500 bg-blue-900/10'
                }`}>
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-bold text-sm">@{b.username}</span>
                      <span className="text-xs px-2 py-0.5 rounded bg-gray-800">{sancion?.emoji} {b.nivel}</span>
                      <span className="text-xs text-gray-500">por {b.ejecutadoPor === 'bot' ? '🤖 Bot' : '👑 Admin'}</span>
                    </div>
                    <p className="text-xs text-gray-400">Norma: {norma?.titulo} — {b.motivo}</p>
                    <p className="text-xs text-gray-600">
                      Desde: {new Date(b.fechaInicio).toLocaleDateString('es')}
                      {b.fechaFin ? ` • Hasta: ${new Date(b.fechaFin).toLocaleDateString('es')}` : ' • PERMANENTE'}
                    </p>
                  </div>
                  <button onClick={() => handleDesbloquear(b.id, b.username)}
                    className="px-3 py-1.5 bg-green-900/50 text-green-400 rounded-lg text-xs font-bold hover:bg-green-900 transition">
                    🔓 Desbloquear
                  </button>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Historial de Bloqueos */}
      {bloqueos.filter(b => !b.activo).length > 0 && (
        <div className="glass rounded-xl p-6 opacity-70">
          <h3 className="font-outfit font-bold text-lg mb-4 text-gray-400">📋 Historial de Sanciones</h3>
          <div className="space-y-2">
            {bloqueos.filter(b => !b.activo).map(b => (
              <div key={b.id} className="flex items-center gap-3 p-2 rounded bg-gray-800/20 text-xs">
                <span className="text-gray-500">✓</span>
                <span className="font-medium">@{b.username}</span>
                <span className="text-gray-600">{b.nivel} — {b.motivo}</span>
                <span className="text-gray-700 ml-auto">{new Date(b.fechaInicio).toLocaleDateString('es')}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

function ConfigView() {
  return (
    <div className="grid md:grid-cols-2 gap-6">
      <div className="glass rounded-xl p-6">
        <h3 className="font-outfit font-bold text-lg mb-4 text-c8l-gold">🤖 Bot Config</h3>
        <div className="space-y-3 text-sm">
          <div className="flex justify-between"><span className="text-gray-400">Modelo</span><span>qwen3-30b-a3b:free</span></div>
          <div className="flex justify-between"><span className="text-gray-400">Modelo Pro</span><span>qwen3-235b-a22b:free</span></div>
          <div className="flex justify-between"><span className="text-gray-400">Provider</span><span>OpenRouter</span></div>
          <div className="flex justify-between"><span className="text-gray-400">Max tokens</span><span>500</span></div>
          <div className="flex justify-between"><span className="text-gray-400">Temperature</span><span>0.8</span></div>
        </div>
      </div>
      <div className="glass rounded-xl p-6">
        <h3 className="font-outfit font-bold text-lg mb-4 text-red-400">🚨 Moderación</h3>
        <div className="space-y-3 text-sm">
          <div className="flex justify-between"><span className="text-gray-400">Auto-ban</span><span className="text-green-400">Activo</span></div>
          <div className="flex justify-between"><span className="text-gray-400">Warnings antes de ban</span><span>3</span></div>
          <div className="flex justify-between"><span className="text-gray-400">Filtro lenguaje</span><span className="text-green-400">Activo</span></div>
          <div className="flex justify-between"><span className="text-gray-400">Reportes auto</span><span className="text-green-400">Activo</span></div>
        </div>
      </div>
      <div className="glass rounded-xl p-6 md:col-span-2">
        <h3 className="font-outfit font-bold text-lg mb-4 text-c8l-purple">🔑 Credenciales</h3>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div><span className="text-gray-400 block text-xs">Admin User</span><code className="text-c8l-gold">leovela</code></div>
          <div><span className="text-gray-400 block text-xs">Bot User</span><code className="text-c8l-purple">c8l_bot</code></div>
          <div><span className="text-gray-400 block text-xs">API</span><code className="text-gray-300">OpenRouter (Qwen3 Free)</code></div>
          <div><span className="text-gray-400 block text-xs">Hosting</span><code className="text-gray-300">Firebase Hosting</code></div>
        </div>
      </div>
    </div>
  )
}
