/* eslint-disable react/display-name */
/* eslint-disable react/prop-types */
/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable no-unused-vars */
import React, { useEffect, useState, useMemo, useCallback, memo, useRef } from 'react'
import {
  FileUp,
  Import,
  Plus,
  Trash,
  Printer,
  Info,
  Package,
  TrendingUp,
  IndianRupee,
  Receipt,
  User,
  Calendar1,
  Box,
  Phone,
  MoreHorizontal,
  PenLine
} from 'lucide-react'
import Loader from '../components/Loader'
import SearchIcon from '@mui/icons-material/Search'
import { DateRangePicker, SelectPicker, Whisper, Tooltip, InputGroup, Input } from 'rsuite'
import 'rsuite/dist/rsuite-no-reset.min.css'
import {
  deleteTransaction,
  setClients,
  setProducts,
  setTransactions,
  updateTransaction
} from '../app/features/electronSlice'
import { useDispatch, useSelector } from 'react-redux'
import { toast } from 'react-toastify'
import TransactionModal from '../components/Modal/TransactionModal'
import HistoryToggleOffIcon from '@mui/icons-material/HistoryToggleOff'
import CreditScoreIcon from '@mui/icons-material/CreditScore'
import Navbar from '../components/UI/Navbar'
import { useLocation } from 'react-router-dom'
import ImportExcel from '../components/UI/ImportExcel'
import * as XLSX from 'xlsx'
import { IoLogoWhatsapp, IoReceipt } from 'react-icons/io5'
import SalesBill from '../components/Modal/SalesBill'

// Constants
const TABLE_HEADERS = [
  // { key: 'id', label: 'ID', width: 'w-[80px]', sticky: true },
  { key: 'date', label: 'Date', width: 'w-[150px]', icon: Calendar1 },
  { key: 'clientName', label: 'Client Name', width: 'w-[300px]', icon: User },
  { key: 'productName', label: 'Product Name', width: 'w-[250px]', icon: Box },
  { key: 'quantity', label: 'Quantity', width: 'w-[150px]', icon: Box },
  { key: 'sellingPrice', label: 'Selling Price', width: 'w-[170px]', conditional: true },
  { key: 'totalAmount', label: 'Total Amount', width: 'w-[200px]', icon: IndianRupee },
  { key: 'pendingAmount', label: 'Pending Amount', width: 'w-[200px]', icon: TrendingUp },
  { key: 'paidAmount', label: 'Paid Amount', width: 'w-[200px]', icon: Receipt },
  { key: 'paymentStatus', label: 'Payment Status', width: 'w-[170px]', icon: Info },
  { key: 'action', label: 'Action', width: 'w-[150px]', icon: MoreHorizontal }
]

const STATUS_OPTIONS = [
  { label: 'Completed', value: 'completed' },
  { label: 'Pending', value: 'pending' },
  { label: 'Partial', value: 'partial' }
]

// Utility functions
const toThousands = (value) => {
  if (!value || isNaN(value)) return '0'
  return new Intl.NumberFormat('en-IN').format(Number(value))
}

const formatTransactionId = (id) => {
  return id ? `RO${String(id).slice(-3).toUpperCase()}` : 'RO---'
}

const getClientName = (clientId, clients) => {
  const client = clients.find((c) => c?.id === clientId)
  return client ? client.clientName : 'Unknown Client'
}

const getProductName = (productId, products) => {
  const product = products.find((p) => p?.id === productId)
  return product ? product.name : 'Unknown Product'
}

const getInitials = (name) => {
  return (
    name
      ?.split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2) || ''
  )
}

const getPaymentStatusComponent = (transaction) => {
  const { statusOfTransaction, paymentType } = transaction

  // Common style base
  const baseStyle =
    'inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-semibold shadow-sm ring-1'

  if (statusOfTransaction === 'completed') {
    return (
      <span className={`${baseStyle} bg-emerald-50 text-emerald-700 ring-emerald-200`}>
        <span className="h-2 w-2 rounded-full bg-emerald-500"></span>
        Completed
      </span>
    )
  }

  if (statusOfTransaction === 'pending' && paymentType === 'partial') {
    return (
      <span className={`${baseStyle} bg-indigo-50 text-indigo-600 ring-indigo-200`}>
        <span className="h-2 w-2 rounded-full bg-indigo-500"></span>
        Partial
      </span>
    )
  }

  if (statusOfTransaction === 'pending') {
    return (
      <span className={`${baseStyle} bg-orange-50 text-orange-300 ring-orange-200`}>
        <span className="h-2 w-2 rounded-full bg-orange-300"></span>
        Pending
      </span>
    )
  }

  return (
    <span className={`${baseStyle} bg-gray-50 text-gray-500 ring-gray-200`}>
      <span className="h-2 w-2 rounded-full bg-gray-400"></span>-
    </span>
  )
}

