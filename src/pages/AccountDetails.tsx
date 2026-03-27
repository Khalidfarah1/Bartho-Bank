import { useState, useEffect } from 'react'
import { getState, subscribe, updateAccount, type AccountDetails } from '../data/store'

export default function AccountDetailsPage() {
  const [saved, setSaved] = useState(getState().account)
  useEffect(() => subscribe(() => setSaved(getState().account)), [])

  const [form, setForm] = useState<AccountDetails>(saved)
  const [editing, setEditing] = useState(false)
  const [success, setSuccess] = useState(false)

  useEffect(() => { if (!editing) setForm(saved) }, [saved, editing])

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    setForm(f => ({ ...f, [e.target.name]: e.target.value }))
  }

  function handleSave(e: React.FormEvent) {
    e.preventDefault()
    updateAccount(form)
    setEditing(false)
    setSuccess(true)
    setTimeout(() => setSuccess(false), 3000)
  }

  function handleCancel() {
    setForm(saved)
    setEditing(false)
  }

  const fields: { name: keyof AccountDetails; label: string; type?: string; placeholder: string; span?: boolean }[] = [
    { name: 'firstName', label: 'First Name',  placeholder: 'Jane' },
    { name: 'lastName',  label: 'Last Name',   placeholder: 'Smith' },
    { name: 'email',     label: 'Email',       type: 'email', placeholder: 'jane@example.com' },
    { name: 'phone',     label: 'Phone',       type: 'tel',   placeholder: '+44 7000 000000' },
    { name: 'address',   label: 'Address',     placeholder: '12 High Street', span: true },
    { name: 'city',      label: 'City',        placeholder: 'London' },
    { name: 'postcode',  label: 'Postcode',    placeholder: 'E1 7PT' },
  ]

  return (
    <div className="space-y-6 pb-24 md:pb-0">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-white">Account Details</h1>
          <p className="text-white/40 text-sm mt-1">View and update your personal information</p>
        </div>
        {!editing && (
          <button
            onClick={() => setEditing(true)}
            className="flex items-center gap-2 bg-orange-500 text-black text-sm font-semibold px-4 py-2 rounded-lg hover:bg-orange-400 transition-colors"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
            Edit
          </button>
        )}
      </div>

      {/* Avatar card */}
      <div className="bg-white/[0.04] backdrop-blur-md border border-white/5 rounded-2xl p-5 flex items-center gap-4">
        <div className="w-14 h-14 rounded-xl bg-orange-500 flex items-center justify-center text-black text-xl font-bold shrink-0">
          {saved.firstName.charAt(0)}{saved.lastName.charAt(0)}
        </div>
        <div>
          <p className="text-base font-semibold text-white">{saved.firstName} {saved.lastName}</p>
          <p className="text-sm text-white/40 mt-0.5">{saved.email}</p>
          <span className="inline-block mt-1.5 text-xs bg-orange-500/10 text-orange-400 border border-orange-500/20 px-2 py-0.5 rounded-full font-medium">
            Verified Account
          </span>
        </div>
      </div>

      {/* Success */}
      {success && (
        <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl px-5 py-3.5 flex items-center gap-3">
          <span className="text-emerald-400">✓</span>
          <p className="text-sm font-medium text-emerald-400">Account details updated successfully.</p>
        </div>
      )}

      {/* Form */}
      <div className="bg-white/[0.04] backdrop-blur-md border border-white/5 rounded-2xl p-6">
        <form onSubmit={handleSave}>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            {fields.map(({ name, label, type = 'text', placeholder, span }) => (
              <div key={name} className={span ? 'sm:col-span-2' : ''}>
                <label className="block text-xs font-medium text-white/40 uppercase tracking-wide mb-2">{label}</label>
                {editing ? (
                  <input
                    type={type} name={name} value={form[name]} onChange={handleChange} required placeholder={placeholder}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-white/20 focus:outline-none focus:border-orange-500 transition-colors"
                  />
                ) : (
                  <div className="w-full bg-white/[0.03] border border-white/5 rounded-xl px-4 py-3 text-sm text-white/70">
                    {saved[name]}
                  </div>
                )}
              </div>
            ))}
          </div>

          {editing && (
            <div className="flex gap-3 mt-6">
              <button type="submit" className="bg-orange-500 text-black font-semibold px-6 py-2.5 rounded-xl hover:bg-orange-400 transition-colors text-sm">
                Save Changes
              </button>
              <button type="button" onClick={handleCancel} className="border border-white/10 text-white/50 font-medium px-6 py-2.5 rounded-xl hover:bg-white/5 transition-colors text-sm">
                Cancel
              </button>
            </div>
          )}
        </form>
      </div>
    </div>
  )
}
