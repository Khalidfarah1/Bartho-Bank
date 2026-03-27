import { useState, useEffect } from 'react'
import { getState, subscribe, type Transaction } from '../data/store'

function fmt(n: number) {
  return new Intl.NumberFormat('en-GB', { style: 'currency', currency: 'GBP' }).format(Math.abs(n))
}

function fmtDate(d: string) {
  return new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
}

function fmtTime(d: string) {
  return new Date(d).toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' })
}

const categoryMeta: Record<string, { color: string; bar: string; emoji: string }> = {
  Groceries:     { color: 'text-yellow-400',  bar: 'bg-yellow-400',  emoji: '🛒' },
  Subscriptions: { color: 'text-purple-400',  bar: 'bg-purple-400',  emoji: '📱' },
  Transport:     { color: 'text-blue-400',    bar: 'bg-blue-400',    emoji: '🚇' },
  Shopping:      { color: 'text-pink-400',    bar: 'bg-pink-400',    emoji: '🛍️' },
  Dining:        { color: 'text-orange-400',  bar: 'bg-orange-400',  emoji: '☕' },
  Bills:         { color: 'text-red-400',     bar: 'bg-red-400',     emoji: '⚡' },
  Transfer:      { color: 'text-white/40',    bar: 'bg-white/30',    emoji: '↔️' },
  Income:        { color: 'text-emerald-400', bar: 'bg-emerald-400', emoji: '💰' },
}

// Group transactions by date label
function groupByDate(txs: Transaction[]) {
  const groups: { label: string; items: Transaction[] }[] = []
  const map = new Map<string, Transaction[]>()
  for (const tx of txs) {
    const existing = map.get(tx.date)
    if (existing) { existing.push(tx) }
    else { map.set(tx.date, [tx]); groups.push({ label: tx.date, items: map.get(tx.date)! }) }
  }
  return groups
}

type Tab = 'overview' | 'timeline'