// Memoized TransactionRow component
const TransactionRow = memo(
  ({ transaction, index, clients, products, location, onEdit, onDelete, onStatusChange }) => {
    const clientName = getClientName(transaction?.clientId, clients)
    const productName = getProductName(transaction?.productId, products)
    const totalAmount = (transaction?.sellAmount || 0) * (transaction?.quantity || 0)

    const renderPendingAmount = () => {
      if (
        transaction?.statusOfTransaction === 'pending' &&
        transaction?.paymentType === 'partial'
      ) {
        return (
          <Whisper
            trigger="hover"
            placement="rightStart"
            speaker={<Tooltip>{toThousands(transaction?.pendingAmount)}</Tooltip>}
          >
            <span>₹ {toThousands(Number(transaction?.pendingAmount).toFixed(0))}</span>
          </Whisper>
        )
      }

      if (transaction?.statusOfTransaction === 'completed') {
        return '-'
      }

      return <HistoryToggleOffIcon className="text-yellow-500" />
    }

    const renderPaidAmount = () => {
      if (transaction?.paymentType === 'partial') {
        return (
          <Whisper
            trigger="hover"
            placement="rightStart"
            speaker={<Tooltip>{toThousands(transaction?.paidAmount)}</Tooltip>}
          >
            <span>₹ {toThousands(Number(transaction?.paidAmount).toFixed(0))}</span>
          </Whisper>
        )
      }

      if (transaction?.statusOfTransaction === 'pending') {
        return '-'
      }

      return <CreditScoreIcon className="text-green-600" />
    }

    return (
      <tr className={`text-sm text-center`}>
        {/* <td className={`px-4 py-3 w-[80px] sticky left-0 ${rowBg} z-10 text-xs`}>
          {formatTransactionId(transaction?.id)}
        </td> */}
        <td className="px-4 py-3">
          {' '}
          {new Date(transaction?.date).toLocaleDateString('en-IN', {
            day: '2-digit',
            month: 'short',
            year: 'numeric'
          })}
        </td>
        <td className="px-4">
          <div className="flex items-center gap-3 px-6">
            <div className="relative group">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-100 border border-indigo-200 rounded-xl flex items-center justify-center text-indigo-700 text-sm font-semibold shadow-sm transition-all duration-300 group-hover:scale-110 group-hover:shadow-md group-hover:border-indigo-300">
                {getInitials(clientName)}
              </div>
              <div className="absolute inset-0 bg-gradient-to-br from-blue-100 to-purple-100 rounded-xl blur opacity-0 group-hover:opacity-40 transition-opacity duration-300"></div>
            </div>
            <span className="font-medium text-gray-700 transition-colors duration-200 group-hover:text-indigo-600">
              {clientName.toUpperCase()}
            </span>
          </div>
        </td>
        <td className="px-4 py-3 tracking-wide font-medium">
          {String(productName === 'Unknown Product' ? '-' : productName).toUpperCase()}
        </td>
        <td className="px-4 py-3">
          <span className="inline-flex items-center justify-center min-w-[3rem] bg-gradient-to-r from-slate-100 to-gray-100 border border-gray-200 px-3 py-1.5 rounded-full text-sm font-semibold text-gray-700 shadow-sm">
            {transaction?.quantity || 0}
          </span>
        </td>
        {location.pathname === '/purchase' && (
          <td className="px-4 py-3 font-bold text-indigo-500">
            ₹ {toThousands(Number(transaction?.sellAmount).toFixed(0))}
          </td>
        )}
        <td className="px-4 py-3 font-semibold">
          <div className="inline-flex items-center justify-center gap-1 bg-gradient-to-r from-slate-50 to-gray-100 text-gray-700 border border-gray-300 w-full py-1.5 rounded-full text-sm font-semibold shadow-sm hover:shadow-md transition-all duration-300">
            ₹ {toThousands(Number(transaction?.totalAmount).toFixed(0))}
          </div>
        </td>
        <td className="px-4 py-3">{renderPendingAmount()}</td>
        <td className="px-4 py-3">{renderPaidAmount()}</td>
        <td className="px-4 py-3 tracking-wide">
          <span onClick={() => onStatusChange(transaction.id)}>
            {getPaymentStatusComponent(transaction)}
          </span>
        </td>
        <td className="w-28">
          <div className="flex gap-2 justify-center items-center">
            {/* Edit Button */}
            {transaction.pageName === 'Bank' ? (
              ''
            ) : (
              <button
                className="group relative p-2 rounded-full bg-purple-50 text-purple-600 hover:bg-purple-100 transition-all duration-300 hover:scale-110 cursor-pointer border border-purple-400 "
                onClick={() => onEdit(transaction)}
                title="Edit transaction"
              >
                <PenLine
                  size={14}
                  className="group-hover:rotate-12 transition-transform duration-300"
                />
              </button>
            )}

            {/* Delete Button */}
            <button
              className="group relative p-2 rounded-full bg-red-50 text-red-600 hover:bg-red-100 transition-all duration-300 hover:scale-110 cursor-pointer border border-red-400"
              onClick={() => onDelete(transaction?.id)}
              title="Delete transaction"
            >
              <Trash
                size={14}
                className="group-hover:rotate-12 transition-transform duration-300"
              />
            </button>

            {/* WhatsApp Button */}
            <button
              className="group relative p-2 rounded-full bg-green-50 text-green-600 hover:bg-green-100 transition-all duration-300 hover:scale-110 cursor-pointer border border-green-400"
              onClick={() => {
                const clientName = getClientName(transaction?.clientId, clients)
                const productName = getProductName(transaction?.productId, products)
                const amount = toThousands(Number(transaction?.sellAmount).toFixed(0))

                const message = `Hello ${clientName},\n\nHere are your transaction details:\n📦 Product: ${productName}\n💰 Amount: ₹${amount}\n📅 Date: ${new Date(
                  transaction?.createdAt
                ).toLocaleDateString()}\n\nThank you for your business!`

                const client = clients.find((c) => c.id === transaction.clientId)
                if (client?.phoneNo) {
                  const url = `https://wa.me/${client.phoneNo}?text=${encodeURIComponent(message)}`
                  window.open(url, '_blank')
                }
              }}
              title="Send on WhatsApp"
            >
              <IoLogoWhatsapp
                size={16}
                className="group-hover:scale-110 transition-transform duration-300"
              />
            </button>
          </div>
        </td>
      </tr>
    )
  }
)

