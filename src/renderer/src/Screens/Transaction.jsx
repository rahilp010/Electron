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
  PenLine,
  ChevronDown
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
// import TransactionModal from '../components/Modal/TransactionModal'
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
  // { key: 'sellingPrice', label: 'Selling Price', width: 'w-[170px]', conditional: true },
  { key: 'totalAmount', label: 'Total Amount', width: 'w-[200px]', icon: IndianRupee },
  { key: 'pendingAmount', label: 'Pending Amount', width: 'w-[200px]', icon: TrendingUp },
  { key: 'paidAmount', label: 'Paid Amount', width: 'w-[200px]', icon: Receipt },
  { key: 'paymentStatus', label: 'Payment Status', width: 'w-[170px]', icon: Info },
  { key: 'action', label: 'Action', width: 'w-[150px]', icon: MoreHorizontal }
]

const ASSETS_TYPE_OPTIONS = [
  { label: 'Raw Material', value: 'Raw Material' },
  { label: 'Finished Goods', value: 'Finished Goods' },
  { label: 'Assets', value: 'Assets' }
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
  if (!clientId) return 'Unknown Client'

  // Handle both direct ID and nested object structure
  const id = typeof clientId === 'object' ? clientId.id : clientId
  const client = clients.find((c) => String(c?.id) === String(id))
  return client ? client.clientName : 'Unknown Client'
}

const getProductName = (productId, products) => {
  if (!productId) return 'Unknown Product'

  // Handle both direct ID and nested object structure
  const id = typeof productId === 'object' ? productId.id : productId
  const product = products.find((p) => String(p?.id) === String(id))
  return product ? product.productName : 'Unknown Product'
}

const getInitials = (name) => {
  if (!name || name === 'Unknown Client') return '??'
  return (
    name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2) || ''
  )
}

