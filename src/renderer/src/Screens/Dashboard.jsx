/* eslint-disable prettier/prettier */
/* eslint-disable react-hooks/exhaustive-deps */
import Navbar from '../components/UI/Navbar'
import clientList from '../assets/client.png'
import report from '../assets/report.png'
import product from '../assets/product.png'
import bank from '../assets/ATM.png'
import transfer from '../assets/transfer.png'
import purchase from '../assets/purchase.png'
import sales from '../assets/sales.png'
import salary from '../assets/salary.png'
import { useNavigate } from 'react-router-dom'
import { useDispatch } from 'react-redux'
import { setKeyBindings } from '../app/features/electronSlice'
import { useEffect, useState } from 'react'
import { IoReceipt } from 'react-icons/io5'
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

  const [systemInfo, setSystemInfo] = useState({
    lastBackup: null,
    nextBackup: null,
    backupTakenToday: false,
    version: '',
    totalProducts: 0,
    totalClients: 0,
    totalAccounts: 0,
    totalTransactions: 0
  })

  const fetchSystemInfo = async () => {
    try {
      const data = await window.api.getSystemInfo()
      setSystemInfo(data)
    } catch (err) {
      console.error('Failed to load system info:', err)
    }
  }

  useEffect(() => {
    fetchKeyBindings()
    fetchSystemInfo()
  }, [])

  const formatDateTime = (value) => (value ? new Date(value).toLocaleString('en-IN') : '—')

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
                onClick={() => navigate('/bankManagment')}
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
                onClick={() => navigate('/transferAmount')}
              >
                <div className="absolute inset-0 bg-gradient-to-br from-gray-700/30 via-transparent to-gray-400/30 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>

                {/* Decorative corner accent */}
                <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-white/5 to-transparent rounded-bl-full"></div>

                <div className="flex items-center justify-center relative">
                  <div className="relative">
                    <img
                      src={transfer}
                      alt="Transfer"
                      className="w-28 h-28 object-cover drop-shadow-lg group-hover:scale-110 transition-transform duration-300"
                    />
                    {/* Glow effect behind image */}
                    <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-gray-400/20 blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 -z-10"></div>
                  </div>
                </div>

                <div className="flex items-center justify-center relative">
                  <div className="flex flex-col text-center">
                    <p className="text-3xl bg-gradient-to-r from-white to-gray-200 bg-clip-text text-transparent">
                      Transfer
                    </p>
                    <span className="text-[10px] text-gray-400">Transfer Amount</span>
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

              <div className="flex items-center justify-center relative">
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

            {/* <div
              className="col-span-12 bg-gradient-to-br from-gray-900 to-gray-800 rounded-4xl border border-white/20 hover:shadow-[0_20px_60px_rgba(0,0,0,0.4),0_4px_16px_rgba(0,0,0,0.3),inset_0_1px_0_rgba(255,255,255,0.15)] transition-all duration-300 hover:-translate-y-1 p-6 flex flex-col justify-center gap-4 relative overflow-hidden group w-full hover:cursor-pointer h-32"
              onClick={() => navigate('/bankManagment')}
            >
              <div className="absolute inset-0 bg-gradient-to-br from-gray-700/30 via-transparent to-gray-400/30 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>

              <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-white/5 to-transparent rounded-bl-full"></div>

              <div className="flex flex-col text-center">
                <p className="text-3xl bg-gradient-to-r from-white to-gray-200 bg-clip-text text-transparent">
                  Bank Management System
                </p>
                <span className="text-[10px] text-gray-400">Manage bank transactions</span>
              </div>
            </div> */}

            <div className="col-span-12 bg-gradient-to-br from-gray-900 to-gray-800 rounded-4xl border border-white/20 hover:shadow-[0_20px_60px_rgba(0,0,0,0.4),0_4px_16px_rgba(0,0,0,0.3),inset_0_1px_0_rgba(255,255,255,0.15)] transition-all duration-300 hover:-translate-y-1 p-6 flex flex-col justify-center gap-4 relative overflow-hidden group w-full hover:cursor-pointer">
              <div className="absolute inset-0 bg-gradient-to-br from-gray-700/30 via-transparent to-gray-400/30 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>

              <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-white/5 to-transparent rounded-bl-full"></div>

              <h3 className="font-semibold text-white text-xl">
                {new Date().toLocaleDateString('en-IN', {
                  weekday: 'long',
                  day: '2-digit',
                  month: 'long',
                  year: 'numeric'
                })}
              </h3>

              {/* ✅ Backup Status */}
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-300">Backup Status</span>
                <span
                  className={`font-semibold ${
                    systemInfo?.backupTakenToday ? 'text-green-400' : 'text-red-400'
                  }`}
                >
                  {systemInfo?.backupTakenToday ? '✔ Taken Today' : '⚠ Pending'}
                </span>
              </div>

              {/* ✅ Last Backup */}
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-300">Last Backup</span>
                <span className="text-white">{formatDateTime(systemInfo?.lastBackup)}</span>
              </div>

              {/* ✅ Version */}
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-300">App Version</span>
                <span className="text-blue-400 font-semibold">
                  v{systemInfo?.version || '1.0.0'}
                </span>
              </div>

              {/* ✅ Divider */}
              <div className="border-t border-white/10 my-1"></div>

              {/* ✅ Stats Row */}
              <div className="grid grid-cols-4 gap-3 text-center mt-1">
                <div>
                  <p className="text-white font-semibold text-lg">{systemInfo?.totalProducts}</p>
                  <span className="text-[10px] text-gray-400">Products</span>
                </div>

                <div>
                  <p className="text-white font-semibold text-lg">{systemInfo?.totalClients}</p>
                  <span className="text-[10px] text-gray-400">Clients</span>
                </div>

                <div>
                  <p className="text-white font-semibold text-lg">{systemInfo?.totalAccounts}</p>
                  <span className="text-[10px] text-gray-400">Accounts</span>
                </div>

                <div>
                  <p className="text-white font-semibold text-lg">
                    {systemInfo?.totalTransactions}
                  </p>
                  <span className="text-[10px] text-gray-400">Transactions</span>
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
