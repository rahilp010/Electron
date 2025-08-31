// import Versions from './components/Versions'
import { store } from './app/store.js'
import { Provider } from 'react-redux'
import { ToastContainer } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css'
import ClientList from './Screens/ClientList'
import Transaction from './Screens/Transaction'
import CurrencyConvertor from './Screens/CurrencyConverter'
import { HashRouter, Route, Routes } from 'react-router-dom'
import YearlyAudit from './Screens/YearlyAudit'
import Dashboard from './Screens/Dashboard'
import Purchase from './Screens/Purchase'
import KeyBind from './components/Shortcuts/KeyBind'
import Products from './Screens/Products'

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
              <Route path="/yearlyaudit" element={<YearlyAudit />} />
              <Route path="/purchase" element={<Purchase />} />
              <Route path="/currencyConverter" element={<CurrencyConvertor />} />
            </Routes>
          </KeyBind>
        </HashRouter>
      </Provider>
      {/* <Versions></Versions> */}
    </>
  )
}

export default App
