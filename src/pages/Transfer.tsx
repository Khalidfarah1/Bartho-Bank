import { useState, useEffect } from 'react'
import { getState, subscribe, transferMoney } from '../data/store'

function fmt(n: number) {
  return new Intl.NumberFormat('en-GB', { style: 'currency', currency: 'GBP' }).format(n)
}

type Status = 'idle' | 'success' | 'error' | 'insufficient'

export default function Transfer() {
  const [balance, setBalance] = useState(getState().balance)
  useEffect(() => subscribe(() => setBalance(getState().balance)), [])

  const [form, setForm] = useState({ toName: '', toAccount: '', sortCode: '', amount: '', reference: '' })
  const [status, setStatus] = useState<Status>('idle')

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    setForm(f => ({ ...f, [e.target.name]: e.target.value }))
    setStatus('idle')
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const amt = parseFloat(form.amount)
    if (isNaN(amt) || amt <= 0) { setStatus('error'); return }
    if (amt > balance) { setStatus('insufficient'); return }
    const ok = transferMoney(form.toName, form.toAccount, amt, form.reference)
    if (ok) {
      setStatus('success')
      setForm({ toName: '', toAccount: '', sortCode: '', amount: '', reference: '' })
    }
  }

  return (
    <div className="space-y-6 pb-24 md:pb-0">
      <div>
        <h1 className="text-2xl font-semibold text-white">Send Money</h1>
        <p className="text-white/40 text-sm mt-1">Transfer funds to another account</p>
      </div>

      {/* Balance pill */}
      <div className="inline-flex items-center gap-2 bg-orange-500/10 border border-orange-500/20 rounded-full px-4 py-2">
        <span className="w-1.5 h-1.5 rounded-full bg-orange-500"></span>
        <span className="text-sm text-orange-400 font-medium">Available: {fmt(balance)}</span>
      </div>

      {/* Success banner */}
      {status === 'success' && (
        <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl px-5 py-4 flex items-start gap-3">
          <span className="text-emerald-400 mt-0.5">✓</span>
          <div>
            <p className="font-semibold text-emerald-400 text-sm">Transfer successful</p>
            <p className="text-sm text-white/40 mt-0.5">Your payment has been processed and your balance updated.</p>
          </div>
        </div>
      )}

      {/* Form */}
      <div className="bg-white/[0.04] backdrop-blur-md border border-white/5 rounded-2xl p-6">
        <form onSubmit={handleSubmit} className="space-y-5">

          <div>
            <label className="block text-xs font-medium text-white/40 uppercase tracking-wide mb-2">Recipient Name</label>
            <input
              type="text" name="toName" value={form.toName} onChange={handleChange} required
              placeholder="e.g. James Smith"
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-white/20 focus:outline-none focus:border-orange-500 transition-colors"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-white/40 uppercase tracking-wide mb-2">Account Number</label>
              <input
                type="text" name="toAccount" value={form.toAccount} onChange={handleChange} required
                placeholder="12345678" maxLength={8}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-white/20 focus:outline-none focus:border-orange-500 transition-colors font-mono"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-white/40 uppercase tracking-wide mb-2">Sort Code</label>
              <input
                type="text" name="sortCode" value={form.sortCode} onChange={handleChange} required
                placeholder="20-41-06" maxLength={8}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-white/20 focus:outline-none focus:border-orange-500 transition-colors font-mono"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-white/40 uppercase tracking-wide mb-2">Amount</label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30 font-medium text-sm">£</span>
              <input
                type="number" name="amount" value={form.amount} onChange={handleChange} required
                min="0.01" step="0.01" placeholder="0.00"
                className="w-full bg-white/5 border border-white/10 rounded-xl pl-8 pr-4 py-3 text-sm text-white placeholder-white/20 focus:outline-none focus:border-orange-500 transition-colors"
              />
            </div>
            {status === 'insufficient' && <p className="text-red-400 text-xs mt-2">Insufficient funds. Balance is {fmt(balance)}.</p>}
            {status === 'error'        && <p className="text-red-400 text-xs mt-2">Please enter a valid amount.</p>}
          </div>

          <div>
            <label className="block text-xs font-medium text-white/40 uppercase tracking-wide mb-2">
              Reference <span className="normal-case text-white/20">(optional)</span>
            </label>
            <input
              type="text" name="reference" value={form.reference} onChange={handleChange}
              placeholder="e.g. Rent, Invoice #42..." maxLength={35}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-white/20 focus:outline-none focus:border-orange-500 transition-colors"
            />
          </div>

          {/* Quick amounts */}
          <div>
            <p className="text-xs text-white/20 mb-2">Quick amounts</p>
            <div className="flex flex-wrap gap-2">
              {[10, 25, 50, 100, 250, 500].map(n => (
                <button
                  key={n} type="button"
                  onClick={() => { setForm(f => ({ ...f, amount: String(n) })); setStatus('idle') }}
                  className="px-3 py-1.5 rounded-lg border border-white/10 text-sm text-white/50 hover:border-orange-500 hover:text-orange-400 transition-colors"
                >
                  £{n}
                </button>
              ))}
            </div>
          </div>

          <button
            type="submit"
            className="w-full bg-orange-500 text-black font-semibold py-3 rounded-xl hover:bg-orange-400 transition-colors text-sm"
          >
            Send Money
          </button>
        </form>
      </div>

      {/* Warning */}
      <div className="bg-white/[0.03] border border-white/5 rounded-xl px-5 py-4 text-sm text-white/30">
        <strong className="text-white/50">Security reminder:</strong> Always verify recipient details before sending. Bartho Bank will never ask you to transfer money urgently.
      </div>
    </div>
  )
}
