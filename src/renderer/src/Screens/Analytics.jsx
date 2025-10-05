/* eslint-disable no-unused-vars */
/* eslint-disable no-const-assign */
/* eslint-disable react/display-name */
/* eslint-disable react/prop-types */
/* eslint-disable prettier/prettier */
import React, { useState, useEffect, useMemo, useCallback } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { setClients, setProducts, setTransactions } from '../app/features/electronSlice'
import { clientApi, productApi, transactionApi } from '../API/Api'
import { toast } from 'react-toastify'
import Navbar from '../components/UI/Navbar'
import { useNavigate } from 'react-router-dom'
import { DateRangePicker, SelectPicker } from 'rsuite'
import { Doughnut } from 'react-chartjs-2'
import {
  TrendingUp,
  TrendingDown,
  Users,
  Package,
  DollarSign,
  CreditCard,
  BarChart3,
  PieChart as PieChartIcon,
  Calendar,
  RefreshCcw,
  Eye,
  FileText,
  Building2,
  ShoppingCart,
  Wallet,
  FileUp
} from 'lucide-react'
import * as XLSX from 'xlsx'
import { Chart as ChartJs, defaults } from 'chart.js/auto'

// ✅ Register elements/plugins for Doughnut chart
defaults.maintainAspectRatio = false
defaults.responsive = true

// Utility functions
const formatCurrency = (value) => {
  if (!value || isNaN(value)) return '₹0'
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(Number(value))
}

const formatDate = (dateString) => {
  if (!dateString) return '-'
  return new Date(dateString).toLocaleDateString('en-IN')
}

const getDateRange = (range) => {
  const now = new Date()
  let end = new Date(now)
  let start = new Date(now)

  switch (range) {
    case 'today':
      start.setHours(0, 0, 0, 0)
      end.setHours(23, 59, 59, 999)
      break
    case 'yesterday':
      start.setDate(now.getDate() - 1)
      start.setHours(0, 0, 0, 0)
      end.setDate(now.getDate() - 1)
      end.setHours(23, 59, 59, 999)
      break
    case 'last7days':
      start.setDate(now.getDate() - 7)
      break
    case 'last30days':
      start.setDate(now.getDate() - 30)
      break
    case 'last90days':
      start.setDate(now.getDate() - 90)
      break
    case 'thisMonth':
      start = new Date(now.getFullYear(), now.getMonth(), 1)
      break
    case 'lastMonth':
      start = new Date(now.getFullYear(), now.getMonth() - 1, 1)
      end = new Date(now.getFullYear(), now.getMonth(), 0)
      break
    case 'thisYear':
      start = new Date(now.getFullYear(), 0, 1)
      break
    case 'lastYear':
      start = new Date(now.getFullYear() - 1, 0, 1)
      end = new Date(now.getFullYear() - 1, 11, 31)
      break
    default:
      start.setDate(now.getDate() - 30)
  }

  return { start, end }
}

// Animated Number Component
const AnimatedNumber = React.memo(({ value, duration = 200 }) => {
  const [displayValue, setDisplayValue] = useState(0)

  useEffect(() => {
    const numericValue =
      typeof value === 'string' ? parseFloat(value.replace(/[^\d.-]/g, '')) || 0 : value || 0

    let startTime
    let startValue = displayValue

    const animate = (currentTime) => {
      if (!startTime) startTime = currentTime
      const elapsed = currentTime - startTime
      const progress = Math.min(elapsed / duration, 1)

      // Easing function for smooth animation
      const easeOut = 1 - Math.pow(1 - progress, 3)
      const current = startValue + (numericValue - startValue) * easeOut

      setDisplayValue(current)

      if (progress < 1) {
        requestAnimationFrame(animate)
      }
    }

    requestAnimationFrame(animate)
  }, [value, duration, displayValue])

  return Math.round(displayValue).toLocaleString('en-IN')
})

// Custom hooks for data operations
const useAnalyticsData = () => {
  const dispatch = useDispatch()
  const [loading, setLoading] = useState(false)

  const clients = useSelector((state) => state.electron.clients.data || [])
  const products = useSelector((state) => state.electron.products.data || [])
  const transactions = useSelector((state) => state.electron.transaction.data || [])

  const fetchAllData = useCallback(async () => {
    setLoading(true)
    try {
      const [clientsRes, productsRes, transactionsRes] = await Promise.all([
        clientApi.getAllClients(),
        productApi.getAllProducts(),
        transactionApi.getAllTransactions()
      ])

      dispatch(setClients(clientsRes))
      dispatch(setProducts(productsRes))
      dispatch(setTransactions(transactionsRes))
    } catch (error) {
      console.error('Error fetching analytics data:', error)
      toast.error('Failed to fetch analytics data')
    } finally {
      setLoading(false)
    }
  }, [dispatch])

  return { clients, products, transactions, loading, fetchAllData }
}

