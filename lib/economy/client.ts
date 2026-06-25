// lib/economy/client.ts — Cliente TypeScript para la API económica C8L
// Conecta la web Next.js con el backend economy/api.py

const API_BASE = process.env.NEXT_PUBLIC_ECONOMY_API || ''

// ================================================================
// TYPES
// ================================================================

export interface WalletBalance {
  user_id: string
  coins: number
  diamonds: number
  real_balance: number
  casino_chips: number
  is_admin: boolean
}

export interface EarnResult {
  success: boolean
  new_balance?: number
  earned?: number
  error?: string
}

export interface SpendResult {
  success: boolean
  new_balance?: number
  spent?: number
  error?: string
  current?: number
}

export interface ConversionResult {
  success: boolean
  coins_used?: number
  fee_coins?: number
  diamonds_received?: number
  new_coins?: number
  new_diamonds?: number
  error?: string
}

export interface WithdrawalResult {
  success: boolean
  withdrawal_id?: string
  diamonds_used?: number
  gross_eur?: number
  fee_eur?: number
  net_eur?: number
  tier?: string
  hold_until?: string
  status?: string
  error?: string
}

export interface SubscriptionPlan {
  name: string
  display_name: string
  price_monthly: number | null
  price_yearly: number | null
  price_lifetime?: number | null
  coins_monthly: number
  trial_days: number
  max_members: number
  features: Record<string, boolean | string | number>
}

export interface UserSubscription {
  plan: string
  display_name?: string
  status: string
  billing_cycle?: string
  end_date?: string
  is_trial?: boolean
  trial_ends_at?: string
  auto_renew?: boolean
  coins_monthly?: number
  features: Record<string, boolean | string | number>
}

export interface SubscribeResult {
  success: boolean
  session_url?: string
  session_id?: string
  plan?: string
  billing?: string
  price?: number
  error?: string
}

export interface SaleResult {
  success: boolean
  sale_id?: string
  total_eur?: number
  breakdown?: {
    c8l: number
    faction: number
    streamer: number
    creator: number
    referral_discount: number
  }
  hold_until?: string
  error?: string
}

// ================================================================
// API CLIENT
// ================================================================

async function apiFetch<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const url = `${API_BASE}${endpoint}`
  try {
    const res = await fetch(url, {
      headers: { 'Content-Type': 'application/json' },
      ...options,
    })
    return await res.json()
  } catch (error) {
    console.error(`[C8L Economy] API error ${endpoint}:`, error)
    throw error
  }
}

// ================================================================
// WALLET
// ================================================================

export async function getBalance(userId: string): Promise<WalletBalance> {
  return apiFetch(`/api/balance/${userId}`)
}

export async function earnCoins(userId: string, amount: number, source: string, description?: string): Promise<EarnResult> {
  return apiFetch('/api/earn', {
    method: 'POST',
    body: JSON.stringify({ user_id: userId, amount, source, description }),
  })
}

export async function spendCoins(userId: string, amount: number, description?: string, source?: string): Promise<SpendResult> {
  return apiFetch('/api/spend', {
    method: 'POST',
    body: JSON.stringify({ user_id: userId, amount, description, source }),
  })
}

export async function claimDailyBonus(userId: string): Promise<EarnResult> {
  return apiFetch(`/api/daily-bonus/${userId}`, { method: 'POST' })
}

// ================================================================
// CONVERSIONS & WITHDRAWALS
// ================================================================

export async function convertCoinsToDiamonds(userId: string, coins: number): Promise<ConversionResult> {
  return apiFetch('/api/convert', {
    method: 'POST',
    body: JSON.stringify({ user_id: userId, coins }),
  })
}

export async function requestWithdrawal(userId: string, diamonds: number, method: string, email: string): Promise<WithdrawalResult> {
  return apiFetch('/api/withdraw', {
    method: 'POST',
    body: JSON.stringify({ user_id: userId, diamonds, method, email }),
  })
}

// ================================================================
// CASINO
// ================================================================

export async function buyCasinoChips(userId: string, coins: number) {
  return apiFetch('/api/casino/buy-chips', {
    method: 'POST',
    body: JSON.stringify({ user_id: userId, coins }),
  })
}

