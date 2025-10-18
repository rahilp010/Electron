/* eslint-disable prettier/prettier */
/* eslint-disable react/no-unknown-property */
/* eslint-disable no-unused-vars */
/* eslint-disable react/display-name */
/* eslint-disable react/prop-types */
import React, { memo, useCallback, useEffect, useMemo, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { toast } from 'react-toastify'
import { Tooltip, Whisper, Input } from 'rsuite'
import html2pdf from 'html2pdf.js'
import {
  TrendingUp,
  Calendar,
  Building2,
  FileText,
  CreditCard,
  Banknote,
  BarChart3,
  Search,
  Users,
  X,
  Printer
} from 'lucide-react'
import { clientApi } from '../API/Api'
import { setClients } from '../app/features/electronSlice'
import Navbar from '../components/UI/Navbar'
import { IoLogoWhatsapp } from 'react-icons/io5'

// Constants
const TABLE_HEADERS = [
  { key: 'date', label: 'Date', width: 'w-[170px]', icon: Calendar },
  { key: 'bank', label: 'Bank', width: 'w-[200px]', icon: Building2 },
  { key: 'accountName', label: 'Account Name', width: 'w-[250px]', icon: CreditCard },
  { key: 'credit', label: 'Pending', width: 'w-[200px]', icon: TrendingUp },
  { key: 'balance', label: 'Balance', width: 'w-[200px]', icon: BarChart3 },
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

const getInitials = (name) => {
  if (!name) return '??'
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
}

const getClientName = (clientId, clients) => {
  const client = clients.find((c) => c.id === clientId)
  return client ? client.clientName : 'Unknown Client'
}

const getProductName = (productId, products) => {
  const product = products.find((p) => p.id === productId)
  return product ? product.name : 'Unknown Product'
}

// Memoized Transaction Row Component
const TransactionRow = memo(({ receipt, index, balance, clientName }) => {
  const isEven = index % 2 === 0

  return (
    <tr
      className={`transition-all duration-200 hover:shadow-md transform hover:scale-[1.001]
        ${isEven ? 'border-l-4' : 'border-l-4'} border-l-emerald-400
      `}
      style={{ animationDelay: `${index * 50}ms` }}
    >
      <td className="px-6 py-4">
        <div className="flex items-center gap-2">
          <div className="p-1 rounded-full bg-emerald-200">
            <Calendar size={14} className="text-emerald-600" />
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
            {getInitials(receipt.clientName)}
          </div>
          <span className="font-medium text-gray-800 tracking-wide">{receipt.clientName}</span>
        </div>
      </td>

      <td className="px-6 py-4">
        <div className="flex items-center gap-2">
          <div className="p-1 rounded-full bg-emerald-200">
            <TrendingUp size={14} className="text-emerald-600" />
          </div>
          <span className="font-semibold text-emerald-600 px-3 py-1 rounded-full">
            {toThousands(receipt.amount)}
          </span>
        </div>
      </td>

      <td className="px-6 py-4">
        <div className="flex items-center gap-2">
          <span className="font-semibold text-[16px] text-emerald-600">{toThousands(balance)}</span>
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
const PendingCollectionReport = ({ client, onClose }) => {
  const { fetchAllClients, fetchRecentBankReceipts, fetchRecentCashReceipts } =
    useAccountOperations()

  // State management
  const [selectedType, setSelectedType] = useState('Bank')
  const [showLoader, setShowLoader] = useState(false)
  const [recentBankReceipts, setRecentBankReceipts] = useState([])
  const [recentCashReceipts, setRecentCashReceipts] = useState([])
  const [showSideBar, setShowSideBar] = useState(false)
  const [sidebarSearch, setSidebarSearch] = useState('')
  const [selectedClient, setSelectedClient] = useState(client || null)

  const clients = useSelector((state) => state.electron.clients.data || [])

  // Get client name helper
  const getClientName = useCallback(
    (id) => {
      const foundClient = clients.find((c) => c?.id === Number(id))
      return foundClient ? foundClient.clientName : 'Unknown Client'
    },
    [clients]
  )

  // Memoized filtered sidebar clients
  const filteredSidebarClients = useMemo(() => {
    if (!sidebarSearch) return clients
    const query = sidebarSearch.toLowerCase()
    return clients.filter((client) => client.clientName?.toLowerCase().includes(query))
  }, [clients, sidebarSearch])

  // Memoized filtered data
  const filteredData = useMemo(() => {
    const sourceData = selectedType === 'Bank' ? recentBankReceipts : recentCashReceipts
    const receipts = sourceData.filter(
      (r) => r.type === 'Receipt' && r.statusOfTransaction === 'pending'
    )
    console.log('receipts', receipts)

    if (selectedClient?.id) {
      return receipts.filter((r) => r.clientName === getClientName(selectedClient.id))
    }

    return receipts
  }, [selectedType, recentBankReceipts, recentCashReceipts, selectedClient, getClientName])

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

  const transaction = useSelector((state) => state.electron.transaction.data || [])

  // Memoized statistics
  const statistics = useMemo(() => {
    const totalReceipts = filteredData.reduce((sum, r) => sum + (Number(r.amount) || 0), 0)
    const transactionCount = filteredData.length

    return { totalReceipts, transactionCount }
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

  const handleClearClient = useCallback(() => {
    setSelectedClient(null)
    setSidebarSearch('')
    onClose(null) // Notify parent of deselection
  }, [onClose])

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

    const title = `Pending Collection Report <br> ${selectedClient?.clientName || 'All Accounts'} (${selectedType})`

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

  // Sync selectedClient with client prop
  useEffect(() => {
    setSelectedClient(client || null)
  }, [client])

  // const handleGenerateAndSendPDF = async () => {
  //   try {
  //     if (!selectedClient) {
  //       toast.warn('Select a client first')
  //       return
  //     }

  //     const receipts = filteredData.filter((r) => r.clientName === selectedClient.clientName)
  //     if (receipts.length === 0) {
  //       toast.info('No pending receipts for this client')
  //       return
  //     }

  //     if (!selectedClient.phoneNo || selectedClient.phoneNo.trim() === '') {
  //       toast.error('Client phone number is missing')
  //       return
  //     }

  //     const printData = receipts.map((r) => ({
  //       accountName: r.clientName,
  //       credit: toThousands(r.amount),
  //       date: new Date(r.date).toLocaleDateString('en-IN')
  //     }))

  //     const totalPending = receipts.reduce((sum, r) => sum + (Number(r.amount) || 0), 0)
  //     const title = `Pending Collection Report - ${selectedClient.clientName} (${selectedType})`
  //     const printHTML = generatePrintHTML(printData, TABLE_HEADERS_PRINT, title, totalPending)

  //     toast.info('Generating PDF...')

  //     // Generate PDF as ArrayBuffer directly
  //     const pdfArrayBuffer = await html2pdf().from(printHTML).toPdf().output('arraybuffer')

  //     toast.info('Sending to WhatsApp...')

  //     const result = await window.api.saveAndSendWhatsAppPDF(
  //       selectedClient.phoneNo,
  //       pdfArrayBuffer,
  //       `${selectedClient.clientName}_Pending.pdf`,
  //       `Hello ${selectedClient.clientName}, here is your pending payment report.`
  //     )

  //     if (result.success) {
  //       toast.success('✅ WhatsApp message sent successfully!')
  //       console.log('PDF saved at:', result.filePath)
  //     } else {
  //       toast.error(`Failed to send: ${result.error || 'Unknown error'}`)
  //     }
  //   } catch (err) {
  //     console.error('Error generating/sending PDF:', err)
  //     toast.error(`Error: ${err.message || 'Failed to generate or send PDF'}`)
  //   }
  // }

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
                <h3 className="font-semibold text-lg">Client Accounts</h3>
                <p className="text-blue-100 text-sm">{clients.length} total accounts</p>
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
              {filteredSidebarClients.map((client, index) => (
                <div
                  key={client.id}
                  className={`group relative p-3 rounded-lg cursor-pointer transition-all duration-200 mx-2
                    ${
                      selectedClient?.id === client.id
                        ? 'bg-gray-200 shadow-md transform scale-[1.02]'
                        : 'hover:bg-white/60 hover:shadow-sm'
                    }
                    animate-fadeInUp`}
                  style={{ animationDelay: `${index * 50}ms` }}
                  onClick={() => handleClientSelect(client)}
                  role="button"
                  aria-label={`Select client ${client.clientName}`}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-10 h-10 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-200
                        ${
                          selectedClient?.id === client.id
                            ? 'bg-gradient-to-br from-blue-400 to-indigo-500 text-white group-hover:from-blue-500 group-hover:to-indigo-600 backdrop-blur-sm'
                            : 'bg-gradient-to-br from-blue-400 to-indigo-500 text-white group-hover:from-blue-500 group-hover:to-indigo-600'
                        }`}
                    >
                      {getInitials(client.clientName)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p
                        className={`font-medium truncate text-sm
                          ${selectedClient?.id === client.id ? 'text-black' : 'text-gray-800'}`}
                      >
                        {client.clientName}
                      </p>
                      <p
                        className={`text-xs truncate
                          ${selectedClient?.id === client.id ? 'text-gray-500' : 'text-gray-500'}`}
                      >
                        {client.accountType || 'Other'} • {toThousands(client.pendingAmount || 0)}
                      </p>
                    </div>
                  </div>

                  {selectedClient?.id === client.id && (
                    <div className="absolute right-2 top-1/2 transform -translate-y-1/2">
                      <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                    </div>
                  )}
                </div>
              ))}
            </div>

            {filteredSidebarClients.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                <Users size={32} className="mx-auto mb-2 opacity-50" />
                <p className="text-sm">No clients found</p>
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
        <div className="flex items-center justify-between  gap-5 mt-10">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-4 mx-1">
              <p className="text-3xl font-light">Pending Collection Report</p>
            </div>
          </div>

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
                  aria-label={`Select ${type.label} transactions`}
                >
                  <Icon size={18} />
                  {type.label}
                </button>
              )
            })}
            <button
              className={`flex items-center gap-2 px-4 py-1.5 rounded-xl font-medium transition-all duration-200 transform hover:scale-105 hover:bg-gradient-to-r from-blue-400 to-blue-600 hover:text-white hover:shadow-lg bg-white border border-blue-200 text-blue-600 hover:bg-blue-50`}
              onClick={handlePrintPDF}
              title="Print Sales Report"
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
          <div className="mx-4 border-r w-52 flex-shrink-0">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg">
                <TrendingUp size={20} className="text-emerald-600" />
              </div>
              <div>
                <p className="text-gray-600 text-sm">Total Pending Amount</p>
                <p className="text-xl font-light">{toThousands(statistics.totalReceipts)}</p>
              </div>
            </div>
          </div>
          {selectedClient && (
            <div
              className="w-52 flex flex-shrink-0 items-center justify-center transition-all duration-200 transform hover:scale-105 cursor-pointer"
              onClick={() => {
                try {
                  console.log(selectedClient)

                  const clientName = selectedClient?.clientName
                  const amount = toThousands(Number(selectedClient?.pendingAmount).toFixed(0))

                  const message = `Hello ${clientName},\n\n!!! just a reminder that the ${amount} amount is still pending till ${new Date(selectedClient?.createdAt).toLocaleDateString('en-US', { month: 'long' })}.\n\nPlease make the payment as soon as possible.\nThank you for your business!`

                  // Replace with client’s phone number if available in DB
                  if (selectedClient?.phoneNo) {
                    const phoneNumber = selectedClient?.phoneNo
                    const encodedMessage = encodeURIComponent(message)
                    const url = `https://wa.me/${phoneNumber}?text=${encodedMessage}`
                    window.open(url, '_blank')
                  }
                } catch (error) {
                  console.log(error)
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
                            No {selectedType.toLowerCase()} receipts available for this account
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

export default PendingCollectionReport