// Main Component
const Analytics = () => {
  const navigate = useNavigate()
  const { clients, products, transactions, loading, fetchAllData } = useAnalyticsData()

  // State management
  const [dateRange, setDateRange] = useState('last30days')
  const [customDateRange, setCustomDateRange] = useState([])
  const [activeTab, setActiveTab] = useState('overview')
  const [autoRefresh, setAutoRefresh] = useState(false)

  // Filtered data based on date range
  const filteredData = useMemo(() => {
    let dateFilter

    if (customDateRange && customDateRange.length === 2) {
      dateFilter = {
        start: new Date(customDateRange[0]),
        end: new Date(customDateRange[1])
      }
    } else {
      dateFilter = getDateRange(dateRange)
    }

    const filteredTransactions = transactions.filter((t) => {
      const transactionDate = new Date(t.createdAt)
      return transactionDate >= dateFilter.start && transactionDate <= dateFilter.end
    })

    const filteredClients = clients.filter((c) => {
      const clientDate = new Date(c.createdAt)
      return clientDate >= dateFilter.start && clientDate <= dateFilter.end
    })

    const filteredProducts = products.filter((p) => {
      const productDate = new Date(p.createdAt)
      return productDate >= dateFilter.start && productDate <= dateFilter.end
    })

    return {
      transactions: filteredTransactions,
      clients: filteredClients,
      products: filteredProducts,
      allTransactions: transactions,
      allClients: clients,
      allProducts: products
    }
  }, [transactions, clients, products, dateRange, customDateRange])

  // Analytics calculations
  const analytics = useMemo(() => {
    const { transactions: filteredTx, allTransactions, allClients, allProducts } = filteredData

    // Sales Analytics
    const salesTransactions = filteredTx.filter((t) => t.transactionType === 'sales')
    const purchaseTransactions = filteredTx.filter((t) => t.transactionType === 'purchase')

    const totalSales = salesTransactions.reduce(
      (sum, t) => sum + (t.sellAmount * t.quantity || 0),
      0
    )
    const totalPurchases = purchaseTransactions.reduce((sum, t) => sum + (t.purchaseAmount || 0), 0)

    const totalRevenue = totalSales
    const totalExpenses = totalPurchases
    const netProfit = totalRevenue - totalExpenses
    const profitMargin = totalRevenue > 0 ? (netProfit / totalRevenue) * 100 : 0

    // Transaction counts
    const totalOrders = filteredTx.length
    const completedOrders = filteredTx.filter((t) => t.statusOfTransaction === 'completed').length
    const pendingOrders = filteredTx.filter((t) => t.statusOfTransaction === 'pending').length

    // Client Analytics
    const activeClients = allClients.filter((c) =>
      allTransactions.some((t) => t.clientId === c.id)
    ).length

    const newClients = filteredData.clients.length

    // Product Analytics
    const totalProducts = allProducts.length
    const lowStockProducts = allProducts.filter((p) => (p.quantity || 0) < 10).length
    const totalInventoryValue = allProducts.reduce(
      (sum, p) => sum + (p.price || 0) * (p.quantity || 0),
      0
    )

    // Average calculations
    const avgOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0
    const avgProductPrice =
      allProducts.length > 0
        ? allProducts.reduce((sum, p) => sum + (p.price || 0), 0) / allProducts.length
        : 0

    // Pending amounts
    const totalPendingAmount = allClients.reduce((sum, c) => sum + (c.pendingAmount || 0), 0)
    const totalPaidAmount = allClients.reduce((sum, c) => sum + (c.paidAmount || 0), 0)
    console.log('all', allClients)

    console.log('totalPaidAmount', totalPaidAmount)

    // Monthly trend data
    const monthlyData = {}
    filteredTx.forEach((t) => {
      const month = new Date(t.createdAt).toLocaleString('en-IN', {
        month: 'short',
        year: 'numeric'
      })
      if (!monthlyData[month]) {
        monthlyData[month] = { sales: 0, purchases: 0, orders: 0 }
      }

      let amount = 0
      if (t.transactionType === 'sales') {
        amount = (t.sellAmount || 0) * (t.quantity || 0)
      } else if (t.transactionType === 'purchase') {
        amount = t.purchaseAmount || 0
      }

      if (t.transactionType === 'sales') {
        monthlyData[month].sales += amount
      } else if (t.transactionType === 'purchase') {
        monthlyData[month].purchases += amount
      }
      monthlyData[month].orders += 1
    })

    // Product category analysis
    const categoryData = {}
    allProducts.forEach((p) => {
      const category = p.assetsType || 'Other'
      if (!categoryData[category]) {
        categoryData[category] = { count: 0, value: 0 }
      }
      categoryData[category].count += 1
      categoryData[category].value += (p.price || 0) * (p.quantity || 0)
    })

    // Top clients by transaction volume
    const clientTransactionVolume = {}
    allTransactions.forEach((t) => {
      const clientId = t.clientId
      if (!clientTransactionVolume[clientId]) {
        clientTransactionVolume[clientId] = 0
      }
      clientTransactionVolume[clientId] += (t.sellAmount || 0) * (t.quantity || 0)
    })

    return {
      revenue: {
        total: totalRevenue,
        sales: totalSales,
        purchases: totalPurchases,
        netProfit,
        profitMargin
      },
      orders: {
        total: totalOrders,
        completed: completedOrders,
        pending: pendingOrders,
        avgValue: avgOrderValue
      },
      clients: {
        total: allClients.length,
        active: activeClients,
        new: newClients,
        pendingAmount: totalPendingAmount,
        paidAmount: totalPaidAmount
      },
      products: {
        total: totalProducts,
        lowStock: lowStockProducts,
        inventoryValue: totalInventoryValue,
        avgPrice: avgProductPrice
      },
      trends: {
        monthly: Object.entries(monthlyData).map(([month, data]) => ({
          month,
          ...data,
          profit: data.sales - data.purchases
        })),
        categories: Object.entries(categoryData).map(([category, data]) => ({
          category,
          ...data,
          percentage: totalInventoryValue > 0 ? (data.value / totalInventoryValue) * 100 : 0
        }))
      }
    }
  }, [filteredData])

  // KPI Cards configuration
  const kpiCards = [
    {
      title: 'Total Revenue',
      value: formatCurrency(analytics.revenue.total),
      change: `${analytics.revenue.profitMargin.toFixed(1)}%`,
      trend: 'up',
      icon: DollarSign,
      gradient: 'from-emerald-500 to-emerald-600',
      bgPattern: 'from-emerald-50/50 to-emerald-100/30'
    },
    {
      title: 'Net Profit',
      value: formatCurrency(analytics.revenue.netProfit),
      change: `${analytics.revenue.profitMargin.toFixed(1)}%`,
      trend: analytics.revenue.netProfit >= 0 ? 'up' : 'down',
      icon: TrendingUp,
      gradient:
        analytics.revenue.netProfit >= 0
          ? 'from-green-500 to-green-600'
          : 'from-red-500 to-red-600',
      bgPattern:
        analytics.revenue.netProfit >= 0
          ? 'from-green-50/50 to-green-100/30'
          : 'from-red-50/50 to-red-100/30'
    },
    {
      title: 'Total Orders',
      value: analytics.orders.total.toLocaleString(),
      change: `${analytics.orders.completed} completed`,
      trend: 'up',
      icon: ShoppingCart,
      gradient: 'from-blue-500 to-blue-600',
      bgPattern: 'from-blue-50/50 to-blue-100/30'
    },
    {
      title: 'Active Clients',
      value: analytics.clients.active.toLocaleString(),
      change: `${analytics.clients.new} new`,
      trend: 'up',
      icon: Users,
      gradient: 'from-purple-500 to-purple-600',
      bgPattern: 'from-purple-50/50 to-purple-100/30'
    },
    {
      title: 'Avg Order Value',
      value: formatCurrency(analytics.orders.avgValue),
      change: '+3.2%',
      trend: 'up',
      icon: CreditCard,
      gradient: 'from-orange-500 to-orange-600',
      bgPattern: 'from-orange-50/50 to-orange-100/30'
    },
    {
      title: 'Inventory Value',
      value: formatCurrency(analytics.products.inventoryValue),
      change: `${analytics.products.lowStock} low stock`,
      trend: analytics.products.lowStock > 0 ? 'down' : 'up',
      icon: Package,
      gradient: 'from-teal-500 to-teal-600',
      bgPattern: 'from-teal-50/50 to-teal-100/30'
    }
  ]

  const dateRanges = [
    { label: 'Today', value: 'today' },
    { label: 'Yesterday', value: 'yesterday' },
    { label: 'Last 7 Days', value: 'last7days' },
    { label: 'This Month', value: 'thisMonth' },
    { label: 'Last Month', value: 'lastMonth' },
    { label: 'This Year', value: 'thisYear' },
    { label: 'Last Year', value: 'lastYear' },
    { label: 'Custom Range', value: 'custom' }
  ]

  // Event handlers
  const handleDateRangeChange = useCallback((range) => {
    setDateRange(range)
    setCustomDateRange([])
  }, [])

  const handleCustomDateRangeChange = useCallback((dates) => {
    setCustomDateRange(dates)
    setDateRange('custom')
  }, [])

  const handleExportData = useCallback(() => {
    try {
      const exportData = [
        ['Analytics Report', formatDate(new Date())],
        [],
        ['Key Metrics'],
        ['Total Revenue', formatCurrency(analytics.revenue.total)],
        ['Net Profit', formatCurrency(analytics.revenue.netProfit)],
        ['Profit Margin', `${analytics.revenue.profitMargin.toFixed(1)}%`],
        ['Total Orders', analytics.orders.total],
        ['Active Clients', analytics.clients.active],
        ['Total Products', analytics.products.total],
        ['Inventory Value', formatCurrency(analytics.products.inventoryValue)],
        [],
        ['Monthly Trends'],
        ['Month', 'Sales', 'Purchases', 'Profit', 'Orders'],
        ...analytics.trends.monthly.map((m) => [
          m.month,
          formatCurrency(m.sales),
          formatCurrency(m.purchases),
          formatCurrency(m.profit),
          m.orders
        ]),
        [],
        ['Product Categories'],
        ['Category', 'Count', 'Value', 'Percentage'],
        ...analytics.trends.categories.map((c) => [
          c.category,
          c.count,
          formatCurrency(c.value),
          `${c.percentage.toFixed(1)}%`
        ])
      ]

      const ws = XLSX.utils.aoa_to_sheet(exportData)
      const wb = XLSX.utils.book_new()
      XLSX.utils.book_append_sheet(wb, ws, 'Analytics Report')
      XLSX.writeFile(wb, `analytics_report_${new Date().toISOString().split('T')[0]}.xlsx`)

      toast.success('Analytics report exported successfully')
    } catch (error) {
      toast.error('Failed to export report: ' + error.message)
    }
  }, [analytics])

  const handleRefreshData = useCallback(() => {
    fetchAllData()
    toast.success('Data refreshed successfully')
  }, [fetchAllData])

  // Auto-refresh effect
  useEffect(() => {
    if (autoRefresh) {
      const interval = setInterval(() => {
        fetchAllData()
      }, 30000) // Refresh every 30 seconds

      return () => clearInterval(interval)
    }
  }, [autoRefresh, fetchAllData])

  // Initial data load
  useEffect(() => {
    fetchAllData()
  }, [fetchAllData])

  const toThousands = (value) => {
    if (!value) return value
    return new Intl.NumberFormat('en-IN').format(value)
  }

  const centerTextPlugin = useMemo(
    () => ({
      id: 'centerText',
      beforeDraw(chart) {
        const { width, height, ctx } = chart
        ctx.restore()

        const remaining = chart.data.datasets[0].data[0]

        ctx.textAlign = 'center'
        ctx.textBaseline = 'middle'

        ctx.fillStyle = '#9CA3AF'
        ctx.font = `${height * 0.06}px sans-serif`
        ctx.fillText('Remaining', width / 2, height / 2.7)

        ctx.fillStyle = '#111827'
        ctx.font = `bold ${height * 0.08}px sans-serif`
        ctx.fillText(`₹${toThousands(remaining)}`, width / 2, height / 2)

        ctx.save()
      }
    }),
    []
  )

  const monthlyData = analytics.trends.monthly.slice(-6)
  const totalSales = monthlyData.reduce((sum, m) => sum + m.sales, 0)
  const totalPurchases = monthlyData.reduce((sum, m) => sum + m.purchases, 0)
  const totalProfit = monthlyData.reduce((sum, m) => sum + m.profit, 0)

  const data = {
    labels: ['Sales', 'Purchases', 'Profit'],
    datasets: [
      {
        data: [totalSales, totalPurchases, totalProfit],
        backgroundColor: ['#10b981', '#ef4444', '#3b82f6'],
        borderWidth: 2,
        cutout: '60%',
        borderColor: 'white',
        borderRadius: 10,
        animation: {
          easing: 'easeInOutQuad'
        }
      }
    ]
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/50">
      {/* Animated background elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 -left-40 w-80 h-80 bg-blue-400/5 rounded-full blur-3xl animate-pulse" />
        <div
          className="absolute bottom-1/4 -right-40 w-96 h-96 bg-indigo-400/5 rounded-full blur-3xl animate-pulse"
          style={{ animationDelay: '2s' }}
        />
      </div>

      <div className="relative z-10">
        {/* Navbar */}
        <div className="w-full sticky top-0 z-20 backdrop-blur-xl bg-white/80 border-b border-white/20">
          <Navbar />
        </div>

        {/* Header */}
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center mt-6 pb-6 px-7 gap-4">
          <div className="flex items-center gap-4">
            <div>
              <p className="text-4xl font-light mb-1">Analytics</p>
              <p className="text-xs font-light bg-amber-100 px-2 py-1 rounded">
                Last updated: {formatDate(new Date())}
              </p>
            </div>
          </div>

          {/* Controls */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-2">
              <SelectPicker
                data={dateRanges}
                value={dateRange}
                onChange={handleDateRangeChange}
                cleanable={false}
                searchable={false}
                appearance="subtle"
                placeholder="Select Date Range"
                className="selectPicker border border-gray-200 rounded-sm"
                container={document.body}
                menuStyle={{ zIndex: 2000 }}
                style={{ width: 224 }} // adjust as needed
              />

              {dateRange === 'custom' && (
                <DateRangePicker
                  format="dd/MM/yyyy"
                  character=" ~ "
                  placeholder="Select Custom Range"
                  onChange={handleCustomDateRangeChange}
                  size="md"
                  className="w-64"
                  placement="bottomEnd"
                  showHeader={false}
                  container={document.body}
                  menuStyle={{ zIndex: 2000 }}
                />
              )}
            </div>

            {/* <button
              onClick={() => setAutoRefresh(!autoRefresh)}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 flex items-center gap-2
                ${
                  autoRefresh
                    ? 'bg-green-100 text-green-700 border border-green-200'
                    : 'bg-white/60 border border-white/30 text-gray-700'
                }`}
            >
              <RefreshCcw size={16} className={autoRefresh ? 'animate-spin' : ''} />
              Auto Refresh
            </button> */}

            <button
              onClick={handleRefreshData}
              disabled={loading}
              className="flex items-center gap-2 border border-gray-300 w-fit p-1.5 px-3 rounded-sm transition-all duration-300 text-sm cursor-pointer hover:bg-black hover:text-white"
            >
              <RefreshCcw size={16} className={loading ? 'animate-spin' : ''} />
              Refresh
            </button>

            <button
              onClick={handleExportData}
              className="flex items-center gap-2 border border-gray-300 w-fit p-1.5 px-3 rounded-sm transition-all duration-300 text-sm cursor-pointer hover:bg-black hover:text-white"
            >
              <FileUp size={14} />
              Export
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        {/* <div className="px-7 mb-6">
          <div className="flex gap-2 bg-white/30 backdrop-blur-sm p-1 rounded-2xl border border-white/30 w-fit">
            {[
              { id: 'overview', label: 'Overview', icon: Eye },
              { id: 'sales', label: 'Sales', icon: TrendingUp },
              { id: 'financial', label: 'Financial', icon: Wallet },
              { id: 'operations', label: 'Operations', icon: BarChart3 }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-6 py-2 rounded-xl text-sm font-medium capitalize transition-all duration-200 flex items-center gap-2
                  ${
                    activeTab === tab.id
                      ? 'bg-white text-gray-900 shadow-md'
                      : 'text-gray-600 hover:text-gray-800 hover:bg-white/50'
                  }`}
              >
                <tab.icon size={16} />
                {tab.label}
              </button>
            ))}
          </div>
        </div> */}

        {/* Main Content */}
        <div className="px-6 pb-8 overflow-auto h-[calc(100vh-200px)]">
          {/* KPI Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 xl:grid-cols-4 gap-3 mb-8">
            {kpiCards.map((card, index) => {
              const Icon = card.icon
              return (
                <div
                  key={index}
                  className="group relative p-5 bg-white/30 backdrop-blur-xl border h-36 border-black/10 rounded-3xl hover:bg-white/10 hover:scale-[1] transition-all duration-600 shadow hover:shadow-lg overflow-hidden"
                >
                  <div
                    className={`absolute inset-0 bg-gradient-to-br ${card.bgPattern} rounded-4xl opacity-50`}
                  />

                  <div className="relative z-10">
                    <div className="flex items-start justify-between mb-4">
                      <div
                        className={`w-10 h-10 bg-gradient-to-br ${card.gradient} rounded-2xl flex items-center justify-center text-white shadow-lg group-hover:scale-110 transition-transform duration-300`}
                      >
                        <Icon size={16} />
                      </div>
                      <div
                        className={`text-sm font-semibold flex items-center gap-1
                        ${card.trend === 'up' ? 'text-emerald-600' : 'text-red-600'}`}
                      >
                        {card.trend === 'up' ? (
                          <TrendingUp size={14} />
                        ) : (
                          <TrendingDown size={14} />
                        )}
                        {card.change}
                      </div>
                    </div>

                    <div>
                      <p className="text-sm text-gray-600 font-light mb-1">{card.title}</p>
                      <p className="text-2xl font-bold text-gray-900">
                        {card.value.includes('₹') ? (
                          <>
                            ₹<AnimatedNumber value={card.value.replace(/[^\d]/g, '')} />
                          </>
                        ) : (
                          <AnimatedNumber value={card.value.replace(/,/g, '')} />
                        )}
                      </p>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>

          {/* Charts and Analytics */}
          <div className="grid grid-cols-12 gap-6">
            {/* Monthly Trends Chart */}
            <div className="col-span-12 lg:col-span-8 bg-white/30 backdrop-blur-xl border border-black/10 rounded-3xl p-8 shadow-md">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
                  <BarChart3 size={20} />
                  Monthly Performance Trends
                </h3>
                <div className="flex gap-4 text-sm">
                  <div className="flex items-center gap-2">
                    <span className="bg-emerald-500 p-1 rounded-2xl px-3 text-white text-xs">
                      Sales
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="bg-red-500 p-1 rounded-2xl px-3 text-white text-xs">
                      Purchases
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="bg-blue-500 p-1 rounded-2xl px-3 text-white text-xs">
                      Profit
                    </span>
                  </div>
                </div>
              </div>

              {analytics.trends.monthly.length > 0 ? (
                <div className="space-y-4">
                  <Doughnut
                    width={300}
                    height={300}
                    data={data}
                    options={{
                      plugins: {
                        legend: {
                          position: 'bottom'
                        }
                      }
                    }}
                    plugins={[centerTextPlugin]}
                    className="drop-shadow-lg"
                  />
                </div>
              ) : (
                <div className="text-center py-12 text-gray-500">
                  <BarChart3 size={48} className="mx-auto mb-4 opacity-30" />
                  <p>No data available for the selected period</p>
                </div>
              )}
            </div>

            {/* Category Distribution */}
            <div className="col-span-12 lg:col-span-4 bg-white/30 backdrop-blur-xl border border-black/10 rounded-3xl p-8 shadow-md">
              <h3 className="text-xl font-semibold text-gray-900 mb-6 flex items-center gap-2">
                <PieChartIcon size={20} />
                Product Categories
              </h3>

              {analytics.trends.categories.length > 0 ? (
                <div className="space-y-4">
                  {analytics.trends.categories.map((category, index) => (
                    <div key={category.category} className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="font-medium text-gray-700">{category.category}</span>
                        <span className="text-sm text-gray-600">{category.count} products</span>
                      </div>
                      <div className="relative h-4 bg-gray-200 rounded-full overflow-hidden">
                        <div
                          className="absolute h-full bg-gradient-to-r from-blue-400 to-indigo-500 transition-all duration-1000 ease-out"
                          style={{
                            width: `${category.percentage}%`,
                            animationDelay: `${index * 300}ms`
                          }}
                        />
                      </div>
                      <div className="flex justify-between text-xs text-gray-500">
                        <span>{formatCurrency(category.value)}</span>
                        <span>{category.percentage.toFixed(1)}%</span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 text-gray-500">
                  <PieChartIcon size={48} className="mx-auto mb-4 opacity-30" />
                  <p>No product categories available</p>
                </div>
              )}
            </div>

            {/* Financial Summary */}
            <div className="col-span-12 lg:col-span-6 bg-white/30 backdrop-blur-xl border border-black/10 rounded-3xl p-8 shadow-md">
              <h3 className="text-xl font-semibold text-gray-900 mb-6 flex items-center gap-2">
                <Wallet size={20} />
                Financial Overview
              </h3>

              <div className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center p-4 bg-emerald-50 rounded-2xl border border-emerald-100">
                    <p className="text-sm text-emerald-700 font-medium">Total Sales</p>
                    <p className="text-2xl font-bold text-emerald-800 mt-1">
                      {formatCurrency(analytics.revenue.sales)}
                    </p>
                  </div>
                  <div className="text-center p-4 bg-red-50 rounded-2xl border border-red-100">
                    <p className="text-sm text-red-700 font-medium">Total Purchases</p>
                    <p className="text-2xl font-bold text-red-800 mt-1">
                      {formatCurrency(analytics.revenue.purchases)}
                    </p>
                  </div>
                </div>

                <div className="text-center p-4 bg-blue-50 rounded-2xl border border-blue-100">
                  <p className="text-sm text-blue-700 font-medium">Net Profit</p>
                  <p className="text-3xl font-bold text-blue-800 mt-1">
                    {formatCurrency(analytics.revenue.netProfit)}
                  </p>
                  <p className="text-sm text-blue-600 mt-2">
                    Profit Margin: {analytics.revenue.profitMargin.toFixed(1)}%
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-4 text-sm text-center">
                  <div className="p-3 bg-yellow-50 rounded-xl">
                    <p className="text-sm text-yellow-700 font-medium">Pending Amount</p>
                    <p className="text-xl font-bold text-yellow-800">
                      {formatCurrency(analytics.clients.pendingAmount)}
                    </p>
                  </div>
                  <div className="p-3 bg-indigo-50 rounded-xl">
                    <p className="text-sm text-indigo-700 font-medium">Paid Amount</p>
                    <p className="text-xl font-bold text-indigo-800">
                      {formatCurrency(analytics.clients.paidAmount)}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="col-span-12 lg:col-span-6 bg-white/30 backdrop-blur-xl border border-black/10 rounded-3xl p-8 shadow-md">
              <h3 className="text-xl font-semibold text-gray-900 mb-6 flex items-center gap-2">
                <Building2 size={20} />
                Quick Navigation
              </h3>

              <div className="grid grid-cols-2 gap-2">
                {[
                  {
                    name: 'Bank Reports',
                    icon: Building2,
                    route: '/bank',
                    color: 'blue',
                    count: analytics.trends.monthly.length
                  },
                  {
                    name: 'Ledger Reports',
                    icon: FileText,
                    route: '/ledger',
                    color: 'green',
                    count: analytics.clients.total
                  },
                  {
                    name: 'Products',
                    icon: Package,
                    route: '/products',
                    color: 'purple',
                    count: analytics.products.total
                  },
                  {
                    name: 'Clients',
                    icon: Users,
                    route: '/clients',
                    color: 'orange',
                    count: analytics.clients.total
                  },
                  {
                    name: 'Transactions',
                    icon: CreditCard,
                    route: '/sales',
                    color: 'red',
                    count: analytics.orders.total
                  },
                  {
                    name: 'Purchase Orders',
                    icon: ShoppingCart,
                    route: '/purchase',
                    color: 'teal',
                    count: analytics.orders.pending
                  }
                ].map((action, index) => {
                  const Icon = action.icon
                  return (
                    <button
                      key={index}
                      onClick={() => navigate(action.route)}
                      className={`p-4 border border-black/10  bg-gradient-to-br from-${action.color}-50 to-${action.color}-100/50 hover:from-${action.color}-300 hover:to-${action.color}-300/50 rounded-2xl transition-all duration-300 hover:shadow-md group text-left cursor-pointer`}
                    >
                      <div className="flex items-center justify-between mb-3">
                        <div
                          className={`w-10 h-10 bg-gradient-to-br from-${action.color}-500 to-${action.color}-600 rounded-xl flex items-center justify-center text-white shadow-md group-hover:scale-110 transition-transform duration-200`}
                        >
                          <Icon size={18} />
                        </div>
                        <span className={`text-2xl font-bold text-${action.color}-600`}>
                          {action.count}
                        </span>
                      </div>
                      <div className="text-sm font-medium text-gray-700 group-hover:text-gray-900 transition-colors duration-200">
                        {action.name}
                      </div>
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Recent Activity */}
            <div className="col-span-12 bg-white/30 backdrop-blur-xl border border-black/10 rounded-3xl p-8 shadow-md">
              <h3 className="text-xl font-semibold text-gray-900 mb-6 flex items-center gap-2">
                <Calendar size={20} />
                Recent Activity & Insights
              </h3>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Activity Timeline */}
                <div>
                  <h4 className="font-medium text-gray-700 mb-4">Latest Transactions</h4>
                  <div className="space-y-3 max-h-screen overflow-y-auto">
                    {filteredData.transactions.slice(0, 5).map((transaction) => (
                      <div
                        key={transaction.id}
                        className="flex items-center gap-3 p-3 bg-white/50 backdrop-blur-sm rounded-xl border border-white/30 hover:bg-indigo-50 transition-all duration-200"
                      >
                        <div
                          className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold
                          ${
                            transaction.transactionType === 'sales'
                              ? 'bg-gradient-to-br from-emerald-500 to-emerald-600'
                              : 'bg-gradient-to-br from-red-500 to-red-600'
                          }`}
                        >
                          {transaction.transactionType === 'sales' ? (
                            <TrendingUp size={14} />
                          ) : (
                            <TrendingDown size={14} />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="flex items-center gap-2 mb-1 text-sm font-medium text-gray-800 truncate">
                            {transaction.transactionType === 'sales' ? 'Sale' : 'Purchase'}
                            {transaction.transactionType === 'sales' ? (
                              <span className="bg-indigo-100 px-2 py-0.5 rounded-full text-xs">
                                {formatCurrency(
                                  (transaction.sellAmount || 0) * (transaction.quantity || 0)
                                )}
                              </span>
                            ) : (
                              <span className="bg-indigo-100 px-2 py-0.5 rounded-full text-xs">
                                {formatCurrency(transaction.purchaseAmount || 0)}
                              </span>
                            )}
                          </p>
                          <p className="text-xs text-gray-500">
                            {formatDate(transaction.createdAt)} • Qty: {transaction.quantity || 0}
                          </p>
                        </div>
                        <div
                          className={`px-2 py-1 rounded-full text-xs font-medium
                          ${
                            transaction.statusOfTransaction === 'completed'
                              ? 'bg-green-100 text-green-700'
                              : 'bg-yellow-100 text-yellow-500 px-4'
                          }`}
                        >
                          {String(transaction.statusOfTransaction).charAt(0).toUpperCase() +
                            String(transaction.statusOfTransaction).slice(1)}
                        </div>
                      </div>
                    ))}

                    {filteredData.transactions.length === 0 && (
                      <div className="text-center py-8 text-gray-500">
                        <Calendar size={32} className="mx-auto mb-2 opacity-50" />
                        <p className="text-sm">No recent transactions</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Key Insights */}
                <div>
                  <h4 className="font-medium text-gray-700 mb-4">Business Insights</h4>
                  <div className="space-y-3">
                    <div className="p-4 bg-blue-50 border border-blue-200 rounded-xl">
                      <div className="flex items-center gap-2 mb-2">
                        <TrendingUp size={16} className="text-blue-600" />
                        <span className="font-medium text-blue-800">Revenue Performance</span>
                      </div>
                      <p className="text-sm text-blue-700">
                        {analytics.revenue.netProfit >= 0
                          ? `Profitable period with ${analytics.revenue.profitMargin.toFixed(1)}% margin`
                          : 'Revenue below costs - review pricing strategy'}
                      </p>
                    </div>

                    <div className="p-4 bg-purple-50 border border-purple-200 rounded-xl">
                      <div className="flex items-center gap-2 mb-2">
                        <Users size={16} className="text-purple-600" />
                        <span className="font-medium text-purple-800">Client Activity</span>
                      </div>
                      <p className="text-sm text-purple-700">
                        {analytics.clients.active} active clients with {analytics.clients.new} new
                        additions
                      </p>
                    </div>

                    <div className="p-4 bg-orange-50 border border-orange-200 rounded-xl">
                      <div className="flex items-center gap-2 mb-2">
                        <Package size={16} className="text-orange-600" />
                        <span className="font-medium text-orange-800">Inventory Status</span>
                      </div>
                      <p className="text-sm text-orange-700">
                        {analytics.products.lowStock > 0
                          ? `${analytics.products.lowStock} products need restocking`
                          : 'Inventory levels are healthy'}
                      </p>
                    </div>

                    <div className="p-4 bg-green-50 border border-green-200 rounded-xl">
                      <div className="flex items-center gap-2 mb-2">
                        <DollarSign size={16} className="text-green-600" />
                        <span className="font-medium text-green-800">Cash Flow</span>
                      </div>
                      <p className="text-sm text-green-700">
                        {formatCurrency(analytics.clients.pendingAmount)} pending collections
                      </p>
                    </div>
                  </div>
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
