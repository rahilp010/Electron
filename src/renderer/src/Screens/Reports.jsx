/* eslint-disable prettier/prettier */
import React, { useState } from 'react'
import { motion } from 'framer-motion'
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

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.3, ease: 'easeOut', when: 'beforeChildren', staggerChildren: 0.1 }
    }
  }

  const cardVariants = {
    hidden: { opacity: 0, y: 40, scale: 0.95 },
    visible: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.4, ease: 'easeOut' } }
  }

  return (
    <div className="select-none min-h-screen w-full overflow-x-auto transition-all duration-300 min-w-[720px] bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/50">
      {/* Background Glow */}
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
        {/* Navbar */}
        <div className="w-full sticky top-0 z-20 backdrop-blur-xl bg-white/70 border-b border-white/20">
          <Navbar />
        </div>

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="relative overflow-hidden -mt-5"
        >
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
        </motion.div>

        {/* Cards Section */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="max-h-[calc(100vh-200px)] overflow-scroll customScrollbar"
        >
          <div className="px-6 pb-8">
            <div className="grid grid-cols-1 md:grid-cols-3 xl:grid-cols-3 gap-4 max-w-7xl mx-auto cursor-pointer">
              {reportCards.map((card) => (
                <motion.div
                  key={card.id}
                  variants={cardVariants}
                  whileHover={{ scale: 1.03, rotateX: 5 }}
                  whileTap={{ scale: 0.98 }}
                  onMouseEnter={() => setHoveredCard(card.id)}
                  onMouseLeave={() => setHoveredCard(null)}
                  onClick={() => navigate(card.route)}
                  className="group relative overflow-hidden rounded-3xl border border-gray-200 bg-white/30 backdrop-blur-xl"
                >
                  {/* Background */}
                  <div
                    className={`absolute inset-0 bg-gradient-to-br ${card.bgPattern} rounded-3xl`}
                  />
                  <div
                    className={`absolute inset-0 bg-gradient-to-br ${
                      hoveredCard === card.id ? card.hoverGradient : card.gradient
                    } opacity-0 group-hover:opacity-10 transition-all duration-500 rounded-3xl`}
                  />

                  {/* Card Content */}
                  <div className="relative z-10 h-64 flex flex-col justify-between p-8">
                    <div className="space-y-4">
                      <motion.div
                        className="text-4xl"
                        animate={hoveredCard === card.id ? { y: [-2, 2, -2] } : {}}
                        transition={{
                          repeat: hoveredCard === card.id ? Infinity : 0,
                          duration: 1.5
                        }}
                      >
                        {card.icon}
                      </motion.div>

                      <h3 className="text-xl font-semibold text-gray-900 mb-2 group-hover:text-gray-800 transition-colors duration-300">
                        {card.title}
                      </h3>
                      <p className="text-sm text-gray-600 leading-relaxed group-hover:text-gray-700 transition-colors duration-300">
                        {card.description}
                      </p>
                    </div>

                    <motion.div
                      className={`self-end px-6 py-2 bg-gradient-to-r ${card.gradient} text-white text-sm font-medium rounded-2xl shadow-lg border border-white/20`}
                      whileHover={{ scale: 1.05 }}
                      transition={{ type: 'spring', stiffness: 200 }}
                    >
                      View Report →
                    </motion.div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </motion.div>
      </div>

      {/* Loader */}
      {showLoader && (
        <div className="fixed inset-0 bg-black/20 backdrop-blur-sm flex items-center justify-center z-50">
          <Loader />
        </div>
      )}
    </div>
  )
}

export default Reports
