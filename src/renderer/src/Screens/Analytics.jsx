/* eslint-disable no-unused-vars */
/* eslint-disable no-const-assign */
/* eslint-disable react/display-name */
/* eslint-disable react/prop-types */
/* eslint-disable prettier/prettier */
import React, { useState, useEffect, useMemo, useCallback } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { setAccount, setClients, setProducts, setTransactions } from '../app/features/electronSlice'
import { clientApi, productApi, transactionApi } from '../API/Api'
import { toast } from 'react-toastify'
import Navbar from '../components/UI/Navbar'
import { useNavigate } from 'react-router-dom'
import { DateRangePicker, SelectPicker } from 'rsuite'
import { Doughnut, Line } from 'react-chartjs-2'
import {
  TrendingUp,
  TrendingDown,
  Users,
  Package,
  DollarSign,
  CreditCard,
  Calendar,
  RefreshCcw,
  FileUp,
  MoreVertical,
  Maximize2,
  ChevronRight,
  Star,
  Activity,
  Building2,
  FileText,
  ShoppingCart,
  Wallet, // Added Wallet icon
  User,
  ArrowUpRight,
  ArrowDownLeft,
  Receipt
} from 'lucide-react'
import * as XLSX from 'xlsx'
import {
  Chart as ChartJs,
  defaults,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  Filler
} from 'chart.js'

// Register ChartJS components
ChartJs.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  Filler
)

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
  return new Date(dateString).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  })
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

const AnimatedNumber = React.memo(({ value, duration = 800 }) => {
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
      const easeOut = 1 - Math.pow(1 - progress, 3)
      const current = startValue + (numericValue - startValue) * easeOut

      setDisplayValue(current)
      if (progress < 1) requestAnimationFrame(animate)
    }
    requestAnimationFrame(animate)
  }, [value, duration])

  return Math.round(displayValue).toLocaleString('en-IN')
})

const useAnalyticsData = () => {
  const dispatch = useDispatch()
  const [loading, setLoading] = useState(false)

  const clients = useSelector((state) => state.electron.clients.data || [])
  const products = useSelector((state) => state.electron.products.data || [])
  const transactions = useSelector((state) => state.electron.transaction.data || [])
  const accounts = useSelector((state) => state.electron.account.data || [])

  const fetchAllData = useCallback(async () => {
    try {
      setLoading(true)
      const [clientsRes, productsRes, purchaseRes, salesRes, accountsRef] = await Promise.all([
        window.api.getAllClients(),
        window.api.getAllProducts(),
        window.api.getAllPurchases(),
        window.api.getAllSales(),
        window.api.getAllAccounts()
      ])

      dispatch(setClients(clientsRes))
      dispatch(setProducts(productsRes))

      const purchases = purchaseRes?.data || []
      const sales = salesRes?.data || []
      dispatch(setTransactions([...purchases, ...sales]))
      dispatch(setAccount(accountsRef))
    } catch (err) {
      toast.error('Failed to fetch analytics data')
    } finally {
      setLoading(false)
    }
  }, [dispatch])

  useEffect(() => {
    fetchAllData()
  }, [fetchAllData])
  return { clients, products, transactions, loading, accounts, fetchAllData }
}

