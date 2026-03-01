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
  // { key: 'bank', label: 'Bank', width: 'w-[200px]', icon: Building2 },
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
  return (
    name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2) || ''
  )
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
            {new Date(receipt?.createdAt).toLocaleDateString('en-IN', {
              day: '2-digit',
              month: 'short',
              year: 'numeric'
            })}
          </span>
        </div>
      </td>

      {/* <td className="px-6 py-4 no-print">
        <div className="flex items-center gap-2">
          <div className="p-1 rounded-full bg-blue-200">
            <Building2 size={14} className="text-blue-600" />
          </div>
          <span className="font-medium text-gray-700">
            {receipt.bank ? `${receipt.bank} Bank` : selectedType}
          </span>
        </div>
      </td> */}

      <td>
        <div className="flex items-center gap-3">
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

      <td className="px-6 py-4">
        <div className="flex items-center gap-2">
          <div className="p-1 rounded-full bg-emerald-200">
            <TrendingUp size={14} className="text-emerald-600" />
          </div>
          <span className="font-semibold text-emerald-600 px-3 py-1 rounded-full">
            {toThousands(receipt.pendingAmount)}
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

  const loadPendingCollections = useCallback(async () => {
    const res = await window.api.getPendingCollections()

    if (res.success) {
      return res.list
    } else {
      toast.error(res.message || 'Failed to load pending collections')
      return []
    }
  }, [])

  return { fetchAllClients, loadPendingCollections }
}

