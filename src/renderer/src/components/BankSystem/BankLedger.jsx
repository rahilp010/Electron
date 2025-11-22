/* eslint-disable prettier/prettier */
/* eslint-disable react/no-unknown-property */
/* eslint-disable no-unused-vars */
/* eslint-disable react/display-name */
/* eslint-disable react/prop-types */
import React, { memo, useCallback, useEffect, useMemo, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { toast } from 'react-toastify'
import { Tooltip, Whisper, Input } from 'rsuite'
import {
  ClockArrowDown,
  Calendar,
  Building2,
  FileText,
  CreditCard,
  Banknote,
  Search,
  Users,
  Printer,
  BarChart3
} from 'lucide-react'
import { clientApi, transactionApi } from '../../API/Api'
import { setClients, setTransactions } from '../../app/features/electronSlice'
import Navbar from '../../components/UI/Navbar'
import { IoLogoWhatsapp } from 'react-icons/io5'

// Constants
const TABLE_HEADERS = [
  { key: 'date', label: 'Date', width: 'w-[150px]', icon: Calendar },
  { key: 'debit', label: 'Debit', width: 'w-[150px]', icon: ClockArrowDown },
  { key: 'credit', label: 'Credit', width: 'w-[150px]', icon: CreditCard },
  { key: 'balance', label: 'Balance', width: 'w-[150px]', icon: BarChart3 },
  { key: 'description', label: 'Description', width: 'w-[350px]', icon: FileText }
]

const TABLE_HEADERS_PRINT = [
  { key: 'date', label: 'Date' },
  { key: 'accountName', label: 'Account Name' },
  { key: 'credit', label: 'Pending Amount' }
]

const LEDGER_TYPES = [
  { label: 'Bank', value: 'Bank', icon: Building2, color: 'blue' },
  { label: 'Cash', value: 'Cash', icon: Banknote, color: 'blue' }
]

// Utility functions
const toThousands = (value) => {
  if (value === null || value === undefined || isNaN(Number(value))) return '₹0'
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR'
  }).format(Number(value))
}

const getAmount = (type, amount) => {
  if (!amount) return 0
  return type === 'Receipt'
    ? Number(amount) // Receipt = credit = add
    : -Number(amount) // Payment = debit = subtract
}

const getInitials = (name) => {
  if (!name) return '??'
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
}

