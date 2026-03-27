export interface Transaction {
  id: string
  date: string
  description: string
  amount: number  // negative = debit, positive = credit
  category: string
  balance: number
}

export interface AccountDetails {
  firstName: string
  lastName: string
  email: string
  phone: string
  address: string
  city: string
  postcode: string
}

export interface BankDetails {
  accountNumber: string
  sortCode: string
  iban: string
  bic: string
  accountType: string
  currency: string
}

export interface AppState {
  balance: number
  account: AccountDetails
  bankDetails: BankDetails
  transactions: Transaction[]
}

const initialState: AppState = {
  balance: 4825.50,
  account: {
    firstName: 'Khalid',
    lastName: 'Farah',
    email: 'khalidfarah9@gmail.com',
    phone: '+44 7517 796 530',
    address: '12 Whitechapel High Street',
    city: 'London',
    postcode: 'E1 7PT',
  },
  bankDetails: {
    accountNumber: '31820947',
    sortCode: '20-41-06',
    iban: 'GB29 BART 2041 0631 8209 47',
    bic: 'BARTHGB2',
    accountType: 'Personal Current Account',
    currency: 'GBP',
  },
  transactions: [
    { id: 't1',  date: '2026-03-26', description: 'Salary — Acme Corp',         amount:  2500.00, category: 'Income',      balance: 4825.50 },
    { id: 't2',  date: '2026-03-25', description: 'Tesco Superstore',            amount:   -67.34, category: 'Groceries',   balance: 2325.50 },
    { id: 't3',  date: '2026-03-24', description: 'Netflix',                     amount:   -17.99, category: 'Subscriptions', balance: 2392.84 },
    { id: 't4',  date: '2026-03-23', description: 'Transport for London',        amount:   -24.50, category: 'Transport',   balance: 2410.83 },
    { id: 't5',  date: '2026-03-22', description: 'Amazon',                      amount:   -43.99, category: 'Shopping',    balance: 2435.33 },
    { id: 't6',  date: '2026-03-20', description: 'HMRC Tax Refund',             amount:   312.00, category: 'Income',      balance: 2479.32 },
    { id: 't7',  date: '2026-03-19', description: 'Costa Coffee',                amount:    -5.70, category: 'Dining',      balance: 2167.32 },
    { id: 't8',  date: '2026-03-18', description: 'EDF Energy',                  amount:   -89.00, category: 'Bills',       balance: 2173.02 },
    { id: 't9',  date: '2026-03-15', description: 'Transfer from James Farah',   amount:   200.00, category: 'Transfer',    balance: 2262.02 },
    { id: 't10', date: '2026-03-12', description: 'Spotify',                     amount:   -11.99, category: 'Subscriptions', balance: 2062.02 },
    { id: 't11', date: '2026-03-10', description: 'Sainsbury\'s',                amount:   -52.14, category: 'Groceries',   balance: 2074.01 },
    { id: 't12', date: '2026-03-08', description: 'National Rail',               amount:   -34.00, category: 'Transport',   balance: 2126.15 },
  ],
}

// Keep state in module-level variable (acts as simple in-memory store)
let state: AppState = JSON.parse(JSON.stringify(initialState))

type Listener = () => void
const listeners: Listener[] = []

export function subscribe(fn: Listener) {
  listeners.push(fn)
  return () => {
    const i = listeners.indexOf(fn)
    if (i > -1) listeners.splice(i, 1)
  }
}

function notify() {
  listeners.forEach(fn => fn())
}

export function getState(): AppState {
  return state
}

export function updateAccount(details: AccountDetails) {
  state = { ...state, account: { ...details } }
  notify()
}

export function transferMoney(toName: string, toAccount: string, amount: number, reference: string) {
  if (amount <= 0 || amount > state.balance) return false
  const newBalance = parseFloat((state.balance - amount).toFixed(2))
  const now = new Date()
  const dateStr = now.toISOString().split('T')[0]
  const tx: Transaction = {
    id: `t${Date.now()}`,
    date: dateStr,
    description: `Transfer to ${toName} — ${reference || toAccount}`,
    amount: -amount,
    category: 'Transfer',
    balance: newBalance,
  }
  state = {
    ...state,
    balance: newBalance,
    transactions: [tx, ...state.transactions],
  }
  notify()
  return true
}
