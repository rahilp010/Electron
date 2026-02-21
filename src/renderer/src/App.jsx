/* eslint-disable prettier/prettier */
// import Versions from './components/Versions'
import { store } from './app/store.js'
import { Provider } from 'react-redux'
import { ToastContainer, Zoom } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css'
import ClientList from './Screens/ClientList'
import Transaction from './Screens/Transaction'
import CurrencyConvertor from './Screens/CurrencyConverter'
import { HashRouter, Route, Routes } from 'react-router-dom'
import Dashboard from './Screens/Dashboard'
import Purchase from './Screens/Purchase'
import KeyBind from './components/Shortcuts/KeyBind'
import Products from './Screens/Products'
import Bank from './Screens/Bank.jsx'
import Cash from './Screens/Cash.jsx'
import LedgerReport from './Screens/LedgerReport.jsx'
import Authentication from './components/UI/Authentication.jsx'
import Analytics from './Screens/Analytics.jsx'
import Reports from './Screens/Reports.jsx'
import PendingPaymentsReport from './Screens/PendingPaymentsReport.jsx'
import PendingCollectionReport from './Screens/PendingCollectionReport.jsx'
import Settings from './Screens/Settings.jsx'
import NotFound from './components/UI/NotFound.jsx'
import Salary from './Screens/Salary.jsx'
import PurchaseBill from './components/Modal/PurchaseBill.jsx'
import BankManagment from './Screens/BankManagment.jsx'
import AccountList from './components/BankSystem/AccountList.jsx'
import Bankledger from './components/BankSystem/BankLedger.jsx'
import TransferAmount from './components/BankSystem/TransferAmount.jsx'
import { useEffect } from 'react'

function App() {
  useEffect(() => {
    if (!window.api?.onBackupStatus) return

    const unsubscribe = window.api.onBackupStatus((data) => {
      console.log('📦 Backup Event:', data)

      if (!data?.takenToday) return

      const existingBackupTime = localStorage.getItem('lastBackupDateTime')

      // ✅ If backup already existed → DO NOTHING
      if (data.alreadyExists && existingBackupTime) {
        console.log('🟡 Backup already taken → keeping old time')
        return
      }

      // ✅ Store ONLY if new backup
      const backupTime = new Date(data.date)

      const formattedBackupTime = backupTime.toLocaleString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      })

      const nextBackup = new Date(backupTime)
      nextBackup.setDate(nextBackup.getDate() + 1)

      const formattedNextBackup = nextBackup.toLocaleString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })

      localStorage.setItem('lastBackupDateTime', formattedBackupTime)
      localStorage.setItem('nextBackupDateTime', formattedNextBackup)

      console.log('✅ Stored NEW backup time')
    })

    return unsubscribe
  }, [])
  return (
    <>
      <Provider store={store}>
        <ToastContainer
          position="top-right"
          autoClose={3000}
          hideProgressBar={false}
          newestOnTop={false}
          closeOnClick
          rtl={false}
          pauseOnFocusLoss
          draggable
          pauseOnHover
          theme="dark"
          transition={Zoom}
        />
        <HashRouter>
          <KeyBind>
            <Routes>
              <Route path="*" element={<NotFound />} />
              <Route path="/" element={<Authentication />} />
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/products" element={<Products />} />
              <Route path="/clients" element={<ClientList />} />
              <Route path="/sales" element={<Transaction />} />
              <Route path="/purchase" element={<Purchase />} />
              <Route path="/currencyConverter" element={<CurrencyConvertor />} />
              <Route path="/bank" element={<Bank />} />
              <Route path="/cash" element={<Cash />} />
              <Route path="/ledger" element={<LedgerReport />} />
              <Route path="/analytics" element={<Analytics />} />
              <Route path="/auth" element={<Authentication />} />
              <Route path="/reports" element={<Reports />} />
              <Route path="/pendingCollection" element={<PendingCollectionReport />} />
              <Route path="/pendingPayment" element={<PendingPaymentsReport />} />
              <Route path="/settings" element={<Settings />} />
              <Route path="/purchaseBill" element={<PurchaseBill />} />
              <Route path="/salary" element={<Salary />} />
              <Route path="/bankManagment" element={<BankManagment />} />
              <Route path="/createAccount" element={<AccountList />} />
              <Route path="/bankLedger" element={<Bankledger />} />
              <Route path="/transferAmount" element={<TransferAmount />} />
            </Routes>
          </KeyBind>
        </HashRouter>
      </Provider>
    </>
  )
}

export default App
