/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable prettier/prettier */
/* eslint-disable react/prop-types */
/* eslint-disable no-unused-vars */
/* eslint-disable react/no-unknown-property */
/* eslint-disable react/display-name */
import React, { useEffect, useState, useCallback, useMemo, memo, useRef } from 'react'
import { FileUp, Import, Users, Search, Printer } from 'lucide-react'
import Loader from '../components/Loader'
import 'rsuite/dist/rsuite-no-reset.min.css'
import { setClients, setTransactions } from '../app/features/electronSlice'
import { useDispatch, useSelector } from 'react-redux'
import { clientApi, transactionApi } from '../API/Api'
import { toast } from 'react-toastify'
import Navbar from '../components/UI/Navbar'
import { DateRangePicker, Input, InputGroup, SelectPicker, Tooltip, Whisper } from 'rsuite'
import SearchIcon from '@mui/icons-material/Search'
import PrintIcon from '@mui/icons-material/Print'
import ImportExcel from '../components/UI/ImportExcel'
import * as XLSX from 'xlsx'
import AccountLedger from '../components/Modal/AccountLedger'

// Constants
const TABLE_HEADERS = [
  { key: 'accountName', label: 'Account Name', width: 'w-[300px]' },
  { key: 'accountType', label: 'Account Type', width: 'w-[200px]' },
  { key: 'gstNo', label: 'GST No', width: 'w-[200px]' },
  { key: 'businessAddress', label: 'Business Address', width: 'w-[250px]' },
  { key: 'pendingAmount', label: 'Pending Amount', width: 'w-[200px]' }
]

const ACCOUNT_TYPES = [
  { label: 'Creditors', value: 'Creditors' },
  { label: 'Debtors', value: 'Debtors' }
]

// Utility functions
const toThousands = (value) => {
  if (!value || isNaN(value)) return '₹0'
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR'
  }).format(value)
}

const formatDate = (dateString) => {
  if (!dateString) return '-'
  return new Date(dateString).toLocaleDateString('en-IN')
}

const getInitials = (name) => {
  if (!name) return '??'
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
}

