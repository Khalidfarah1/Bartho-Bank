export interface Transaction {
  id: string
  date: string
  description: string
  amount: number    // negative = debit, positive = credit
  category: string
  balance: number   // running balance after this transaction
}

export interface Account {
  id: string
  firstName: string
  lastName: string
  email: string
  phone: string
  address: string
  city: string
  postcode: string
  accountNumber: string
  sortCode: string
  iban: string
  bic: string
  balance: number
}

export type EditableAccountField = 'firstName' | 'lastName' | 'email' | 'phone' | 'address' | 'city' | 'postcode'
