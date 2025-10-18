/* eslint-disable prettier/prettier */
/* eslint-disable react/no-unknown-property */
/* eslint-disable no-unused-vars */
/* eslint-disable react/display-name */
/* eslint-disable react/prop-types */
import { memo, useCallback, useEffect, useMemo, useState, useRef, forwardRef } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { clientApi } from '../../API/Api'
import { setClients } from '../../app/features/electronSlice'
import { toast } from 'react-toastify'
import { Tooltip, Whisper } from 'rsuite'
import {
  TrendingUp,
  TrendingDown,
  Calendar,
  Building2,
  FileText,
  DollarSign,
  CreditCard,
  Banknote,
  BarChart3,
  Printer
} from 'lucide-react'
import { IoLogoWhatsapp } from 'react-icons/io5'

// Constants
const TABLE_HEADERS = [
  { key: 'date', label: 'Date', width: 'w-[170px]', icon: Calendar },
  { key: 'bank', label: 'Bank', width: 'w-[200px]', icon: Building2 },
  { key: 'accountName', label: 'Account Name', width: 'w-[250px]', icon: CreditCard },
  { key: 'debit', label: 'Debit', width: 'w-[200px]', icon: TrendingDown },
  { key: 'credit', label: 'Credit', width: 'w-[200px]', icon: TrendingUp },
  { key: 'balance', label: 'Balance', width: 'w-[200px]', icon: BarChart3 },
  { key: 'description', label: 'Description', width: 'w-[350px]', icon: FileText },
  { key: 'statusOfTransaction', label: 'Status', width: 'w-[200px]', icon: BarChart3 }
]

const TABLE_HEADERS_PRINT = [
  { key: 'date', label: 'Date' },
  { key: 'accountName', label: 'Account Name' },
  { key: 'debit', label: 'Debit' },
  { key: 'credit', label: 'Credit' },
  { key: 'balance', label: 'Balance' }
]

const LEDGER_TYPES = [
  { label: 'Bank', value: 'Bank', icon: Building2, color: 'blue' },
  { label: 'Cash', value: 'Cash', icon: Banknote, color: 'green' }
]

// Utility functions
const toThousands = (value) => {
  if (!value || isNaN(value)) return '₹0'
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR'
  }).format(value)
}

const getAmount = (type, amount) => {
  if (!amount) return 0
  return type === 'Receipt' ? Number(amount) : -Number(amount)
}