// Memoized AccountRow component
const AccountRow = memo(({ client, onOpenLedger }) => {
  return (
    <tr className="transition-colors hover:bg-blue-50 cursor-pointer group">
      <td className="px-6 py-3 font-medium" onClick={() => onOpenLedger(client)}>
        <div className="flex items-center gap-3 font-bold">
          <div className="w-8 h-8 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full flex items-center justify-center text-xs font-medium text-white shadow-md transition-transform group-hover:scale-110">
            {getInitials(client.clientName)}
          </div>
          <span className="text-gray-700 ml-5 group-hover:text-blue-600 transition-colors">
            {client.clientName || '-'}
          </span>
        </div>
      </td>
      <td className="px-6 py-3">
        <div
          className={`py-2 px-3 w-fit rounded-full text-xs font-bold transition-all duration-200 ${
            client.accountType === 'Creditors'
              ? 'bg-emerald-100 text-emerald-700 border border-emerald-200'
              : client.accountType === 'Debtors'
                ? 'bg-blue-100 text-blue-700 border border-blue-200'
                : 'bg-gray-100 text-gray-700 border border-gray-200'
          }`}
        >
          {client.accountType || 'Other'}
        </div>
      </td>
      <td className="px-6 py-3 font-mono text-sm uppercase">
        {client.gstNo ? (
          <Whisper
            trigger="hover"
            placement="top"
            speaker={<Tooltip>GST Number: {client.gstNo}</Tooltip>}
          >
            <span className="bg-gray-100 px-2 py-1 rounded border">{client.gstNo}</span>
          </Whisper>
        ) : (
          <span className="text-gray-400 italic">Not provided</span>
        )}
      </td>
      <td className="px-6 py-3 max-w-[350px] truncate">
        {client.address ? (
          <Whisper trigger="hover" placement="top" speaker={<Tooltip>{client.address}</Tooltip>}>
            <span className="text-gray-600">{client.address}</span>
          </Whisper>
        ) : (
          <span className="text-gray-400 italic">Not provided</span>
        )}
      </td>
      <td className="px-6 py-3">
        <span
          className={`font-semibold text-lg ${
            (client.pendingAmount || 0) > 0 ? 'text-red-500' : 'text-emerald-500'
          }`}
        >
          {toThousands(client.pendingAmount || 0)}
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

  const fetchAllTransactions = useCallback(async () => {
    try {
      const response = await transactionApi.getAllTransactions()
      dispatch(setTransactions(response))
    } catch (error) {
      console.error('Error fetching transactions:', error)
      toast.error('Failed to fetch transactions')
    }
  }, [dispatch])

  return { fetchAllClients, fetchAllTransactions }
}

// Main Component
const LedgerReport = () => {
  const { fetchAllClients, fetchAllTransactions } = useAccountOperations()

  // State management
  const [showLoader, setShowLoader] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [dateRange, setDateRange] = useState(null)
  const [accountTypeFilter, setAccountTypeFilter] = useState('')
  const [importFile, setImportFile] = useState(false)
  const [clientFilter, setClientFilter] = useState('')
  const [openLedgerClient, setOpenLedgerClient] = useState(null)
  const [showSideBar, setShowSideBar] = useState(false)
  const [sidebarSearch, setSidebarSearch] = useState('')

  const clients = useSelector((state) => state.electron.clients?.data || [])
  const transactions = useSelector((state) => state.electron.transaction?.data || [])
  const products = useSelector((state) => state.electron.products?.data || [])

  // Memoized filtered sidebar clients
  const filteredSidebarClients = useMemo(() => {
    if (!sidebarSearch) return clients
    const query = sidebarSearch.toLowerCase()
    return clients.filter((client) => client.clientName?.toLowerCase().includes(query))
  }, [clients, sidebarSearch])

  // Memoized filtered data
  const filteredData = useMemo(() => {
    const query = searchQuery?.toLowerCase()

    return clients.filter((client) => {
      const matchesSearch =
        !query ||
        [
          client?.clientName?.toLowerCase(),
          client?.accountType?.toLowerCase(),
          client?.gstNo?.toLowerCase(),
          client?.address?.toLowerCase(),
          client?.phoneNo?.toLowerCase()
        ].some((field) => field?.includes(query))

      const matchesType = !accountTypeFilter || client.accountType === accountTypeFilter
      const matchesClient = !clientFilter || client.id === clientFilter

      let matchesDate = true
      if (dateRange?.length === 2) {
        const createdDate = new Date(client.createdAt)
        const [start, end] = dateRange
        matchesDate = createdDate >= new Date(start) && createdDate <= new Date(end)
      }

      return matchesSearch && matchesType && matchesClient && matchesDate
    })
  }, [searchQuery, accountTypeFilter, clientFilter, dateRange, clients])

  // Memoized statistics
  const statistics = useMemo(() => {
    const totalAccounts = filteredData.length

    const totalPendingAmount = filteredData.reduce(
      (sum, client) => sum + (Number(client.pendingAmount) || 0),
      0
    )

    const accountsByType = filteredData.reduce((acc, client) => {
      const type = client.accountType || 'Other'
      acc[type] = (acc[type] || 0) + 1
      return acc
    }, {})

    const totalPaidAmount = transactions
      .filter((t) => t.clientName === clients.clientName)
      .reduce((sum, t) => sum + (Number(t.totalAmount) || 0), 0)
    console.log('totalPaidAmount', totalPaidAmount)

    return {
      totalAccounts,
      totalPendingAmount,
      totalPaidAmount,
      accountsByType
    }
  }, [filteredData, clients, transactions])

  // Event handlers
  const handleSearchChange = useCallback((value) => {
    setSearchQuery(value)
  }, [])

  const handleSidebarSearchChange = useCallback((value) => {
    setSidebarSearch(value)
  }, [])

  const handleImportExcel = useCallback(
    async (filePath) => {
      try {
        const result = await window.api.importExcel(filePath, 'clients')

        if (result.success) {
          toast.success(`Imported ${result.count} accounts successfully`)
          await fetchAllClients()
          setImportFile(false)
        } else {
          toast.error(`Import failed: ${result.error}`)
        }
      } catch (error) {
        toast.error('Failed to import Excel: ' + error.message)
      }
    },
    [fetchAllClients]
  )

  const handleExportExcel = useCallback(() => {
    try {
      const exportData = filteredData.map((client) => ({
        'Account Name': client.clientName,
        'Account Type': client.accountType || 'Other',
        'GST No': client.gstNo || 'Not provided',
        'Business Address': client.address || 'Not provided',
        'Phone No': client.phoneNo || 'Not provided',
        'Pending Amount': client.pendingAmount || 0,
        'Paid Amount': client.paidAmount || 0,
        'Created Date': formatDate(client.createdAt)
      }))

      const ws = XLSX.utils.json_to_sheet(exportData)
      const wb = XLSX.utils.book_new()
      XLSX.utils.book_append_sheet(wb, ws, 'Account Ledger')
      XLSX.writeFile(wb, `account_ledger_${new Date().toISOString().split('T')[0]}.xlsx`)

      toast.success('Account ledger exported successfully')
    } catch (error) {
      toast.error('Failed to export ledger: ' + error.message)
    }
  }, [filteredData])

  const handleClientSelect = useCallback((client) => {
    setOpenLedgerClient(client)
    setSidebarSearch('')
  }, [])

  // Data fetching
  const loadData = useCallback(async () => {
    setShowLoader(true)
    try {
      await fetchAllClients()
    } finally {
      setShowLoader(false)
    }
  }, [fetchAllClients])

  // Effects
  useEffect(() => {
    loadData()
  }, [loadData])

  return (
    <div className="select-none gap-10 h-screen overflow-x-auto min-w-[720px] overflow-auto customScrollbar relative">
      <div className="w-full sticky top-0 z-50">
        <Navbar />
      </div>

      {/* Enhanced Animated Sidebar */}
      {openLedgerClient && (
        <div
          className={`fixed left-0 top-0 h-screen z-40 shadow-2xl transition-all duration-500 ease-out overflow-hidden
            ${showSideBar ? 'w-80' : 'w-4'}`}
          style={{ backdropFilter: 'blur(10px)' }}
        >
          {/* Sidebar Toggle Button */}
          <div
            className="absolute right-0 top-1/2 transform -translate-y-1/2 bg-gray-500 text-white text-xs px-1 py-10 rounded-r cursor-pointer hover:bg-gray-500 font-extrabold z-50"
            onClick={() => setShowSideBar(!showSideBar)}
          >
            {showSideBar ? '<' : '>'}
          </div>

          {/* Sidebar Content */}
          <div
            className={`h-full flex flex-col transition-all duration-500 ease-out
              ${showSideBar ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-4'}`}
          >
            {/* Header */}
            {/* <div className="p-6 border-b border-blue-200 bg-gradient-to-r from-blue-500 to-indigo-600 mt-96">
              <div className="flex items-center gap-3 text-white">
                <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
                  <Users size={20} />
                </div>
                <div>
                  <h3 className="font-semibold text-lg">Client Accounts</h3>
                  <p className="text-blue-100 text-sm">{clients.length} total accounts</p>
                </div>
              </div>
            </div> */}

            {/* Search Bar */}
            <div className="p-4 mt-18">
              <div className="relative">
                <Input
                  type="text"
                  placeholder="Search clients..."
                  value={sidebarSearch}
                  onChange={(value) => handleSidebarSearchChange(value)}
                  className="w-full pl-8 pr-4 py-2 focus:outline-none text-sm shadow-2xl"
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
                        openLedgerClient?.id === client.id
                          ? 'bg-gray-200 shadow-md transform scale-[1.02]'
                          : 'hover:bg-white/60 hover:shadow-sm'
                      }
                      ${index % 2 === 0 ? 'animate-fadeInUp' : 'animate-fadeInUp'}
                    `}
                    style={{ animationDelay: `${index * 50}ms` }}
                    onClick={() => handleClientSelect(client)}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-10 h-10 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-200
                          ${
                            openLedgerClient?.id === client.id
                              ? 'bg-gradient-to-br from-blue-400 to-indigo-500 text-white group-hover:from-blue-500 group-hover:to-indigo-600 backdrop-blur-sm'
                              : 'bg-gradient-to-br from-blue-400 to-indigo-500 text-white group-hover:from-blue-500 group-hover:to-indigo-600'
                          }
                        `}
                      >
                        {getInitials(client.clientName)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p
                          className={`font-medium truncate text-sm
                            ${openLedgerClient?.id === client.id ? 'text-black' : 'text-gray-800'}
                          `}
                        >
                          {client.clientName}
                        </p>
                        <p
                          className={`text-xs truncate
                            ${openLedgerClient?.id === client.id ? 'text-gray-500' : 'text-gray-500'}
                          `}
                        >
                          {client.accountType || 'Other'} • {toThousands(client.pendingAmount || 0)}
                        </p>
                      </div>
                    </div>

                    {/* Active indicator */}
                    {openLedgerClient?.id === client.id && (
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
      )}

      {/* Main Content with Dynamic Margin */}
      <div
        className={`transition-all duration-500 ease-out
          ${openLedgerClient && showSideBar ? 'ml-80' : openLedgerClient ? 'ml-4' : ''}
        `}
      >
        {/* Header */}
        <div className="flex justify-between mt-5 pb-2 items-center">
          {openLedgerClient ? (
            <div className="mx-7 flex items-center gap-4">
              <p
                className="text-3xl font-light cursor-pointer"
                onClick={() => setOpenLedgerClient(null)}
              >
                Ledger Report
              </p>
              <div className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white px-4 py-2 rounded-full shadow-lg">
                <span className="font-semibold text-sm">{openLedgerClient.clientName}</span>
              </div>
            </div>
          ) : (
            <p className="text-3xl font-light mx-7">Ledger Report</p>
          )}

          {!openLedgerClient && (
            <div className="mx-7 flex gap-2">
              <button
                className="flex items-center gap-2 border border-gray-300 w-fit p-1.5 px-3 rounded-lg hover:bg-gray-50 transition-all duration-200 hover:shadow-md"
                onClick={() => setImportFile(!importFile)}
              >
                <Import size={16} />
                <span className="text-sm">Import</span>
              </button>
              <button
                className="flex items-center gap-2 border border-gray-300 w-fit p-1.5 px-3 rounded-lg hover:bg-gray-50 transition-all duration-200 hover:shadow-md"
                onClick={handleExportExcel}
              >
                <FileUp size={16} />
                <span className="text-sm">Export</span>
              </button>
            </div>
          )}
        </div>

        {/* Import Excel Component */}
        {importFile && (
          <ImportExcel onFileSelected={handleImportExcel} onClose={() => setImportFile(false)} />
        )}

        {/* Loader */}
        {showLoader && <Loader />}

        {/* Statistics Cards */}
        {!openLedgerClient && (
          <div className="border border-gray-200 shadow-lg px-5 py-3 mx-6 rounded-2xl my-4 flex overflow-x-auto bg-gradient-to-r from-white to-gray-50">
            <div className="mx-5 border-r w-52 flex-shrink-0">
              <p className="text-sm font-light mb-1 text-gray-600">Total Accounts</p>
              <p className="text-2xl font-light">{statistics.totalAccounts}</p>
            </div>
            <div className="mx-5 border-r w-52 flex-shrink-0">
              <p className="text-sm font-light mb-1 text-gray-600">Total Pending</p>
              <p className="text-2xl font-light">{toThousands(statistics.totalPendingAmount)}</p>
            </div>
            <div className="mx-5 border-r w-52 flex-shrink-0">
              <p className="text-sm font-light mb-1 text-gray-600">Total Paid</p>
              <p className="text-2xl font-light">{toThousands(statistics.totalPaidAmount)}</p>
            </div>
            <div className="mx-5 w-52 flex-shrink-0">
              <p className="text-sm font-light mb-1 text-gray-600">Customers</p>
              <p className="text-2xl font-light">{statistics.accountsByType.Customer || 0}</p>
            </div>
          </div>
        )}

        <div className={`mx-7 ${openLedgerClient ? 'my-8 mt-5' : 'my-10'}`}>
          {/* Filters */}
          <div className="flex justify-between mb-5 relative">
            <div>
              <InputGroup size="md">
                <Input
                  placeholder="Search accounts..."
                  value={searchQuery || ''}
                  onChange={handleSearchChange}
                  className="rounded-xl border-2 indent-2 border-[#d4d9fb] outline-none"
                />
                <InputGroup.Button>
                  <SearchIcon />
                </InputGroup.Button>
              </InputGroup>
            </div>
            <div className="flex gap-2 items-center">
              <DateRangePicker
                format="dd/MM/yyyy"
                character=" ~ "
                placeholder="Select Date Range"
                onChange={setDateRange}
                placement="bottomEnd"
                container={() => document.body}
                className="w-[250px]"
              />
              {!openLedgerClient && (
                <div className="flex gap-2">
                  <SelectPicker
                    data={clients.map((client) => ({ value: client.id, label: client.clientName }))}
                    onChange={setClientFilter}
                    placeholder="Select Client"
                    searchable={false}
                    placement="bottomEnd"
                    container={() => document.body}
                    className="w-[200px]"
                  />
                  <SelectPicker
                    data={ACCOUNT_TYPES}
                    onChange={setAccountTypeFilter}
                    placeholder="Select Account Type"
                    searchable={false}
                    placement="bottomEnd"
                    container={() => document.body}
                    className="w-[200px]"
                  />
                </div>
              )}
            </div>
          </div>

          {/* Table */}
          {!openLedgerClient && (
            <div className="bg-white rounded-2xl shadow-lg overflow-x-auto customScrollbar max-h-screen relative border border-gray-200">
              <table className="min-w-max border-collapse text-sm">
                <thead className="bg-gradient-to-r from-gray-50 to-gray-100 sticky top-0">
                  <tr className="text-gray-700 border-b border-gray-200">
                    {TABLE_HEADERS.map((header) => (
                      <th
                        key={header.key}
                        className={`px-6 py-4 border-r border-gray-200 ${header.width} ${
                          header.sticky ? 'sticky left-0 top-0 z-5 bg-gray-100' : ''
                        } font-semibold text-left`}
                      >
                        {header.label}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="text-sm divide-y divide-gray-100">
                  {filteredData.length === 0 ? (
                    <tr className="h-96">
                      <td
                        colSpan={TABLE_HEADERS.length}
                        className="px-6 py-4 text-xl text-center text-gray-400"
                      >
                        <div className="flex flex-col items-center gap-4">
                          <Users size={48} className="opacity-30" />
                          <span>No accounts found</span>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    filteredData.map((client) => (
                      <AccountRow
                        key={client.id}
                        client={client}
                        onOpenLedger={() => setOpenLedgerClient(client)}
                      />
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Ledger Modal */}
        {openLedgerClient && (
          <AccountLedger
            client={openLedgerClient}
            onClose={() => setOpenLedgerClient(null)}
            transactions={transactions}
            toThousands={toThousands}
          />
        )}
      </div>

      {/* Custom CSS for animations */}
      <style jsx>{`
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
        .animate-fadeInUp {
          animation: fadeInUp 0.3s ease-out forwards;
        }
      `}</style>
    </div>
  )
}

export default LedgerReport
