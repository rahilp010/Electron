/* eslint-disable prettier/prettier */
import React, { useState } from 'react'
import Navbar from '../components/UI/Navbar'
import Loader from '../components/Loader'
import { useNavigate } from 'react-router-dom'

const Reports = () => {
  const navigate = useNavigate()
  const [showLoader, setShowLoader] = useState(false)
  const [hoveredCard, setHoveredCard] = useState(null)

  const reportCards = [
    {
      id: 1,
      title: 'Ledger Report',
      description: 'Complete transaction history and account statements',
      icon: '📊',
      route: '/ledger',
      gradient: 'from-blue-500/80 to-indigo-600/80',
      hoverGradient: 'from-blue-600/90 to-indigo-700/90',
      bgPattern: 'from-blue-50/20 to-indigo-50/10'
    },
    {
      id: 2,
      title: 'Pending Payments',
      description: 'Track outstanding payment obligations',
      icon: '💳',
      route: '/pendingPayment',
      gradient: 'from-amber-500/80 to-orange-600/80',
      hoverGradient: 'from-amber-600/90 to-orange-700/90',
      bgPattern: 'from-amber-50/20 to-orange-50/10'
    },
    {
      id: 3,
      title: 'Pending Collections',
      description: 'Monitor receivables and collection status',
      icon: '📈',
      route: '/pendingCollection',
      gradient: 'from-rose-500/80 to-pink-600/80',
      hoverGradient: 'from-rose-600/90 to-pink-700/90',
      bgPattern: 'from-rose-50/20 to-pink-50/10'
    },
    {
      id: 4,
      title: 'Financial Analytics',
      description: 'Comprehensive financial insights and trends',
      icon: '📋',
      route: '/analytics',
      gradient: 'from-purple-500/80 to-violet-600/80',
      hoverGradient: 'from-purple-600/90 to-violet-700/90',
      bgPattern: 'from-purple-50/20 to-violet-50/10'
    },
    {
      id: 5,
      title: 'Cash Flow Analysis',
      description: 'Real-time cash flow monitoring and forecasting',
      icon: '💰',
      route: '/cashflow',
      gradient: 'from-rose-500/80 to-pink-600/80',
      hoverGradient: 'from-rose-600/90 to-pink-700/90',
      bgPattern: 'from-rose-50/20 to-pink-50/10'
    },
    {
      id: 6,
      title: 'Tax Reports',
      description: 'Generate comprehensive tax documentation',
      icon: '📄',
      route: '/tax-reports',
      gradient: 'from-teal-500/80 to-cyan-600/80',
      hoverGradient: 'from-teal-600/90 to-cyan-700/90',
      bgPattern: 'from-teal-50/20 to-cyan-50/10'
    }
  ]

  return (
    <div className="select-none min-h-screen w-full overflow-x-auto transition-all duration-300 min-w-[720px] bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/50">
      {/* Animated Background Elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 -left-40 w-80 h-80 bg-blue-400/10 rounded-full blur-3xl animate-pulse" />
        <div
          className="absolute bottom-1/4 -right-40 w-96 h-96 bg-indigo-400/10 rounded-full blur-3xl animate-pulse"
          style={{ animationDelay: '2s' }}
        />
        <div
          className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-72 h-72 bg-purple-400/5 rounded-full blur-3xl animate-pulse"
          style={{ animationDelay: '4s' }}
        />
      </div>

      <div className="relative z-10">
        {/* Navbar with Glass Effect */}
        <div className="w-full sticky top-0 z-20 backdrop-blur-xl bg-white/70 border-b border-white/20">
          <Navbar />
        </div>

        {/* Enhanced Header */}
        <div className="relative overflow-hidden -mt-5">
          <div className="absolute inset-0" />
          <div className="relative flex flex-col items-start justify-between mt-8 pb-6 px-7">
            <div className="flex justify-between mt-5 pb-2 items-center">
              <p className="text-3xl font-light">Reports List</p>
            </div>

            {/* Stats Bar */}
            <div className="flex gap-4 mt-4">
              <div className="flex items-center gap-2 px-4 py-2 bg-emerald-200/20 backdrop-blur-sm rounded-full border border-emerald-300">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                <span className="text-xs font-light">6 Reports Available</span>
              </div>
              <div className="flex items-center gap-2 px-4 py-2 bg-blue-200/30 backdrop-blur-sm rounded-full border border-blue-300">
                <div className="w-2 h-2 bg-blue-500 rounded-full" />
                <span className="text-xs font-light">Real-time Data</span>
              </div>
            </div>
          </div>
        </div>

        <div className="max-h-[calc(100vh-200px)] overflow-scroll customScrollbar">
          {/* Enhanced Reports Grid */}
          <div className="px-6 pb-8">
            <div className="grid grid-cols-1 md:grid-cols-3 xl:grid-cols-3 gap-4 max-w-7xl mx-auto cursor-pointer">
              {reportCards.map((card, index) => (
                <div
                  key={card.id}
                  className={`group relative overflow-hidden rounded-3xl cursor-pointer transition-all duration-500 animate-fadeInUp border border-gray-200`}
                  style={{ animationDelay: `${index * 100}ms` }}
                  onMouseEnter={() => setHoveredCard(card.id)}
                  onMouseLeave={() => setHoveredCard(null)}
                  onClick={() => navigate(card.route)}
                >
                  {/* Glass Card Background */}
                  <div
                    className={`relative p-8 h-64 bg-white/20 backdrop-blur-xl border border-white/30 rounded-3xl transition-all duration-500 group-hover:bg-white/30 group-hover:backdrop-blur-2xl group-hover:border-white/40 group-hover:scale-[1.02] group-hover:shadow-2xl
                  ${hoveredCard === card.id ? 'shadow-2xl' : 'shadow-lg'}`}
                    style={{
                      boxShadow:
                        hoveredCard === card.id
                          ? '0 25px 50px -12px rgba(0, 0, 0, 0.25), 0 0 0 1px rgba(255, 255, 255, 0.2), inset 0 1px 0 rgba(255, 255, 255, 0.3)'
                          : '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 0 0 1px rgba(255, 255, 255, 0.1), inset 0 1px 0 rgba(255, 255, 255, 0.2)'
                    }}
                  >
                    {/* Background Pattern */}
                    <div
                      className={`absolute inset-0 bg-gradient-to-br ${card.bgPattern} rounded-3xl transition-opacity duration-500 ${hoveredCard === card.id ? 'opacity-100' : 'opacity-50'}`}
                    />

                    {/* Animated Gradient Overlay */}
                    <div
                      className={`absolute inset-0 bg-gradient-to-br ${hoveredCard === card.id ? card.hoverGradient : card.gradient} opacity-0 group-hover:opacity-10 rounded-3xl transition-all duration-500`}
                    />

                    {/* Content */}
                    <div className="relative z-10 h-full flex flex-col justify-between">
                      {/* Icon and Title */}
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <div className="text-4xl transform transition-all duration-300 group-hover:scale-110 group-hover:rotate-12">
                            {card.icon}
                          </div>
                          <div
                            className={`w-3 h-3 rounded-full bg-gradient-to-r ${card.gradient} opacity-60 group-hover:opacity-100 transition-all duration-300`}
                          />
                        </div>

                        <div>
                          <h3 className="text-xl font-semibold text-gray-900 mb-2 group-hover:text-gray-800 transition-colors duration-300">
                            {card.title}
                          </h3>
                          <p className="text-sm text-gray-600 leading-relaxed group-hover:text-gray-700 transition-colors duration-300">
                            {card.description}
                          </p>
                        </div>
                      </div>

                      {/* Action Button */}
                      <div className="flex justify-end">
                        <div
                          className={`px-6 py-2 bg-gradient-to-r ${card.gradient} text-white text-sm font-medium rounded-2xl shadow-lg backdrop-blur-sm border border-white/20 transform transition-all duration-300 group-hover:scale-105 group-hover:shadow-xl opacity-90 group-hover:opacity-100`}
                        >
                          View Report
                          <span className="ml-2 transform transition-transform duration-300 group-hover:translate-x-1 inline-block">
                            →
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Hover Glow Effect */}
                    <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 bg-gradient-to-br from-white/10 via-transparent to-transparent rounded-3xl" />

                    {/* Edge Highlight */}
                    <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Enhanced Loader */}
      {showLoader && (
        <div className="fixed inset-0 bg-black/20 backdrop-blur-sm flex items-center justify-center z-50">
          <Loader />
        </div>
      )}
    </div>
  )
}

export default Reports