// Custom hook for transaction operations
const useTransactionOperations = () => {
  const dispatch = useDispatch()

  const fetchAllProducts = useCallback(async () => {
    try {
      const response = await window.api.getAllProducts()
      dispatch(setProducts(response))
    } catch (error) {
      console.error('Error fetching products:', error)
      toast.error('Failed to fetch products')
    }
  }, [dispatch])

  const fetchAllClients = useCallback(async () => {
    try {
      const response = await window.api.getAllClients()
      dispatch(setClients(response))
    } catch (error) {
      console.error('Error fetching clients:', error)
      toast.error('Failed to fetch clients')
    }
  }, [dispatch])

  const fetchAllTransactions = useCallback(async () => {
    try {
      const response = await window.api.getAllTransactions()
      dispatch(setTransactions(response))
    } catch (error) {
      console.error('Error fetching transactions:', error)
      toast.error('Failed to fetch transactions')
    }
  }, [dispatch])

  const handleDeleteTransaction = useCallback(
    async (id) => {
      if (!window.confirm('Are you sure you want to delete this transaction?')) return

      try {
        const response = await window.api.deleteTransaction(id)
        dispatch(deleteTransaction(response))
        await fetchAllTransactions()
        toast.success('Transaction deleted successfully')
      } catch (error) {
        toast.error('Failed to delete transaction: ' + error.message)
      }
    },
    [dispatch, fetchAllTransactions]
  )

  const handleStatusChange = useCallback(
    async (id) => {
      if (!window.confirm('Are you sure you want to update the transaction status?')) return
      try {
        const response = await window.api.getTransactionById(id)
        if (response.statusOfTransaction === 'pending') {
          response.statusOfTransaction = 'completed'
        } else {
          response.statusOfTransaction = 'pending'
        }
        const updatedResponse = await window.api.updateTransaction(response)
        dispatch(updateTransaction(updatedResponse))
        await fetchAllTransactions()
        toast.success('Transaction status updated successfully')
      } catch (error) {
        toast.error('Failed to update transaction status: ' + error.message)
      }
    },
    [dispatch, fetchAllTransactions]
  )

  const handleEditTransaction = useCallback(
    async (transaction, setSelectedTransaction, setIsUpdateExpense, setShowSalesBillModal) => {
      try {
        const response = await window.api.getTransactionById(transaction.id)
        setSelectedTransaction(response)
        setIsUpdateExpense(true)
        setShowSalesBillModal(true)
      } catch (error) {
        console.error('Error fetching transaction:', error)
        toast.error('Failed to load transaction data: ' + error.message)
      }
    },
    []
  )

  return {
    fetchAllProducts,
    fetchAllClients,
    fetchAllTransactions,
    handleDeleteTransaction,
    handleEditTransaction,
    handleStatusChange
  }
}

