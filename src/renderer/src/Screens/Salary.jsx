/* eslint-disable prettier/prettier */
/* eslint-disable react/display-name */
/* eslint-disable react/prop-types */
/* eslint-disable no-unused-vars */
import React, { useEffect, useMemo, useState, useCallback, memo, useRef } from 'react'
import {
  Info,
  IndianRupee,
  Receipt,
  User,
  Phone,
  MoreHorizontal,
  History,
  MapPinHouse
} from 'lucide-react'
import Loader from '../components/Loader'
import { useDispatch, useSelector } from 'react-redux'
import { deleteClient, setClients, setProducts } from '../app/features/electronSlice'
import SearchIcon from '@mui/icons-material/Search'
import { toast } from 'react-toastify'
import { SelectPicker, InputGroup, Input, Whisper, Tooltip, Modal } from 'rsuite'
import Navbar from '../components/UI/Navbar'
import { IoLogoWhatsapp } from 'react-icons/io'
import { RiLockPasswordLine } from 'react-icons/ri'

// Constants
const TABLE_HEADERS = [
  { key: 'clientName', label: 'Employee', width: 'w-[300px]', icon: User },
  { key: 'phoneNo', label: 'Phone No', width: 'w-[200px]', icon: Phone },
  { key: 'paidAmount', label: 'Amount', width: 'w-[250px]', icon: Receipt },
  { key: 'address', label: 'Address', width: 'w-[250px]', icon: MapPinHouse },
  { key: 'accountType', label: 'Account Type', width: 'w-[200px]', icon: Info },
  { key: 'action', label: 'Action', width: 'w-[150px]', icon: MoreHorizontal }
]

// Utility functions
const toThousands = (value) => {
  if (value === undefined || value === null || isNaN(value)) return '0'
  return new Intl.NumberFormat('en-IN').format(Number(value))
}

const getInitials = (name) =>
  name
    ?.split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2) || ''

