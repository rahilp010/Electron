/* eslint-disable prettier/prettier */
/* eslint-disable react-hooks/exhaustive-deps */
import Navbar from '../components/UI/Navbar'
import clientList from '../assets/client.png'
import report from '../assets/report.png'
import product from '../assets/product.png'
import bank from '../assets/ATM.png'
import cash from '../assets/cash.png'
import purchase from '../assets/purchase.png'
import sales from '../assets/sales.png'
import salary from '../assets/salary.png'
import { useNavigate } from 'react-router-dom'
import { useDispatch } from 'react-redux'
import { setKeyBindings } from '../app/features/electronSlice'
import { useEffect } from 'react'
// import WhatsAppQRModal from '../components/Modal/whatsappQRModal'

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
    <div className="w-full select-none">
      <div className="overflow-y-auto h-screen customScrollbar">
        <div className="sticky top-0 z-10">
          <Navbar />
        </div>
        <div>
          <div className="grid grid-cols-12 gap-1.5 p-6 bg-gray-50 min-h-[500px] font-poppins">
            {/* Profile Card */}
            <div
              className="col-span-3 bg-gradient-to-br from-white to-gray-50 rounded-4xl border border-gray-400 border-b-4 shadow-[0_10px_40px_rgba(0,0,0,0.08),0_2px_12px_rgba(0,0,0,0.04),inset_0_1px_0_rgba(255,255,255,0.8)] hover:shadow-[0_20px_60px_rgba(0,0,0,0.12),0_4px_16px_rgba(0,0,0,0.06),inset_0_1px_0_rgba(255,255,255,0.9)] transition-all duration-300 hover:-translate-y-1 p-6 flex flex-col justify-center gap-4 relative overflow-hidden group hover:cursor-pointer"
              onClick={() => navigate('/products')}
            >
              {/* Animated background gradient */}
              <div className="absolute inset-0 bg-gradient-to-br from-blue-50/50 via-transparent to-purple-50/50 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>

              {/* Decorative corner accent */}
              <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-gray-900/5 to-transparent rounded-bl-full"></div>

              <div className="flex items-center justify-center relative">
                <div className="relative">
                  <img
                    src={product}
                    alt="product"
                    className="w-30 h-24 object-cover drop-shadow-lg group-hover:scale-110 transition-transform duration-300"
                  />
                  {/* Glow effect behind image */}
                  <div className="absolute inset-0 bg-gradient-to-br from-blue-400/40 to-purple-400/20 blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 -z-10"></div>
                </div>
              </div>

              <div className="flex items-center justify-center relative pt-1">
                <div className="flex flex-col text-center">
                  <p className="text-3xl bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
                    Products
                  </p>
                  <span className="text-[10px] text-gray-500">Manage inventory</span>
                </div>
              </div>
            </div>

            <div
              className="col-span-3 bg-gradient-to-br from-white to-gray-50 rounded-4xl border border-gray-400 border-b-4 shadow-[0_10px_40px_rgba(0,0,0,0.08),0_2px_12px_rgba(0,0,0,0.04),inset_0_1px_0_rgba(255,255,255,0.8)] hover:shadow-[0_20px_60px_rgba(0,0,0,0.12),0_4px_16px_rgba(0,0,0,0.06),inset_0_1px_0_rgba(255,255,255,0.9)] transition-all duration-300 hover:-translate-y-1 p-6 flex flex-col justify-center gap-4 relative overflow-hidden group hover:cursor-pointer"
              onClick={() => navigate('/clients')}
            >
              {/* Animated background gradient */}
              <div className="absolute inset-0 bg-gradient-to-br from-blue-50/50 via-transparent to-purple-50/50 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>

              {/* Decorative corner accent */}
              <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-gray-900/5 to-transparent rounded-bl-full"></div>

              <div className="flex items-center justify-center relative">
                <div className="relative">
                  <img
                    src={clientList}
                    alt="client"
                    className="w-24 h-24 object-cover drop-shadow-lg group-hover:scale-110 transition-transform duration-300"
                  />
                  {/* Glow effect behind image */}
                  <div className="absolute inset-0 bg-gradient-to-br from-blue-400/40 to-purple-400/20 blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 -z-10"></div>
                </div>
              </div>

              <div className="flex items-center justify-center relative mt-1">
                <div className="flex flex-col text-center">
                  <p className="text-3xl bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
                    Clients
                  </p>
                  <span className="text-[10px] text-gray-500">Manage inventory</span>
                </div>
              </div>
            </div>

            <div
              className="col-span-3 bg-gradient-to-br from-white to-gray-50 rounded-4xl border border-gray-400 border-b-4 shadow-[0_10px_40px_rgba(0,0,0,0.08),0_2px_12px_rgba(0,0,0,0.04),inset_0_1px_0_rgba(255,255,255,0.8)] hover:shadow-[0_20px_60px_rgba(0,0,0,0.12),0_4px_16px_rgba(0,0,0,0.06),inset_0_1px_0_rgba(255,255,255,0.9)] transition-all duration-300 hover:-translate-y-1 p-6 flex flex-col justify-center gap-4 relative overflow-hidden group hover:cursor-pointer"
              onClick={() => navigate('/salary')}
            >
              {/* Animated background gradient */}
              <div className="absolute inset-0 bg-gradient-to-br from-blue-50/50 via-transparent to-purple-50/50 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>

              {/* Decorative corner accent */}
              <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-gray-900/5 to-transparent rounded-bl-full"></div>

              <div className="flex items-center justify-center relative">
                <div className="relative">
                  <img
                    src={salary}
                    alt="client"
                    className="w-30 h-24 object-cover drop-shadow-lg group-hover:scale-110 transition-transform duration-300"
                  />
                  {/* Glow effect behind image */}
                  <div className="absolute inset-0 bg-gradient-to-br from-blue-400/40 to-purple-400/20 blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 -z-10"></div>
                </div>
              </div>

              <div className="flex items-center justify-center relative mt-1">
                <div className="flex flex-col text-center">
                  <p className="text-3xl bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
                    Salary
                  </p>
                  <span className="text-[10px] text-gray-500">Manage inventory</span>
                </div>
              </div>
            </div>

            {/* Onboarding Progress */}
            <div className="col-span-3 row-span-2 bg-white rounded-4xl border border-gray-400 border-b-4 shadow-lg p-4 flex  flex-col items-center justify-center gap-5">
              <div
                className="col-span-3 bg-gradient-to-br from-gray-900 to-gray-800 rounded-4xl border border-white/20 hover:shadow-[0_20px_60px_rgba(0,0,0,0.4),0_4px_16px_rgba(0,0,0,0.3),inset_0_1px_0_rgba(255,255,255,0.15)] transition-all duration-300 hover:-translate-y-1 p-6 flex flex-col justify-center gap-4 relative overflow-hidden group w-full hover:cursor-pointer"
                onClick={() => navigate('/bank')}
              >
                {/* Animated background gradient */}
                <div className="absolute inset-0 bg-gradient-to-br from-gray-700/30 via-transparent to-gray-400/30 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>

                {/* Decorative corner accent */}
                <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-white/5 to-transparent rounded-bl-full"></div>

                <div className="flex items-center justify-center relative">
                  <div className="relative">
                    <img
                      src={bank}
                      alt="bank"
                      className="w-24 h-24 object-cover drop-shadow-lg group-hover:scale-110 transition-transform duration-300"
                    />
                    {/* Glow effect behind image */}
                    <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-gray-400/20 blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 -z-10"></div>
                  </div>
                </div>

                <div className="flex items-center justify-center mt-1 relative">
                  <div className="flex flex-col text-center">
                    <p className="text-3xl bg-gradient-to-r from-white to-gray-200 bg-clip-text text-transparent">
                      Bank
                    </p>
                    <span className="text-[10px] text-gray-400">Banking transactions</span>
                  </div>
                </div>
              </div>

              <div
                className="col-span-3 bg-gradient-to-br from-gray-900 to-gray-800 rounded-4xl border border-white/20  hover:shadow-[0_20px_60px_rgba(0,0,0,0.4),0_4px_16px_rgba(0,0,0,0.3),inset_0_1px_0_rgba(255,255,255,0.15)] transition-all duration-300 hover:-translate-y-1 p-6 flex flex-col justify-center gap-4 relative overflow-hidden group w-full hover:cursor-pointer"
                onClick={() => navigate('/cash')}
              >
                {/* Animated background gradient */}
                <div className="absolute inset-0 bg-gradient-to-br from-gray-700/30 via-transparent to-gray-400/30 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>

                {/* Decorative corner accent */}
                <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-white/5 to-transparent rounded-bl-full"></div>

                <div className="flex items-center justify-center relative">
                  <div className="relative">
                    <img
                      src={cash}
                      alt="cash"
                      className="w-24 h-24 object-cover drop-shadow-lg group-hover:scale-110 transition-transform duration-300"
                    />
                    {/* Glow effect behind image */}
                    <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-gray-400/20 blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 -z-10"></div>
                  </div>
                </div>

                <div className="flex items-center justify-center relative">
                  <div className="flex flex-col text-center">
                    <p className="text-3xl bg-gradient-to-r from-white to-gray-200 bg-clip-text text-transparent">
                      Cash
                    </p>
                    <span className="text-[10px] text-gray-400">cash transactions</span>
                  </div>
                </div>
              </div>
            </div>

            <div
              className="col-span-3 bg-gradient-to-br from-white to-gray-50 rounded-4xl border border-gray-400 border-b-4 shadow-[0_10px_40px_rgba(0,0,0,0.08),0_2px_12px_rgba(0,0,0,0.04),inset_0_1px_0_rgba(255,255,255,0.8)] hover:shadow-[0_20px_60px_rgba(0,0,0,0.12),0_4px_16px_rgba(0,0,0,0.06),inset_0_1px_0_rgba(255,255,255,0.9)] transition-all duration-300 hover:-translate-y-1 p-6 flex flex-col justify-center gap-4 relative overflow-hidden group hover:cursor-pointer"
              onClick={() => navigate('/reports')}
            >
              {/* Animated background gradient */}
              <div className="absolute inset-0 bg-gradient-to-br from-blue-50/50 via-transparent to-purple-50/50 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>

              {/* Decorative corner accent */}
              <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-gray-900/5 to-transparent rounded-bl-full"></div>

              <div className="flex items-center justify-center relative z-10">
                <div className="relative">
                  <img
                    src={report}
                    alt="client"
                    className="w-28 h-24 object-cover drop-shadow-lg group-hover:scale-110 transition-transform duration-300"
                  />
                  {/* Glow effect behind image */}
                  <div className="absolute inset-0 bg-gradient-to-br from-blue-400/40 to-purple-400/20 blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 -z-10"></div>
                </div>
              </div>

              <div className="flex items-center justify-center relative ">
                <div className="flex flex-col text-center">
                  <p className="text-3xl bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
                    Reports
                  </p>
                  <span className="text-[10px] text-gray-500">Manage inventory</span>
                </div>
              </div>
            </div>

            <div className="col-span-6 bg-white rounded-4xl border border-gray-400 border-b-4 shadow-lg p-4 flex items-center justify-center gap-5">
              <div
                className="col-span-3 bg-gradient-to-br from-gray-900 to-gray-800 rounded-4xl border border-white/20 hover:shadow-[0_20px_60px_rgba(0,0,0,0.4),0_4px_16px_rgba(0,0,0,0.3),inset_0_1px_0_rgba(255,255,255,0.15)] transition-all duration-300 hover:-translate-y-1 p-6 flex flex-col justify-center gap-4 relative overflow-hidden group w-full hover:cursor-pointer"
                onClick={() => navigate('/purchase')}
              >
                {/* Animated background gradient */}
                <div className="absolute inset-0 bg-gradient-to-br from-gray-700/30 via-transparent to-gray-400/30 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>

                {/* Decorative corner accent */}
                <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-white/5 to-transparent rounded-bl-full"></div>

                <div className="flex items-center justify-center relative">
                  <div className="relative">
                    <img
                      src={purchase}
                      alt="purchase"
                      className="w-24 h-24 object-cover drop-shadow-lg group-hover:scale-110 transition-transform duration-300"
                    />
                    {/* Glow effect behind image */}
                    <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-gray-400/20 blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 -z-10"></div>
                  </div>
                </div>

                <div className="flex items-center justify-center relative">
                  <div className="flex flex-col text-center">
                    <p className="text-3xl bg-gradient-to-r from-white to-gray-200 bg-clip-text text-transparent">
                      Purchase
                    </p>
                    <span className="text-[10px] text-gray-400">purchase transactions</span>
                  </div>
                </div>
              </div>

              <div
                className="col-span-3 bg-gradient-to-br from-gray-900 to-gray-800 rounded-4xl border border-white/20 hover:shadow-[0_20px_60px_rgba(0,0,0,0.4),0_4px_16px_rgba(0,0,0,0.3),inset_0_1px_0_rgba(255,255,255,0.15)] transition-all duration-300 hover:-translate-y-1 p-6 flex flex-col justify-center gap-4 relative overflow-hidden group w-full hover:cursor-pointer"
                onClick={() => navigate('/sales')}
              >
                {/* Animated background gradient */}
                <div className="absolute inset-0 bg-gradient-to-br from-gray-700/30 via-transparent to-gray-400/30 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>

                {/* Decorative corner accent */}
                <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-white/5 to-transparent rounded-bl-full"></div>

                <div className="flex items-center justify-center relative">
                  <div className="relative">
                    <img
                      src={sales}
                      alt="sales"
                      className="w-24 h-24 object-cover drop-shadow-lg group-hover:scale-110 transition-transform duration-300"
                    />
                    {/* Glow effect behind image */}
                    <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-gray-400/20 blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 -z-10"></div>
                  </div>
                </div>

                <div className="flex items-center justify-center relative">
                  <div className="flex flex-col text-center">
                    <p className="text-3xl bg-gradient-to-r from-white to-gray-200 bg-clip-text text-transparent">
                      Sales
                    </p>
                    <span className="text-[10px] text-gray-400">sales transactions</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="col-span-12 bg-gradient-to-br from-gray-900 to-gray-800 rounded-4xl border border-white/20 hover:shadow-[0_20px_60px_rgba(0,0,0,0.4),0_4px_16px_rgba(0,0,0,0.3),inset_0_1px_0_rgba(255,255,255,0.15)] transition-all duration-300 hover:-translate-y-1 p-6 flex flex-col justify-center gap-4 relative overflow-hidden group w-full hover:cursor-pointer">
              {/* Animated background gradient */}
              <div className="absolute inset-0 bg-gradient-to-br from-gray-700/30 via-transparent to-gray-400/30 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>

              {/* Decorative corner accent */}
              <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-white/5 to-transparent rounded-bl-full"></div>

              <h3 className="font-semibold text-white text-xl">
                {fullMonth} {year}
              </h3>
              <div className="mt-4 flex flex-col space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-medium text-white text-sm">Last BackUp</span>
                  <span className="text-white text-sm">Sep 13, 10:00 AM</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="font-medium text-white text-sm">Next BackUp</span>
                  <span className="text-white text-sm">Sep 15, 09:00 AM</span>
                </div>
              </div>
            </div>

            {/* <div className="col-span-6 bg-white rounded-4xl border border-gray-100 shadow-lg p-4">
              <WhatsAppQRModal />
            </div> */}
          </div>
        </div>
      </div>
    </div>
  )
}

export default Dashboard