// Main Component
const PendingCollectionReport = ({ client, onClose }) => {
  const { fetchAllClients, loadPendingCollections } = useAccountOperations()

  // State management
  const [showLoader, setShowLoader] = useState(false)
  const [pendingData, setPendingData] = useState([])
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
    let receipts = pendingData || []

    // Filter by selected client
    if (selectedClient?.id) {
      receipts = receipts.filter((r) => String(r.clientId) === String(selectedClient.id))
    }

    return receipts.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
  }, [pendingData, selectedClient?.id])

  // Memoized running balance calculation
  const balances = useMemo(() => {
    return filteredData.map((r) => r.pendingAmount)
  }, [filteredData])

  const statistics = useMemo(() => {
    const totalPending = filteredData.reduce((sum, r) => sum + (Number(r.pendingAmount) || 0), 0)

    const uniqueClients = new Set(filteredData.map((r) => r.clientId)).size

    const largestOutstanding = Math.max(...filteredData.map((r) => Number(r.pendingAmount) || 0), 0)

    const averagePending = filteredData.length > 0 ? totalPending / filteredData.length : 0

    const overdueCount = filteredData.filter(
      (r) => r.dueDate && new Date(r.dueDate) < new Date()
    ).length

    return {
      totalPending,
      transactionCount: filteredData.length,
      uniqueClients,
      largestOutstanding,
      averagePending,
      overdueCount
    }
  }, [filteredData])

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
      const data = await loadPendingCollections()

      setPendingData(data)
    } catch (err) {
      console.error(err)
    } finally {
      setShowLoader(false)
    }
  }, [fetchAllClients, loadPendingCollections])

  // Utility function to generate dynamic print HTML

  const generatePrintHTML = (data, headers, title, totalPending = 0) => {
    const toThousands = (num) =>
      Number(num || 0)
        .toString()
        .replace(/\B(?=(\d{3})+(?!\d))/g, ',')

    const getCellValue = (row, headerKey) => {
      console.log('row', row)
      console.log('headerKey', headerKey)

      switch (headerKey) {
        case 'date':
          return row.date
            ? new Date(row.date).toLocaleDateString('en-IN', {
                day: 'numeric',
                month: 'short',
                year: 'numeric'
              })
            : '-'
        case 'accountName':
          return `<div class="text-wrap-cell">${row.accountName || ''}</div>`
        case 'credit':
          return `₹ ${toThousands(row.credit || 0)}`
        default:
          return row[headerKey] || ''
      }
    }

    const tableHeaders = headers
      .map((h) => {
        let align = 'text-left'
        if (h.key === 'credit') align = 'text-right'
        return `<th class="${align}">${h.label}</th>`
      })
      .join('')

    const tableRows = data
      .map((row) => {
        const cells = headers
          .map((h) => {
            let align = 'text-left'
            if (h.key === 'credit') align = 'text-right'
            return `<td class="${align}">${getCellValue(row, h.key)}</td>`
          })
          .join('')
        return `<tr>${cells}</tr>`
      })
      .join('')

    const companyInfo = {
      name: 'Electron by Envy',
      city: 'Surat, Gujarat - 395006',
      phone: '+91 9316080624',
      email: 'admin@envy.com'
    }

    return `
<!DOCTYPE html>
<html>
<head>
  <title>${title}</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&display=swap');

    :root {
      --primary: #1e293b;
      --secondary: #64748b;
      --border: #e2e8f0;
    }

    html, body {
      height: 100%;
      margin: 0;
      padding: 0;
    }

    body {
      font-family: 'Inter', sans-serif;
      color: #334155;
      background: #fff;
      display: flex;
      flex-direction: column;
      min-height: 100vh;
    }

    .page-wrapper {
      flex: 1;
      display: flex;
      flex-direction: column;
    }

    .content {
      flex: 1;
    }

    /* Layout helpers */
    .flex { display: flex; }
    .justify-between { justify-content: space-between; }
    .items-start { align-items: flex-start; }
    .text-right { text-align: right; }
    .text-left { text-align: left; }
    .font-bold { font-weight: 700; }

    /* Header */
    .header-container {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      border-bottom: 2px solid var(--primary);
      padding-bottom: 20px;
      margin-bottom: 30px;
    }

    .left-header {
      display: flex;
      flex-direction: column;
    }

    .logo-placeholder {
      width: 70px;
      height: 65px;
      background: var(--primary);
      color: white;
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: 8px;
      font-weight: bold;
      font-size: 20px;
      margin-bottom: 10px;
    }

    .company-branding h1 {
      margin: 0;
      font-size: 24px;
      color: var(--primary);
      text-transform: uppercase;
    }

    .company-details {
      font-size: 12px;
      color: var(--secondary);
      margin-top: 6px;
      line-height: 1.4;
    }

    .right-header {
      display: flex;
      flex-direction: column;
      align-items: flex-end;
      text-align: right;
    }

    .report-title {
      font-size: 28px;
      font-weight: 800;
      color: #cbd5e1;
      text-transform: uppercase;
      margin: 0;
    }

    .meta-table {
      margin-top: 10px;
      border-collapse: collapse;
      font-size: 12px;
    }

    .meta-table td {
      padding: 3px 8px;
      border-bottom: 1px solid var(--border);
      white-space: nowrap;
    }

    .meta-label {
      font-weight: 600;
      color: var(--primary);
    }

    /* Table */
    table.data-table {
      width: 100%;
      border-collapse: collapse;
      margin-top: 10px;
    }

    table.data-table th {
      background: var(--primary);
      color: white;
      padding: 10px;
      font-size: 12px;
      text-transform: uppercase;
    }

    table.data-table td {
      padding: 8px 10px;
      border-bottom: 1px solid var(--border);
      font-size: 12px;
    }

    table.data-table tr:nth-child(even) {
      background: #f8fafc;
    }

    /* Totals */
    .totals-container {
      display: flex;
      justify-content: flex-end;
      margin-top: 25px;
    }

    .totals-table {
      width: 40%;
      border-collapse: collapse;
      font-size: 13px;
    }

    .totals-table td {
      padding: 8px 12px;
      border-bottom: 1px solid #e2e8f0;
    }

    .totals-table .label {
      font-weight: 600;
      color: var(--secondary);
    }

    .totals-table .value {
      text-align: right;
      font-weight: 600;
      color: var(--primary);
    }

    .grand-total-row {
      background-color: var(--primary);
      color: white;
    }
    .text-center { text-align: center; }

    .grand-total-row .label,
    .grand-total-row .value {
      color: white;
      font-weight: 700;
      border: none;
    }

    /* Footer pinned */
    .footer {
margin-top: auto; padding-top: 20px; border-top: 1px solid var(--border);
    }

    .signature-area { width: 200px; text-align: center; }
    .signature-line { border-top: 1px solid #334155; margin-bottom: 5px; }

    @media print {
      body {
        -webkit-print-color-adjust: exact;
        print-color-adjust: exact;
      }
    }
  </style>
</head>

<body onload="window.print(); setTimeout(() => { window.close(); }, 1000);">

  <div class="page-wrapper">
    
    <div class="content">

      <div class="header-container">
        <div class="left-header">
          <div class="logo-placeholder">Envy</div>
          <div class="company-branding">
            <h1>${companyInfo.name}</h1>
            <div class="company-details">
              ${companyInfo.city}<br/>
              ${companyInfo.phone} | ${companyInfo.email}
            </div>
          </div>
        </div>

        <div class="right-header">
          <h2 class="report-title">${title}</h2>
          <table class="meta-table">
            <tr>
              <td class="meta-label">Date:</td>
              <td>${new Date().toLocaleDateString('en-IN')}</td>
            </tr>
            <tr>
              <td class="meta-label">Records:</td>
              <td>${data.length}</td>
            </tr>
          </table>
        </div>
      </div>

      <table class="data-table">
        <thead>
          <tr>${tableHeaders}</tr>
        </thead>
        <tbody>
          ${tableRows}
        </tbody>
      </table>

      <div class="totals-container">
        <table class="totals-table">
          <tr>
            <td class="label">Total Records</td>
            <td class="value">${data.length}</td>
          </tr>
          <tr class="grand-total-row">
            <td class="label">Total Pending Amount</td>
            <td class="value">₹ ${toThousands(totalPending)}</td>
          </tr>
        </table>
      </div>

    </div>
  </div>

  <div class="footer">
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
          acc[name] = { accountName: name, credit: 0, date: row.createdAt }
        }
        acc[name].credit += Number(row.pendingAmount) || 0
        return acc
      }, {})

      printData = Object.values(grouped).map((item) => ({
        ...item,
        credit: item.credit,
        date: item.date
      }))
    } else {
      // Single client: just one row with sum
      const clientSum = filteredData.reduce((sum, row) => sum + (Number(row.pendingAmount) || 0), 0)

      printData = [
        {
          accountName: selectedClient.clientName || '',
          credit: clientSum,
          date:
            selectedClient.createdAt ||
            (filteredData.length > 0 ? filteredData[0].createdAt : new Date())
        }
      ]
    }

    totalPending = filteredData.reduce((sum, row) => sum + (Number(row.pendingAmount) || 0), 0)

    const title = `Pending Collection Report <br> ${selectedClient?.clientName || 'All Accounts'} `

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
  }, [filteredData, selectedClient])

  // Effects
  useEffect(() => {
    loadData()
  }, [loadData])

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
                  <div className="flex items-center gap-3 px-6">
                    <div className="w-10 h-10 bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-100 border border-indigo-200 rounded-xl flex items-center justify-center text-indigo-700 text-sm font-semibold shadow-sm transition-all duration-300 group-hover:scale-110 group-hover:shadow-md group-hover:border-indigo-300">
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
          <div className="mx-4 border-r w-52 flex-shrink-0">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg">
                <BarChart3 size={20} className="text-orange-600" />
              </div>
              <div>
                <p className="text-gray-600 text-sm">Largest Due</p>
                <p className="text-xl font-light">{toThousands(statistics.largestOutstanding)}</p>
              </div>
            </div>
          </div>
          <div className="mx-4 border-r w-52 flex-shrink-0">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg">
                <Calendar size={20} className="text-emerald-600" />
              </div>
              <div>
                <p className="text-gray-600 text-sm">Overdue</p>
                <p className="text-xl font-light">{toThousands(statistics.overdueCount)}</p>
              </div>
            </div>
          </div>
          {selectedClient && (
            <div
              className="w-52 flex flex-shrink-0 items-center justify-center transition-all duration-200 transform hover:scale-105 cursor-pointer"
              onClick={() => {
                try {
                  const clientName = selectedClient?.clientName
                  const amount = toThousands(Number(selectedClient?.pendingAmount).toFixed(0))

                  const message = `Hello ${clientName},\n\n!!! just a reminder that the ${amount} amount is still pending till ${new Date().toLocaleDateString('en-US', { month: 'long' })}.\n\nPlease make the payment as soon as possible.\nThank you for your business!`

                  if (
                    selectedClient.phoneNo === '' ||
                    selectedClient.phoneNo === null ||
                    selectedClient.phoneNo === undefined
                  ) {
                    toast.error('Phone number not found')
                  }

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
                            No pending collections available for this account
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
