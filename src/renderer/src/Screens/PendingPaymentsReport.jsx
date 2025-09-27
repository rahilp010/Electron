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
  Users
} from 'lucide-react'
import { clientApi, transactionApi } from '../API/Api'
import { setClients, setTransactions } from '../app/features/electronSlice'
import Navbar from '../components/UI/Navbar'

// Constants
const TABLE_HEADERS = [
  { key: 'date', label: 'Date', width: 'w-[150px]', icon: Calendar },
  { key: 'bank', label: 'Bank', width: 'w-[150px]', icon: Building2 },
  { key: 'accountName', label: 'Account Name', width: 'w-[250px]', icon: CreditCard },
  { key: 'credit', label: 'Pending', width: 'w-[200px]', icon: ClockArrowDown },
  { key: 'description', label: 'Description', width: 'w-[350px]', icon: FileText }
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

// Memoized Transaction Row Component
const TransactionRow = memo(({ receipt, index, selectedType }) => {
  const isEven = index % 2 === 0
  const LedgerIcon = selectedType === 'Bank' ? Building2 : Banknote

  return (
    <tr
      className={`transition-all duration-200 hover:shadow-md transform hover:scale-[1.001]
        ${isEven ? 'border-l-4' : 'border-l-4'} border-l-red-400
      `}
      style={{ animationDelay: `${index * 50}ms` }}
    >
      <td className="px-6 py-4">
        <div className="flex items-center gap-2">
          <div className="p-1 rounded-full bg-red-200">
            <Calendar size={14} className="text-red-600" />
          </div>
          <span className="font-medium text-gray-700">
            {new Date(receipt.date).toLocaleDateString()}
          </span>
        </div>
      </td>

      <td className="px-6 py-4 no-print">
        <div className="flex items-center gap-2">
          <div className="p-1 rounded-full bg-blue-200">
            <LedgerIcon size={14} className="text-blue-600" />
          </div>
          <span className="font-medium text-gray-700">
            {receipt.bank ? `${receipt.bank} Bank` : selectedType}
          </span>
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
          <div className="p-1 rounded-full bg-red-200">
            <ClockArrowDown size={14} className="text-red-600" />
          </div>
          <span className="font-semibold text-red-600 px-3 py-1 rounded-full">
            {toThousands(receipt.amount)}
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
const PendingPaymentsReport = ({ client, onClose }) => {
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
  const tableHeaders = useMemo(() => 
    TABLE_HEADERS.map(header => 
      header.key === 'bank' 
        ? { ...header, label: selectedType, icon: selectedType === 'Bank' ? Building2 : Banknote }
        : header
    ),
    [selectedType]
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

    const receipts = sourceData.filter((r) => r.type === 'Payment' && r.statusOfTransaction === 'pending')

    if (selectedClient?.id) {
      return receipts.filter((r) => r.clientName === getClientName(selectedClient.id))
    }

    return receipts
  }, [selectedType, recentBankReceipts, recentCashReceipts, selectedClient, getClientName])

  // Memoized statistics
  const statistics = useMemo(() => {
    const totalPending = filteredData.reduce((sum, r) => sum + (Number(r.amount) || 0), 0)
    const transactionCount = filteredData.length

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

  // Effects
  useEffect(() => {
    loadData()
  }, [loadData])

  // Sync selectedClient with client prop
  useEffect(() => {
    if (!selectedClient && clients.length > 0) {
      setSelectedClient(clients[0]) // auto select first client
    }
  }, [clients, selectedClient])

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
                  className={`group relative p-4 rounded-2xl cursor-pointer transition-all duration-300 ease-out mx-2 overflow-hidden
    ${
      selectedClient?.id === client.id
        ? 'bg-white/30 backdrop-blur-xl border border-white/40 shadow-2xl transform scale-[1.02] ring-2 ring-white/30'
        : 'bg-white/10 backdrop-blur-md border border-white/20 hover:bg-white/20 hover:backdrop-blur-lg hover:border-white/30 hover:shadow-xl hover:scale-[1.01]'
    }
    animate-fadeInUp before:absolute before:inset-0 before:bg-gradient-to-br before:from-white/5 before:to-transparent before:pointer-events-none`}
                  style={{
                    animationDelay: `${index * 50}ms`,
                    boxShadow:
                      selectedClient?.id === client.id
                        ? '0 25px 50px -12px rgba(0, 0, 0, 0.15), 0 0 0 1px rgba(255, 255, 255, 0.1), inset 0 1px 0 rgba(255, 255, 255, 0.2)'
                        : '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 0 0 1px rgba(255, 255, 255, 0.05), inset 0 1px 0 rgba(255, 255, 255, 0.1)'
                  }}
                  onClick={() => handleClientSelect(client)}
                  role="button"
                  aria-label={`Select client ${client.clientName}`}
                >
                  {/* Subtle gradient overlay */}
                  <div className="absolute inset-0 bg-gradient-to-br from-blue-50/10 via-transparent to-indigo-50/10 pointer-events-none" />

                  {/* Animated background glow for selected state */}
                  {selectedClient?.id === client.id && (
                    <div className="absolute inset-0 bg-gradient-to-r from-blue-400/10 via-indigo-400/10 to-purple-400/10 animate-pulse rounded-2xl" />
                  )}

                  <div className="relative flex items-center gap-4">
                    <div
                      className={`w-12 h-12 rounded-2xl flex items-center justify-center text-sm font-bold transition-all duration-300 relative overflow-hidden
        ${
          selectedClient?.id === client.id
            ? 'bg-gradient-to-br from-blue-500/90 to-indigo-600/90 text-white shadow-lg backdrop-blur-sm border border-white/20'
            : 'bg-gradient-to-br from-blue-400/80 to-indigo-500/80 text-white group-hover:from-blue-500/90 group-hover:to-indigo-600/90 shadow-md backdrop-blur-sm border border-white/10'
        }`}
                    >
                      {/* Inner glow effect */}
                      <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent rounded-2xl" />
                      <span className="relative z-10">{getInitials(client.clientName)}</span>
                    </div>

                    <div className="flex-1 min-w-0 relative">
                      <p
                        className={`font-semibold truncate text-sm transition-all duration-200
          ${
            selectedClient?.id === client.id
              ? 'text-gray-900 drop-shadow-sm'
              : 'text-gray-800 group-hover:text-gray-900'
          }`}
                      >
                        {client.clientName}
                      </p>
                      <p
                        className={`text-xs truncate transition-all duration-200 flex items-center gap-1
          ${
            selectedClient?.id === client.id
              ? 'text-gray-600'
              : 'text-gray-500 group-hover:text-gray-600'
          }`}
                      >
                        <span className="inline-block w-1 h-1 bg-current font-light rounded-full opacity-70" />
                        {client.accountType || 'Other'}
                        <span className="mx-1 opacity-40">•</span>
                        <span className="font-medium">
                          {toThousands(client.pendingFromOurs || 0)}
                        </span>
                      </p>
                    </div>
                  </div>

                  {/* Enhanced selection indicator */}
                  {selectedClient?.id === client.id && (
                    <div className="absolute right-3 top-1/2 transform -translate-y-1/2 flex items-center gap-2">
                      <div className="w-2 h-2 bg-gradient-to-r from-emerald-400 to-green-500 rounded-full animate-pulse shadow-md" />
                      <div className="w-1 h-1 bg-emerald-300 rounded-full animate-ping" />
                    </div>
                  )}

                  {/* Subtle hover glow */}
                  <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-gradient-to-br from-white/5 via-transparent to-blue-50/5 rounded-2xl pointer-events-none" />

                  {/* Edge highlight */}
                  <div
                    className={`absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/30 to-transparent transition-opacity duration-300
    ${selectedClient?.id === client.id ? 'opacity-100' : 'opacity-0 group-hover:opacity-60'}`}
                  />
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
              <p className="text-3xl font-light">Pending Payments Report</p>
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
          <div className="mx-4 w-52 flex-shrink-0">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg">
                <ClockArrowDown size={20} className="text-red-600" />
              </div>
              <div>
                <p className="text-gray-600 text-sm">Total Pending Amount</p>
                <p className="text-xl font-light">{toThousands(statistics.totalPending)}</p>
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
                      key={`${receipt.id || receipt.transactionId}-${index}`}
                      receipt={receipt}
                      index={index}
                      selectedType={selectedType}
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

export default PendingPaymentsReport