const Analytics = () => {
  const navigate = useNavigate()
  const { clients, products, transactions, loading, accounts, fetchAllData } = useAnalyticsData()

  const [dateRange, setDateRange] = useState('last7days')
  const [customDateRange, setCustomDateRange] = useState([])

  const filteredData = useMemo(() => {
    let dateFilter =
      customDateRange && customDateRange.length === 2
        ? { start: new Date(customDateRange[0]), end: new Date(customDateRange[1]) }
        : getDateRange(dateRange)

    return {
      transactions: transactions.filter(
        (t) => new Date(t.createdAt) >= dateFilter.start && new Date(t.createdAt) <= dateFilter.end
      ),
      clients: clients.filter(
        (c) => new Date(c.createdAt) >= dateFilter.start && new Date(c.createdAt) <= dateFilter.end
      ),
      products: products.filter(
        (p) => new Date(p.createdAt) >= dateFilter.start && new Date(p.createdAt) <= dateFilter.end
      ),
      allTransactions: transactions,
      allClients: clients,
      allProducts: products,
      allAccounts: accounts
    }
  }, [transactions, clients, products, accounts, dateRange, customDateRange])

  const analytics = useMemo(() => {
    const {
      transactions: filteredTx,
      allTransactions,
      allClients,
      allProducts,
      allAccounts
    } = filteredData

    const salesTransactions = filteredTx.filter((t) => t.pageName === 'Sales')
    const purchaseTransactions = filteredTx.filter((t) => t.pageName === 'Purchase')

    const totalSales = salesTransactions.reduce((sum, t) => sum + (t.totalAmountWithTax || 0), 0)
    const totalPurchases = purchaseTransactions.reduce(
      (sum, t) => sum + (t.totalAmountWithTax || 0),
      0
    )

    const totalRevenue = totalSales - totalPurchases
    const netProfit = totalRevenue
    const totalInventoryValue = allProducts.reduce(
      (sum, p) => sum + (p.productPrice || 0) * (p.productQuantity || 0),
      0
    )
    const profitMargin = totalSales > 0 ? (netProfit / totalSales) * 100 : 0

    const completedOrders = filteredTx.filter((t) => t.statusOfTransaction === 'completed').length
    const pendingOrders = filteredTx.filter((t) => t.statusOfTransaction === 'pending').length
    const activeClients = allClients.filter((c) =>
      allTransactions.some((t) => t.clientId === c.id)
    ).length
    const lowStockProducts = allProducts.filter((p) => (p.productQuantity || 0) < 10).length

    const monthlyData = {}
    filteredTx.forEach((t) => {
      const month = new Date(t.createdAt).toLocaleString('en-US', { month: 'short' })
      if (!monthlyData[month]) monthlyData[month] = { sales: 0, purchases: 0 }
      const amount = t.totalAmountWithTax || 0
      if (t.pageName === 'Sales') monthlyData[month].sales += amount
      else if (t.pageName === 'Purchase') monthlyData[month].purchases += amount
    })

    const categoryData = {}
    allProducts.forEach((p) => {
      const category = p.assetsType || 'Other'
      if (!categoryData[category]) categoryData[category] = { count: 0, value: 0 }
      categoryData[category].count += 1
      categoryData[category].value += (p.productPrice || 0) * (p.productQuantity || 0)
    })

    return {
      revenue: {
        total: totalRevenue,
        sales: totalSales,
        purchases: totalPurchases,
        netProfit,
        profitMargin
      },
      orders: { total: filteredTx.length, completed: completedOrders, pending: pendingOrders },
      clients: {
        total: allClients.length,
        active: activeClients,
        new: filteredData.clients.length,
        pendingAmount: allClients.reduce((sum, c) => sum + (c.pendingAmount || 0), 0),
        paidAmount: allClients.reduce((sum, c) => sum + (c.paidAmount || 0), 0)
      },
      products: {
        total: allProducts.length,
        inventoryValue: totalInventoryValue,
        lowStock: lowStockProducts
      },
      accounts: {
        total: allAccounts.length
      },
      trends: {
        monthly: Object.entries(monthlyData).map(([month, data]) => ({
          month,
          ...data,
          profit: data.sales - data.purchases
        })),
        categories: Object.entries(categoryData)
          .map(([category, data]) => ({
            category,
            ...data,
            percentage: totalInventoryValue > 0 ? (data.value / totalInventoryValue) * 100 : 0
          }))
          .sort((a, b) => b.value - a.value)
      }
    }
  }, [filteredData])

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
        ['Month', 'Sales', 'Purchases', 'Profit'],
        ...analytics.trends.monthly.map((m) => [
          m.month,
          formatCurrency(m.sales),
          formatCurrency(m.purchases),
          formatCurrency(m.profit)
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

  const dateRanges = [
    { label: 'Today', value: 'today' },
    { label: 'Yesterday', value: 'yesterday' },
    { label: 'Last 7 Days', value: 'last7days' },
    { label: 'This Month', value: 'thisMonth' },
    { label: 'Custom Range', value: 'custom' }
  ]

  // CHART CONFIGURATIONS
  const donutColors = [
    '#6366f1', // indigo
    '#0ea5e9', // sky
    '#f59e0b', // amber
    '#10b981' // emerald
  ]
  const donutData = {
    labels: analytics.trends.categories.slice(0, 4).map((c) => c.category),
    datasets: [
      {
        data: analytics.trends.categories.slice(0, 4).map((c) => c.value),
        backgroundColor: donutColors,
        borderWidth: 0,
        borderRadius: 20,
        circumference: 180,
        rotation: -90,
        cutout: '75%'
      }
    ]
  }

  const chartTrends = useMemo(() => {
    const { start, end } = getDateRange(dateRange)

    const dataMap = {}

    const startDate = new Date(start)
    const endDate = new Date(end)

    // 🔥 Build full date range first
    while (startDate <= endDate) {
      const label = startDate.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric'
      })

      dataMap[label] = { sales: 0, purchases: 0 }

      startDate.setDate(startDate.getDate() + 1)
    }

    // 🔥 Now inject actual transaction data
    transactions.forEach((t) => {
      const txDate = new Date(t.createdAt)

      if (txDate >= start && txDate <= end) {
        const label = txDate.toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric'
        })

        const amount = Number(t.totalAmountWithTax || 0)

        if (t.pageName === 'Sales') {
          dataMap[label].sales += amount
        } else if (t.pageName === 'Purchase') {
          dataMap[label].purchases += amount
        }
      }
    })

    return Object.entries(dataMap).map(([label, values]) => ({
      label,
      ...values
    }))
  }, [transactions, dateRange])

  const lineData = {
    labels: chartTrends.map((t) => t.label),
    datasets: [
      {
        label: 'Sales',
        data: chartTrends.map((t) => t.sales),
        borderColor: '#6366f1',
        backgroundColor: 'rgba(99,102,241,0.2)',
        borderWidth: 3,
        tension: 0.5, // 🔥 smooth curve
        fill: true,
        pointRadius: 4,
        pointHoverRadius: 6,
        pointBackgroundColor: '#fff',
        pointBorderColor: '#6366f1',
        pointBorderWidth: 2
      },
      {
        label: 'Purchases',
        data: chartTrends.map((t) => t.purchases),
        borderColor: '#f59e0b',
        backgroundColor: 'rgba(245,158,11,0.2)',
        borderWidth: 3,
        tension: 0.5,
        fill: true,
        pointRadius: 4,
        pointHoverRadius: 6,
        pointBackgroundColor: '#fff',
        pointBorderColor: '#f59e0b',
        pointBorderWidth: 2
      }
    ]
  }

  return (
    <div className="max-h-screen overflow-auto bg-[#f8f9fa] text-gray-900">
      <div className="w-full sticky top-0 z-20 backdrop-blur-xl bg-white/80 border-b border-gray-100">
        <Navbar />
      </div>

      {/* Header */}
      <div className="flex flex-col lg:flex-row justify-between items-center mt-6 pb-6 px-8 gap-4">
        <div>
          <p className="text-3xl font-light">Analytics</p>
          <p className="text-xs text-gray-500 mt-1">Last updated: {formatDate(new Date())}</p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2">
            <SelectPicker
              data={dateRanges}
              value={dateRange}
              onChange={(val) => {
                setDateRange(val)
                setCustomDateRange([])
              }}
              cleanable={false}
              searchable={false}
              appearance="default"
              className="w-40 !rounded-xl border-gray-200"
            />
            {dateRange === 'custom' && (
              <DateRangePicker
                format="dd/MM/yyyy"
                character=" ~ "
                placeholder="Select Date Range"
                onChange={setCustomDateRange}
                size="md"
                className="w-60"
                placement="bottomEnd"
              />
            )}
          </div>
          <button
            onClick={handleRefreshData}
            disabled={loading}
            className="px-3 py-2 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors flex items-center gap-2 text-sm font-medium"
          >
            <RefreshCcw size={16} className={`text-gray-600 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
          <button
            onClick={handleExportData}
            className="px-3 py-2 bg-black text-white rounded-xl hover:bg-gray-800 transition-colors flex items-center gap-2 text-sm font-medium shadow-sm"
          >
            <FileUp size={16} />
            Export
          </button>
        </div>
      </div>

      <div className="px-8 pb-10 space-y-6">
        {/* TOP ROW: KPIs & CHARTS */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* KPI Split Card */}
          <div className="col-span-12 lg:col-span-3 flex flex-col gap-4">
            <div className="bg-white rounded-[1.5rem] p-6 border border-gray-50 flex-1 relative overflow-hidden shadow-lg">
              <div className="flex items-center justify-between mb-3 relative z-10">
                <div className="flex items-center gap-2 text-gray-500 font-medium">
                  <div className="w-6 h-6 rounded-full border border-[#ff5b22] flex items-center justify-center text-[#ff5b22]">
                    <Activity size={12} />
                  </div>
                  Total Revenue
                </div>
                <span className="text-xs font-bold text-emerald-500 flex items-center">
                  <TrendingUp size={12} className="mr-1" />{' '}
                  {analytics.revenue.profitMargin.toFixed(1)}%
                </span>
              </div>
              <div className="text-4xl font-semibold text-gray-900 tracking-tight flex items-center relative z-10">
                <span className="text-2xl mr-1">₹</span>
                <AnimatedNumber value={analytics.revenue.total} />
              </div>
            </div>

            <div className="bg-white rounded-[1.5rem] p-6 shadow-lg border border-gray-50 flex-1 relative overflow-hidden">
              <div className="flex items-center justify-between mb-3 relative z-10">
                <div className="flex items-center gap-2 text-gray-500 font-medium">
                  <div className="w-6 h-6 rounded-full border border-gray-300 flex items-center justify-center text-gray-600">
                    <Package size={12} />
                  </div>
                  Total Products
                </div>
              </div>
              <div className="text-4xl font-semibold text-gray-900 tracking-tight relative z-10">
                <AnimatedNumber value={analytics.products.total} />
              </div>
            </div>
          </div>

          <div className="col-span-12 lg:col-span-3 flex flex-col gap-4">
            <div className="bg-white rounded-[1.5rem] p-6 shadow-lg border border-gray-50 flex-1 relative overflow-hidden">
              <div className="flex items-center justify-between mb-3 relative z-10">
                <div className="flex items-center gap-2 text-gray-500 font-medium">
                  <div className="w-6 h-6 rounded-full border border-gray-300 flex items-center justify-center text-gray-600">
                    <User size={12} />
                  </div>
                  Total Clients
                </div>
              </div>
              <div className="text-4xl font-semibold text-gray-900 tracking-tight relative z-10">
                <AnimatedNumber value={analytics.clients.total} />
              </div>
            </div>

            <div className="bg-white rounded-[1.5rem] p-6 shadow-lg border border-gray-50 flex-1 relative overflow-hidden">
              <div className="flex items-center justify-between mb-3 relative z-10">
                <div className="flex items-center gap-2 text-gray-500 font-medium">
                  <div className="w-6 h-6 rounded-full border border-gray-300 flex items-center justify-center text-gray-600">
                    <Package size={12} />
                  </div>
                  Total Accounts
                </div>
              </div>
              <div className="text-4xl font-semibold text-gray-900 tracking-tight relative z-10">
                <AnimatedNumber value={analytics.accounts.total} />
              </div>
            </div>
          </div>

          {/* Top Categories (Donut) */}
          <div className="col-span-12 lg:col-span-6 bg-white rounded-[1.5rem] p-6 shadow-lg border border-gray-50 flex flex-col justify-between">
            <div className="flex justify-between items-center mb-2">
              <h3 className="text-lg font-light text-gray-800">Product Categories</h3>
              <button className="text-gray-400 hover:text-gray-600">
                <MoreVertical size={18} />
              </button>
            </div>

            <div className="relative h-40 flex items-end justify-center">
              <div className="absolute top-0 w-full h-full pb-4 left-0">
                <Doughnut
                  data={donutData}
                  options={{
                    maintainAspectRatio: false,
                    plugins: { legend: { display: false }, tooltip: { enabled: true } }
                  }}
                />
              </div>
              <div className="absolute bottom-6 flex flex-col items-center">
                <span className="text-xs text-gray-400 font-medium uppercase tracking-wider">
                  Contribution
                </span>
                <span className="text-2xl font-semibold text-gray-900">
                  {formatCurrency(analytics.products.inventoryValue)}
                </span>
              </div>
            </div>

            <div className="space-y-3 mb-4 mt-2">
              {analytics.trends.categories.slice(0, 3).map((cat, i) => (
                <div key={i} className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <div
                      className="w-3 h-3 rounded-sm"
                      style={{ backgroundColor: donutColors[i] }}
                    ></div>
                    <span className="text-gray-600 font-medium">{cat.category}</span>
                  </div>
                  <span className="font-bold text-gray-800">{cat.percentage.toFixed(0)}%</span>
                </div>
              ))}
            </div>

            <button className="w-full py-3 mt-auto rounded-xl border border-gray-100 text-sm font-bold text-gray-700 hover:bg-gray-50 transition flex justify-center items-center gap-2">
              View Details <ChevronRight size={16} />
            </button>
          </div>

          {/* Product Engagement (Line Chart) */}
          <div className="col-span-12 lg:col-span-12 bg-white rounded-[1.5rem] p-6 shadow-lg border border-gray-50 flex flex-col justify-between">
            <div className="flex justify-between items-start mb-2">
              <div>
                <h3 className="text-lg font-light text-gray-800">Performance Metrics</h3>
                <p className="text-xs text-gray-400 font-light">
                  Monthly active sales metrics shown here.
                </p>
              </div>
              <div className="flex gap-2">
                <span className="text-xs bg-gray-100 px-2 py-1 rounded-md font-semibold text-gray-600">
                  {analytics.orders.total} Orders
                </span>
                <button className="text-gray-400 hover:text-gray-600">
                  <MoreVertical size={18} />
                </button>
              </div>
            </div>

            <div className="h-72 w-full mt-4">
              <Line
                data={lineData}
                options={{
                  maintainAspectRatio: false,
                  responsive: true,
                  interaction: {
                    mode: 'index',
                    intersect: false
                  },
                  plugins: {
                    legend: {
                      display: true,
                      position: 'top',
                      labels: {
                        usePointStyle: true,
                        pointStyle: 'line',
                        padding: 20,
                        color: '#374151',
                        font: {
                          size: 13,
                          weight: '500'
                        }
                      }
                    },
                    tooltip: {
                      backgroundColor: '#111827',
                      padding: 10,
                      titleFont: { size: 13 },
                      bodyFont: { size: 12 },
                      callbacks: {
                        label: function (context) {
                          return `${context.dataset.label}: ₹${context.raw.toLocaleString()}`
                        }
                      }
                    }
                  },
                  scales: {
                    x: {
                      title: {
                        display: true,
                        text: 'Day, Month & Year',
                        color: '#6b7280',
                        font: { size: 13, weight: '500' }
                      },
                      grid: {
                        display: false
                      },
                      ticks: {
                        color: '#6b7280',
                        font: { size: 12, weight: '500' }
                      }
                    },
                    y: {
                      title: {
                        color: '#6b7280',
                        font: { size: 12, weight: '500' }
                      },
                      grid: {
                        color: 'rgba(0,0,0,0.05)'
                      },
                      ticks: {
                        color: '#6b7280',
                        font: { size: 10.5 },
                        callback: function (value) {
                          return '₹' + value.toLocaleString()
                        }
                      }
                    }
                  }
                }}
              />
            </div>

            {/* <button className="w-full py-3 mt-6 rounded-xl border border-gray-100 text-sm font-bold text-gray-700 hover:bg-gray-50 transition flex justify-center items-center gap-2">
              View Details <ChevronRight size={16} />
            </button> */}
          </div>
        </div>

        {/* MIDDLE ROW: Table & Financial Overview */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Clean UI Financial Overview Card */}
          <div className="col-span-12 lg:col-span-5 bg-white rounded-[1.5rem] p-6 shadow-lg border border-gray-50 flex flex-col justify-between">
            <div className="flex justify-between items-center mb-5">
              <h3 className="text-xl font-light text-gray-800 flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
                  <Wallet size={16} />
                </div>
                Financial Overview
              </h3>
              <button className="text-gray-400 hover:text-gray-600">
                <MoreVertical size={18} />
              </button>
            </div>

            <div className="space-y-4">
              {/* Sales & Purchases */}
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3.5 rounded-2xl bg-gray-50 border border-gray-800/50 shadow-sm">
                  <p className="text-[13px] text-gray-500 font-medium mb-1 flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-500"></span> Total Sales
                  </p>
                  <p className="text-lg font-bold text-gray-900">
                    {formatCurrency(analytics.revenue.sales)}
                  </p>
                </div>
                <div className="p-3.5 rounded-2xl bg-gray-50 border border-gray-800/50 shadow-sm">
                  <p className="text-[13px] text-gray-500 font-medium mb-1 flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-red-500"></span> Total Purchases
                  </p>
                  <p className="text-lg font-bold text-gray-900">
                    {formatCurrency(analytics.revenue.purchases)}
                  </p>
                </div>
              </div>

              {/* Net Profit */}
              <div className="py-6 px-4 rounded-2xl bg-gradient-to-br from-blue-50/80 to-indigo-50/30 border border-gray-800/50 flex flex-col items-center justify-center text-center shadow-sm">
                <p className="text-xs text-blue-600 font-bold mb-1 uppercase tracking-wider">
                  Net Profit
                </p>
                <p className="text-4xl font-light text-blue-900 tracking-tight">
                  {formatCurrency(analytics.revenue.netProfit)}
                </p>
                <div className="mt-2.5 inline-flex items-center gap-1 px-2.5 py-1 bg-blue-100/60 text-blue-700 rounded-md text-[11px] font-bold">
                  <TrendingUp size={12} />
                  Margin: {analytics.revenue.profitMargin.toFixed(1)}%
                </div>
              </div>

              {/* Pending & Paid */}
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3.5 rounded-2xl bg-white border border-gray-800/50 shadow-sm flex flex-col items-center justify-center text-center">
                  <p className="text-[11px] text-gray-400 font-bold mb-0.5 uppercase tracking-wider">
                    Pending
                  </p>
                  <p className="text-lg font-bold text-amber-500">
                    {formatCurrency(analytics.clients.pendingAmount)}
                  </p>
                </div>
                <div className="p-3.5 rounded-2xl bg-white border border-gray-800/50 shadow-sm flex flex-col items-center justify-center text-center">
                  <p className="text-[11px] text-gray-400 font-bold mb-0.5 uppercase tracking-wider">
                    Received
                  </p>
                  <p className="text-lg font-bold text-emerald-500">
                    {formatCurrency(analytics.clients.paidAmount)}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Table (All Products / Transactions) */}
          <div className="col-span-7 bg-white rounded-3xl p-6 border border-gray-100 shadow-md">
            <h3 className="text-xl font-semibold text-gray-800 mb-6">Recent Transactions</h3>

            <RecentTransactionsBlock filteredData={filteredData} />
          </div>
        </div>

        {/* BOTTOM ROW: QUICK NAVIGATION & INSIGHTS */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Quick Navigation Restored */}
          <div className="col-span-12 lg:col-span-6 bg-white rounded-[1.5rem] p-6 shadow-lg border border-gray-50">
            <h3 className="text-lg font-light text-gray-800 mb-6 flex items-center gap-2">
              <Building2 size={20} className="text-[#ff5b22]" /> Quick Navigation
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {[
                {
                  name: 'Bank Reports',
                  icon: Building2,
                  route: '/bank',
                  count: analytics.trends.monthly.length
                },
                {
                  name: 'Ledger Reports',
                  icon: FileText,
                  route: '/ledger',
                  count: analytics.clients.total
                },
                {
                  name: 'Products',
                  icon: Package,
                  route: '/products',
                  count: analytics.products.total
                },
                { name: 'Clients', icon: Users, route: '/clients', count: analytics.clients.total },
                {
                  name: 'Transactions',
                  icon: CreditCard,
                  route: '/sales',
                  count: analytics.orders.total
                },
                {
                  name: 'Purchases',
                  icon: ShoppingCart,
                  route: '/purchase',
                  count: analytics.orders.pending
                }
              ].map((action, idx) => {
                const Icon = action.icon
                return (
                  <button
                    key={idx}
                    onClick={() => navigate(action.route)}
                    className="p-4 rounded-2xl border-gray-800/50 cursor-pointer bg-gray-300/50 hover:bg-gray-100 hover:border-gray-200 transition-all text-left group flex flex-col justify-between h-28 shadow-md"
                  >
                    <div className="flex justify-between items-start">
                      <div className="w-8 h-8 rounded-lg bg-white border border-gray-100 shadow-sm flex items-center justify-center text-gray-700 group-hover:text-[#ff5b22] transition-colors">
                        <Icon size={16} />
                      </div>
                      <span className="text-lg font-bold text-gray-900">{action.count}</span>
                    </div>
                    <span className="text-sm font-semibold text-gray-600 group-hover:text-gray-900">
                      {action.name}
                    </span>
                  </button>
                )
              })}
            </div>
          </div>

          {/* Business Insights Restored */}
          <div className="col-span-12 lg:col-span-6 bg-white rounded-[1.5rem] p-6 shadow-lg border border-gray-50">
            <h3 className="text-lg font-light text-gray-800 mb-6 flex items-center gap-2">
              <Star size={20} className="text-yellow-400 fill-yellow-400" /> Business Insights
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 rounded-2xl border border-blue-100 bg-blue-50/50">
                <div className="flex items-center gap-2 mb-2">
                  <Users size={16} className="text-blue-600" />
                  <span className="font-bold text-blue-900 text-sm">Client Activity</span>
                </div>
                <p className="text-sm text-blue-800/80 font-medium">
                  {analytics.clients.active} active clients with{' '}
                  <span className="font-bold text-blue-600">{analytics.clients.new} new</span>{' '}
                  additions this period.
                </p>
              </div>

              <div className="p-4 rounded-2xl border border-orange-100 bg-orange-50/50">
                <div className="flex items-center gap-2 mb-2">
                  <Package size={16} className="text-[#ff5b22]" />
                  <span className="font-bold text-orange-900 text-sm">Inventory Status</span>
                </div>
                <p className="text-sm text-orange-800/80 font-medium">
                  {analytics.products.lowStock > 0 ? (
                    <>
                      <span className="font-bold text-red-500">
                        {analytics.products.lowStock} products
                      </span>{' '}
                      need immediate restocking.
                    </>
                  ) : (
                    'Inventory levels are completely healthy.'
                  )}
                </p>
              </div>

              <div className="p-4 rounded-2xl border border-emerald-100 bg-emerald-50/50">
                <div className="flex items-center gap-2 mb-2">
                  <TrendingUp size={16} className="text-emerald-600" />
                  <span className="font-bold text-emerald-900 text-sm">Order Fulfillment</span>
                </div>
                <p className="text-sm text-emerald-800/80 font-medium">
                  {analytics.orders.completed} completed orders and{' '}
                  <span className="font-bold">{analytics.orders.pending} pending</span> processing.
                </p>
              </div>

              <div className="p-4 rounded-2xl border border-purple-100 bg-purple-50/50">
                <div className="flex items-center gap-2 mb-2">
                  <DollarSign size={16} className="text-purple-600" />
                  <span className="font-bold text-purple-900 text-sm">Revenue Health</span>
                </div>
                <p className="text-sm text-purple-800/80 font-medium">
                  {analytics.revenue.netProfit >= 0
                    ? `Profitable operations maintaining a ${analytics.revenue.profitMargin.toFixed(1)}% margin.`
                    : 'Revenue is operating below cost thresholds.'}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Analytics

// ─── Sub-components ──────────────────────────────────────────────────────────

function TransactionIcon({ isSale }) {
  return (
    <div
      className={`flex items-center justify-center w-10 h-10 rounded-xl flex-shrink-0 ${
        isSale
          ? 'bg-emerald-500/10 text-emerald-400 ring-1 ring-emerald-500/20'
          : 'bg-rose-500/10 text-rose-400 ring-1 ring-rose-500/20'
      }`}
    >
      {isSale ? (
        <ArrowUpRight size={18} strokeWidth={2.2} />
      ) : (
        <ArrowDownLeft size={18} strokeWidth={2.2} />
      )}
    </div>
  )
}

function TransactionRow({ t, idx }) {
  const isSale = t.pageName === 'Sales'

  const formatCurrency = (v) =>
    new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(v)

  const toTitleCase = (s) => String(s).charAt(0).toUpperCase() + String(s).slice(1).toLowerCase()

  return (
    <div
      className="group flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 hover:bg-white/5 cursor-default border border-gray-800/50 shadow-sm "
      style={{ animationDelay: `${idx * 60}ms` }}
    >
      {/* Icon */}
      <TransactionIcon isSale={isSale} />

      {/* Middle — product + bill */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium tracking-wider truncate leading-tight">{toTitleCase(t.productName)}</p>
        <div className="flex items-center gap-2 mt-0.5">
          <span className="text-xs text-slate-500  tracking-wide">{t.billNo}</span>
          <span className="w-1 h-1 rounded-full bg-slate-700" />
          <span className="text-xs text-slate-500">
            Qty <span className="text-slate-500">{t.quantity}</span>
          </span>
        </div>
      </div>

      {/* Right — type badge + amount */}
      <div className="flex flex-col items-end gap-1 flex-shrink-0">
        <span
          className={`text-sm font-bold tabular-nums ${
            isSale ? 'text-emerald-400' : 'text-rose-400'
          }`}
        >
          {isSale ? '+' : '−'}
          {formatCurrency(t.totalAmountWithTax)}
        </span>
        <span
          className={`inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full tracking-wide ${
            isSale ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'
          }`}
        >
          {isSale ? (
            <TrendingUp size={9} strokeWidth={2.5} />
          ) : (
            <TrendingDown size={9} strokeWidth={2.5} />
          )}
          {t.pageName}
        </span>
      </div>
    </div>
  )
}

// ─── Main block — paste this into your dashboard ─────────────────────────────

export function RecentTransactionsBlock({ filteredData }) {
  const transactions = filteredData?.transactions ?? []
  const shown = transactions.slice(0, 5)

  return (
    <div className="overflow-auto">
      {/* List */}
      <div className="py-2">
        {shown.length > 0 ? (
          <ul className="space-y-2">
            {shown.map((t, idx) => (
              <li key={`${t.billNo}-${idx}`}>
                <TransactionRow t={t} idx={idx} />
              </li>
            ))}
          </ul>
        ) : (
          /* Empty state */
          <div className="flex flex-col items-center justify-center py-10 gap-3 text-center">
            <div className="w-12 h-12 rounded-2xl bg-slate-800 flex items-center justify-center text-slate-600">
              <Receipt size={22} strokeWidth={1.5} />
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-400">No transactions found</p>
              <p className="text-xs text-slate-600 mt-0.5">Try adjusting the selected period</p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
