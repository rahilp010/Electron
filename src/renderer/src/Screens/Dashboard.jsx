import Navbar from '../components/UI/Navbar'
import clientList from '../assets/client.png'
import report from '../assets/report.png'
import product from '../assets/product.png'
import bank from '../assets/ATM.png'
import cash from '../assets/cash.png'
import purchase from '../assets/purchase.png'
import { useNavigate } from 'react-router-dom'
import { ReceiptText } from 'lucide-react'
import { useDispatch } from 'react-redux'
import { setKeyBindings } from '../app/features/electronSlice'
import { useEffect } from 'react'

const Dashboard = () => {
  const navigate = useNavigate()
  const dispatch = useDispatch()

  const fetchKeyBindings = async () => {
    try {
      const response = await window.api.getKeyBindings()
      dispatch(setKeyBindings(response))
    } catch (error) {
      console.error('Failed to fetch key bindings:', error)
    }
  }

  useEffect(() => {
    fetchKeyBindings()
  }, [])

  const date = new Date()
  const year = date.getFullYear()
  const fullMonth = date.toLocaleString('default', { month: 'long' })
  return (
    <div className="w-full">
      <div className="overflow-y-auto h-screen customScrollbar">
        <div className="sticky top-0 z-10">
          <Navbar />
        </div>
        <div>
          <div className="grid grid-cols-12 gap-2 p-6 bg-gray-50 min-h-[500px] font-poppins">
            {/* Profile Card */}
            <div className="col-span-3 bg-white rounded-4xl border border-gray-100 shadow-lg p-4 flex flex-col items-center justify-center gap-4">
              <img src={product} alt="product" className="w-24 h-24 object-cover" />
              <button
                className="mt-4 bg-black text-white px-16 py-2 rounded-full shadow cursor-pointer transition-all duration-200 hover:bg-black/80"
                onClick={() => navigate('/products')}
              >
                Add Products
              </button>
            </div>

            {/* Progress */}
            {/* <div className="col-span-3 bg-white rounded-4xl border border-gray-100 shadow-lg p-4">
                     <h3 className="font-semibold text-gray-700">Progress</h3>
                     <p className="text-2xl font-bold">6.1h</p>
                     <p className="text-sm text-gray-500">
                        Work Time this week
                     </p>
                     {/* Placeholder bar chart *
                     <div className="flex justify-between mt-4">
                        {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((d, i) => (
                           <div key={i} className="flex flex-col items-center">
                              <div
                                 className="w-3 bg-yellow-400 rounded"
                                 style={{ height: `${(i + 2) * 10}px` }}></div>
                              <span className="text-xs mt-1">{d}</span>
                           </div>
                        ))}
                     </div>
                  </div> */}
            <div className="col-span-3 bg-white rounded-4xl border border-gray-100 shadow-lg p-4 flex flex-col items-center justify-center gap-4">
              <img src={clientList} alt="product" className="w-24 h-24 object-cover" />
              <button
                className="mt-4 bg-black text-white px-16 py-2 rounded-full shadow cursor-pointer transition-all duration-200 hover:bg-black/80"
                onClick={() => navigate('/clients')}
              >
                Add Clients
              </button>
            </div>

            {/* Time Tracker */}
            <div className="col-span-3 bg-white rounded-4xl border border-gray-100 shadow-lg p-4 flex flex-col items-center justify-center gap-4 relative">
              <img src={purchase} alt="product" className="w-24 h-24 object-cover" />
              <ReceiptText
                className="absolute top-3 right-3 border p-1.5 rounded-full bg-black text-white hover:scale-110 transition-all duration-200 cursor-pointer"
                size={28}
                onClick={() => navigate('/purchaseBill')}
              />
              <button
                className="mt-4 bg-black text-white px-18 py-2 rounded-full shadow cursor-pointer transition-all duration-200 hover:bg-black/80"
                onClick={() => navigate('/purchase')}
              >
                Purchase
              </button>
            </div>

            {/* Onboarding Progress */}
            <div className="col-span-3 row-span-2 bg-white rounded-4xl border border-gray-100 shadow-lg p-4 flex  flex-col items-center justify-center gap-5">
              <div className="flex flex-col bg-gray-900 rounded-4xl p-3 items-center justify-center gap-5">
                <img src={bank} alt="product" className="w-24 h-24 object-cover" />
                <button
                  className="mt-4 bg-white text-black px-20 py-2 rounded-full shadow cursor-pointer transition-all duration-200 hover:bg-white/80"
                  onClick={() => navigate('/bank')}
                >
                  Bank
                </button>
              </div>

              <div className="flex flex-col bg-gray-900 rounded-4xl p-3 items-center justify-center gap-3">
                <img src={cash} alt="product" className="w-24 h-24 object-cover" />
                <button
                  className="mt-4 bg-white text-black px-20 py-2 rounded-full shadow cursor-pointer transition-all duration-200 hover:bg-white/80"
                  onClick={() => navigate('/cash')}
                >
                  Cash
                </button>
              </div>
            </div>

            <div className="col-span-3 bg-white rounded-4xl border border-gray-100 shadow-lg p-4 flex flex-col items-center justify-center gap-4">
              <img src={report} alt="product" className="w-24 h-24 object-cover" />
              <button
                className="mt-4 bg-black text-white px-10 py-2 rounded-full shadow cursor-pointer transition-all duration-200 hover:bg-black/80"
                onClick={() => navigate('/reports')}
              >
                Reports & Analytics
              </button>
            </div>

            {/* Pension Contributions */}
            {/* <div className="col-span-3 bg-white rounded-4xl border border-gray-100 shadow-lg p-4">
                     <h3 className="font-semibold text-gray-700">
                        Pension contributions
                     </h3>
                     <ul className="mt-3 space-y-2">
                        <li className="flex justify-between">
                           <span>Devices</span>
                           <span className="text-gray-500">MacBook Air</span>
                        </li>
                        <li className="flex justify-between">
                           <span>Compensation</span>
                           <span className="text-gray-500">Summary</span>
                        </li>
                        <li className="flex justify-between">
                           <span>Benefits</span>
                           <span className="text-gray-500">Employee</span>
                        </li>
                     </ul>
                  </div> */}

            {/* Calendar */}
            <div className="col-span-6 bg-white rounded-4xl border border-gray-100 shadow-lg p-4">
              <h3 className="font-semibold text-gray-700">
                {fullMonth} {year}
              </h3>
              <div className="mt-4 flex flex-col space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-medium">Last BackUp</span>
                  <span className="text-gray-500 text-sm">Sep 13, 10:00 AM</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="font-medium">Next BackUp</span>
                  <span className="text-gray-500 text-sm">Sep 15, 09:00 AM</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Dashboard