// ClientRow (kept memoized)
const ClientRow = memo(({ client, onDelete, onEdit, setClientHistory, setOpen }) => {
  const clients = useSelector((state) => state.electron.clients.data || [])
  const transactions = useSelector((state) => state.electron.transaction.data || [])
  const [showPasscode, setShowPasscode] = useState(false)
  const [passcode, setPasscode] = useState(['', '', '', '', '', ''])
  const [isVerifying, setIsVerifying] = useState(false)
  const inputRefs = useRef([])
  const [salaryVisible, setSalaryVisible] = useState(false)

  const handleHistory = async (id) => {
    try {
      const bankReceipts = await window.api.getRecentBankReceipts()
      const cashReceipts = await window.api.getRecentCashReceipts()
      const filteredBankReceipts = bankReceipts.filter((receipt) => receipt.clientId === id)
      const filteredCashReceipts = cashReceipts.filter((receipt) => receipt.clientId === id)
      const combinedHistory = [...filteredBankReceipts, ...filteredCashReceipts]
      setClientHistory(combinedHistory)
      setOpen(true)
    } catch (error) {
      toast.error('Failed to fetch client details: ' + error.message)
    }
  }

  // Passcode handling (unchanged behaviour)
  const handlePasscodeChange = (index, value) => {
    if (value.length > 1) return
    if (!/^\d*$/.test(value)) return

    const newPasscode = [...passcode]
    newPasscode[index] = value
    setPasscode(newPasscode)

    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus()
    }
  }

  const handlePasscodeKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !passcode[index] && index > 0) {
      inputRefs.current[index - 1]?.focus()
    }
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && passcode.join('').length === 6) {
      handlePasscodeSubmit()
    }
  }

  const handlePasscodeSubmit = async () => {
    const code = passcode.join('')
    if (code.length !== 6) {
      toast.error('Please enter complete passcode')
      return
    }

    try {
      const response = await window.api.getAuthorization()
      if (code !== response.passcode) {
        toast.error('Incorrect passcode ❌')
        return
      }

      setIsVerifying(true)
      setSalaryVisible(true)
      toast.success('Authenticated successfully ✅')

      setTimeout(() => {
        setIsVerifying(false)
        setShowPasscode(false)
        setPasscode(['', '', '', '', '', ''])

        setTimeout(() => {
          setSalaryVisible(false)
        }, 8000)
      }, 1000)
    } catch (err) {
      toast.error('Auth error: ' + err.message)
    }
  }

  return (
    <tr className="text-sm text-center">
      <td className="px-4 py-3">
        <div className="flex items-center gap-3">
          <div className="relative group px-2">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-100 border border-indigo-200 rounded-xl flex items-center justify-center text-indigo-700 text-sm font-semibold shadow-sm transition-all duration-300 group-hover:scale-110 group-hover:shadow-md group-hover:border-indigo-300">
              {getInitials(client.clientName)}
            </div>
            <div className="absolute inset-0 bg-gradient-to-br from-blue-100 to-purple-100 rounded-xl blur opacity-0 group-hover:opacity-40 transition-opacity duration-300"></div>
          </div>
          <span className="font-medium text-gray-700 transition-colors duration-200 group-hover:text-indigo-600">
            {client.clientName}
          </span>
        </div>
      </td>

      <td className="px-4 py-3">
        {client.phoneNo === '' || client.phoneNo === null || client.phoneNo === 'undefined'
          ? '-'
          : client.phoneNo}
      </td>

      <td className="px-4 py-3 text-center">
        {/* 🔢 Passcode input (only visible when user clicks lock) */}
        {showPasscode && !isVerifying ? (
          <div className="flex gap-1 justify-center">
            {passcode.map((digit, index) => (
              <input
                key={index}
                ref={(el) => (inputRefs.current[index] = el)}
                type="text"
                inputMode="numeric"
                maxLength={1}
                value={digit}
                onChange={(e) => handlePasscodeChange(index, e.target.value)}
                onKeyDown={(e) => {
                  handlePasscodeKeyDown(index, e)
                  handleKeyDown(e)
                }}
                className="w-8 h-10 text-center text-2xl font-semibold border-2 border-gray-300 rounded-xl 
                     focus:border-black focus:outline-none focus:scale-110 bg-white/80 transition-all duration-300"
                autoFocus={index === 0}
              />
            ))}
          </div>
        ) : (
          <div className="flex justify-center">
            {!salaryVisible && !isVerifying && (
              <RiLockPasswordLine
                size={22}
                onClick={() => setShowPasscode(true)}
                className="cursor-pointer text-gray-700 hover:text-black transition-all duration-300"
              />
            )}
          </div>
        )}

        {/* ⏳ Verifying loader */}
        {isVerifying && (
          <div className="mt-2 text-xs text-gray-500 animate-pulse">Verifying...</div>
        )}

        {/* 💸 Show salary only after verification */}
        {salaryVisible && !showPasscode && !isVerifying && (
          <div className="text-base font-semibold text-gray-800">
            ₹ {Number(client.salary || 0).toLocaleString('en-IN')}
          </div>
        )}
      </td>

      <td className="px-4 py-3">
        <div className="inline-flex items-center justify-center gap-1 w-full text-sm transition-all duration-300">
          {client.address}
        </div>
      </td>

      <td className="px-4 py-3">
        <div className="inline-flex items-center justify-center gap-1 bg-gradient-to-r from-rose-50 to-red-100 text-rose-700 border border-rose-300 w-full py-1.5 rounded-full text-sm font-semibold shadow-sm hover:shadow-md transition-all duration-300">
          {client.accountType}
        </div>
      </td>

      <td className="w-28">
        <div className="flex gap-3 justify-center items-center">
          <Whisper
            trigger="hover"
            placement="top"
            speaker={
              <Tooltip
                style={{
                  backgroundColor: 'white',
                  color: 'black',
                  border: '2px solid #ccc',
                  fontWeight: 'bold',
                  padding: '6px',
                  borderRadius: '4px'
                }}
              >
                <div className="max-w-xs">
                  <p className="text-sm">History</p>
                </div>
              </Tooltip>
            }
          >
            <button
              className="group relative p-2 rounded-full bg-purple-50 text-purple-600 hover:bg-purple-100 transition-all duration-300 hover:scale-110 cursor-pointer border border-purple-400 "
              onClick={() => handleHistory(client.id)}
              title="History"
            >
              <History
                size={16}
                className="group-hover:rotate-12 transition-transform duration-300"
              />
            </button>
          </Whisper>

          <button
            className="group relative p-2 rounded-full bg-green-50 text-green-600 hover:bg-green-100 transition-all duration-300 hover:scale-110 cursor-pointer border border-green-400"
            onClick={() => {
              const clientTransactions = transactions.filter((t) => t.clientId === client.id)

              if (!clientTransactions.length) {
                toast.info('No transactions found for this client.')
                return
              }

              const targetClient = clients.find((c) => c.id === client.id)

              if (!targetClient?.phoneNo) {
                toast.error('Client phone number not available.')
                return
              }

              let message = `Hello ${targetClient.clientName},\n\nHere are your recent transaction details:\n\n`
              message += `Thank you for your business!\n- RO Team`

              const url = `https://wa.me/${targetClient.phoneNo}?text=${encodeURIComponent(message)}`
              window.open(url, '_blank')
            }}
            title="Send on WhatsApp"
          >
            <IoLogoWhatsapp
              size={18}
              className="group-hover:scale-110 transition-transform duration-300"
            />
          </button>
        </div>
      </td>
    </tr>
  )
})

