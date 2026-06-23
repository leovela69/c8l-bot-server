'use client'
import { useState, useRef, useEffect } from 'react'
import { sendChatMessage, ChatResponse } from '@/lib/bot/chatEngine'
import { addMessage, generateId } from '@/lib/controlCenter/store'

interface Message {
  id: string
  role: 'user' | 'bot'
  content: string
  timestamp: string
  flagged?: boolean
}

export default function ChatWidget() {
  const [isOpen, setIsOpen] = useState(false)
  const [messages, setMessages] = useState<Message[]>([
    { id: '0', role: 'bot', content: '🤖 ¡Hola! Soy el Bot de C8L Agency. Estoy aquí para ayudarte, vigilar el orden y hacerte pasar un buen rato. ¿En qué te puedo ayudar?', timestamp: new Date().toISOString() }
  ])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [username] = useState(() => `user_${Math.random().toString(36).slice(2, 6)}`)
  const messagesEnd = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    messagesEnd.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  useEffect(() => {
    if (isOpen) inputRef.current?.focus()
  }, [isOpen])

  const getCurrentSection = (): string => {
    if (typeof window === 'undefined') return 'home'
    const path = window.location.pathname
    if (path.includes('casino')) return 'Casino'
    if (path.includes('studio')) return 'Estudio'
    if (path.includes('karaoke')) return 'Karaoke'
    if (path.includes('lives')) return 'Lives'
    if (path.includes('bandos')) return 'Bandos'
    if (path.includes('tv')) return 'C8L TV'
    if (path.includes('monedero')) return 'Monedero'
    if (path.includes('control')) return 'Control Center'
    return 'Home'
  }

  const handleSend = async () => {
    if (!input.trim() || loading) return
    const userMsg: Message = {
      id: generateId(),
      role: 'user',
      content: input.trim(),
      timestamp: new Date().toISOString()
    }
    setMessages(prev => [...prev, userMsg])
    setInput('')
    setLoading(true)

    // Store in Control Center
    addMessage({
      id: userMsg.id,
      role: 'user',
      content: userMsg.content,
      username,
      timestamp: userMsg.timestamp,
      section: getCurrentSection()
    })

    try {
      const history = messages.slice(-10).map(m => ({
        role: m.role === 'bot' ? 'assistant' : 'user',
        content: m.content
      }))

      const response: ChatResponse = await sendChatMessage(
        userMsg.content,
        username,
        getCurrentSection(),
        history
      )

      const botMsg: Message = {
        id: generateId(),
        role: 'bot',
        content: response.message,
        timestamp: new Date().toISOString(),
        flagged: response.moderation?.flagged
      }
      setMessages(prev => [...prev, botMsg])

      // Store bot response too
      addMessage({
        id: botMsg.id,
        role: 'bot',
        content: botMsg.content,
        username: 'c8l_bot',
        timestamp: botMsg.timestamp,
        section: getCurrentSection()
      })
    } catch (error) {
      setMessages(prev => [...prev, {
        id: generateId(),
        role: 'bot',
        content: '⚠️ Error de conexión. Intenta de nuevo.',
        timestamp: new Date().toISOString()
      }])
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      {/* Floating Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-6 right-6 z-50 w-16 h-16 rounded-full bg-gradient-to-r from-c8l-purple to-c8l-gold shadow-2xl flex items-center justify-center text-2xl hover:scale-110 transition-transform animate-float"
        title="Chat con C8L Bot"
      >
        {isOpen ? '✕' : '🤖'}
      </button>

      {/* Chat Panel */}
      {isOpen && (
        <div className="fixed bottom-24 right-6 z-50 w-[380px] max-w-[calc(100vw-2rem)] h-[520px] glass-dark rounded-2xl flex flex-col overflow-hidden shadow-2xl border border-c8l-purple/30">
          {/* Header */}
          <div className="bg-gradient-to-r from-c8l-purple/80 to-c8l-gold/60 p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-black/30 flex items-center justify-center text-xl">🤖</div>
            <div className="flex-1">
              <h3 className="font-outfit font-bold text-sm">C8L Bot</h3>
              <p className="text-xs text-white/70">Asistente & Policía • En línea</p>
            </div>
            <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {messages.map(msg => (
              <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm ${
                  msg.role === 'user'
                    ? 'bg-c8l-purple/40 text-white rounded-br-sm'
                    : msg.flagged
                      ? 'bg-red-900/30 text-white rounded-bl-sm border border-red-500/30'
                      : 'bg-gray-800/80 text-white rounded-bl-sm'
                }`}>
                  <p className="whitespace-pre-wrap">{msg.content}</p>
                  <p className="text-[10px] text-gray-500 mt-1 text-right">
                    {new Date(msg.timestamp).toLocaleTimeString('es', { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex justify-start">
                <div className="bg-gray-800/80 rounded-2xl rounded-bl-sm px-4 py-3">
                  <div className="flex gap-1">
                    <div className="w-2 h-2 bg-c8l-gold rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                    <div className="w-2 h-2 bg-c8l-gold rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                    <div className="w-2 h-2 bg-c8l-gold rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEnd} />
          </div>

          {/* Input */}
          <div className="p-3 border-t border-gray-700/50">
            <div className="flex gap-2">
              <input
                ref={inputRef}
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleSend()}
                placeholder="Escribe un mensaje..."
                className="flex-1 bg-black/50 border border-gray-700 rounded-xl px-4 py-2.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-c8l-gold/50"
                disabled={loading}
              />
              <button
                onClick={handleSend}
                disabled={!input.trim() || loading}
                className="w-10 h-10 rounded-xl bg-c8l-gold/80 flex items-center justify-center text-black font-bold hover:bg-c8l-gold transition disabled:opacity-30"
              >
                ➤
              </button>
            </div>
            <p className="text-[10px] text-gray-600 mt-1 text-center">
              🛡️ Mensajes monitoreados • Normas de la comunidad activas
            </p>
          </div>
        </div>
      )}
    </>
  )
}
