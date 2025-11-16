/* eslint-disable prettier/prettier */

import { Button } from 'rsuite'
import Navbar from '../components/UI/Navbar'
import { useNavigate } from 'react-router-dom'

const BankManagement = () => {
  const navigate = useNavigate()

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 text-gray-800">
      <Navbar />
      <div className="p-8 max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <p className="text-3xl font-light ">Banking System</p>
        </div>
      </div>

      <div>
        <div className="grid grid-cols-12 gap-1.5 p-6 bg-gray-50 min-h-[300px] font-poppins">
          {/* Profile Card */}
          <div
            className="col-span-3 bg-gradient-to-br from-white to-gray-50 rounded-4xl border border-gray-400 border-b-4 shadow-[0_10px_40px_rgba(0,0,0,0.08),0_2px_12px_rgba(0,0,0,0.04),inset_0_1px_0_rgba(255,255,255,0.8)] hover:shadow-[0_20px_60px_rgba(0,0,0,0.12),0_4px_16px_rgba(0,0,0,0.06),inset_0_1px_0_rgba(255,255,255,0.9)] transition-all duration-300 hover:-translate-y-1 p-6 flex flex-col justify-center gap-4 relative overflow-hidden group hover:cursor-pointer"
            onClick={() => navigate('/createAccount')}
          >
            {/* Animated background gradient */}
            <div className="absolute inset-0 bg-gradient-to-br from-blue-50/50 via-transparent to-purple-50/50 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>

            {/* Decorative corner accent */}
            <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-gray-900/5 to-transparent rounded-bl-full"></div>

            <div className="flex items-center justify-center relative">
              <div className="relative">
                {/* Glow effect behind image */}
                <div className="absolute inset-0 bg-gradient-to-br from-blue-400/40 to-purple-400/20 blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 -z-10"></div>
              </div>
            </div>

            <div className="flex items-center justify-center relative pt-1">
              <div className="flex flex-col text-center">
                <p className="text-3xl bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
                  Add Account
                </p>
                <span className="text-[10px] text-gray-500">Manage Accounts</span>
              </div>
            </div>
          </div>

          <div
            className="col-span-3 bg-gradient-to-br from-white to-gray-50 rounded-4xl border border-gray-400 border-b-4 shadow-[0_10px_40px_rgba(0,0,0,0.08),0_2px_12px_rgba(0,0,0,0.04),inset_0_1px_0_rgba(255,255,255,0.8)] hover:shadow-[0_20px_60px_rgba(0,0,0,0.12),0_4px_16px_rgba(0,0,0,0.06),inset_0_1px_0_rgba(255,255,255,0.9)] transition-all duration-300 hover:-translate-y-1 p-6 flex flex-col justify-center gap-4 relative overflow-hidden group hover:cursor-pointer"
            onClick={() => navigate('/bankLedger')}
          >
            {/* Animated background gradient */}
            <div className="absolute inset-0 bg-gradient-to-br from-blue-50/50 via-transparent to-purple-50/50 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>

            {/* Decorative corner accent */}
            <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-gray-900/5 to-transparent rounded-bl-full"></div>

            <div className="flex items-center justify-center relative">
              <div className="relative">
                {/* <img
                  src={clientList}
                  alt="client"
                  className="w-24 h-24 object-cover drop-shadow-lg group-hover:scale-110 transition-transform duration-300"
                /> */}
                {/* Glow effect behind image */}
                <div className="absolute inset-0 bg-gradient-to-br from-blue-400/40 to-purple-400/20 blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 -z-10"></div>
              </div>
            </div>

            <div className="flex items-center justify-center relative mt-1">
              <div className="flex flex-col text-center">
                <p className="text-3xl bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
                  View Ledger
                </p>
                <span className="text-[10px] text-gray-500">View Ledger</span>
              </div>
            </div>
          </div>

          <div
            className="col-span-3 bg-gradient-to-br from-white to-gray-50 rounded-4xl border border-gray-400 border-b-4 shadow-[0_10px_40px_rgba(0,0,0,0.08),0_2px_12px_rgba(0,0,0,0.04),inset_0_1px_0_rgba(255,255,255,0.8)] hover:shadow-[0_20px_60px_rgba(0,0,0,0.12),0_4px_16px_rgba(0,0,0,0.06),inset_0_1px_0_rgba(255,255,255,0.9)] transition-all duration-300 hover:-translate-y-1 p-6 flex flex-col justify-center gap-4 relative overflow-hidden group hover:cursor-pointer"
            onClick={() => navigate('/transferAmount')}
          >
            {/* Animated background gradient */}
            <div className="absolute inset-0 bg-gradient-to-br from-blue-50/50 via-transparent to-purple-50/50 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>

            {/* Decorative corner accent */}
            <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-gray-900/5 to-transparent rounded-bl-full"></div>

            <div className="flex items-center justify-center relative">
              <div className="relative">
                {/* <img
                  src={clientList}
                  alt="client"
                  className="w-24 h-24 object-cover drop-shadow-lg group-hover:scale-110 transition-transform duration-300"
                /> */}
                {/* Glow effect behind image */}
                <div className="absolute inset-0 bg-gradient-to-br from-blue-400/40 to-purple-400/20 blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 -z-10"></div>
              </div>
            </div>

            <div className="flex items-center justify-center relative mt-1">
              <div className="flex flex-col text-center">
                <p className="text-3xl bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
                  Transfer Amount
                </p>
                <span className="text-[10px] text-gray-500">Transfer</span>
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
                {/* <img
                  src={clientList}
                  alt="client"
                  className="w-24 h-24 object-cover drop-shadow-lg group-hover:scale-110 transition-transform duration-300"
                /> */}
                {/* Glow effect behind image */}
                <div className="absolute inset-0 bg-gradient-to-br from-blue-400/40 to-purple-400/20 blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 -z-10"></div>
              </div>
            </div>

            <div className="flex items-center justify-center relative mt-1">
              <div className="flex flex-col text-center">
                <p className="text-3xl bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
                  Reports
                </p>
                <span className="text-[10px] text-gray-500">Reports</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default BankManagement