// Utility function to generate dynamic print HTML
const generatePrintHTML = (
  data,
  headers,
  title,
  reportType = 'default',
  clients = [],
  products = []
) => {
  const getCellValue = (row, headerKey) => {
    switch (headerKey) {
      case 'date':
        return new Date(row.createdAt).toLocaleDateString()
      case 'clientName':
        return getClientName(row.clientId, clients)
      case 'productName':
        return getProductName(row.productId, products)
      case 'quantity':
        return row.quantity || 0
      case 'totalAmount':
        return `₹ ${toThousands(Number((row.sellAmount || 0) * (row.quantity || 0)).toFixed(0))}`
      case 'pendingAmount':
        if (row.statusOfTransaction === 'pending' && row.paymentType === 'partial') {
          return `₹ ${toThousands(Number(row.pendingAmount).toFixed(0))}`
        }
        return row.statusOfTransaction === 'completed' ? '-' : 'Pending'
      default:
        return ''
    }
  }

  const tableHeaders = headers.map((h) => `<th class="border px-4 py-2">${h.label}</th>`).join('')
  const tableRows = data
    .map((row) => {
      const cells = headers
        .map((h) => `<td class="border px-4 py-2 text-center">${getCellValue(row, h.key)}</td>`)
        .join('')
      return `<tr>${cells}</tr>`
    })
    .join('')

  let ledgerSpecificContent = ''
  if (reportType === 'ledger') {
    // Example for ledger: Add balance columns or specific ledger logic
    // Customize based on your ledger data structure
    ledgerSpecificContent = `
      <tr>
        <td colspan="${headers.length}" class="border px-4 py-2 font-bold text-right">Running Balance</td>
      </tr>
      ${data
        .map((row, index) => {
          // Assume ledger data has 'balance' field; adjust as needed
          const balance = row.balance || 0
          return `<tr><td colspan="${headers.length - 1}" class="border px-4 py-2"></td><td class="border px-4 py-2 text-right">₹ ${toThousands(balance)}</td></tr>`
        })
        .join('')}
    `
  }

  return `
    <!DOCTYPE html>
<html>
  <head>
    <title>${title} Report</title>
    <style>
      body {
        font-family: "Segoe UI", Tahoma, Geneva, Verdana, sans-serif;
        margin: 20px;
        color: #1e293b;
        background: #fff;
      }

      /* ===== HEADER BAR ===== */
      .header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 25px;
        padding-bottom: 15px;
        border-bottom: 2px solid #e5e7eb;
      }

      .header-left {
        display: flex;
        flex-direction: column;
        align-items: flex-start;
      }

      .header-left h1 {
        font-size: 28px;
        font-weight: 600;
        margin: 0;
        color: #111827;
      }

      .generated-label {
        font-size: 12px;
        color: #64748b;
        background: #f1f5f9;
        border: 1px solid #e5e7eb;
        padding: 2px 8px;
        border-radius: 6px;
        margin-bottom: 6px;
      }

      .header-right {
        font-size: 14px;
        color: #374151;
        display: flex;
        flex-direction: column;
        align-items: flex-end;
        gap: 5px;
      }

      .record-count {
        font-weight: bold;
        background: #f3f4f6;
        border: 1px solid #e2e8f0;
        padding: 3px 8px;
        border-radius: 6px;
        font-size: 13px;
        color: #1e40af;
      }

      /* ===== TABLE ===== */
      table {
        width: 100%;
        border-collapse: collapse;
        margin-top: 20px;
        font-size: 14px;
      }

      thead th {
        background: #e5e7eb;
        color: #111827;
        padding: 12px 14px;
        border: 1px solid #e2e8f0;
        font-weight: 600;
        text-transform: capitalize;
        font-size: 15px;
        text-align: left;
      }

      tbody td {
        padding: 10px 14px;
        border: 1px solid #e2e8f0;
        font-size: 14px;
        color: #374151;
      }

      tbody tr:nth-child(even) {
        background: #f9fafb;
      }

      tbody tr:hover {
        background: #f1f5f9;
      }

      .totals-row {
        font-weight: bold;
        background: #f3f4f6;
      }

      /* ===== FOOTER ===== */
      .footer {
        margin-top: 25px;
        text-align: center;
        font-size: 12px;
        color: #64748b;
        border-top: 1px solid #e2e8f0;
        padding-top: 10px;
      }

      .footer strong {
        font-size: 15px;
        color: #1e40af;
      }

      @media print {
        body {
          margin: 0.8cm;
        }
        .footer {
          position: fixed;
          bottom: 10px;
          width: 100%;
        }
      }
    </style>
  </head>
  <body onload="window.print(); setTimeout(() => { window.close(); }, 1000);">

    <!-- ===== HEADER SECTION ===== -->
    <div class="header">
      <div class="header-left">
        <h1>${title}</h1>
      </div>
      <div class="header-right">
      <div class="record-count">Total Records: ${data.length}</div>
      <div>Generated on: ${new Date().toLocaleString()}</div>
      </div>
    </div>

    <!-- ===== TABLE ===== -->
    <table>
      <thead>
        <tr>
          ${tableHeaders}
        </tr>
      </thead>
      <tbody>
        ${tableRows}
        ${ledgerSpecificContent}
      </tbody>
    </table>

    <!-- ===== FOOTER ===== -->
    <div class="footer">
      <p>This is a computer-generated report. No signature is required.</p>
      <p><strong>Powered by Electron</strong></p>
    </div>
  </body>
</html>


  `
}

