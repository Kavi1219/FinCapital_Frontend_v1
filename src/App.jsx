import { Navigate,Route,Routes } from 'react-router'
import AppLayout from './components/AppLayout'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import Customers from './pages/Customers'
import AddCustomer from './pages/AddCustomer'
import SimplePage from './pages/SimplePage'
import Payments from './pages/Payments'
import Expenses from './pages/Expenses'
import Reports from './pages/Reports'
export default function App(){
    return (
    <Routes>
        <Route path="/login" element={<Login/>}/>
        <Route element={<AppLayout/>}>
            <Route path="/" element={<Navigate to="/dashboard" replace/>}/>
            <Route path="/dashboard" element={<Dashboard/>}/>
            <Route path="/customers/:cycle?" element={<Customers/>}/>
            <Route path="/customers/new" element={<AddCustomer/>}/>
            <Route path="/loans/create" element={<AddCustomer/>}/>
            <Route path="/loans" element={<SimplePage title="All Loans"/>}/>
            <Route path="/collection" element={<SimplePage title="Collection"/>}/>
            <Route path="/payments" element={<Payments/>}/>
            <Route path="/expenses" element={<Expenses/>}/>
            <Route path="/reports" element={<Reports/>}/>
            <Route path="/agents" element={<SimplePage title="Agents"/>}/>
            <Route path="/documents" element={<SimplePage title="Documents"/>}/>
            <Route path="/settings" element={<SimplePage title="Settings"/>}/>
        </Route>
        <Route path="*" element={<Navigate to="/dashboard" replace/>}/>
    </Routes>
    )
}