// Memoized Transaction Row Component
const TransactionRow = memo(({ receipt, index, selectedType, bankAccount, balance }) => {
  const isEven = index % 2 === 0
  const LedgerIcon = selectedType === 'Bank' ? Building2 : Banknote

  const getClientName = (clientId, bankAccount) => {
    if (!clientId) return 'Unknown Client'
    const id = typeof clientId === 'object' ? clientId.id : clientId
    const client = bankAccount.find((c) => String(c?.id) === String(id))
    return client ? client.accountName : 'Unknown Client'
  }

  const isDebit = receipt.type === 'Payment'
  const isCredit = receipt.type === 'Receipt'
  const isOpening = receipt.type === 'Opening'

  return (
    <tr
      className={`transition-all duration-200 hover:shadow-md transform hover:scale-[1.001]
        ${isEven ? 'border-l-4' : 'border-l-4'} border-l-red-400
      `}
      style={{ animationDelay: `${index * 50}ms` }}
    >
      {/* Date */}
      <td className="px-6 py-4">
        <div className="flex items-center gap-2">
          <div className="p-1 rounded-full bg-red-200">
            <Calendar size={14} className="text-red-600" />
          </div>
          <span className="font-medium text-gray-700">
            {receipt.date ? new Date(receipt.date).toLocaleDateString() : ''}
          </span>
        </div>
      </td>

      {/* Debit (Payment) */}
      <td className="px-6 py-4">
        <div className="flex items-center gap-2">
          {isDebit ? (
            <>
              <div className="p-1 rounded-full bg-red-200">
                <ClockArrowDown size={14} className="text-red-600" />
              </div>
              <span className="font-semibold text-red-600 px-3 py-1 rounded-full">
                {toThousands(receipt.amount)}
              </span>
            </>
          ) : (
            <span className="text-gray-400 text-xs">—</span>
          )}
        </div>
      </td>

      {/* Credit (Receipt) */}
      <td className="px-6 py-4">
        <div className="flex items-center gap-2">
          {isCredit ? (
            <>
              <div className="p-1 rounded-full bg-green-200">
                <CreditCard size={14} className="text-green-700" />
              </div>
              <span className="font-semibold text-green-600 px-3 py-1 rounded-full">
                {toThousands(receipt.amount)}
              </span>
            </>
          ) : (
            <span className="text-gray-400 text-xs">—</span>
          )}
        </div>
      </td>

      {/* Balance */}
      <td className="px-6 py-4">
        <span className="font-semibold text-[16px] text-blue-600">{toThousands(balance)}</span>
      </td>

      {/* Description */}
      <td className="px-6 py-4 max-w-[350px] no-print">
        <Whisper
          trigger="hover"
          placement="leftStart"
          speaker={
            <Tooltip>
              <div className="max-w-xs">
                <p className="text-sm">
                  {receipt.description ||
                    (isOpening ? 'Opening Balance' : 'No description provided')}
                </p>
              </div>
            </Tooltip>
          }
        >
          <div className="flex items-center gap-2 cursor-pointer">
            <FileText size={14} className="text-gray-400 flex-shrink-0" />
            {isOpening ? (
              <span className="truncate text-gray-800 font-bold">Opening Balance</span>
            ) : (
              <span className="truncate text-gray-600">
                {receipt.description || 'No description provided'}
              </span>
            )}
          </div>
        </Whisper>
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

  const fetchAllTransactions = useCallback(async () => {
    try {
      const response = await transactionApi.getAllTransactions()
      dispatch(setTransactions(response))
    } catch (error) {
      console.error('Error fetching transactions:', error)
      toast.error('Failed to fetch transactions')
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

  return { fetchAllClients, fetchAllTransactions, fetchRecentBankReceipts, fetchRecentCashReceipts }
}

// Main Component
const BankLedger = ({ client, onClose }) => {
  const {
    fetchAllClients,
    fetchAllTransactions,
    fetchRecentBankReceipts,
    fetchRecentCashReceipts
  } = useAccountOperations()

  // State management
  const [selectedType, setSelectedType] = useState('Bank')
  const [showLoader, setShowLoader] = useState(false)
  const [recentBankReceipts, setRecentBankReceipts] = useState([])
  const [recentCashReceipts, setRecentCashReceipts] = useState([])
  const [showSideBar, setShowSideBar] = useState(false)
  const [sidebarSearch, setSidebarSearch] = useState('')
  const [selectedClient, setSelectedClient] = useState(client || null)

  const clients = useSelector((state) => state.electron.clients?.data || [])
  const bankAccount = useSelector((state) => state.electron.account?.data || [])
  const transaction = useSelector((state) => state.electron.transaction?.data || [])

  // Get client name helper
  const getClientName = useCallback(
    (id) => {
      const foundClient = clients.find((c) => c?.id === Number(id))
      return foundClient ? foundClient.clientName : 'Unknown Client'
    },
    [clients]
  )

  // Memoized table headers
  const tableHeaders = useMemo(
    () =>
      TABLE_HEADERS.map((header) =>
        header.key === 'bank'
          ? { ...header, label: selectedType, icon: selectedType === 'Bank' ? Building2 : Banknote }
          : header
      ),
    [selectedType]
  )

  // Memoized filtered sidebar clients
  const filteredSidebarAccounts = useMemo(() => {
    if (!sidebarSearch) return bankAccount
    const query = sidebarSearch.toLowerCase()
    return bankAccount.filter((account) => account.accountName?.toLowerCase().includes(query))
  }, [bankAccount, sidebarSearch])

  // Add opening balance row at top of ledger and then the filtered pending receipts
  // FILTER ONLY REAL RECEIPTS — NO OPENING ROW
  const filteredData = useMemo(() => {
    const allReceipts = [...recentBankReceipts, ...recentCashReceipts]

    console.log('allReceipts', allReceipts)

    // const receipts = allReceipts.filter((r) => r.statusOfTransaction === 'pending')
    if (!selectedClient?.id) return []
    const account = bankAccount.find((a) => a.id === selectedClient.id)
    if (!account) return []

    const accountName = account.accountName?.toLowerCase().trim()

    // normal receipt filtering
    const actualReceipts = allReceipts
      .filter((r) => {
        const sendTo = (r?.sendTo || '').toLowerCase().trim()

        return sendTo.includes(accountName)
      })
      .sort((a, b) => new Date(b.date) - new Date(a.date))

    return actualReceipts
  }, [recentBankReceipts, recentCashReceipts, selectedClient, bankAccount])

  // Running balance calculation: opening balance sets starting balance, then apply entries in order
  const balances = useMemo(() => {
    const receipts = [...filteredData].reverse()
    let balance = Number(selectedClient?.openingBalance || 0)
    const output = []

    receipts.forEach((receipt, idx) => {
      balance += getAmount(receipt.type, receipt.amount)
      output[receipts.length - 1 - idx] = balance
    })

    return output
  }, [filteredData, selectedClient])

  // Memoized statistics
  const statistics = useMemo(() => {
    const totalPending = filteredData.reduce((sum, r) => sum + (Number(r.amount) || 0), 0)
    const transactionCount = Math.max(
      0,
      filteredData.length - (filteredData[0]?.type === 'Opening' ? 1 : 0)
    )

    return { totalPending, transactionCount }
  }, [filteredData])

  // Event handlers
  const handleTypeChange = useCallback((type) => {
    setSelectedType(type)
  }, [])

  const handleSidebarSearchChange = useCallback((value) => {
    setSidebarSearch(value)
  }, [])

  const handleClientSelect = useCallback((client) => {
    setSelectedClient(client)
    setSidebarSearch('')
    setShowSideBar(false)
  }, [])

  // Data fetching
  const loadData = useCallback(async () => {
    setShowLoader(true)
    try {
      await fetchAllClients()
      await fetchAllTransactions()
      const [bankData, cashData] = await Promise.all([
        fetchRecentBankReceipts(),
        fetchRecentCashReceipts()
      ])
      setRecentBankReceipts(bankData)
      setRecentCashReceipts(cashData)
    } finally {
      setShowLoader(false)
    }
  }, [fetchAllClients, fetchAllTransactions, fetchRecentBankReceipts, fetchRecentCashReceipts])

  // Utility function to generate dynamic print HTML
  const generatePrintHTML = (data, headers, title, totalPending) => {
    const getCellValue = (row, headerKey) => {
      switch (headerKey) {
        case 'date':
          return new Date(row.date).toLocaleDateString('en-IN')
        case 'accountName':
          return row.accountName || ''
        case 'credit':
          return row.credit || ''
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

    const totalsRow = `
        <tr class="totals-row">
          <td colspan="2" class="border px-4 py-2 font-bold text-right">Total Pending Amount:</td>
          <td class="border px-4 py-2 font-bold text-right">${toThousands(totalPending)}</td>
        </tr>
      `

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
            ${totalsRow}
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
    // Aggregate by accountName if no specific client selected
    let printData = []
    let totalPending = 0

    if (!selectedClient) {
      // Group by clientName and sum
      const grouped = filteredData.reduce((acc, row) => {
        const name = row.clientName
        if (!acc[name]) {
          acc[name] = { accountName: name, credit: 0, date: '' }
        }
        acc[name].credit += Number(row.amount) || 0
        return acc
      }, {})

      printData = Object.values(grouped).map((item) => ({
        ...item,
        credit: toThousands(item.credit),
        date: ''
      }))
    } else {
      // Single client: just one row with sum
      const clientSum = filteredData.reduce((sum, row) => sum + (Number(row.amount) || 0), 0)
      printData = [
        {
          accountName: selectedClient.clientName || '',
          credit: toThousands(clientSum),
          date: ''
        }
      ]
    }

    totalPending = filteredData.reduce((sum, row) => sum + (Number(row.amount) || 0), 0)

    const title = `Pending Payment Report <br> ${selectedClient?.clientName || 'All Accounts'} (${selectedType})`

    const printHTML = generatePrintHTML(printData, TABLE_HEADERS_PRINT, title, totalPending)

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
  }, [filteredData, selectedClient, selectedType])

  // Effects
  useEffect(() => {
    loadData()
  }, [loadData])

  // useEffect(() => {
  //   if (!selectedClient && bankAccount.length > 0) {
  //     setSelectedClient(bankAccount[0]) // auto select first client
  //   }
  // }, [bankAccount, selectedClient])

  return (
    <div className="select-none gap-10 h-screen overflow-x-auto min-w-[720px] overflow-auto customScrollbar relative">
      <div className="w-full sticky top-0 z-10">
        <Navbar />
      </div>
      {/* Sidebar */}
      <div
        className={`fixed left-0 top-0 h-screen z-40 shadow-2xl transition-all duration-500 ease-out overflow-hidden
          ${showSideBar ? 'w-72' : 'w-4'}`}
        style={{ backdropFilter: 'blur(10px)' }}
      >
        {/* Sidebar Toggle Button */}
        <div
          className="absolute right-0 top-1/2 transform -translate-y-1/2 bg-gray-500 text-white text-xs px-1 py-10 rounded-r cursor-pointer hover:bg-gray-600 font-extrabold z-50"
          onClick={() => setShowSideBar(!showSideBar)}
          aria-label={showSideBar ? 'Collapse sidebar' : 'Expand sidebar'}
          role="button"
        >
          {showSideBar ? '<' : '>'}
        </div>

        {/* Sidebar Content */}
        <div
          className={`h-full flex flex-col transition-all duration-500 ease-out
            ${showSideBar ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-4'}`}
        >
          {/* Header */}
          <div className="p-6 border-b border-blue-200 bg-gradient-to-r from-blue-500 to-indigo-600">
            <div className="flex items-center gap-3 text-white">
              <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
                <Users size={20} />
              </div>
              <div>
                <h3 className="font-semibold text-lg">Bank Accounts</h3>
                <p className="text-blue-100 text-sm">{bankAccount.length} total accounts</p>
              </div>
            </div>
          </div>

          {/* Search Bar */}
          <div className="p-4">
            <div className="relative">
              <Input
                type="text"
                placeholder="Search clients..."
                value={sidebarSearch}
                onChange={(value) => handleSidebarSearchChange(value)}
                className="w-full pl-8 pr-4 py-2 focus:outline-none text-sm shadow-2xl"
                aria-label="Search clients"
              />
              <Search size={16} className="absolute right-3 top-2.5 text-gray-400" />
            </div>
          </div>

          {/* Client List */}
          <div className="flex-1 overflow-y-auto customScrollbar p-2">
            <div className="space-y-1">
              {filteredSidebarAccounts.map((account, index) => (
                <div
                  key={account?.id}
                  className={`group relative p-3 rounded-lg cursor-pointer transition-all duration-200 mx-2
                    ${
                      selectedClient?.id === account?.id
                        ? 'bg-gray-200 shadow-md transform scale-[1.02]'
                        : 'hover:bg-white/60 hover:shadow-sm'
                    }
                    animate-fadeInUp`}
                  style={{
                    animationDelay: `${index * 50}ms`
                  }}
                  onClick={() => handleClientSelect(account)}
                  role="button"
                  aria-label={`Select account ${account?.accountName}`}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-10 h-10 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-200
                        ${
                          selectedClient?.id === account?.id
                            ? 'bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-100 border border-indigo-200 rounded-xl flex items-center justify-center text-indigo-700 text-sm font-semibold shadow-sm transition-all duration-300 group-hover:scale-110 group-hover:shadow-md group-hover:border-indigo-300'
                            : 'bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-100 border border-indigo-200 rounded-xl flex items-center justify-center text-indigo-700 text-sm font-semibold shadow-sm transition-all duration-300 group-hover:scale-110 group-hover:shadow-md group-hover:border-indigo-300'
                        }`}
                    >
                      {getInitials(account?.accountName)}
                    </div>

                    <div className="flex-1 min-w-0">
                      <p
                        className={`font-medium truncate text-sm
                          ${selectedClient?.id === account?.id ? 'text-black' : 'text-gray-800'}`}
                      >
                        {account?.accountName}
                      </p>
                      <p
                        className={`text-xs truncate
                          ${selectedClient?.id === account?.id ? 'text-gray-500' : 'text-gray-500'}`}
                      >
                        {/* {client.accountType || 'Other'} • {toThousands(client.pendingFromOurs || 0)} */}
                      </p>
                    </div>
                  </div>

                  {/* Enhanced selection indicator */}
                  {selectedClient?.id === account?.id && (
                    <div className="absolute right-4 top-1/2 transform -translate-y-1/2">
                      <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                    </div>
                  )}
                </div>
              ))}
            </div>

            {filteredSidebarAccounts.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                <Users size={32} className="mx-auto mb-2 opacity-50" />
                <p className="text-sm">No Accounts found</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div
        className={`transition-all duration-500 ease-out space-y-6 mx-7 -mt-4
          ${showSideBar ? 'ml-76' : 'ml-6'}`}
      >
        {/* Client Header */}
        <div className="flex items-center justify-between mt-10">
          <div className="flex justify-between items-center gap-2">
            <div className="flex items-center gap-4 mx-1">
              <p className="text-3xl font-light">Account Ledger</p>
            </div>
            {selectedClient && (
              <div className="bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-100 border border-indigo-200 rounded-full flex items-center justify-center text-indigo-700 text-sm font-semibold shadow-sm transition-all duration-300 group-hover:scale-110 group-hover:shadow-md group-hover:border-indigo-300 px-4 py-2 ">
                <span className="font-semibold text-sm">{selectedClient?.accountName}</span>
              </div>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              className="flex items-center gap-2 px-4 py-1.5 rounded-xl font-medium 
               bg-white border border-blue-200 text-blue-600 hover:bg-blue-50 cursor-pointer"
              onClick={handlePrintPDF}
            >
              <Printer size={18} />
              <span className="text-sm">Print</span>
            </button>
          </div>
        </div>

        {/* Statistics Cards */}
        <div className="border border-gray-200 shadow-lg px-2 py-5 rounded-2xl my-4 flex overflow-x-auto bg-gradient-to-r from-white to-gray-50 no-print">
          <div className="border-r w-52 flex-shrink-0">
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

          {selectedClient && (
            <div
              className="w-52 flex flex-shrink-0 items-center justify-center transition-all duration-200 transform hover:scale-105 cursor-pointer"
              onClick={() => {
                try {
                  const clientName = selectedClient?.clientName
                  const amount = toThousands(Number(selectedClient?.pendingFromOurs).toFixed(0))

                  const message = `Hello ${clientName},\n\n!!! just a reminder that the ${amount} amount is still pending till ${new Date(selectedClient?.createdAt).toLocaleDateString('en-US', { month: 'long' })}.\n\nPlease make the payment as soon as possible.\nThank you for your business!`

                  // Replace with client’s phone number if available in DB
                  if (selectedClient?.phoneNo) {
                    const phoneNumber = selectedClient?.phoneNo
                    const encodedMessage = encodeURIComponent(message)
                    const url = `https://wa.me/${phoneNumber}?text=${encodedMessage}`
                    window.open(url, '_blank')
                  }
                } catch (error) {
                  toast.error('Failed to share to WhatsApp : ', error)
                }
              }}
            >
              <div className="flex items-center gap-1">
                <div className="p-2 rounded-lg">
                  <IoLogoWhatsapp size={22} className="text-emerald-600" />
                </div>
                <div>Share to WhatsApp</div>
              </div>
            </div>
          )}
        </div>

        {/* Transaction Table */}
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-200 print-area">
          <div className="overflow-x-auto customScrollbar max-h-[600px] relative">
            <table className="min-w-max border-collapse text-sm w-full">
              <thead className="bg-gradient-to-r from-gray-100 to-gray-200 sticky top-0 z-10">
                <tr className="text-gray-700">
                  {tableHeaders.map((header) => {
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
                            No {selectedType.toLowerCase()} receipts available for this account
                          </p>
                        </div>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredData.map((receipt, index) => (
                    <TransactionRow
                      key={`${receipt.id || receipt.transactionId || receipt.type}-${index}`}
                      receipt={receipt}
                      index={index}
                      balance={balances[index]}
                      selectedType={selectedType}
                      bankAccount={bankAccount}
                    />
                  ))
                )}
                {/* Opening Balance at LAST ROW */}
                <tr className="bg-blue-50 font-bold">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <Calendar size={14} className="text-blue-600" />
                      <span>Opening Balance</span>
                    </div>
                  </td>

                  <td className="px-6 py-4 text-gray-400">—</td>
                  <td className="px-6 py-4 text-gray-400">—</td>

                  <td className="px-6 py-4 text-blue-700 font-bold">
                    {toThousands(selectedClient?.openingBalance || 0)}
                  </td>

                  <td className="px-6 py-4 text-gray-600">Opening Balance</td>
                </tr>
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

          @keyframes fadeInUp {
            from {
              opacity: 0;
              transform: translateY(10px);
            }
            to {
              opacity: 1;
              transform: translateY(0);
            }
          }

          .animate-slideInUp {
            animation: slideInUp 0.3s ease-out forwards;
          }

          .animate-fadeInUp {
            animation: fadeInUp 0.3s ease-out forwards;
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
    </div>
  )
}

export default BankLedger