export async function reportCasinoResult(userId: string, bet: number, win: number, game: string) {
  return apiFetch('/api/casino/result', {
    method: 'POST',
    body: JSON.stringify({ user_id: userId, bet, win, game }),
  })
}

// ================================================================
// SUBSCRIPTIONS
// ================================================================

export async function getPlans(): Promise<Record<string, SubscriptionPlan>> {
  return apiFetch('/api/plans')
}

export async function getUserSubscription(userId: string): Promise<UserSubscription> {
  return apiFetch(`/api/subscription/${userId}`)
}

export async function subscribe(userId: string, plan: string, billing: string = 'monthly'): Promise<SubscribeResult> {
  return apiFetch('/api/subscribe', {
    method: 'POST',
    body: JSON.stringify({ user_id: userId, plan, billing }),
  })
}

export async function cancelSubscription(userId: string) {
  return apiFetch('/api/subscription/cancel', {
    method: 'POST',
    body: JSON.stringify({ user_id: userId }),
  })
}

export async function changePlan(userId: string, plan: string, billing: string = 'monthly') {
  return apiFetch('/api/subscription/change', {
    method: 'POST',
    body: JSON.stringify({ user_id: userId, plan, billing }),
  })
}

// ================================================================
// SALES & PAYOUTS
// ================================================================

export async function processSale(saleData: {
  product_type: string
  buyer_id: string
  total_amount_eur: number
  product_name?: string
  faction_id?: string
  streamer_id?: string
  creator_id?: string
  referral_code?: string
}): Promise<SaleResult> {
  return apiFetch('/api/sales/process', {
    method: 'POST',
    body: JSON.stringify(saleData),
  })
}

export async function getFactionTreasury(factionId: string) {
  return apiFetch(`/api/factions/${factionId}/treasury`)
}

export async function getStreamerBalance(streamerId: string) {
  return apiFetch(`/api/streamers/${streamerId}/balance`)
}

// ================================================================
// LOCAL FALLBACK (when API is not available)
// Uses localStorage as temporary store — syncs when API connects
// ================================================================

const LOCAL_KEY = 'c8l_economy_local'

export function getLocalBalance(userId: string): WalletBalance {
  if (typeof window === 'undefined') {
    return { user_id: userId, coins: 0, diamonds: 0, real_balance: 0, casino_chips: 0, is_admin: false }
  }

  const stored = localStorage.getItem(`${LOCAL_KEY}_${userId}`)
  if (stored) {
    return JSON.parse(stored)
  }

  // Check admin
  const ADMIN_IDS = ['leovela69', 'rufinoleon30@gmail.com', 'Leo Vela']
  const isAdmin = ADMIN_IDS.some(id => userId.toLowerCase().includes(id.toLowerCase()))

  const wallet: WalletBalance = {
    user_id: userId,
    coins: isAdmin ? 9999 : 0,
    diamonds: isAdmin ? 9999 : 0,
    real_balance: 0,
    casino_chips: isAdmin ? 9999 : 0,
    is_admin: isAdmin,
  }

  localStorage.setItem(`${LOCAL_KEY}_${userId}`, JSON.stringify(wallet))
  return wallet
}

export function updateLocalBalance(userId: string, updates: Partial<WalletBalance>): WalletBalance {
  const current = getLocalBalance(userId)
  const updated = { ...current, ...updates }
  if (typeof window !== 'undefined') {
    localStorage.setItem(`${LOCAL_KEY}_${userId}`, JSON.stringify(updated))
  }
  return updated
}

export function localEarnCoins(userId: string, amount: number): WalletBalance {
  const current = getLocalBalance(userId)
  if (current.is_admin) return current
  return updateLocalBalance(userId, { coins: current.coins + amount })
}

export function localSpendCoins(userId: string, amount: number): { success: boolean; wallet: WalletBalance } {
  const current = getLocalBalance(userId)
  if (current.is_admin) return { success: true, wallet: current }
  if (current.coins < amount) return { success: false, wallet: current }
  return { success: true, wallet: updateLocalBalance(userId, { coins: current.coins - amount }) }
}
