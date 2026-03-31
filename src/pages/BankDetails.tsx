import { useState, useEffect } from 'react'
import { api } from '../lib/api'
import type { Account } from '../types'

const ACCOUNT_TYPE = 'Personal Current Account'
const CURRENCY = 'GBP'

export default function BankDetails() {
  const [account, setAccount] = useState<Account | null>(null)
  const [copied, setCopied] = useState<string | null>(null)

  useEffect(() => {
    api.getAccount().then(setAccount).catch(() => {})
  }, [])

  function copy(value: string, key: string) {
    navigator.clipboard.writeText(value)
    setCopied(key)
    setTimeout(() => setCopied(null), 2000)
  }

  const rows = account ? [
    { label: 'Account Number', value: account.accountNumber,                      key: 'acc',  mono: true  },
    { label: 'Sort Code',      value: account.sortCode,                            key: 'sort', mono: true  },
    { label: 'IBAN',           value: account.iban,                                key: 'iban', mono: true  },
    { label: 'BIC / SWIFT',    value: account.bic,                                 key: 'bic',  mono: true  },
    { label: 'Account Type',   value: ACCOUNT_TYPE,                                key: 'type', mono: false },
    { label: 'Currency',       value: CURRENCY,                                    key: 'cur',  mono: false },
    { label: 'Account Holder', value: `${account.firstName} ${account.lastName}`,  key: 'name', mono: false },
  ] : []

  return (
    <div className="space-y-6 pb-24 md:pb-0">
      <div>
        <h1 className="text-2xl font-semibold text-white">Bank Details</h1>
        <p className="text-white/40 text-sm mt-1">Your account information for receiving payments</p>
      </div>

      {/* Card visual */}
      <div className="bg-white/[0.04] backdrop-blur-md border border-white/5 rounded-2xl p-6 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-48 h-48 bg-orange-500/5 rounded-full -translate-y-1/2 translate-x-1/2" />
        <div className="relative z-10">
          <div className="flex items-center justify-between mb-8">
            <div>
              <p className="text-white/30 text-xs font-medium uppercase tracking-widest">Bartho Bank</p>
              <p className="text-white font-semibold mt-1">{account ? `${account.firstName} ${account.lastName}` : '—'}</p>
            </div>
            <div className="w-10 h-10 bg-orange-500 rounded-lg flex items-center justify-center">
              <span className="text-black font-bold">B</span>
            </div>
          </div>
          <div className="mb-4">
            <p className="text-white/30 text-xs mb-1">Account Number</p>
            <p className="font-mono text-white text-2xl tracking-[0.2em]">
              {account ? account.accountNumber.replace(/(.{4})/g, '$1 ').trim() : '•••• ••••'}
            </p>
          </div>
          <div className="flex gap-8">
            <div>
              <p className="text-white/30 text-xs mb-0.5">Sort Code</p>
              <p className="font-mono text-white text-sm">{account?.sortCode ?? '——'}</p>
            </div>
            <div>
              <p className="text-white/30 text-xs mb-0.5">Currency</p>
              <p className="font-mono text-white text-sm">{CURRENCY}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Details table */}
      <div className="bg-white/[0.04] backdrop-blur-md border border-white/5 rounded-2xl overflow-hidden">
        <div className="px-5 py-4 border-b border-white/5">
          <h2 className="font-semibold text-white text-sm">Full Account Details</h2>
          <p className="text-xs text-white/20 mt-0.5">Tap any row to copy</p>
        </div>
        <ul>
          {rows.map(({ label, value, key, mono }, i) => (
            <li key={key} className={i < rows.length - 1 ? 'border-b border-white/[0.04]' : ''}>
              <button
                onClick={() => copy(value, key)}
                className="w-full flex items-center justify-between px-5 py-4 hover:bg-white/[0.03] transition-colors text-left group"
              >
                <div>
                  <p className="text-xs text-white/30 font-medium uppercase tracking-wide">{label}</p>
                  <p className={`text-sm text-white mt-0.5 ${mono ? 'font-mono' : 'font-medium'}`}>{value}</p>
                </div>
                <div className="shrink-0 ml-4">
                  {copied === key ? (
                    <span className="text-xs text-orange-400 font-medium bg-orange-500/10 border border-orange-500/20 px-2.5 py-1 rounded-lg">Copied!</span>
                  ) : (
                    <svg className="w-4 h-4 text-white/20 group-hover:text-white/50 transition-colors" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                  )}
                </div>
              </button>
            </li>
          ))}
        </ul>
      </div>

      <div className="bg-white/[0.03] border border-white/5 rounded-xl px-5 py-4 text-sm text-white/30">
        <strong className="text-white/50">Receiving payments?</strong> Share your account number and sort code for UK transfers, or your IBAN and BIC for international payments.
      </div>
    </div>
  )
}
