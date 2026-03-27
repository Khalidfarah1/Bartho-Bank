import { Routes, Route } from 'react-router-dom'
import Layout from './components/Layout'
import Dashboard from './pages/Dashboard'
import Transfer from './pages/Transfer'
import AccountDetails from './pages/AccountDetails'
import BankDetails from './pages/BankDetails'

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Layout />}>
        <Route index element={<Dashboard />} />
        <Route path="transfer" element={<Transfer />} />
        <Route path="account" element={<AccountDetails />} />
        <Route path="bank" element={<BankDetails />} />
      </Route>
    </Routes>
  )
}
