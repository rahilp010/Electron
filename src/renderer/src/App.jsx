// import Versions from './components/Versions'
import { store } from './app/store.js'
import { Provider } from 'react-redux'
import { ToastContainer } from 'react-toastify'
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

function App() {
  return (
    <>
      {/* <p className="tip">
        Please try pressing <code>F12</code> to open the devTool
      </p> */}

      <Provider store={store}>
        <ToastContainer
          position="top-right"
          autoClose={5000}
          hideProgressBar={false}
          newestOnTop={false}
          closeOnClick
          rtl={false}
          pauseOnFocusLoss
          draggable
          pauseOnHover
        />
        <HashRouter>
          <KeyBind>
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/products" element={<Products />} />
              <Route path="/clients" element={<ClientList />} />
              <Route path="/sales" element={<Transaction />} />
              <Route path="/purchase" element={<Purchase />} />
              <Route path="/currencyConverter" element={<CurrencyConvertor />} />
              <Route path="/bank" element={<Bank />} />
              <Route path="/cash" element={<Cash />} />
              <Route path="/ledger" element={<LedgerReport />} />
              <Route path="/auth" element={<Authentication />} />
            </Routes>
          </KeyBind>
        </HashRouter>
      </Provider>
      {/* <Versions></Versions> */}
    </>
  )
}

export default App