export default function Spending() {
  const [state, setState] = useState(getState())
  useEffect(() => subscribe(() => setState(getState())), [])
  const [tab, setTab] = useState<Tab>('overview')

  const { transactions } = state

  // Only debits for spending analysis
  const debits = transactions.filter(t => t.amount < 0)
  const totalSpent = debits.reduce((s, t) => s + Math.abs(t.amount), 0)

  // Spending by category
  const byCategory = debits.reduce<Record<string, number>>((acc, t) => {
    acc[t.category] = (acc[t.category] ?? 0) + Math.abs(t.amount)
    return acc
  }, {})
  const sortedCategories = Object.entries(byCategory).sort((a, b) => b[1] - a[1])
  const maxCat = sortedCategories[0]?.[1] ?? 1

  // Spending by day for mini bar chart
  const byDay = debits.reduce<Record<string, number>>((acc, t) => {
    acc[t.date] = (acc[t.date] ?? 0) + Math.abs(t.amount)
    return acc
  }, {})
  const dayEntries = Object.entries(byDay).sort((a, b) => a[0].localeCompare(b[0]))
  const maxDay = Math.max(...dayEntries.map(([, v]) => v), 1)

  // Timeline grouped by date (all transactions)
  const grouped = groupByDate(transactions)

  return (
    <div className="space-y-6 pb-24 md:pb-0">
      <div>
        <h1 className="text-2xl font-semibold text-white">Spending</h1>
        <p className="text-white/40 text-sm mt-1">Track your spending in real time</p>
      </div>

      {/* Tab switcher */}
      <div className="flex gap-1 bg-white/[0.04] backdrop-blur-md border border-white/5 rounded-xl p-1 w-fit">
        {(['overview', 'timeline'] as Tab[]).map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-5 py-2 rounded-lg text-sm font-medium capitalize transition-all ${
              tab === t ? 'bg-orange-500 text-black' : 'text-white/40 hover:text-white'
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {tab === 'overview' && (
        <div className="space-y-5">
          {/* Total spent */}
          <div className="bg-white/[0.04] backdrop-blur-md border border-white/5 rounded-2xl p-6">
            <p className="text-white/30 text-xs font-medium uppercase tracking-widest">Total Spent This Period</p>
            <p className="text-4xl font-bold text-white mt-2">{fmt(totalSpent)}</p>
            <p className="text-white/30 text-xs mt-1">{debits.length} transactions</p>
          </div>

          {/* Daily spend bar chart */}
          <div className="bg-white/[0.04] backdrop-blur-md border border-white/5 rounded-2xl p-6">
            <p className="text-white text-sm font-semibold mb-5">Daily Spend</p>
            <div className="flex items-end gap-1.5 h-24">
              {dayEntries.map(([date, amount]) => (
                <div key={date} className="flex-1 flex flex-col items-center gap-1 group relative">
                  <div
                    className="w-full bg-orange-500/70 hover:bg-orange-500 rounded-t-md transition-all cursor-default"
                    style={{ height: `${(amount / maxDay) * 96}px` }}
                  />
                  {/* Tooltip */}
                  <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 bg-[#1a1a1a] border border-white/10 text-white text-xs rounded-lg px-2.5 py-1.5 whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
                    <p className="font-semibold">{fmt(amount)}</p>
                    <p className="text-white/40">{fmtTime(date)}</p>
                  </div>
                </div>
              ))}
            </div>
            <div className="flex justify-between mt-2">
              <span className="text-white/20 text-xs">{dayEntries[0] ? fmtTime(dayEntries[0][0]) : ''}</span>
              <span className="text-white/20 text-xs">{dayEntries.length ? fmtTime(dayEntries[dayEntries.length - 1][0]) : ''}</span>
            </div>
          </div>

          {/* Category breakdown */}
          <div className="bg-white/[0.04] backdrop-blur-md border border-white/5 rounded-2xl p-6">
            <p className="text-white text-sm font-semibold mb-5">By Category</p>
            <div className="space-y-4">
              {sortedCategories.map(([cat, amount]) => {
                const meta = categoryMeta[cat] ?? { color: 'text-white/40', bar: 'bg-white/30', emoji: '💳' }
                const pct = Math.round((amount / totalSpent) * 100)
                return (
                  <div key={cat}>
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="flex items-center gap-2">
                        <span className="text-base">{meta.emoji}</span>
                        <span className="text-sm text-white font-medium">{cat}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-xs text-white/30">{pct}%</span>
                        <span className={`text-sm font-semibold ${meta.color}`}>{fmt(amount)}</span>
                      </div>
                    </div>
                    <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full ${meta.bar} transition-all duration-700`}
                        style={{ width: `${(amount / maxCat) * 100}%` }}
                      />
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      )}

      {tab === 'timeline' && (
        <div className="space-y-2">
          {grouped.map(({ label, items }) => (
            <div key={label}>
              {/* Date heading */}
              <div className="flex items-center gap-3 px-1 py-2">
                <span className="text-xs font-semibold text-white/30 uppercase tracking-widest whitespace-nowrap">
                  {fmtDate(label)}
                </span>
                <div className="flex-1 h-px bg-white/5" />
                <span className="text-xs text-white/20">
                  {fmt(items.reduce((s, t) => s + t.amount, 0))}
                </span>
              </div>

              {/* Transactions for this date */}
              <div className="bg-white/[0.04] backdrop-blur-md border border-white/5 rounded-2xl overflow-hidden">
                {items.map((tx, i) => {
                  const meta = categoryMeta[tx.category] ?? { color: 'text-white/40', bar: 'bg-white/30', emoji: '💳' }
                  return (
                    <div
                      key={tx.id}
                      className={`flex items-center gap-4 px-5 py-4 hover:bg-white/[0.03] transition-colors ${
                        i < items.length - 1 ? 'border-b border-white/[0.04]' : ''
                      }`}
                    >
                      {/* Timeline dot + line */}
                      <div className="flex flex-col items-center shrink-0">
                        <div className={`w-2.5 h-2.5 rounded-full ${tx.amount > 0 ? 'bg-emerald-400' : 'bg-orange-500'}`} />
                        {i < items.length - 1 && <div className="w-px flex-1 bg-white/5 mt-1" style={{ minHeight: '20px' }} />}
                      </div>

                      {/* Icon */}
                      <div className="w-9 h-9 rounded-xl bg-white/5 flex items-center justify-center text-base shrink-0">
                        {meta.emoji}
                      </div>

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-white truncate">{tx.description}</p>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className={`text-xs px-2 py-0.5 rounded-full bg-white/5 ${meta.color}`}>
                            {tx.category}
                          </span>
                        </div>
                      </div>

                      {/* Amount + running balance */}
                      <div className="text-right shrink-0">
                        <p className={`text-sm font-semibold ${tx.amount > 0 ? 'text-emerald-400' : 'text-white'}`}>
                          {tx.amount > 0 ? '+' : ''}{fmt(tx.amount)}
                        </p>
                        <p className="text-xs text-white/20 mt-0.5">bal. {fmt(tx.balance)}</p>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