// Main Component
const Transaction = () => {
  const dispatch = useDispatch()
  const location = useLocation()
  const {
    fetchAllProducts,
    fetchAllClients,
    fetchAllTransactions,
    handleDeleteTransaction,
    handleEditTransaction,
    handleStatusChange
  } = useTransactionOperations()

  // State management
  const [showLoader, setShowLoader] = useState(false)
  const [showModal, setShowModal] = useState(false)
  const [showSalesBillModal, setShowSalesBillModal] = useState(false)
  const [selectedTransaction, setSelectedTransaction] = useState(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [isUpdateExpense, setIsUpdateExpense] = useState(false)
  const [dateRange, setDateRange] = useState([])
  const [clientFilter, setClientFilter] = useState('')
  const [productFilter, setProductFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [importFile, setImportFile] = useState(false)
  const [visibleCount, setVisibleCount] = useState(30)
  const tableContainerRef = useRef(null)

  const products = useSelector((state) => state.electron.products.data || [])
  const clients = useSelector((state) => state.electron.clients.data || [])
  const transactions = useSelector((state) => state.electron.transaction.data || [])

  // Memoized filtered data
  const filteredData = useMemo(() => {
    if (!Array.isArray(transactions)) return []
    const query = searchQuery?.toLowerCase()

    return transactions.filter((data) => {
      // Only show sales transactions
      if (data?.transactionType !== 'sales') return false

      // Search filter
      const matchesSearch =
        !query ||
        [
          data?.id?.toString(),
          getClientName(data?.clientId, clients)?.toLowerCase(),
          data?.sellAmount?.toString(),
          getProductName(data?.productId, products)?.toLowerCase(),
          data?.quantity?.toString(),
          data?.statusOfTransaction?.toLowerCase()
        ].some((field) => field?.includes(query))

      // Client filter
      const matchesClient = !clientFilter || String(data.clientId) === String(clientFilter)

      // Product filter
      const matchesProduct = !productFilter || String(data.productId) === String(productFilter)

      // Status filter
      const matchesStatus = !statusFilter || data?.statusOfTransaction === statusFilter

      // Date filter
      let matchesDate = true
      if (dateRange?.length === 2) {
        const createdDate = new Date(data.createdAt)
        const [start, end] = dateRange
        matchesDate = createdDate >= new Date(start) && createdDate <= new Date(end)
      }

      return matchesSearch && matchesClient && matchesProduct && matchesDate && matchesStatus
    })
  }, [
    transactions,
    searchQuery,
    clientFilter,
    productFilter,
    dateRange,
    statusFilter,
    clients,
    products
  ])

  const loadMore = useCallback(() => {
    if (visibleCount < filteredData.length) {
      setVisibleCount((prev) => prev + 30)
    }
  }, [visibleCount, filteredData.length])

  const handleScroll = useCallback(() => {
    if (tableContainerRef.current) {
      const { scrollTop, scrollHeight, clientHeight } = tableContainerRef.current
      if (scrollTop + clientHeight >= scrollHeight - 100) {
        loadMore()
      }
    }
  }, [loadMore])

  useEffect(() => {
    const container = tableContainerRef?.current
    if (container) {
      container?.addEventListener('scroll', handleScroll)
      return () => container.removeEventListener('scroll', handleScroll)
    }
  }, [handleScroll])

  // Memoized visible data for rendering
  const visibleData = useMemo(() => {
    return filteredData.slice(0, visibleCount)
  }, [filteredData, visibleCount])

  // Reset visible count when filters change
  useEffect(() => {
    setVisibleCount(30)
  }, [filteredData])

  // Memoized statistics
  const statistics = useMemo(() => {
    const salesTransactions = transactions.filter((t) => t?.transactionType === 'sales')

    const totalSales = salesTransactions.reduce((total, item) => total + (item.totalAmount || 0), 0)

    const totalPendingAmount = salesTransactions.reduce((total, item) => {
      if (item.statusOfTransaction === 'pending' && item.paymentType === 'full') {
        return total + (item.totalAmount || 0)
      }
      if (item.statusOfTransaction === 'pending' && item.paymentType === 'partial') {
        return total + (item.pendingAmount || 0)
      }
      return total
    }, 0)

    return { totalSales, totalPendingAmount }
  }, [transactions])

  // Event handlers
  const handleCreateTransaction = useCallback(() => {
    setSelectedTransaction(null)
    setIsUpdateExpense(false)
    // setShowModal(true)
    setShowSalesBillModal(true)
  }, [])

  const handleSearchChange = useCallback((value) => {
    setSearchQuery(value)
  }, [])

  const handleImportExcel = useCallback(
    async (filePath) => {
      try {
        const result = await window.api.importExcel(filePath, 'transactions')

        if (result.success) {
          toast.success(`Imported ${result.count} transactions successfully`)
          await fetchAllTransactions()
          setImportFile(false)
        } else {
          toast.error(`Import failed: ${result.error}`)
        }
      } catch (error) {
        toast.error('Failed to import Excel: ' + error.message)
      }
    },
    [fetchAllTransactions]
  )

  const handleExportExcel = useCallback(() => {
    try {
      const exportData = filteredData.map((transaction) => ({
        ID: formatTransactionId(transaction.id),
        Date: new Date(transaction.createdAt).toLocaleDateString(),
        'Client Name': getClientName(transaction.clientId, clients),
        'Product Name': getProductName(transaction.productId, products),
        Quantity: transaction.quantity,
        'Sell Amount': transaction.sellAmount,
        'Total Amount': transaction.sellAmount,
        'Pending Amount': transaction.pendingAmount || 0,
        'Paid Amount': transaction.paidAmount || 0,
        'Payment Status': transaction.statusOfTransaction,
        'Payment Type': transaction.paymentType
      }))

      const ws = XLSX.utils.json_to_sheet(exportData)
      const wb = XLSX.utils.book_new()
      XLSX.utils.book_append_sheet(wb, ws, 'Transactions')
      XLSX.writeFile(wb, `transactions_${new Date().toISOString().split('T')[0]}.xlsx`)

      toast.success('Data exported successfully')
    } catch (error) {
      toast.error('Failed to export data: ' + error.message)
    }
  }, [filteredData, clients, products])

  const TABLE_HEADERS_PRINT = [
    { key: 'date', label: 'Date', width: 'w-[100px]' },
    { key: 'clientName', label: 'Client Name', width: 'w-[250px]' },
    { key: 'productName', label: 'Product Name', width: 'w-[230px]' },
    { key: 'quantity', label: 'Quantity', width: 'w-[150px]' },
    { key: 'totalAmount', label: 'Total Amount', width: 'w-[200px]' },
    { key: 'pendingAmount', label: 'Status', width: 'w-[150px]' }
  ]

  // Updated handler for printing PDF using iframe to avoid popup blockers
  const handlePrintPDF = useCallback(
    (reportType = 'default') => {
      // Define columns to print (customize per report type)
      let printHeaders = TABLE_HEADERS_PRINT.filter((h) => h.key !== 'action') // Exclude action column by default
      let printData = filteredData

      if (reportType === 'ledger') {
        // Example: For ledger report, filter to specific client/product and add balance logic
        // Assume you pass clientId or adjust data here; customize as needed
        printHeaders = printHeaders.filter((h) =>
          [
            'date',
            'clientName',
            'productName',
            'quantity',
            'totalAmount',
            'pendingAmount'
          ].includes(h.key)
        ) // Only specific columns for ledger
        // Simulate ledger data with balance (adjust based on your data)
        printData = filteredData.map((row, index) => ({
          ...row,
          balance:
            index % 2 === 0
              ? (row.sellAmount || 0) * (row.quantity || 0)
              : -((row.sellAmount || 0) * (row.quantity || 0)) // Dummy balance; replace with real logic
        }))
      }

      const title = reportType === 'ledger' ? 'Ledger Report' : 'Sales Report'
      const printHTML = generatePrintHTML(
        printData,
        printHeaders,
        title,
        reportType,
        clients,
        products
      )

      // Create iframe for printing
      try {
        const printFrame = document.createElement('iframe')
        printFrame.style.position = 'absolute'
        printFrame.style.left = '-9999px'
        printFrame.style.width = '0'
        printFrame.style.height = '0'
        printFrame.style.border = '0'
        document.body.appendChild(printFrame)

        const printDoc = printFrame.contentDocument || printFrame.contentWindow.document
        printDoc.open()
        printDoc.write(printHTML)
        printDoc.close()

        // Wait a bit for content to load
        setTimeout(() => {
          printFrame.contentWindow.focus()
          printFrame.contentWindow.print()

          // Cleanup after print
          setTimeout(() => {
            document.body.removeChild(printFrame)
          }, 1000)
        }, 500)

        toast.success('Print dialog opened. Choose "Save as PDF" to generate PDF.')
      } catch (error) {
        console.error('Error initiating print:', error)
        toast.error('Failed to initiate print: ' + error.message)
      }
    },
    [filteredData, clients, products]
  )

  // Effects
  useEffect(() => {
    setShowLoader(true)
    Promise.all([fetchAllProducts(), fetchAllClients(), fetchAllTransactions()]).finally(() => {
      setShowLoader(false)
    })
  }, [fetchAllProducts, fetchAllClients, fetchAllTransactions])

  // Get visible headers based on location
  const visibleHeaders = useMemo(() => {
    return TABLE_HEADERS.filter((header) => {
      if (header.conditional && header.key === 'sellingPrice') {
        return location.pathname === '/purchase'
      }
      return true
    })
  }, [location.pathname])

  return (
    <div className="select-none gap-10 h-screen w-full overflow-x-auto transition-all duration-300 min-w-[720px] overflow-hidden">
      <div className="w-full sticky top-0 z-10">
        <Navbar />
      </div>

      {/* Header */}
      <div className="flex justify-between mt-5 pb-2 items-center">
        <p className="text-3xl font-light mx-7">Sales</p>
        <div className="mx-7 flex gap-2">
          <button
            className="text-black flex items-center cursor-pointer gap-1 border border-gray-300 w-fit p-1 px-3 rounded-sm hover:bg-black hover:text-white transition-all duration-300 hover:scale-105"
            onClick={() => setImportFile(!importFile)}
          >
            <Import size={16} />
            <span className="text-sm">Import</span>
          </button>
          <button
            className="text-black flex items-center cursor-pointer gap-1 border border-gray-300 w-fit p-1 px-3 rounded-sm hover:bg-black hover:text-white transition-all duration-300 hover:scale-105"
            onClick={handleExportExcel}
          >
            <FileUp size={16} />
            <span className="text-sm">Export</span>
          </button>
          <button
            className="text-black flex items-center cursor-pointer gap-1 border border-gray-300 w-fit p-1 px-3 rounded-sm hover:bg-black hover:text-white transition-all duration-300 hover:scale-105"
            onClick={() => handlePrintPDF('default')}
            title="Print Sales Report"
          >
            <Printer size={16} />
            <span className="text-sm">Print</span>
          </button>
          <button
            className="text-black flex items-center cursor-pointer gap-1 border border-gray-300 w-fit p-1 px-3 rounded-sm hover:bg-black hover:text-white transition-all duration-300 hover:scale-105"
            onClick={handleCreateTransaction}
          >
            <Plus size={16} />
            <span className="text-sm">ADD</span>
          </button>
        </div>
      </div>

      {/* Import Excel Component */}
      {importFile && (
        <ImportExcel onFileSelected={handleImportExcel} onClose={() => setImportFile(false)} />
      )}

      {/* Loader */}
      {showLoader && <Loader />}

      <div className="overflow-y-auto h-screen customScrollbar">
        {/* Statistics Cards */}
        <div className="bg-gradient-to-r from-slate-50 to-gray-100 border border-gray-200 rounded-2xl shadow-md px-6 py-4 mx-7 flex items-center justify-start transition-all duration-300 hover:shadow-lg">
          <div className="mx-5 border-r w-52">
            <p className="text-sm font-light mb-1">Total Sales</p>
            <p className="text-2xl font-light">₹ {toThousands(statistics.totalSales)}</p>
          </div>
          <div className="mx-5 border-r w-52">
            <p className="text-sm font-light mb-1">Total Pending Amount</p>
            <p className="text-2xl font-light">₹ {toThousands(statistics.totalPendingAmount)}</p>
          </div>
          <div className="mx-5 border-r w-52">
            <p className="text-sm font-light mb-1">Sales Bill</p>
            <div className="flex items-center gap-2">
              <IoReceipt
                size={34}
                className="text-[#897ee8] cursor-pointer hover:scale-110 transition-all duration-300 z-30 bg-[#edecff] border p-1.5 rounded-full"
                onClick={(e) => {
                  e.stopPropagation()
                  setShowSalesBillModal(true)
                }}
              />
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="w-full h-[calc(100%-40px)] my-3 bg-white overflow-y-auto customScrollbar relative">
          <div className="mx-7 my-3">
            {/* Filters */}
            <div className="flex justify-between mb-4">
              <div>
                <InputGroup size="md">
                  <Input
                    placeholder="Search transactions..."
                    value={searchQuery || ''}
                    onChange={handleSearchChange}
                    className="rounded-xl border-2 indent-2 border-[#d4d9fb] outline-none"
                  />
                  <InputGroup.Button>
                    <SearchIcon />
                  </InputGroup.Button>
                </InputGroup>
              </div>
              <div className="flex gap-2">
                <DateRangePicker
                  format="dd/MM/yyyy"
                  character=" ~ "
                  placeholder="Select Date Range"
                  onChange={setDateRange}
                  placement="bottomEnd"
                  container={() => document.body}
                  menuStyle={{ zIndex: 99999, position: 'absolute' }}
                />
                <SelectPicker
                  data={products.map((product) => ({
                    label: product?.name,
                    value: product?.id
                  }))}
                  onChange={setProductFilter}
                  placeholder="Select Product"
                  style={{ width: 150 }}
                  container={() => document.body}
                  menuStyle={{ zIndex: 99999, position: 'absolute' }}
                />
                <SelectPicker
                  data={clients.map((client) => ({
                    label: client?.clientName,
                    value: client?.id
                  }))}
                  placement="bottomEnd"
                  onChange={setClientFilter}
                  placeholder="Select Client"
                  style={{ width: 150 }}
                  container={() => document.body}
                  menuStyle={{ zIndex: 99999, position: 'absolute' }}
                />
                <SelectPicker
                  data={STATUS_OPTIONS}
                  onChange={setStatusFilter}
                  placeholder="Select Status"
                  style={{ width: 150 }}
                  searchable={false}
                  container={() => document.body}
                  menuStyle={{ zIndex: 99999, position: 'absolute' }}
                />
              </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto customScrollbar border border-gray-200 rounded-2xl h-screen mt-5 mb-40">
              <table className="min-w-max border-collapse table-fixed">
                <thead className="relative z-20">
                  <tr className="text-sm sticky top-0 z-20 bg-gradient-to-r from-gray-50 to-gray-100">
                    {visibleHeaders.map((header) => {
                      const IconTable = header.icon
                      return (
                        <th
                          key={header.key}
                          className={`px-4 py-3 border-b border-gray-300 ${header.width} ${header.sticky} bg-transparent`}
                        >
                          <div className="flex items-center justify-center gap-2">
                            <IconTable size={16} className="text-gray-500" />
                            {header.label}
                          </div>
                        </th>
                      )
                    })}
                  </tr>
                </thead>
                <tbody className="text-sm divide-y divide-gray-200">
                  {filteredData.length === 0 ? (
                    <tr className="text-center h-72">
                      <td
                        colSpan={visibleHeaders.length}
                        className="text-center font-light tracking-wider text-gray-500 text-lg"
                      >
                        No Data Found
                      </td>
                    </tr>
                  ) : (
                    visibleData.map((transaction, index) => (
                      <TransactionRow
                        key={transaction?.id || index}
                        transaction={transaction}
                        index={index}
                        clients={clients}
                        products={products}
                        location={location}
                        onEdit={(transaction) =>
                          handleEditTransaction(
                            transaction,
                            setSelectedTransaction,
                            setIsUpdateExpense,
                            setShowSalesBillModal
                          )
                        }
                        onDelete={handleDeleteTransaction}
                        onStatusChange={handleStatusChange}
                      />
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <TransactionModal
          setShowModal={setShowModal}
          existingTransaction={selectedTransaction}
          isUpdateExpense={isUpdateExpense}
          type="transaction"
        />
      )}
      {showSalesBillModal && (
        <SalesBill
          setShowSalesBillModal={setShowSalesBillModal}
          existingTransaction={selectedTransaction}
          isUpdateExpense={isUpdateExpense}
          type="transaction"
        />
      )}
    </div>
  )
}

export default Transaction
