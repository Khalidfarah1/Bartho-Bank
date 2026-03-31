import { Routes, Route, Navigate } from 'react-router-dom'
import Layout from './components/Layout'
import Dashboard from './pages/Dashboard'
import Transfer from './pages/Transfer'
import AccountDetails from './pages/AccountDetails'
import BankDetails from './pages/BankDetails'
import Spending from './pages/Spending'
import Login from './pages/Login'
import Register from './pages/Register'
import { isAuthenticated } from './lib/api'

function PrivateRoute({ children }: { children: React.ReactNode }) {
  return isAuthenticated() ? <>{children}</> : <Navigate to="/login" replace />
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route
        path="/"
        element={
          <PrivateRoute>
            <Layout />
          </PrivateRoute>
        }
      >
        <Route index element={<Dashboard />} />
        <Route path="transfer" element={<Transfer />} />
        <Route path="spending" element={<Spending />} />
        <Route path="account" element={<AccountDetails />} />
        <Route path="bank" element={<BankDetails />} />
      </Route>
    </Routes>
  )
}