// Custom hook for client operations
const useClientOperations = () => {
  const dispatch = useDispatch()

  const fetchClients = useCallback(async () => {
    try {
      const response = await window.api.getAllClients()
      dispatch(setClients(response))
    } catch (error) {
      toast.error('Failed to fetch clients: ' + error.message)
    }
  }, [dispatch])

  const fetchProducts = useCallback(async () => {
    try {
      const response = await window.api.getAllProducts()
      dispatch(setProducts(response))
    } catch (error) {
      toast.error('Failed to fetch products: ' + error.message)
    }
  }, [dispatch])

  const handleDeleteClient = useCallback(
    async (id) => {
      if (!window.confirm('Are you sure you want to delete this client?')) return
      try {
        await window.api.deleteClient(id)
        dispatch(deleteClient(id))
        toast.success('Client data deleted successfully')
      } catch (error) {
        toast.error('Failed to delete client: ' + error.message)
      }
      await fetchClients()
    },
    [dispatch, fetchClients]
  )

  const handleEditClient = useCallback(
    async (client, setSelectedClient, setIsUpdateExpense, setShowModal) => {
      try {
        const response = await window.api.getClientById(client.id)
        setSelectedClient(response)
        setIsUpdateExpense(true)
        setShowModal(true)
      } catch (error) {
        toast.error('Failed to fetch client details: ' + error.message)
      }
    },
    []
  )

  return { fetchClients, handleDeleteClient, handleEditClient, fetchProducts }
}