// Memoized Transaction Row Component
const TransactionRow = memo(({ receipt, index, balance, clientName }) => {
  const isReceipt = receipt.type === 'Receipt'
  const isEven = index % 2 === 0

  console.log('receipt', receipt)

  return (
    <tr
      className={`transition-all duration-200 hover:shadow-md transform hover:scale-[1.001]
        ${isEven ? 'border-l-4' : 'border-l-4'}
        ${isReceipt ? 'border-l-emerald-400' : 'border-l-red-400'}
      `}
      style={{ animationDelay: `${index * 50}ms` }}
    >
      <td className="px-6 py-4">
        <div className="flex items-center gap-2">
          <div className={`p-1 rounded-full ${isReceipt ? 'bg-emerald-200' : 'bg-red-200'}`}>
            <Calendar size={14} className={isReceipt ? 'text-emerald-600' : 'text-red-600'} />
          </div>
          <span className="font-medium text-gray-700">
            {new Date(receipt.date).toLocaleDateString()}
          </span>
        </div>
      </td>

      <td className="px-6 py-4 no-print">
        <div className="flex items-center gap-2">
          <div className="p-1 rounded-full bg-blue-200">
            <Building2 size={14} className="text-blue-600" />
          </div>
          <span className="font-medium text-gray-700">{receipt.bank}</span>
        </div>
      </td>

      <td className="px-6 py-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-gradient-to-br from-blue-400 to-indigo-500 rounded-full flex items-center justify-center text-white text-xs font-bold">
            {receipt.clientName
              .split(' ')
              .map((n) => n[0])
              .join('')
              .toUpperCase()}
          </div>
          <span className="font-medium text-gray-800 tracking-wide">{receipt.clientName}</span>
        </div>
      </td>

      <td className="px-6 py-4">
        {receipt.type === 'Payment' ? (
          <div className="flex items-center gap-2">
            <div className="p-1 rounded-full bg-red-200">
              <TrendingDown size={14} className="text-red-600" />
            </div>
            <span className="font-semibold text-red-600 px-3 py-1 rounded-full">
              {toThousands(receipt.amount)}
            </span>
          </div>
        ) : (
          <span className="text-gray-400 italic">-</span>
        )}
      </td>

      <td className="px-6 py-4">
        {receipt.type === 'Receipt' ? (
          <div className="flex items-center gap-2">
            <div className="p-1 rounded-full bg-emerald-200">
              <TrendingUp size={14} className="text-emerald-600" />
            </div>
            <span className="font-semibold text-emerald-600 px-3 py-1 rounded-full">
              {toThousands(receipt.amount)}
            </span>
          </div>
        ) : (
          <span className="text-gray-400 italic">-</span>
        )}
      </td>

      <td className="px-6 py-4">
        <div className="flex items-center gap-2">
          <span
            className={`font-semibold text-[16px] ${isReceipt ? 'text-emerald-600' : 'text-red-600'}`}
          >
            {toThousands(balance)}
          </span>
        </div>
      </td>

      <td className="px-6 py-4 max-w-[350px] no-print">
        <Whisper
          trigger="hover"
          placement="leftStart"
          speaker={
            <Tooltip>
              <div className="max-w-xs">
                <p className="text-sm">{receipt.description || 'No description provided'}</p>
              </div>
            </Tooltip>
          }
        >
          <div className="flex items-center gap-2 cursor-pointer">
            <FileText size={14} className="text-gray-400 flex-shrink-0" />
            <span className="truncate text-gray-600">
              {receipt.description || 'No description provided'}
            </span>
          </div>
        </Whisper>
      </td>

      <td className="px-6 py-3">
        <span
          className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-semibold shadow-sm ${
            receipt.statusOfTransaction === 'pending'
              ? 'bg-orange-50 text-orange-300 ring-1 ring-orange-200'
              : 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200'
          }`}
        >
          <span
            className={`h-2 w-2 rounded-full ${
              receipt.statusOfTransaction === 'pending' ? 'bg-orange-300' : 'bg-emerald-500'
            }`}
          ></span>
          {String(receipt.statusOfTransaction).charAt(0).toUpperCase() +
            String(receipt.statusOfTransaction).slice(1)}
        </span>
      </td>
    </tr>
  )
})

// Custom hook for account operations
const useAccountOperations = () => {
  const dispatch = useDispatch()

  const fetchAllClients = useCallback(async () => {
    try {
      const response = await clientApi.getAllClients()
      dispatch(setClients(response))
    } catch (error) {
      console.error('Error fetching clients:', error)
      toast.error('Failed to fetch accounts')
    }
  }, [dispatch])

  const fetchRecentBankReceipts = useCallback(async () => {
    try {
      const receipts = await window.api.getRecentBankReceipts()
      return receipts.map((r) => ({
        ...r,
        clientName: r.party,
        date: r.date || r.createdAt
      }))
    } catch (error) {
      console.error('Error fetching bank receipts:', error)
      toast.error('Failed to fetch bank receipts')
      return []
    }
  }, [])

  const fetchRecentCashReceipts = useCallback(async () => {
    try {
      const receipts = await window.api.getRecentCashReceipts()
      return receipts.map((r) => ({
        ...r,
        clientName: r.party,
        date: r.date || r.createdAt
      }))
    } catch (error) {
      console.error('Error fetching cash receipts:', error)
      toast.error('Failed to fetch cash receipts')
      return []
    }
  }, [])

  return { fetchAllClients, fetchRecentBankReceipts, fetchRecentCashReceipts }
}

// Main Component
const AccountLedger = forwardRef(({ client, onClose }, ref) => {
  const { fetchAllClients, fetchRecentBankReceipts, fetchRecentCashReceipts } =
    useAccountOperations()

  // State management
  const [selectedType, setSelectedType] = useState('Bank')
  const [showLoader, setShowLoader] = useState(false)
  const [recentBankReceipts, setRecentBankReceipts] = useState([])
  const [recentCashReceipts, setRecentCashReceipts] = useState([])

  const clients = useSelector((state) => state.electron.clients.data || [])

  // Get client name helper
  const getClientName = useCallback(
    (id) => {
      const foundClient = clients.find((c) => c?.id === Number(id))
      return foundClient ? foundClient.clientName : 'Unknown Client'
    },
    [clients]
  )

  // Memoized filtered data
  const filteredData = useMemo(() => {
    const sourceData = selectedType === 'Bank' ? recentBankReceipts : recentCashReceipts

    if (client?.id) {
      return sourceData.filter((r) => r.clientName === getClientName(client.id))
    }

    return sourceData
  }, [selectedType, recentBankReceipts, recentCashReceipts, client, getClientName])

  // Memoized running balance calculation
  const balances = useMemo(() => {
    const receipts = [...filteredData].reverse()
    let balance = 0
    const calculatedBalances = []

    receipts.forEach((receipt, idx) => {
      const amount = getAmount(receipt.type, receipt.amount)
      balance += amount
      calculatedBalances[receipts.length - 1 - idx] = balance
    })

    return calculatedBalances
  }, [filteredData])

  // Memoized statistics
  const statistics = useMemo(() => {
    const totalReceipts = filteredData
      .filter((r) => r.type === 'Receipt')
      .reduce((sum, r) => sum + (Number(r.amount) || 0), 0)

    const totalPayments = filteredData
      .filter((r) => r.type === 'Payment')
      .reduce((sum, r) => sum + (Number(r.amount) || 0), 0)

    const netBalance = totalReceipts - totalPayments
    const transactionCount = filteredData.length

    return { totalReceipts, totalPayments, netBalance, transactionCount }
  }, [filteredData])

  // Event handlers
  const handleTypeChange = useCallback((type) => {
    setSelectedType(type)
  }, [])

  // Utility function to generate dynamic print HTML
  const generatePrintHTML = (data, headers, title) => {
    const getCellValue = (row, headerKey) => {
      switch (headerKey) {
        case 'date':
          return new Date(row.date).toLocaleDateString('en-IN')
        case 'accountName':
          return row.accountName || ''
        case 'debit':
          return row.debit || ''
        case 'credit':
          return row.credit || ''
        case 'balance':
          return toThousands(row.balance || 0)
        default:
          return ''
      }
    }

    const tableHeaders = headers.map((h) => `<th class="border px-4 py-2">${h.label}</th>`).join('')
    const tableRows = data
      .map((row) => {
        const cells = headers
          .map((h) => `<td class="border px-4 py-2 text-left">${getCellValue(row, h.key)}</td>`)
          .join('')
        return `<tr>${cells}</tr>`
      })
      .join('')

    return `
      <!DOCTYPE html>
  <html>
    <head>
      <title>${title}</title>
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

  // Updated handler for printing PDF using iframe to avoid popup blockers
  const handlePrintPDF = useCallback(() => {
    let printHeaders = TABLE_HEADERS_PRINT
    let printData = filteredData.map((row, index) => ({
      ...row,
      accountName: row.clientName || '',
      date: row.date,
      debit: row.type === 'Payment' ? toThousands(Number(row.amount) || 0) : '-',
      credit: row.type === 'Receipt' ? toThousands(Number(row.amount) || 0) : '-',
      balance: balances[index] || 0
    }))

    const title = `Account Ledger Report - ${client?.clientName || 'All Accounts'} (${selectedType})`

    const printHTML = generatePrintHTML(printData, printHeaders, title)

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
  }, [filteredData, balances, client, selectedType])

  // Data fetching
  const loadData = useCallback(async () => {
    setShowLoader(true)
    try {
      await fetchAllClients()
      const [bankData, cashData] = await Promise.all([
        fetchRecentBankReceipts(),
        fetchRecentCashReceipts()
      ])
      setRecentBankReceipts(bankData)
      setRecentCashReceipts(cashData)
    } finally {
      setShowLoader(false)
    }
  }, [fetchAllClients, fetchRecentBankReceipts, fetchRecentCashReceipts])

  // Effects
  useEffect(() => {
    loadData()
  }, [loadData])

  return (
    <div className="space-y-6 mx-7 -mt-4">
      {/* Client Header */}
      <div className="flex items-center justify-between gap-5">
        {/* Type Selector */}
        <div className="flex items-center gap-2">
          {LEDGER_TYPES.map((type) => {
            const Icon = type.icon
            return (
              <button
                key={type.value}
                onClick={() => handleTypeChange(type.value)}
                className={`flex items-center gap-2 px-4 py-1.5 rounded-xl font-medium transition-all duration-200 transform hover:scale-105
                ${
                  selectedType === type.value
                    ? `bg-gradient-to-r from-${type.color}-500 to-${type.color}-600 text-white shadow-lg`
                    : `bg-white border border-${type.color}-200 text-${type.color}-600 hover:bg-${type.color}-50`
                }
              `}
              >
                <Icon size={18} />
                {type.label}
              </button>
            )
          })}
        </div>

        {/* Print Button */}
        <button
          className="text-black flex items-center cursor-pointer gap-1 border border-gray-300 w-fit p-1 px-3 rounded-sm hover:bg-black hover:text-white transition-all duration-300 hover:scale-105"
          onClick={handlePrintPDF}
          title="Print Sales Report"
        >
          <Printer size={16} />
          <span className="text-sm">Print</span>
        </button>
      </div>

      {/* Statistics Cards */}
      <div className="border border-gray-200 shadow-lg px-2 py-5 rounded-2xl my-4 flex overflow-x-auto bg-gradient-to-r from-white to-gray-50 no-print">
        <div className=" border-r w-52 flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg">
              <FileText size={20} className="text-blue-600" />
            </div>
            <div>
              <p className="text-gray-600 text-sm">Transactions</p>
              <p className="text-xl font-bold text-gray-800">{statistics.transactionCount}</p>
            </div>
          </div>
        </div>
        <div className="mx-4 border-r w-52 flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg">
              <TrendingUp size={20} className="text-emerald-600" />
            </div>
            <div>
              <p className="text-gray-600 text-sm">Total Credits</p>
              <p className="text-xl font-light">{toThousands(statistics.totalReceipts)}</p>
            </div>
          </div>
        </div>
        <div className=" border-r w-52 flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg">
              <TrendingDown size={20} className="text-red-600" />
            </div>
            <div>
              <p className="text-gray-600 text-sm">Total Debits</p>
              <p className="text-xl font-light">{toThousands(statistics.totalPayments)}</p>
            </div>
          </div>
        </div>
        <div className="mx-4 w-52 flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg`}>
              <DollarSign
                size={20}
                className={statistics.netBalance >= 0 ? 'text-emerald-600' : 'text-red-600'}
              />
            </div>
            <div>
              <p className="text-gray-600 text-sm">Net Balance</p>
              <p
                className={`text-xl font-light ${statistics.netBalance >= 0 ? 'text-emerald-600' : 'text-red-600'}`}
              >
                {toThousands(statistics.netBalance)}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Transaction Table */}
      <div className="bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-200 print-area">
        <div className="overflow-x-auto customScrollbar max-h-[600px] relative">
          <table className="min-w-max border-collapse text-sm w-full">
            <thead className="bg-gradient-to-r from-gray-100 to-gray-200 sticky top-0 z-10">
              <tr className="text-gray-700">
                {TABLE_HEADERS.map((header) => {
                  const Icon = header.icon
                  return (
                    <th
                      key={header.key}
                      className={`px-6 py-4 border-r border-gray-200 ${header.width} font-semibold text-left`}
                    >
                      <div className="flex items-center gap-2">
                        <Icon size={16} className="text-gray-500" />
                        {header.label}
                      </div>
                    </th>
                  )
                })}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredData.length === 0 ? (
                <tr className="h-96">
                  <td colSpan={TABLE_HEADERS.length} className="text-center">
                    <div className="flex flex-col items-center gap-4 py-12">
                      <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center">
                        <FileText size={32} className="text-gray-400" />
                      </div>
                      <div className="text-center">
                        <p className="text-xl font-medium text-gray-500">No transactions found</p>
                        <p className="text-gray-400 mt-1">
                          No {selectedType.toLowerCase()} transactions available for this account
                        </p>
                      </div>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredData.map((receipt, index) => (
                  <TransactionRow
                    key={`${receipt.id || receipt.transactionId}-${index}`}
                    receipt={receipt}
                    index={index}
                    balance={balances[index]}
                    clientName={getClientName(receipt.clientId)}
                  />
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showLoader && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 shadow-2xl">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading transactions...</p>
          </div>
        </div>
      )}

      {/* Custom CSS for animations */}
      <style jsx>{`
        @keyframes slideInUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .animate-slideInUp {
          animation: slideInUp 0.3s ease-out forwards;
        }

        tbody tr {
          animation: slideInUp 0.3s ease-out forwards;
          opacity: 0;
        }

        tbody tr:nth-child(1) {
          animation-delay: 0ms;
        }
        tbody tr:nth-child(2) {
          animation-delay: 50ms;
        }
        tbody tr:nth-child(3) {
          animation-delay: 100ms;
        }
        tbody tr:nth-child(4) {
          animation-delay: 150ms;
        }
        tbody tr:nth-child(5) {
          animation-delay: 200ms;
        }
      `}</style>
    </div>
  )
})

export default AccountLedger
