/* eslint-disable prettier/prettier */
import React, { useState, useEffect } from 'react'
import Navbar from '../components/UI/Navbar'
import { useNavigate } from 'react-router-dom'
import { LineChart } from '@mui/x-charts/LineChart'
import { BarChart } from '@mui/x-charts/BarChart'
import { PieChart } from '@mui/x-charts/PieChart'
import { motion } from 'framer-motion'

const AnimatedNumber = ({ value }) => {
  const [displayValue, setDisplayValue] = useState(0)

  useEffect(() => {
    let start = 0
    const end = parseInt(value.toString().replace(/\D/g, '')) || 0
    if (start === end) return

    let step = 0
    const duration = 1000
    const increment = end / (duration / 16)

    const timer = setInterval(() => {
      start += increment
      step++
      if (start >= end) {
        clearInterval(timer)
        setDisplayValue(end)
      } else {
        setDisplayValue(Math.floor(start))
      }
    }, 16)

    return () => clearInterval(timer)
  }, [value])

  return <>{value.includes('₹') ? `₹${displayValue.toLocaleString()}` : displayValue.toLocaleString()}</>
}

const Analytics = () => {
  const navigate = useNavigate()
  const [dateRange, setDateRange] = useState('last30days')
  const [activeTab, setActiveTab] = useState('overview')

  // Initial sample data for charts
  const initialSalesData = [
    { name: 'Jan', sales: 140000, purchase: 120000, profit: 20000 },
    { name: 'Feb', sales: 180000, purchase: 150000, profit: 30000 },
    { name: 'Mar', sales: 160000, purchase: 140000, profit: 20000 },
    { name: 'Apr', sales: 220000, purchase: 180000, profit: 40000 },
    { name: 'May', sales: 250000, purchase: 200000, profit: 50000 },
    { name: 'Jun', sales: 280000, purchase: 220000, profit: 60000 }
  ]

  const initialPieData = [
    { name: 'Electronics', value: 35, color: '#3B82F6' },
    { name: 'Clothing', value: 25, color: '#10B981' },
    { name: 'Food & Beverage', value: 20, color: '#F59E0B' },
    { name: 'Books', value: 12, color: '#EF4444' },
    { name: 'Others', value: 8, color: '#8B5CF6' }
  ]

  const initialKpiCards = [
    {
      title: 'Total Revenue',
      value: '₹2850000',
      change: '+15.2%',
      trend: 'up',
      icon: '💰',
      gradient: 'from-blue-500 to-blue-600',
      bgPattern: 'from-blue-50/20 to-blue-100/10'
    },
    {
      title: 'Net Profit',
      value: '₹620000',
      change: '+22.8%',
      trend: 'up',
      icon: '📈',
      gradient: 'from-green-500 to-green-600',
      bgPattern: 'from-green-50/20 to-green-100/10'
    },
    {
      title: 'Total Orders',
      value: '1247',
      change: '+8.3%',
      trend: 'up',
      icon: '📦',
      gradient: 'from-purple-500 to-purple-600',
      bgPattern: 'from-purple-50/20 to-purple-100/10'
    },
    {
      title: 'Active Clients',
      value: '342',
      change: '+12.1%',
      trend: 'up',
      icon: '👥',
      gradient: 'from-orange-500 to-orange-600',
      bgPattern: 'from-orange-50/20 to-orange-100/10'
    },
    {
      title: 'Avg Order Value',
      value: '₹2285',
      change: '-3.2%',
      trend: 'down',
      icon: '💳',
      gradient: 'from-red-500 to-red-600',
      bgPattern: 'from-red-50/20 to-red-100/10'
    },
    {
      title: 'Inventory Value',
      value: '₹1530000',
      change: '+5.7%',
      trend: 'up',
      icon: '📊',
      gradient: 'from-teal-500 to-teal-600',
      bgPattern: 'from-teal-50/20 to-teal-100/10'
    }
  ]

  const [salesData, setSalesData] = useState(initialSalesData)
  const [pieData, setPieData] = useState(initialPieData)
  const [kpiCards, setKpiCards] = useState(initialKpiCards)

  useEffect(() => {
    const interval = setInterval(() => {
      setSalesData(prev => prev.map(d => {
        const salesDelta = Math.floor(Math.random() * 10000 - 5000)
        const purchaseDelta = Math.floor(Math.random() * 10000 - 5000)
        const newSales = Math.max(10000, d.sales + salesDelta)
        const newPurchase = Math.max(10000, d.purchase + purchaseDelta)
        const newProfit = Math.max(0, newSales - newPurchase)
        return { ...d, sales: newSales, purchase: newPurchase, profit: newProfit }
      }))

      setPieData(prev => {
        let newData = prev.map(p => ({
          ...p,
          value: Math.max(1, p.value + Math.floor(Math.random() * 5 - 2.5))
        }))
        const total = newData.reduce((sum, p) => sum + p.value, 0)
        newData = newData.map(p => ({ ...p, value: Math.round((p.value / total) * 100) }))
        return newData
      })

      setKpiCards(prev => prev.map(card => {
        let newValueNum
        const deltaPercent = (Math.random() * 10 - 5).toFixed(1)
        const newChange = `${deltaPercent > 0 ? '+' : ''}${deltaPercent}%`
        const newTrend = deltaPercent > 0 ? 'up' : 'down'

        if (card.title.includes('Value') || card.title.includes('Revenue') || card.title.includes('Profit')) {
          const currentNum = parseInt(card.value.replace(/\D/g, ''))
          newValueNum = Math.max(1000, currentNum + Math.floor(Math.random() * 100000 - 50000))
          return { ...card, value: `₹${newValueNum.toLocaleString('en-IN')}`, change: newChange, trend: newTrend }
        } else {
          const currentNum = parseInt(card.value.replace(/,/g, ''))
          newValueNum = Math.max(10, currentNum + Math.floor(Math.random() * 50 - 25))
          return { ...card, value: newValueNum.toLocaleString(), change: newChange, trend: newTrend }
        }
      }))
    }, 10000) // Update every 10 seconds for real-time simulation

    return () => clearInterval(interval)
  }, [])

  const handlePrint = () => {
    const content = document.getElementById('analytics-content')
    const printWindow = window.open('', '_blank')
    printWindow.document.write(
      `<html><head><title>Analytics Report</title></head><body>${content.innerHTML}</body></html>`
    )
    printWindow.document.close()
    printWindow.print()
  }

  return (
    <div className="select-none max-h-screen w-full overflow-x-auto transition-all duration-300 min-w-[720px] bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/50">
      {/* Animated Background Elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 -left-40 w-80 h-80 bg-blue-400/10 rounded-full blur-3xl animate-pulse" />
        <div
          className="absolute bottom-1/4 -right-40 w-96 h-96 bg-indigo-400/10 rounded-full blur-3xl animate-pulse"
          style={{ animationDelay: '2s' }}
        />
      </div>

      <div className="relative z-10">
        {/* Enhanced Navbar */}
        <div className="w-full sticky top-0 z-20 backdrop-blur-xl bg-white/70 border-b border-white/20">
          <Navbar />
        </div>

        <div id="analytics-content">
          {/* Header with Controls */}
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center mt-6 pb-4 px-7 gap-4">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center text-white text-xl font-bold shadow-lg">
                📊
              </div>
              <div>
                <h1 className="text-4xl font-light text-gray-900">Analytics Dashboard</h1>
                <p className="text-gray-600 text-sm">Comprehensive business performance insights</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              {/* Date Filter */}
              <select
                value={dateRange}
                onChange={(e) => setDateRange(e.target.value)}
                className="px-4 py-2 bg-white/40 backdrop-blur-sm border border-white/30 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/50"
              >
                <option value="last7days">Last 7 Days</option>
                <option value="last30days">Last 30 Days</option>
                <option value="last3months">Last 3 Months</option>
                <option value="last6months">Last 6 Months</option>
                <option value="lastyear">Last Year</option>
              </select>

              {/* Print Button */}
              <button
                onClick={handlePrint}
                className="px-6 py-2 bg-gradient-to-r from-blue-500 to-indigo-600 text-white text-sm font-medium rounded-xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200 flex items-center gap-2"
              >
                🖨️ Print Report
              </button>
            </div>
          </div>

          {/* Tab Navigation */}
          <div className="px-7 mb-6">
            <div className="flex gap-2 bg-white/20 backdrop-blur-sm p-1 rounded-2xl border border-white/30 w-fit">
              {['overview', 'sales', 'financial', 'operations'].map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`px-6 py-2 rounded-xl text-sm font-medium capitalize transition-all duration-200 ${
                    activeTab === tab
                      ? 'bg-white text-gray-900 shadow-md'
                      : 'text-gray-600 hover:text-gray-800'
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>
          </div>

          {/* KPI Cards */}
          <motion.div
            className="px-6 mb-8 overflow-scroll max-h-[1000px]"
            initial="hidden"
            animate="show"
            variants={{
              hidden: {},
              show: { transition: { staggerChildren: 0.1 } }
            }}
          >
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {kpiCards.map((card, index) => (
                <div
                  key={index}
                  className="group relative p-6 bg-white/20 backdrop-blur-xl border border-white/30 rounded-3xl hover:bg-white/30 hover:scale-[1.02] transition-all duration-300 shadow-lg hover:shadow-2xl"
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                  <div
                    className={`absolute inset-0 bg-gradient-to-br ${card.bgPattern} rounded-3xl opacity-50`}
                  />

                  <div className="relative z-10 flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-4">
                        <div
                          className={`w-12 h-12 bg-gradient-to-br ${card.gradient} rounded-2xl flex items-center justify-center text-white text-xl shadow-lg`}
                        >
                          {card.icon}
                        </div>
                        <div>
                          <p className="text-sm text-gray-600 font-medium">{card.title}</p>
                          <p className="text-2xl font-bold text-gray-900">
                            <AnimatedNumber value={card.value} />
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <span
                          className={`text-sm font-semibold ${card.trend === 'up' ? 'text-green-600' : 'text-red-600'}`}
                        >
                          {card.trend === 'up' ? '↗️' : '↘️'} {card.change}
                        </span>
                        <span className="text-xs text-gray-500">from last period</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Main Analytics Content */}
          <div className="px-6 pb-8">
            <div className="grid grid-cols-12 gap-6">
              {/* Sales & Revenue Chart */}
              <div className="col-span-12 lg:col-span-8 bg-white/20 backdrop-blur-xl border border-white/30 rounded-3xl p-8 shadow-lg">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xl font-semibold text-gray-900">Sales & Revenue Trend</h3>
                  <div className="flex gap-2">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                      <span className="text-sm text-gray-600">Sales</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                      <span className="text-sm text-gray-600">Profit</span>
                    </div>
                  </div>
                </div>

                <div style={{ width: '100%', height: 300 }}>
                  <LineChart
                    dataset={salesData}
                    xAxis={[{ scaleType: 'point', dataKey: 'name' }]}
                    series={[
                      { dataKey: 'sales', area: true, color: '#3B82F6', showMark: false, curve: 'monotoneX' },
                      { dataKey: 'profit', area: true, color: '#10B981', showMark: false, curve: 'monotoneX' }
                    ]}
                    grid={{ vertical: true, horizontal: true }}
                  />
                </div>
              </div>

              {/* Category Distribution */}
              <div className="col-span-12 lg:col-span-4 bg-white/20 backdrop-blur-xl border border-white/30 rounded-3xl p-8 shadow-lg">
                <h3 className="text-xl font-semibold text-gray-900 mb-6">Category Distribution</h3>

                <div style={{ width: '100%', height: 300 }}>
                  <PieChart
                    series={[
                      {
                        data: pieData.map((item, index) => ({
                          id: index,
                          value: item.value,
                          label: item.name,
                          color: item.color
                        })),
                        innerRadius: 60,
                        outerRadius: 100,
                        paddingAngle: 2,
                        cornerRadius: 5
                      }
                    ]}
                  />
                </div>

                <div className="mt-4 space-y-2">
                  {pieData.map((item, index) => (
                    <div key={index} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: item.color }}
                        ></div>
                        <span className="text-sm text-gray-700">{item.name}</span>
                      </div>
                      <span className="text-sm font-semibold text-gray-900">{item.value}%</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Monthly Performance */}
              <div className="col-span-12 lg:col-span-6 bg-white/20 backdrop-blur-xl border border-white/30 rounded-3xl p-8 shadow-lg">
                <h3 className="text-xl font-semibold text-gray-900 mb-6">Monthly Performance</h3>

                <div style={{ width: '100%', height: 250 }}>
                  <BarChart
                    dataset={salesData}
                    xAxis={[{ scaleType: 'band', dataKey: 'name' }]}
                    series={[
                      { dataKey: 'sales', color: '#3B82F6' },
                      { dataKey: 'purchase', color: '#EF4444' }
                    ]}
                    grid={{ vertical: true, horizontal: true }}
                    borderRadius={8}
                  />
                </div>
              </div>

              {/* Quick Actions */}
              <div className="col-span-12 lg:col-span-6 bg-white/20 backdrop-blur-xl border border-white/30 rounded-3xl p-8 shadow-lg">
                <h3 className="text-xl font-semibold text-gray-900 mb-6">Quick Actions</h3>

                <div className="grid grid-cols-2 gap-4">
                  {[
                    { name: 'Bank Reports', icon: '🏦', route: '/bank', color: 'blue' },
                    { name: 'Cash Reports', icon: '💵', route: '/cash', color: 'green' },
                    { name: 'Add Products', icon: '📦', route: '/products', color: 'purple' },
                    { name: 'Manage Clients', icon: '👥', route: '/clients', color: 'orange' },
                    { name: 'Purchase Orders', icon: '🛒', route: '/purchase', color: 'red' },
                    { name: 'Inventory', icon: '📊', route: '/inventory', color: 'teal' }
                  ].map((action, index) => (
                    <button
                      key={index}
                      onClick={() => navigate(action.route)}
                      className={`p-4 bg-gradient-to-br from-${action.color}-500/20 to-${action.color}-600/10 hover:from-${action.color}-500/30 hover:to-${action.color}-600/20 border border-white/20 rounded-2xl transition-all duration-200 hover:scale-105 hover:shadow-lg group`}
                    >
                      <div className="text-2xl mb-2 group-hover:scale-110 transition-transform duration-200">
                        {action.icon}
                      </div>
                      <div className="text-sm font-medium text-gray-700 group-hover:text-gray-900 transition-colors duration-200">
                        {action.name}
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Recent Activity */}
              <div className="col-span-12 bg-white/20 backdrop-blur-xl border border-white/30 rounded-3xl p-8 shadow-lg">
                <h3 className="text-xl font-semibold text-gray-900 mb-6">Recent Activity</h3>

                <div className="space-y-4">
                  {[
                    {
                      type: 'sale',
                      message: 'New sale of ₹12,450 from Client ABC Corp',
                      time: '2 minutes ago',
                      icon: '💰',
                      color: 'green'
                    },
                    {
                      type: 'purchase',
                      message: 'Purchase order #PO-2024-001 for ₹8,750',
                      time: '15 minutes ago',
                      icon: '🛒',
                      color: 'blue'
                    },
                    {
                      type: 'payment',
                      message: 'Payment received ₹25,000 from XYZ Industries',
                      time: '1 hour ago',
                      icon: '✅',
                      color: 'emerald'
                    },
                    {
                      type: 'client',
                      message: 'New client registration: Tech Solutions Ltd',
                      time: '2 hours ago',
                      icon: '👥',
                      color: 'purple'
                    },
                    {
                      type: 'inventory',
                      message: 'Low stock alert for Product SKU-12345',
                      time: '3 hours ago',
                      icon: '⚠️',
                      color: 'amber'
                    }
                  ].map((activity, index) => (
                    <div
                      key={index}
                      className="flex items-center gap-4 p-4 bg-white/30 backdrop-blur-sm rounded-2xl border border-white/20"
                    >
                      <div
                        className={`w-10 h-10 bg-gradient-to-br from-${activity.color}-500 to-${activity.color}-600 rounded-full flex items-center justify-center text-white shadow-md`}
                      >
                        {activity.icon}
                      </div>
                      <div className="flex-1">
                        <p className="text-sm text-gray-800 font-medium">{activity.message}</p>
                        <p className="text-xs text-gray-500 mt-1">{activity.time}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Analytics