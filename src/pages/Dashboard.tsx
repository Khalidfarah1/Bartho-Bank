import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../lib/api'
import type { Account, Transaction } from '../types'

const categoryColors: Record<string, string> = {
  Income:        'text-emerald-400 bg-emerald-400/10',
  Groceries:     'text-yellow-400 bg-yellow-400/10',
  Subscriptions: 'text-purple-400 bg-purple-400/10',
  Transport:     'text-blue-400 bg-blue-400/10',
  Shopping:      'text-pink-400 bg-pink-400/10',
  Dining:        'text-orange-400 bg-orange-400/10',
  Bills:         'text-red-400 bg-red-400/10',
  Transfer:      'text-white/40 bg-white/5',
}

function fmt(n: number) {
  return new Intl.NumberFormat('en-GB', { style: 'currency', currency: 'GBP' }).format(n)
}

function fmtDate(d: string) {
  return new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
}

function categoryEmoji(cat: string) {
  const map: Record<string, string> = {
    Income: '💰', Groceries: '🛒', Subscriptions: '📱',
    Transport: '🚇', Shopping: '🛍️', Dining: '☕',
    Bills: '⚡', Transfer: '↔️',
  }
  return map[cat] ?? '💳'
}

export default function Dashboard() {
  const [account, setAccount] = useState<Account | null>(null)
  const [transactions, setTransactions] = useState<Transaction[]>([])

  useEffect(() => {
    Promise.all([api.getAccount(), api.getTransactions()])
      .then(([acc, txs]) => { setAccount(acc); setTransactions(txs) })
      .catch(() => {})
  }, [])

  const balance = account?.balance ?? 0
  const monthIncome = transactions.filter(t => t.amount > 0).reduce((s, t) => s + t.amount, 0)
  const monthSpend  = transactions.filter(t => t.amount < 0).reduce((s, t) => s + Math.abs(t.amount), 0)

  return (
    <div className="space-y-6 pb-24 md:pb-0">
      <div>
        <h1 className="text-2xl font-semibold text-white">
          Good morning{account ? `, ${account.firstName}` : ''}
        </h1>
        <p className="text-white/40 text-sm mt-1">Here's your account overview</p>
      </div>

      {/* Balance card */}
      <div className="bg-orange-500 rounded-2xl p-6 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-orange-400 to-orange-600 opacity-60" />
        <div className="relative z-10">
          <p className="text-black/60 text-xs font-semibold uppercase tracking-widest">Available Balance</p>
          <p className="text-5xl font-bold text-black mt-2 tracking-tight">{fmt(balance)}</p>
          <p className="text-black/50 text-sm mt-1">Personal Current Account</p>
          <div className="flex gap-3 mt-6">
            <Link to="/transfer" className="bg-black text-white text-sm font-semibold px-5 py-2.5 rounded-lg hover:bg-black/80 transition-colors">
              Send Money
            </Link>
            <Link to="/bank" className="bg-black/20 text-black text-sm font-semibold px-5 py-2.5 rounded-lg hover:bg-black/30 transition-colors">
              Bank Details
            </Link>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-white/[0.04] backdrop-blur-md border border-white/5 rounded-xl p-4">
          <p className="text-white/30 text-xs font-medium uppercase tracking-wide">Money In</p>
          <p className="text-xl font-bold text-emerald-400 mt-1.5">{fmt(monthIncome)}</p>
          <p className="text-white/20 text-xs mt-1">This period</p>
        </div>
        <div className="bg-white/[0.04] backdrop-blur-md border border-white/5 rounded-xl p-4">
          <p className="text-white/30 text-xs font-medium uppercase tracking-wide">Money Out</p>
          <p className="text-xl font-bold text-red-400 mt-1.5">{fmt(monthSpend)}</p>
          <p className="text-white/20 text-xs mt-1">This period</p>
        </div>
      </div>

      {/* Transactions */}
      <div className="bg-white/[0.04] backdrop-blur-md border border-white/5 rounded-2xl overflow-hidden">
        <div className="px-5 py-4 border-b border-white/5 flex items-center justify-between">
          <h2 className="font-semibold text-white text-sm">Recent Transactions</h2>
          <span className="text-white/20 text-xs">{transactions.length} transactions</span>
        </div>
        <ul>
          {transactions.map((tx: Transaction, i: number) => (
            <li
              key={tx.id}
              className={`flex items-center justify-between px-5 py-4 hover:bg-white/[0.03] transition-colors ${
                i < transactions.length - 1 ? 'border-b border-white/[0.04]' : ''
              }`}
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-9 h-9 rounded-xl bg-white/5 flex items-center justify-center shrink-0 text-base">
                  {categoryEmoji(tx.category)}
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-medium text-white truncate">{tx.description}</p>
                  <p className="text-xs text-white/30 mt-0.5">{fmtDate(tx.date)}</p>
                </div>
              </div>
              <div className="text-right shrink-0 ml-4">
                <p className={`text-sm font-semibold ${tx.amount > 0 ? 'text-emerald-400' : 'text-white'}`}>
                  {tx.amount > 0 ? '+' : ''}{fmt(tx.amount)}
                </p>
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium mt-1 inline-block ${categoryColors[tx.category] ?? 'text-white/40 bg-white/5'}`}>
                  {tx.category}
                </span>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}