const getPaymentStatusComponent = (transaction) => {
  const { statusOfTransaction } = transaction
  const baseStyle =
    'inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-semibold shadow-sm ring-1'

  if (statusOfTransaction === 'mixed') {
    return (
      <span className={`${baseStyle} bg-indigo-50 text-indigo-700 ring-indigo-200`}>
        <span className="h-2 w-2 rounded-full bg-indigo-500"></span>
        Mixed
      </span>
    )
  }

  if (statusOfTransaction === 'completed') {
    return (
      <span className={`${baseStyle} bg-emerald-50 text-emerald-700 ring-emerald-200`}>
        <span className="h-2 w-2 rounded-full bg-emerald-500"></span>
        Completed
      </span>
    )
  }

  if (statusOfTransaction === 'pending' && transaction.paymentType === 'partial') {
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
  ({
    transaction,
    index,
    clients,
    products,
    onEdit,
    onDelete,
    onStatusChange,
    isSubRow = false
  }) => {
    const clientName = getClientName(transaction?.clientId, clients)
    const productName = getProductName(transaction?.productId, products)
    const totalAmountProduct = products
      .filter((p) => p.productName === productName)
      .map((p) => p.productPrice)
    const totalAmount = (totalAmountProduct || 0) * (transaction?.quantity || 0)

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
            <span>₹ {toThousands(Number(transaction?.pendingAmount).toFixed(2))}</span>
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
            <span>₹ {toThousands(Number(transaction?.paidAmount).toFixed(2))}</span>
          </Whisper>
        )
      }

      if (transaction?.statusOfTransaction === 'pending') {
        return '-'
      }

      return <CreditScoreIcon className="text-green-600" />
    }

    return (
      <tr className={`text-sm text-center ${isSubRow ? 'bg-indigo-100' : ''}`}>
        <td className={`px-4 py-3 text-center `}>
          {new Date(transaction?.date).toLocaleDateString('en-IN', {
            day: '2-digit',
            month: 'short',
            year: 'numeric'
          })}
        </td>
        <td className={`px-4 `}>
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
        <td className={`px-4 py-3 tracking-wide font-medium `}>
          {String(productName === 'Unknown Product' ? '-' : productName).toUpperCase()}
        </td>
        <td className={`px-4 py-3 `}>
          <span className="inline-flex items-center justify-center min-w-[3rem] bg-gradient-to-r from-slate-100 to-gray-100 border border-gray-200 px-3 py-1.5 rounded-full text-sm font-semibold text-gray-700 shadow-sm">
            {transaction?.quantity || 0}
          </span>
        </td>
        <td className={`px-4 py-3 font-semibold `}>
          <div className="inline-flex items-center justify-center gap-1 bg-gradient-to-r from-slate-50 to-gray-100 text-gray-700 border border-gray-300 w-full py-1.5 rounded-full text-sm font-semibold shadow-sm hover:shadow-md transition-all duration-300">
            ₹ {toThousands(Number(transaction?.totalAmountWithTax).toFixed(2))}
          </div>
        </td>
        <td className={`px-4 py-3 `}>{renderPendingAmount()}</td>
        <td className={`px-4 py-3 `}>{renderPaidAmount()}</td>
        <td className={`px-4 py-3 tracking-wide `}>
          <span onClick={() => onStatusChange(transaction.id)}>
            {getPaymentStatusComponent(transaction)}
          </span>
        </td>

        <td className={`w-28`}>
          <div className="flex gap-2 justify-center items-center">
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

            <button
              className="group relative p-2 rounded-full bg-green-50 text-green-600 hover:bg-green-100 transition-all duration-300 hover:scale-110 cursor-pointer border border-green-400"
              onClick={() => {
                const clientName = getClientName(transaction?.clientId, clients)
                const productName = getProductName(transaction?.productId, products)
                const amount = toThousands(Number(transaction?.saleAmount).toFixed(2))

                const message = `Hello ${clientName},\n\nHere are your transaction details:\n📦 Product: ${productName}\n💰 Amount: ₹${amount}\n📅 Date: ${new Date(
                  transaction?.createdAt
                ).toLocaleDateString()}\n\nThank you for your business!`

                const client = clients.find((c) => String(c.id) === String(transaction.clientId))
                if (client?.phoneNo) {
                  const url = `https://wa.me/${client.phoneNo}?text=${encodeURIComponent(message)}`
                  window.open(url, '_blank')
                }
              }}
              title="Send on WhatsApp"
            >
              <IoLogoWhatsapp
                size={16}
                className="group-hover:rotate-12 transition-transform duration-300"
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
      const response = await window.api.getAllSales()
      dispatch(setTransactions(response.data))
    } catch (error) {
      console.error('Error fetching transactions:', error)
      toast.error('Failed to fetch transactions')
    }
  }, [dispatch])

  const handleDeleteTransaction = useCallback(
    async (id) => {
      if (!window.confirm('Are you sure you want to delete this transaction?')) return

      try {
        const response = await window.api.deleteSales(id)
        dispatch(deleteTransaction(response))
        await fetchAllTransactions()

        toast.success('Transaction deleted successfully')
      } catch (error) {
        toast.error('Failed to delete transaction: ' + error.message)
      }
    },
    [dispatch, fetchAllTransactions]
  )

  const handleDeleteGroup = useCallback(
    async (items, billNo) => {
      if (
        !window.confirm(
          `Are you sure you want to delete ${items.length} transactions in bill ${billNo}?`
        )
      )
        return

      try {
        for (const item of items) {
          await window.api.deleteSales(item.id)
        }
        await fetchAllTransactions()
        toast.success('Bill deleted successfully')
      } catch (error) {
        toast.error('Failed to delete bill: ' + error.message)
      }
    },
    [fetchAllTransactions]
  )

  const handleStatusChange = useCallback(
    async (id) => {
      if (!window.confirm('Are you sure you want to update the transaction status?')) return
      try {
        const response = await window.api.getSalesById(id)

        if (response.statusOfTransaction === 'pending') {
          response.statusOfTransaction = 'completed'
        } else {
          response.statusOfTransaction = 'pending'
        }
        const updatedResponse = await window.api.updateSales(response)
        dispatch(updateTransaction(updatedResponse))
        await fetchAllTransactions()
        toast.success('Transaction status updated successfully')
      } catch (error) {
        toast.error('Failed to update transaction status: ' + error.message)
      }
    },
    [dispatch, fetchAllTransactions]
  )

  const handleToggleGroupStatus = useCallback(
    async (items, currentStatus) => {
      if (!window.confirm('Are you sure you want to update the status for all items in this bill?'))
        return
      const newStatus = currentStatus === 'completed' ? 'pending' : 'completed'
      try {
        for (const item of items) {
          const updatedItem = { ...item, statusOfTransaction: newStatus }
          await window.api.updateSales(updatedItem)
        }
        await fetchAllTransactions()
        toast.success('Bill status updated successfully')
      } catch (error) {
        toast.error('Failed to update bill status: ' + error.message)
      }
    },
    [fetchAllTransactions]
  )

  const handleEditTransaction = useCallback(
    async (transaction, setSelectedTransaction, setIsUpdateExpense, setShowSalesBillModal) => {
      try {
        const response = await window.api.getSalesById(transaction.id)
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

  const handleEditGroup = useCallback(
    (items, setSelectedTransaction, setIsUpdateExpense, setShowSalesBillModal) => {
      const groupData = {
        ...items[0],
        multipleProducts: items,
        isMultiProduct: true
      }
      setSelectedTransaction(groupData)
      setIsUpdateExpense(true)
      setShowSalesBillModal(true)
    },
    []
  )

  const handleUpdatePaymentStatus = useCallback(
    async (transactionId, newStatus) => {
      try {
        // Call API (assuming your backend supports update)
        const response = await window.api.updateSales({
          transactionId,
          statusOfTransaction: newStatus
        })

        await fetchAllTransactions()

        toast.success(`Payment status updated to ${newStatus}`)
      } catch (error) {
        toast.error('Failed to update payment status: ' + error.message)
      }
    },
    [fetchAllTransactions]
  )

  return {
    fetchAllProducts,
    fetchAllClients,
    fetchAllTransactions,
    handleDeleteTransaction,
    handleDeleteGroup,
    handleStatusChange,
    handleToggleGroupStatus,
    handleEditTransaction,
    handleEditGroup,
    handleUpdatePaymentStatus
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
  // --- 1. Helper Functions & Calculations ---
  const toThousands = (num) => num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',')

  // Calculate Totals
  const totalAmount = data.reduce((sum, row) => sum + (Number(row.totalAmountWithTax) || 0), 0)
  const totalQuantity = data.reduce((sum, row) => sum + (Number(row.quantity) || 0), 0)

  const getCellValue = (row, headerKey) => {
    switch (headerKey) {
      case 'billNo':
        return `<span class="font-mono font-bold">#${row.billNo || '---'}</span>`
      case 'date':
        return new Date(row.createdAt).toLocaleDateString('en-IN', {
          day: 'numeric',
          month: 'short',
          year: 'numeric'
        })
      case 'clientName':
        const name =
          typeof getClientName !== 'undefined'
            ? getClientName(row.clientId, clients)
            : row.clientName || 'N/A'
        return `<div class="text-wrap-cell">${name}</div>`
      case 'productName':
        const prod =
          typeof getProductName !== 'undefined'
            ? getProductName(row.productId, products)
            : row.productName || 'N/A'
        return `<div class="text-wrap-cell">${prod}</div>`
      case 'quantity':
        return row.quantity || 0
      case 'totalAmount':
        return `₹ ${toThousands(Number(row.totalAmountWithTax || 0).toFixed(0))}`
      case 'pendingAmount':
        if (row.statusOfTransaction === 'pending' && row.paymentType === 'partial') {
          return `<span class="text-red font-bold">₹ ${toThousands(Number(row.pendingAmount).toFixed(0))}</span>`
        }
        return row.statusOfTransaction === 'completed'
          ? '<span class="badge badge-success">Paid</span>'
          : '<span class="badge badge-warning">Pending</span>'
      default:
        return row[headerKey] || ''
    }
  }

  // --- 2. Table Construction ---
  const tableHeaders = headers
    .map((h) => {
      let align = 'text-left'
      if (h.key === 'totalAmount' || h.key === 'quantity') align = 'text-right'
      if (h.key === 'pendingAmount') align = 'text-center'
      return `<th class="${align}">${h.label}</th>`
    })
    .join('')

  const tableRows = data
    .map((row) => {
      const cells = headers
        .map((h) => {
          let alignClass = 'text-left'
          if (h.key === 'totalAmount' || h.key === 'quantity') alignClass = 'text-right'
          if (h.key === 'pendingAmount') alignClass = 'text-center'
          return `<td class="${alignClass}">${getCellValue(row, h.key)}</td>`
        })
        .join('')
      return `<tr>${cells}</tr>`
    })
    .join('')

  // --- 3. Ledger Specific Logic ---
  let ledgerSpecificContent = ''
  if (reportType === 'ledger') {
    ledgerSpecificContent = `
      <tr class="ledger-separator">
        <td colspan="${headers.length}" class="text-right font-bold bg-gray">Running Balance calculation below</td>
      </tr>
      ${data
        .map((row) => {
          const balance = row.balance || 0
          return `
            <tr class="ledger-row">
              <td colspan="${headers.length - 1}" class="text-right label-cell">Balance Forward:</td>
              <td class="text-right font-bold">₹ ${toThousands(balance)}</td>
            </tr>`
        })
        .join('')}
    `
  }

  // --- 4. Company Info ---
  const companyInfo = {
    name: 'Electron by Envy',
    // address: '123 Business Park, Main Street',
    city: 'Surat, Gujarat - 395006',
    phone: '+91 9316080624',
    email: 'admin@envy.com'
    // gst: 'GSTIN: 24ABCDE1234F1Z5'
  }

  return `
    <!DOCTYPE html>
    <html>
      <head>
        <title>${title}</title>
        <style>
          @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&display=swap');

          :root {
            --primary: #1e293b; /* Slate 800 */
            --secondary: #64748b; /* Slate 500 */
            --border: #e2e8f0;
            --highlight: #f8fafc;
          }

          html, body { height: 100%; margin: 0; padding: 0; }

          body {
            font-family: 'Inter', sans-serif;
            color: #334155;
            line-height: 1.5;
            background: #fff;
            display: flex;
            flex-direction: column; 
            min-height: 100vh;
          }

          .page-wrapper {
            flex: 1;
            padding: 40px;
            display: flex;
            flex-direction: column;
          }

          .content-grow { flex: 1; }

          /* Layout Utils */
          .flex { display: flex; }
          .justify-between { justify-content: space-between; }
          .justify-end { justify-content: flex-end; }
          .items-center { align-items: center; }
          .items-end { align-items: flex-end; }
          .font-bold { font-weight: 700; }
          .font-mono { font-family: 'Courier New', Courier, monospace; }
          .text-right { text-align: right; }
          .text-left { text-align: left; }
          .text-center { text-align: center; }
          .text-red { color: #dc2626; }
          .bg-gray { background-color: #f1f5f9; }

          .text-wrap-cell {
            max-width: 180px;
            white-space: normal;
            word-wrap: break-word;
            line-height: 1.3;
          }

          /* Header */
          .header-container {
            border-bottom: 2px solid var(--primary);
            padding-bottom: 20px;
            margin-bottom: 30px;
          }
          .company-branding h1 { margin: 0; font-size: 24px; color: var(--primary); text-transform: uppercase; }
          .company-details { font-size: 12px; color: var(--secondary); margin-top: 8px; }
          .logo-placeholder {
            width: 70px; height: 65px; background: var(--primary); color: white;
            display: flex; align-items: center; justify-content: center;
            border-radius: 8px; font-weight: bold; font-size: 20px; margin-bottom: 10px;
          }
          .report-meta { text-align: right; }
          .report-title { font-size: 28px; font-weight: 800; color: #cbd5e1; text-transform: uppercase; margin: 0; }
          .meta-table { margin-top: 10px; border-collapse: collapse; float: right; font-size: 12px; }
          .meta-table td { padding: 2px 10px; border-bottom: 1px solid var(--border); }
          .meta-label { font-weight: 600; color: var(--primary); }

          /* Table */
          table.data-table { width: 100%; border-collapse: collapse; margin-bottom: 10px; }
          table.data-table th {
            background-color: var(--primary); color: white;
            padding: 10px; font-weight: 600; font-size: 12px;
            text-transform: uppercase;
          }
          table.data-table td {
            padding: 8px 10px; border-bottom: 1px solid var(--border);
            font-size: 12px; vertical-align: middle;
          }
          table.data-table tr:nth-child(even) { background-color: #f8fafc; }

          /* Totals Section */
          .totals-container {
            display: flex;
            justify-content: flex-end;
            margin-top: 20px;
            page-break-inside: avoid;
          }
          .totals-table {
            width: 40%; /* Adjust width of summary box */
            border-collapse: collapse;
            font-size: 13px;
          }
          .totals-table td {
            padding: 8px 12px;
            border-bottom: 1px solid #e2e8f0;
          }
          .totals-table .label { font-weight: 600; color: var(--secondary); }
          .totals-table .value { text-align: right; font-weight: 600; color: var(--primary); }
          .totals-table .grand-total-row {
            background-color: var(--primary);
            color: white;
          }
          .totals-table .grand-total-row .label, 
          .totals-table .grand-total-row .value {
            color: white;
            font-size: 14px;
            font-weight: 700;
            border: none;
          }

          /* Status Pills */
          .badge {
            display: inline-block; padding: 4px 12px; border-radius: 50px;
            font-weight: 600; font-size: 10px; text-transform: uppercase;
            min-width: 60px; text-align: center;
          }
          .badge-success { background: #dcfce7; color: #15803d; border: 1px solid #bbf7d0; }
          .badge-warning { background: #fef9c3; color: #a16207; border: 1px solid #fde047; }

          /* Footer */
          .footer-section {
            margin-top: auto; padding-top: 20px; border-top: 1px solid var(--border);
          }
          .signature-area { width: 200px; text-align: center; }
          .signature-line { border-top: 1px solid #334155; margin-bottom: 5px; }

          @media print {
            body { -webkit-print-color-adjust: exact; print-color-adjust: exact; display: block; min-height: 100%; }
            .page-wrapper { padding: 0; display: block; height: 100%; }
            .footer-section { position: fixed; bottom: 0; left: 0; width: 100%; background: white; padding-bottom: 10px; }
            table.data-table { margin-bottom: 20px; } /* Reset margin */
            /* Ensure the totals don't overlap the fixed footer if data is long */
            .totals-container { margin-bottom: 150px; } 
          }
        </style>
      </head>
      <body onload="window.print();">
        <div class="page-wrapper">
          <div class="content-grow">
            <div class="header-container flex justify-between items-start">
              <div class="company-branding">
                <div class="logo-placeholder">Envy</div> 
                <h1>${companyInfo.name}</h1>
                <div class="company-details">
                  <div>${companyInfo.city}</div>
                  <div>${companyInfo.phone} | ${companyInfo.email}</div>
                </div>
              </div>
              <div class="report-meta">
                <h2 class="report-title">${title}</h2>
                <table class="meta-table">
                  <tr><td class="meta-label">Date:</td><td>${new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</td></tr>
                  <tr><td class="meta-label">Records:</td><td>${data.length}</td></tr>
                </table>
              </div>
            </div>

            <table class="data-table">
              <thead><tr>${tableHeaders}</tr></thead>
              <tbody>
                ${tableRows}
                ${ledgerSpecificContent}
              </tbody>
            </table>

            <div class="totals-container">
              <table class="totals-table">
                <tr>
                  <td class="label">Total Quantity</td>
                  <td class="value">${totalQuantity}</td>
                </tr>
                <tr>
                  <td class="label">Sub Total</td>
                  <td class="value">₹ ${toThousands(totalAmount.toFixed(0))}</td>
                </tr>
                <tr class="grand-total-row">
                  <td class="label">Grand Total</td>
                  <td class="value">₹ ${toThousands(totalAmount.toFixed(0))}</td>
                </tr>
              </table>
            </div>

          </div> <div class="footer-section">
            <div class="flex justify-between items-end">
              <div style="width: 60%;">
                <p style="font-size:11px; font-weight:bold; margin-bottom:4px;">Terms & Conditions:</p>
                <p style="font-size:10px; color:#64748b; margin:0; line-height:1.4;">
                  1. Goods once sold will not be taken back.<br>
                  2. Interest @18% p.a. will be charged if payment is delayed.<br>
                  3. Subject to Surat Jurisdiction.
                </p>
              </div>
              <div class="signature-area">
                <div style="height: 50px;"></div> <div class="signature-line"></div>
                <div class="font-bold" style="font-size:12px;">Authorized Signatory</div>
                <div style="font-size:10px;">For, ${companyInfo.name}</div>
              </div>
            </div>
            <div class="text-center" style="margin-top:20px; font-size:9px; color:#94a3b8;">
              This is a computer-generated document. | Powered by Electron by Envy
            </div>
          </div>
        </div>
      </body>
    </html>
  `
}

// Main Component
const Transaction = () => {
  const location = useLocation()
  const dispatch = useDispatch()
  const {
    fetchAllProducts,
    fetchAllClients,
    fetchAllTransactions,
    handleDeleteTransaction,
    handleDeleteGroup,
    handleStatusChange,
    handleToggleGroupStatus,
    handleEditTransaction,
    handleEditGroup,
    handleUpdatePaymentStatus
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
  const [assetsTypeFilter, setAssetsTypeFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [importFile, setImportFile] = useState(false)
  const [expandedGroups, setExpandedGroups] = useState(new Set())
  const [visibleCount, setVisibleCount] = useState(30)
  const tableContainerRef = useRef(null)

  const products = useSelector((state) => state.electron.products.data || [])
  const clients = useSelector((state) => state.electron.clients.data || [])
  const transactions = useSelector((state) => state.electron.transaction.data || [])

  const isMatch = useCallback(
    (
      data,
      query,
      clientFilter,
      productFilter,
      assetsTypeFilter,
      dateRange,
      statusFilter,
      clients,
      products
    ) => {
      const q = query?.toLowerCase()

      const matchesSearch =
        !q ||
        [
          data?.id?.toString(),
          getClientName(data?.clientId, clients)?.toLowerCase(),
          data?.saleAmount?.toString(),
          getProductName(data?.productId, products)?.toLowerCase(),
          data?.quantity?.toString(),
          data?.statusOfTransaction?.toLowerCase()
        ].some((field) => field?.includes(q))

      // Client filter - handle nested object structure
      const matchesClient =
        !clientFilter || String(data.clientId?.id || data.clientId) === String(clientFilter)

      // Product filter - handle nested object structure
      const matchesProduct =
        !productFilter || String(data.productId?.id || data.productId) === String(productFilter)

      // Assets type filter
      const product = products.find((p) => String(p?.id) === String(data?.productId))
      const matchesAssets =
        !assetsTypeFilter || (product?.type || product?.assetsType) === assetsTypeFilter

      // Status filter
      const matchesStatus = !statusFilter || data?.statusOfTransaction === statusFilter

      // Date filter
      let matchesDate = true
      if (dateRange?.length === 2) {
        const createdDate = new Date(data.createdAt)
        const [start, end] = dateRange
        matchesDate = createdDate >= new Date(start) && createdDate <= new Date(end)
      }

      return (
        matchesSearch &&
        matchesClient &&
        matchesProduct &&
        matchesAssets &&
        matchesDate &&
        matchesStatus
      )
    },
    [clients, products]
  )

  const filteredTransactions = useMemo(() => {
    return transactions.filter((data) => {
      // Only show sales transactions
      if (data?.pageName !== 'Sales') return false

      return isMatch(
        data,
        searchQuery,
        clientFilter,
        productFilter,
        assetsTypeFilter,
        dateRange,
        statusFilter,
        clients,
        products
      )
    })
  }, [
    transactions,
    searchQuery,
    clientFilter,
    productFilter,
    assetsTypeFilter,
    dateRange,
    statusFilter,
    clients,
    products,
    isMatch
  ])

  const candidateBills = useMemo(() => {
    const bills = new Set()
    transactions.forEach((t) => {
      if (
        t.transactionType === 'sales' &&
        isMatch(
          t,
          searchQuery,
          clientFilter,
          productFilter,
          assetsTypeFilter,
          dateRange,
          statusFilter,
          clients,
          products
        )
      ) {
        bills.add(t.billNo)
      }
    })
    return bills
  }, [
    transactions,
    searchQuery,
    clientFilter,
    productFilter,
    assetsTypeFilter,
    dateRange,
    statusFilter,
    clients,
    products,
    isMatch
  ])

  const filteredGrouped = useMemo(() => {
    const grouped = {}

    filteredTransactions.forEach((transaction) => {
      const billNo = transaction.billNo
      if (!grouped[billNo]) {
        grouped[billNo] = []
      }
      grouped[billNo].push(transaction)
    })

    // Sort items within each group by createdAt descending
    Object.keys(grouped).forEach((billNo) => {
      grouped[billNo].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    })

    // Sort groups by the latest date in each group (descending)
    const sortedBillNos = Object.keys(grouped).sort((a, b) => {
      const groupA = grouped[a]
      const groupB = grouped[b]
      const latestA = new Date(groupA[0].createdAt)
      const latestB = new Date(groupB[0].createdAt)
      return latestB - latestA
    })

    const sortedGrouped = {}
    sortedBillNos.forEach((billNo) => {
      sortedGrouped[billNo] = grouped[billNo]
    })

    return sortedGrouped
  }, [filteredTransactions])

  const toggleGroup = useCallback((billNo) => {
    setExpandedGroups((prev) => {
      const newSet = new Set(prev)
      if (newSet.has(billNo)) {
        newSet.delete(billNo)
      } else {
        newSet.add(billNo)
      }
      return newSet
    })
  }, [])

  const renderedGroups = useMemo(() => {
    const entries = Object.entries(filteredGrouped)
    return entries.slice(0, visibleCount)
  }, [filteredGrouped, visibleCount])

  const loadMore = useCallback(() => {
    if (visibleCount < Object.keys(filteredGrouped).length) {
      setVisibleCount((prev) => prev + 30)
    }
  }, [visibleCount, filteredGrouped])

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

  // Reset visible count when filters change
  useEffect(() => {
    setVisibleCount(30)
  }, [filteredGrouped])

  // Memoized statistics
  const statistics = useMemo(() => {
    const salesTransactions = transactions.filter((t) => t?.pageName === 'Sales')

    const currentPID = salesTransactions.map((p) => p.productId)

    const productName = getProductName(currentPID[0], products)

    const totalAmountProduct = products
      .filter((p) => p.productName === productName)
      .map((p) => p.productPrice)

    const totalSales = salesTransactions.reduce((total, item) => total + item.totalAmountWithTax, 0)

    const totalProducts = salesTransactions.reduce((total, item) => total + (item.quantity || 0), 0)

    const valueFunction = (item) => {
      switch (item.statusOfTransaction === 'pending') {
        case item.paymentType === 'full':
          return Number(item.totalAmountWithTax)
        case item.paymentType === 'partial':
          return Number(item.pendingFromOurs)
        default:
          return Number(item.pendingFromOurs)
      }
    }

    const totalPendingAmount = salesTransactions.reduce(
      (total, item) => total + (valueFunction(item) || 0),
      0
    )

    const totalPendingCount = salesTransactions.filter(
      (item) => item.statusOfTransaction === 'pending'
    ).length

    const totalPaidCount = salesTransactions.filter(
      (item) => item.statusOfTransaction === 'completed'
    ).length

    return { totalSales, totalProducts, totalPendingAmount, totalPendingCount, totalPaidCount }
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
          toast.success(`Imported ${result.count} sales successfully`)
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
      const exportData = filteredTransactions.map((transaction) => ({
        'Bill No': transaction.billNo,
        ID: formatTransactionId(transaction.id),
        Date: new Date(transaction.createdAt).toLocaleDateString(),
        'Client Name': getClientName(transaction.clientId, clients),
        'Product Name': getProductName(transaction.productId, products),
        Quantity: transaction.quantity,
        'Total Amount': toThousands(transaction.totalAmountWithTax || 0),
        'Pending Amount': toThousands(transaction.pendingAmount || 0),
        'Paid Amount': toThousands(transaction.paidAmount || 0),
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
  }, [filteredTransactions, clients, products])

  const TABLE_HEADERS_PRINT = [
    { key: 'billNo', label: 'Bill No', width: 'w-[150px]' },
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
      let printData = filteredTransactions

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
        printData = filteredTransactions.map((row, index) => ({
          ...row,
          balance:
            index % 2 === 0
              ? (row.saleAmount || 0) * (row.productQuantity || 0)
              : -((row.saleAmount || 0) * (row.productQuantity || 0)) // Dummy balance; replace with real logic
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
    [filteredTransactions, clients, products]
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
            <p className="text-2xl font-light">
              ₹ {toThousands(Number(statistics.totalSales).toFixed(2))}
            </p>
          </div>
          <div className="mx-5 border-r w-52">
            <p className="text-sm font-light mb-1">Total Pending Amount</p>
            <p className="text-2xl font-light">
              ₹ {toThousands(Number(statistics.totalPendingAmount).toFixed(2))}
            </p>
          </div>
          {/* <div className="mx-5 border-r w-52">
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
          </div> */}
          <div className="mx-5 border-r w-52">
            <p className="text-sm font-light mb-1">Pending Count</p>
            <p className="text-2xl font-light">{statistics.totalPendingCount}</p>
          </div>
          <div className="mx-5 border-r w-52">
            <p className="text-sm font-light mb-1">Paid Count</p>
            <p className="text-2xl font-light">{statistics.totalPaidCount}</p>
          </div>
        </div>

        {/* Main Content */}
        <div className="w-full h-[calc(100%-40px)] my-3 bg-white overflow-y-auto customScrollbar relative">
          <div className="mx-7 my-5">
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
                  data={clients.map((client) => ({
                    label: client?.clientName,
                    value: client?.id
                  }))}
                  onChange={setClientFilter}
                  placeholder="Select Client"
                  virtualized={true}
                  menuMaxHeight={250}
                  style={{ width: 200 }}
                  placement="bottomEnd"
                  container={() => document.body}
                  menuStyle={{ zIndex: 99999, position: 'absolute' }}
                />
                <SelectPicker
                  data={products.map((product) => ({
                    label: product?.productName,
                    value: product?.id
                  }))}
                  onChange={setProductFilter}
                  placeholder="Select Product"
                  virtualized={true}
                  style={{ width: 200 }}
                  placement="bottomEnd"
                  container={() => document.body}
                  menuStyle={{ zIndex: 99999, position: 'absolute' }}
                />
                <SelectPicker
                  data={ASSETS_TYPE_OPTIONS}
                  onChange={setAssetsTypeFilter}
                  placeholder="Select Assets Type"
                  style={{ width: 150 }}
                  placement="bottomEnd"
                  searchable={false}
                  container={() => document.body}
                  menuStyle={{ zIndex: 99999, position: 'absolute' }}
                  virtualized={true}
                />
                <SelectPicker
                  data={[
                    { label: 'All', value: '' },
                    { label: 'Pending', value: 'pending' },
                    { label: 'Completed', value: 'completed' }
                  ]}
                  onChange={setStatusFilter}
                  placeholder="Select Status"
                  style={{ width: 150 }}
                  placement="bottomEnd"
                  searchable={false}
                  container={() => document.body}
                  menuStyle={{ zIndex: 99999, position: 'absolute' }}
                />
              </div>
            </div>

            {/* Table */}
            <div
              ref={tableContainerRef}
              className="overflow-x-auto customScrollbar border border-gray-200 rounded-2xl h-screen mt-5 mb-40"
            >
              <table className="min-w-max border-collapse table-fixed text-center">
                <thead className="relative z-20">
                  <tr className="text-sm sticky top-0 z-20 bg-gradient-to-r from-gray-50 to-gray-100">
                    {visibleHeaders.map((header) => {
                      const IconTable = header.icon
                      return (
                        <th
                          key={header.key}
                          className={`px-4 py-3 border-b border-gray-300 text-center ${header.width} ${header.sticky} bg-transparent`}
                        >
                          <div className="flex items-center justify-center gap-2">
                            {IconTable && <IconTable size={16} className="text-gray-500" />}
                            {header.label}
                          </div>
                        </th>
                      )
                    })}
                  </tr>
                </thead>
                <tbody className="text-sm divide-y divide-gray-200">
                  {Object.entries(filteredGrouped).length === 0 ? (
                    <tr className="text-center h-80">
                      <td
                        colSpan={visibleHeaders.length}
                        className="text-center font-light tracking-wider text-gray-500 text-lg"
                      >
                        No Data Found
                      </td>
                    </tr>
                  ) : (
                    renderedGroups.map(([billNo, items]) => {
                      if (items.length === 1) {
                        // Single item: Render directly as TransactionRow without group header
                        const item = items[0]
                        return (
                          <TransactionRow
                            key={`${billNo}-single-${item.id}`}
                            transaction={item}
                            index={0}
                            clients={clients}
                            products={products}
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
                            onUpdateStatus={handleUpdatePaymentStatus}
                            isSubRow={false}
                          />
                        )
                      } else {
                        // Multi-item: Render group header and sub-rows if expanded
                        const firstItem = items[0]
                        const isExpanded = expandedGroups.has(billNo)
                        const clientName = getClientName(firstItem?.clientId, clients)
                        const date = new Date(firstItem?.date).toLocaleDateString('en-IN', {
                          day: '2-digit',
                          month: 'short',
                          year: 'numeric'
                        })
                        const totalQty = items.reduce((sum, i) => sum + (i.quantity || 0), 0)
                        const totalAmount = items.reduce((sum, i) => sum + (i.saleAmount || 0), 0)
                        const totalPending = items.reduce((sum, i) => {
                          if (i.statusOfTransaction === 'pending') {
                            return (
                              sum +
                              (i.paymentType === 'partial'
                                ? i.pendingAmount || 0
                                : i.purchaseAmount || 0)
                            )
                          }
                          return sum
                        }, 0)
                        const totalPaid = items.reduce((sum, i) => sum + (i.paidAmount || 0), 0)
                        const statusCounts = items.reduce((acc, i) => {
                          acc[i.statusOfTransaction] = (acc[i.statusOfTransaction] || 0) + 1
                          return acc
                        }, {})
                        const status =
                          Object.keys(statusCounts).length === 1
                            ? Object.keys(statusCounts)[0]
                            : 'mixed'

                        return (
                          <>
                            {/* Group Header Row */}
                            <tr
                              key={`header-${billNo}`}
                              className="bg-gray-50 hover:bg-gray-100 cursor-pointer transition-colors"
                              onClick={() => toggleGroup(billNo)}
                            >
                              <td className="px-4 py-3 font-medium">{date}</td>
                              <td className="px-4 py-3">
                                <div className="flex items-center gap-3 px-6">
                                  <div className="relative group">
                                    <div className="w-10 h-10 bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-100 border border-indigo-200 rounded-xl flex items-center justify-center text-indigo-700 text-sm font-semibold shadow-sm transition-all duration-300 group-hover:scale-110 group-hover:shadow-md group-hover:border-indigo-300">
                                      {getInitials(clientName)}
                                    </div>
                                    <div className="absolute inset-0 bg-gradient-to-br from-blue-100 to-purple-100 rounded-xl blur opacity-0 group-hover:opacity-40 transition-opacity duration-300"></div>
                                  </div>
                                  <span className="font-medium text-gray-700">
                                    {clientName.toUpperCase()}
                                  </span>
                                </div>
                              </td>
                              <td className="px-4 py-3 tracking-wide font-medium">
                                <span className="inline-flex items-center justify-center min-w-[3rem] bg-gradient-to-r from-slate-100 to-gray-100 border border-gray-200 px-3 py-1.5 rounded-full text-sm font-semibold text-gray-700 shadow-sm">
                                  Multiple Products ({items.length})
                                </span>
                              </td>
                              <td className="px-4 py-3">
                                <span className="inline-flex items-center justify-center min-w-[3rem] bg-gradient-to-r from-slate-100 to-gray-100 border border-gray-200 px-3 py-1.5 rounded-full text-sm font-semibold text-gray-700 shadow-sm">
                                  {totalQty}
                                </span>
                              </td>
                              <td className="px-4 py-3 font-semibold">
                                <div className="inline-flex items-center justify-center gap-1 bg-gradient-to-r from-slate-50 to-gray-100 text-gray-700 border border-gray-300 w-full py-1.5 rounded-full text-sm font-semibold shadow-sm hover:shadow-md transition-all duration-300">
                                  ₹ {toThousands(totalAmount?.toFixed(0))}
                                </div>
                              </td>
                              <td className="px-4 py-3">
                                {totalPending > 0 ? (
                                  <Whisper
                                    trigger="hover"
                                    placement="rightStart"
                                    speaker={<Tooltip>{toThousands(totalPending)}</Tooltip>}
                                  >
                                    <span>₹ {toThousands(Number(totalPending)?.toFixed(0))}</span>
                                  </Whisper>
                                ) : (
                                  '-'
                                )}
                              </td>
                              <td className="px-4 py-3">
                                {totalPaid > 0 ? (
                                  <CreditScoreIcon className="text-green-600" />
                                ) : (
                                  '-'
                                )}
                              </td>
                              <td className="px-4 py-3 tracking-wide">
                                <span
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    if (status !== 'mixed') {
                                      handleToggleGroupStatus(items, status)
                                    } else {
                                      toast.info('Mixed status: Update items individually')
                                    }
                                  }}
                                  className={`cursor-pointer ${status === 'mixed' ? 'cursor-not-allowed' : ''}`}
                                >
                                  {getPaymentStatusComponent({
                                    statusOfTransaction: status,
                                    paymentType: firstItem?.paymentType
                                  })}
                                </span>
                              </td>
                              <td className="w-28 px-4 py-3 text-center">
                                <div className="flex gap-2 justify-center items-center">
                                  {/* Expand/Collapse Icon Only */}
                                  <ChevronDown
                                    size={20}
                                    className={`transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`}
                                    onClick={(e) => {
                                      e.stopPropagation()
                                      toggleGroup(billNo)
                                    }}
                                  />
                                </div>
                              </td>
                            </tr>
                            {/* Sub Rows */}
                            {isExpanded &&
                              items.map((item, idx) => (
                                <TransactionRow
                                  key={`${billNo}-sub-${item.id || idx}`}
                                  transaction={item}
                                  index={idx}
                                  clients={clients}
                                  products={products}
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
                                  onUpdateStatus={handleUpdatePaymentStatus}
                                  isSubRow={true}
                                />
                              ))}
                          </>
                        )
                      }
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {/* Modal */}
      {/* {showModal && (
        <TransactionModal
          setShowModal={setShowModal}
          existingTransaction={selectedTransaction}
          isUpdateExpense={isUpdateExpense}
          type="transaction"
        />
      )} */}
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