// Main Component
const Salary = () => {
  const dispatch = useDispatch()
  const { fetchClients, handleDeleteClient, handleEditClient, fetchProducts } =
    useClientOperations()

  // State management
  const [showLoader, setShowLoader] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [clientFilter, setClientFilter] = useState('')
  const [accountTypeFilter, setAccountTypeFilter] = useState('')
  const [open, setOpen] = useState(false)
  const [overflow, setOverflow] = useState(true)
  const [clientHistory, setClientHistory] = useState([])
  const [visibleCount, setVisibleCount] = useState(30)
  const tableContainerRef = useRef(null)
  const [showPasscode, setShowPasscode] = useState(false)
  const [passcode, setPasscode] = useState(['', '', '', '', '', ''])
  const [isVerifying, setIsVerifying] = useState(false)
  const inputRefs = useRef([])
  const [salaryVisible, setSalaryVisible] = useState(false)

  const clients = useSelector((state) => state.electron.clients.data || [])
  const transactions = useSelector((state) => state.electron.transaction.data || [])

  const ACCOUNT_TYPE_OPTIONS = [
    { label: 'Creditors', value: 'Creditors' },
    { label: 'Debtors', value: 'Debtors' }
  ]

  // Passcode handling (unchanged behaviour)
  const handlePasscodeChange = (index, value) => {
    if (value.length > 1) return
    if (!/^\d*$/.test(value)) return

    const newPasscode = [...passcode]
    newPasscode[index] = value
    setPasscode(newPasscode)

    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus()
    }
  }

  const handlePasscodeKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !passcode[index] && index > 0) {
      inputRefs.current[index - 1]?.focus()
    }
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && passcode.join('').length === 6) {
      handlePasscodeSubmit()
    }
  }

  const handlePasscodeSubmit = async () => {
    const code = passcode.join('')
    if (code.length !== 6) {
      toast.error('Please enter complete passcode')
      return
    }

    try {
      const response = await window.api.getAuthorization()
      if (code !== response.passcode) {
        toast.error('Incorrect passcode ❌')
        return
      }

      setIsVerifying(true)
      setSalaryVisible(true)
      toast.success('Authenticated successfully ✅')

      setTimeout(() => {
        setIsVerifying(false)
        setShowPasscode(false)
        setPasscode(['', '', '', '', '', ''])

        setTimeout(() => {
          setSalaryVisible(false)
        }, 8000)
      }, 1000)
    } catch (err) {
      toast.error('Auth error: ' + err.message)
    }
  }

  // Filters & derived data
  // Filter only employees and then apply search / filters
  const filteredData = useMemo(() => {
    if (!Array.isArray(clients)) return []
    const q = searchQuery.trim().toLowerCase()

    return clients.filter((data) => {
      if (data.isEmployee !== 1) return false // ensure employee only

      // Search filter
      const matchesSearch =
        !q ||
        [
          String(data.id || '').toLowerCase(),
          String(data.clientName || '').toLowerCase(),
          String(data.phoneNo || '').toLowerCase(),
          String(data.pendingAmount || '').toLowerCase(),
          String(data.paidAmount || '').toLowerCase(),
          String(data.pendingFromOurs || '').toLowerCase()
        ].some((field) => field.includes(q))

      // Client filter
      const matchesClient = !clientFilter || data.id === clientFilter

      // Date filter
      let matchesDate = true

      // Account type filter
      const matchesAccountType = !accountTypeFilter || data.accountType === accountTypeFilter

      return matchesSearch && matchesClient && matchesDate && matchesAccountType
    })
  }, [clients, searchQuery, clientFilter, accountTypeFilter])

  // Visible slice (pagination)
  const visibleData = useMemo(
    () => filteredData.slice(0, visibleCount),
    [filteredData, visibleCount]
  )

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

  useEffect(() => {
    const timer = setTimeout(() => setShowLoader(false), 500)
    return () => clearTimeout(timer)
  }, [])

  useEffect(() => {
    fetchClients()
  }, [fetchClients])

  const clientSalary = clients.find((c) => c.id === clientFilter)

  // Stats
  const statistics = useMemo(() => {
    const totalEmployees = filteredData.length
    const totalPendingAmount = filteredData.reduce(
      (sum, c) => sum + Number(c.pendingAmount || 0),
      0
    )
    const totalPaidAmount = filteredData.reduce((sum, c) => sum + Number(c.paidAmount || 0), 0)
    const totalPendingFromOurs = filteredData.reduce(
      (sum, c) => sum + Number(c.pendingFromOurs || 0),
      0
    )

    return { totalEmployees, totalPendingAmount, totalPaidAmount, totalPendingFromOurs }
  }, [filteredData])

  const handleSearchChange = useCallback((value) => {
    // rsuite Input onChange supplies value param
    setSearchQuery(typeof value === 'string' ? value : value?.target?.value || '')
  }, [])

  // helpers
  const getTransactionDetails = (id) => {
    const transaction = transactions.find((t) => t.id === id)
    return transaction?.transactionType
  }

  return (
    <div className="select-none gap-10 h-screen w-full overflow-x-auto transition-all duration-300 min-w-[720px] overflow-hidden relative">
      <div className="w-full sticky top-0 z-10">
        <Navbar />
      </div>

      {/* Header */}
      <div className="flex justify-between mt-5 pb-2 items-center px-7">
        <p className="text-3xl font-light">Salary</p>
      </div>

      {showLoader && <Loader />}

      <div className="overflow-y-auto h-screen customScrollbar px-7">
        {/* Stats */}
        <div className="bg-gradient-to-r from-slate-50 to-gray-100 border border-gray-200 rounded-2xl shadow-md px-6 py-4 my-4 flex items-center justify-start transition-all duration-300 hover:shadow-lg">
          <div className="mx-5 border-r w-52 pr-4">
            <p className="text-sm font-light">Total Employee</p>
            <p className="font-light text-sm">
              <span className="font-bold text-2xl">{statistics.totalEmployees}</span> Clients
            </p>
          </div>
        </div>

        {/* Filters */}
        <div className="flex justify-between mb-4">
          <div>
            <InputGroup size="md">
              <Input
                placeholder="Search clients..."
                value={searchQuery}
                onChange={handleSearchChange}
                className="rounded-xl border-2 indent-2 border-[#d4d9fb] outline-none"
              />
              <InputGroup.Button>
                <SearchIcon />
              </InputGroup.Button>
            </InputGroup>
          </div>

          <div className="flex gap-2">
            <SelectPicker
              data={clients.map((client) => ({
                label: client?.clientName,
                value: client?.id
              }))}
              onChange={setClientFilter}
              placeholder="Select Client"
              placement="bottomEnd"
              style={{ width: 250 }}
              searchable
              virtualized={true}
              container={() => document.body}
            />
            <SelectPicker
              data={ACCOUNT_TYPE_OPTIONS}
              onChange={setAccountTypeFilter}
              placeholder="Select Account Type"
              placement="bottomEnd"
              searchable={false}
              style={{ width: 200 }}
              container={() => document.body}
            />
          </div>
        </div>

        {/* Table */}
        <div
          ref={tableContainerRef}
          className="overflow-x-auto customScrollbar border border-gray-200 rounded-2xl h-[60vh]"
        >
          <table className="min-w-max table-fixed w-full">
            <thead className="relative z-20">
              <tr className="text-sm sticky top-0 z-20 bg-gradient-to-r from-gray-50 to-gray-100">
                {TABLE_HEADERS.map((header) => {
                  const IconTable = header.icon
                  return (
                    <th
                      key={header.key}
                      className={`px-4 py-3 border-b border-gray-300 ${header.width} text-center`}
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
                    colSpan={TABLE_HEADERS.length}
                    className="text-center font-light tracking-wider text-gray-500 text-lg"
                  >
                    No Data Found
                  </td>
                </tr>
              ) : (
                visibleData.map((client) => (
                  <ClientRow
                    key={client.id}
                    client={client}
                    onDelete={handleDeleteClient}
                    setOpen={setOpen}
                    setClientHistory={setClientHistory}
                  />
                ))
              )}
            </tbody>
          </table>
        </div>

        {filteredData.length > visibleCount && (
          <div className="flex justify-center mt-4">
            <button
              className="px-5 py-2 bg-yellow-500 hover:bg-yellow-600 text-white rounded-lg transition-all"
              onClick={() => setVisibleCount((prev) => prev + 10)}
            >
              Load More
            </button>
          </div>
        )}
      </div>

      {/* Transactions Modal */}
      <Modal
        overflow={overflow}
        open={open}
        onClose={() => setOpen(false)}
        size="md"
        className="modern-history-modal"
      >
        <Modal.Header className="py-2">
          <div className="flex items-center gap-3">
            <div>
              <Modal.Title>
                <p className="text-2xl font-medium">Salary History</p>
              </Modal.Title>
            </div>
          </div>
        </Modal.Header>

        <Modal.Body>
          {clientHistory.length > 0 ? (
            <>
              <div className="pb-4 space-y-3 max-h-[400px] overflow-auto customScrollbar">
                <div className="bg-white rounded-2xl shadow-md border border-gray-200 transition-all duration-300 hover:shadow-lg">
                  <table className="min-w-full border-collapse text-sm">
                    <thead className="bg-gradient-to-r from-gray-50 to-gray-100 sticky top-0 z-10">
                      <tr className="text-gray-700">
                        <th className="px-6 py-3 border-b font-semibold text-left w-[120px]">
                          Date
                        </th>
                        <th className="px-6 py-3 border-b font-semibold text-left w-[150px]">
                          Amount
                        </th>
                        <th className="px-6 py-3 border-b font-semibold text-left w-[150px]">
                          Description
                        </th>
                        <th className="px-6 py-3 border-b font-semibold text-left w-[150px]">
                          Status
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {clientHistory.length === 0 ? (
                        <tr>
                          <td colSpan={4}>
                            <div className="text-center py-10 text-gray-500 italic">
                              No transaction history found.
                            </div>
                          </td>
                        </tr>
                      ) : (
                        clientHistory.map((t, idx) => {
                          const txType = getTransactionDetails(t.transactionId)
                          return (
                            <tr
                              key={idx}
                              className="hover:bg-gray-50 transition-colors duration-200"
                            >
                              <td className="px-6 py-3 text-gray-800">
                                {new Date(t.createdAt || t.date).toLocaleDateString('en-IN', {
                                  day: '2-digit',
                                  month: 'short',
                                  year: 'numeric'
                                })}
                              </td>
                              <td className="px-6 py-3 font-medium text-gray-800">
                                {/* 🔢 Passcode input (only visible when user clicks lock) */}
                                {showPasscode && !isVerifying ? (
                                  <div className="flex gap-1">
                                    {passcode.map((digit, index) => (
                                      <input
                                        key={index}
                                        ref={(el) => (inputRefs.current[index] = el)}
                                        type="text"
                                        inputMode="numeric"
                                        maxLength={1}
                                        value={digit}
                                        onChange={(e) =>
                                          handlePasscodeChange(index, e.target.value)
                                        }
                                        onKeyDown={(e) => {
                                          handlePasscodeKeyDown(index, e)
                                          handleKeyDown(e)
                                        }}
                                        className="w-8 h-9 text-center text-2xl font-semibold border-2 border-gray-300 rounded-xl 
                     focus:border-black focus:outline-none focus:scale-110 bg-white/80 transition-all duration-300"
                                        autoFocus={index === 0}
                                      />
                                    ))}
                                  </div>
                                ) : (
                                  <div className="flex">
                                    {!salaryVisible && !isVerifying && (
                                      <RiLockPasswordLine
                                        size={22}
                                        onClick={() => setShowPasscode(true)}
                                        className="cursor-pointer text-gray-700 hover:text-black transition-all duration-300"
                                      />
                                    )}
                                  </div>
                                )}
                                {/* ⏳ Verifying loader */}
                                {isVerifying && (
                                  <div className="mt-2 text-xs text-gray-500 animate-pulse">
                                    Verifying...
                                  </div>
                                )}
                                {/* 💸 Show salary only after verification */}
                                {salaryVisible && !showPasscode && !isVerifying && (
                                  <div className="text-base font-semibold text-gray-800">
                                    ₹{toThousands(t.amount) || '-'}
                                  </div>
                                )}
                              </td>
                              <td className="px-6 py-3 font-medium text-gray-800">
                                {t.description || '-'}
                              </td>
                              <td className="px-6 py-3 flex items-center gap-2 relative">
                                <span
                                  className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-semibold shadow-sm ${t.statusOfTransaction === 'pending' ? 'bg-orange-50 text-orange-300 ring-1 ring-orange-200' : 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200'}`}
                                >
                                  <span
                                    className={`h-2 w-2 rounded-full ${t.statusOfTransaction === 'pending' ? 'bg-orange-300' : 'bg-emerald-500'}`}
                                  />
                                  {String(t.statusOfTransaction).charAt(0).toUpperCase() +
                                    String(t.statusOfTransaction).slice(1)}
                                </span>
                              </td>
                            </tr>
                          )
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          ) : (
            <div className="flex items-center justify-center h-full">
              <p className="text-gray-500 w-full rounded-xl h-32 flex items-center justify-center text-xl">
                No Transactions Found
              </p>
            </div>
          )}
        </Modal.Body>
      </Modal>
    </div>
  )
}

export default Salary
