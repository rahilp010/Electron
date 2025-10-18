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
import PurchaseBill from './components/UI/PurchaseBill.jsx'
import NotFound from './components/UI/NotFound.jsx'

function App() {
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
              <Route path="/" element={<Dashboard />} />
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
            </Routes>
          </KeyBind>
        </HashRouter>
      </Provider>
    </>
  )
}

export default App
