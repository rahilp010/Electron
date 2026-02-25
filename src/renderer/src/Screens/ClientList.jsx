/* eslint-disable prettier/prettier */
/* eslint-disable react/no-unknown-property */
/* eslint-disable react/display-name */
/* eslint-disable react/prop-types */
/* eslint-disable no-unused-vars */
import React, { useEffect, useMemo, useState, useCallback, memo, useRef } from 'react'
import {
  Trash,
  PenLine,
  Plus,
  Import,
  FileUp,
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
  ChevronUp,
  ChevronDown
} from 'lucide-react'
import Loader from '../components/Loader'
import { useDispatch, useSelector } from 'react-redux'
import { deleteClient, setClients, setProducts } from '../app/features/electronSlice'
import SearchIcon from '@mui/icons-material/Search'
import { toast } from 'react-toastify'
import { DateRangePicker, SelectPicker, InputGroup, Input, Whisper, Tooltip, Modal } from 'rsuite'
import ClientModal from '../components/Modal/ClientModal'
import Navbar from '../components/UI/Navbar'
import * as XLSX from 'xlsx'
import ImportExcel from '../components/UI/ImportExcel'
import { IoLogoWhatsapp } from 'react-icons/io'
import purchase from '../assets/purchase.png'

// Constants
const TABLE_HEADERS = [
  // { key: 'id', label: 'ID', width: 'w-[80px]', sticky: true },
  { key: 'date', label: 'Date', width: 'w-[120px]', icon: Calendar1, sortable: true },
  { key: 'clientName', label: 'Client Name', width: 'w-[500px]', icon: User, sortable: true },
  { key: 'gstNo', label: 'GST No', width: 'w-[200px]', icon: Package, sortable: true },
  { key: 'phoneNo', label: 'Phone No', width: 'w-[200px]', icon: Phone, sortable: true },
  {
    key: 'pendingAmount',
    label: 'Pending Payment',
    width: 'w-[200px]',
    icon: TrendingUp,
    sortable: true
  },
  { key: 'paidAmount', label: 'Paid Amount', width: 'w-[200px]', icon: Receipt, sortable: true },
  { key: 'pendingFromOurs', label: 'Our Pendings', width: 'w-[200px]', icon: Box, sortable: true },
  { key: 'accountType', label: 'Account Type', width: 'w-[200px]', icon: Info, sortable: true },
  {
    key: 'totalWorth',
    label: 'Total Worth',
    width: 'w-[200px]',
    icon: IndianRupee,
    sortable: true
  },
  { key: 'action', label: 'Action', width: 'w-[150px]', icon: MoreHorizontal }
]

// Utility functions
const toThousands = (value) => {
  if (!value || isNaN(value)) return '0'
  return new Intl.NumberFormat('en-IN').format(Number(value))
}
const formatClientId = (id) => {
  return id ? `RO${String(id).slice(-3).toUpperCase()}` : 'RO---'
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
const calculateLoss = (pendingFromOurs, pendingAmount) => {
  return Number(pendingFromOurs || 0) + Number(pendingAmount || 0)
}
const calculateTotalWorth = (pendingFromOurs, pendingAmount, paidAmount) => {
  return (
    Number(pendingFromOurs || 0) +
    Number(pendingAmount || 0) +
    (Number(paidAmount || 0) - Number(pendingFromOurs || 0))
  )
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

// Helper for sorting values
const getSortValue = (item, key) => {
  switch (key) {
    case 'totalWorth':
      return calculateTotalWorth(item.pendingFromOurs, item.pendingAmount, item.paidAmount)
    case 'date':
      return new Date(item.createdAt)
    default:
      const val = item[key]
      if (typeof val === 'string') {
        return val.toLowerCase()
      }
      return Number(val) || 0
  }
}

// Memoized ClientRow component
const ClientRow = memo(({ client, index, onDelete, onEdit, setClientHistory, setOpen }) => {
  const isEven = index % 2 === 0
  const rowBg = isEven ? 'bg-white' : 'bg-[#f0f0f0]'
  const clients = useSelector((state) => state.electron.clients.data || [])
  const products = useSelector((state) => state.electron.products.data || [])
  const transactions = useSelector((state) => state.electron.transaction.data || [])
  const handleHistory = async (id) => {
    try {
      const purchaseData = await window.api.getAllPurchases()
      const saleData = await window.api.getAllSales()
      const fetchData = await window.api.getLedgerByAccount()

      const transactions = [...purchaseData.data, ...saleData.data]

      setClientHistory(transactions)
    } catch (error) {
      toast.error('Failed to fetch client details: ' + error.message)
    }
  }
  return (
    <tr className={`text-sm text-center`}>
      <td className="px-4 py-3">
        {new Date(client.createdAt).toLocaleDateString('en-IN', {
          day: '2-digit',
          month: 'short',
          year: 'numeric'
        })}
      </td>
      <td className="px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3 px-6">
          <div className="relative group">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-100 border border-indigo-200 rounded-xl flex items-center justify-center text-indigo-700 text-sm font-semibold shadow-sm transition-all duration-300 group-hover:scale-110 group-hover:shadow-md group-hover:border-indigo-300">
              {getInitials(client.clientName)}
            </div>
            <div className="absolute inset-0 bg-gradient-to-br from-blue-100 to-purple-100 rounded-xl blur opacity-0 group-hover:opacity-40 transition-opacity duration-300"></div>
          </div>
          <span className="font-medium text-gray-700 transition-colors duration-200 group-hover:text-indigo-600">
            {client.clientName}
          </span>
        </div>
        <Whisper
          trigger="hover"
          placement="left"
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
          <Info
            size={16}
            className="text-[#897ee8] cursor-pointer hover:scale-110 transition-all duration-300"
            onClick={() => {
              setOpen(true)
              handleHistory(client.id)
            }}
          />
        </Whisper>
      </td>
      <td className="px-4 py-3 uppercase">
        {client.gstNo === '' || client.gstNo === null || client.gstNo === undefined
          ? '-'
          : client.gstNo}
      </td>
      <td className="px-4 py-3">
        {client.phoneNo === '' || client.phoneNo === null || client.phoneNo === 'undefined'
          ? '-'
          : client.phoneNo}
      </td>
      <td className="px-4 py-3">
        <div className="inline-flex items-center justify-center gap-1 bg-gradient-to-r from-yellow-50 to-amber-100 text-amber-700 border border-amber-300 w-full py-1.5 rounded-full text-sm font-semibold shadow-sm hover:shadow-md transition-all duration-300 ">
          ₹ {toThousands(Number(client.pendingAmount).toFixed(0))}
        </div>
      </td>
      <td className="px-4 py-3">
        <div className="inline-flex items-center justify-center gap-1 bg-gradient-to-r from-indigo-50 to-indigo-100 text-indigo-700 border border-indigo-300 w-full py-1.5 rounded-full text-sm font-semibold shadow-sm hover:shadow-md transition-all duration-300">
          ₹ {toThousands(Number(client.paidAmount).toFixed(0))}
        </div>
      </td>
      <td className="px-4 py-3">
        <div className="inline-flex items-center justify-center gap-1 bg-gradient-to-r from-emerald-50 to-green-100 text-emerald-700 border border-emerald-300 w-full py-1.5 rounded-full text-sm font-semibold shadow-sm hover:shadow-md transition-all duration-300">
          ₹ {toThousands(Number(client.pendingFromOurs).toFixed(0))}
        </div>
      </td>
      <td className="px-4 py-3">
        <div className="inline-flex items-center justify-center gap-1 bg-gradient-to-r from-rose-50 to-red-100 text-rose-700 border border-rose-300 w-full py-1.5 rounded-full text-sm font-semibold shadow-sm hover:shadow-md transition-all duration-300">
          {client.accountType}
        </div>
      </td>
      <td className="px-4 py-3 font-semibold">
        <div className="inline-flex items-center justify-center gap-1 bg-gradient-to-r from-slate-50 to-gray-100 text-gray-700 border border-gray-300 w-full py-1.5 rounded-full text-sm font-semibold shadow-sm hover:shadow-md transition-all duration-300">
          ₹{' '}
          {toThousands(
            calculateTotalWorth(client.pendingFromOurs, client.pendingAmount, client.paidAmount)
          )}
        </div>
      </td>
      <td className="w-28">
        <div className="flex gap-3 justify-center items-center">
          <button
            className="group relative p-2 rounded-full bg-purple-50 text-purple-600 hover:bg-purple-100 transition-all duration-300 hover:scale-110 cursor-pointer border border-purple-400 "
            onClick={() => onEdit(client)}
            title="Edit client"
          >
            <PenLine
              size={14}
              className="group-hover:rotate-12 transition-transform duration-300"
            />
          </button>
          <button
            className="group relative p-2 rounded-full bg-red-50 text-red-600 hover:bg-red-100 transition-all duration-300 hover:scale-110 cursor-pointer border border-red-400"
            onClick={() => onDelete(client.id)}
            title="Delete client"
          >
            <Trash size={14} className="group-hover:rotate-12 transition-transform duration-300" />
          </button>
          <button
            className="group relative p-2 rounded-full bg-green-50 text-green-600 hover:bg-green-100 transition-all duration-300 hover:scale-110 cursor-pointer border border-green-400"
            onClick={() => {
              // Get all transactions for this client
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
              // Build a WhatsApp message
              let message = `Hello ${targetClient.clientName},\n\nHere are your recent transaction details:\n\n`
              clientTransactions.forEach((t, index) => {
                const productName = getProductName(t.productId, products)
                const amount = toThousands(Number(t.sellAmount).toFixed(0))
                message += `${index + 1}. 📦 ${productName}\n💰 ₹${amount}\n📅 ${new Date(
                  t.createdAt
                ).toLocaleDateString('en-IN')}\n\n`
              })
              message += `Thank you for your business!\n- RO Team`
              // Open WhatsApp with the encoded message
              const url = `https://wa.me/${targetClient.phoneNo}?text=${encodeURIComponent(message)}`
              window.open(url, '_blank')
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
        const response = await window.api.deleteClient(id)
        dispatch(deleteClient(response))
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
const ClientList = () => {
  const dispatch = useDispatch()
  const { fetchClients, handleDeleteClient, handleEditClient, fetchProducts } =
    useClientOperations()
  // State management
  const [showLoader, setShowLoader] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [selectedClient, setSelectedClient] = useState(null)
  const [isUpdateExpense, setIsUpdateExpense] = useState(false)
  const [dateRange, setDateRange] = useState([])
  const [clientFilter, setClientFilter] = useState('')
  const [accountTypeFilter, setAccountTypeFilter] = useState('')
  const [importFile, setImportFile] = useState(false)
  const [open, setOpen] = useState(false)
  const [overflow, setOverflow] = useState(true)
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' })
  const [clientHistory, setClientHistory] = useState([])
  const [visibleCount, setVisibleCount] = useState(30)
  const tableContainerRef = useRef(null)
  const clients = useSelector((state) => state.electron.clients.data || [])
  const products = useSelector((state) => state.electron.products.data || [])
  const transactions = useSelector((state) => state.electron.transaction.data || [])
  const TABLE_HEADERS_HISTORY = [
    { key: 'date', label: 'Date', width: 'w-[100px]', icon: Calendar1 },
    { key: 'product', label: 'Product', width: 'w-[150px]', icon: Package },
    { key: 'quantity', label: 'Quantity', width: 'w-[50px]', icon: Box },
    { key: 'amount', label: 'Amount', width: 'w-[50px]', icon: TrendingUp },
    { key: 'status', label: 'Status', width: 'w-[50px]', icon: TrendingUp }
  ]
  const ACCOUNT_TYPE_OPTIONS = [
    { label: 'Creditor', value: 'Creditor' },
    { label: 'Debtor', value: 'Debtor' }
  ]
  // Memoized filtered data
  const filteredData = useMemo(() => {
    if (!Array.isArray(clients)) return []
    const query = searchQuery.toLowerCase()
    let filtered = clients.filter((data) => {
      const matchesSearch =
        !query ||
        [
          data?.id?.toString(),
          data?.clientName?.toLowerCase(),
          data?.phoneNo?.toString(),
          data?.pendingAmount?.toString(),
          data?.paidAmount?.toString(),
          data?.pendingFromOurs?.toString()
        ].some((field) => field?.includes(query))
      const matchesClient = !clientFilter || data.id === clientFilter
      let matchesDate = true
      if (dateRange?.length === 2) {
        const createdDate = new Date(data.createdAt)
        const [start, end] = dateRange
        matchesDate = createdDate >= new Date(start) && createdDate <= new Date(end)
      }
      // Account type filter
      const matchesAccountType = !accountTypeFilter || data.accountType === accountTypeFilter
      return matchesSearch && matchesClient && matchesDate && matchesAccountType
    })
    if (sortConfig.key) {
      filtered = [...filtered].sort((a, b) => {
        const aVal = getSortValue(a, sortConfig.key)
        const bVal = getSortValue(b, sortConfig.key)
        if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1
        if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1
        return 0
      })
    }
    return filtered
  }, [clients, searchQuery, clientFilter, dateRange, accountTypeFilter, sortConfig])
  const handleSort = useCallback((key) => {
    setSortConfig((prev) => {
      if (prev.key === key) {
        // toggle direction
        return { key, direction: prev.direction === 'asc' ? 'desc' : 'asc' }
      }
      return { key, direction: 'asc' }
    })
    // Reset visible count when sorting to start from top
    setVisibleCount(30)
  }, [])
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
    const totalAssets = filteredData.reduce(
      (sum, client) =>
        sum +
        Number(
          calculateTotalWorth(client.pendingFromOurs, client.pendingAmount, client.paidAmount) || 0
        ),
      0
    )
    const totalProducts = filteredData.length
    const totalPendingAmount = filteredData.reduce(
      (sum, client) => sum + Number(client.pendingAmount || 0),
      0
    )
    const totalPaidAmount = filteredData.reduce(
      (sum, client) => sum + Number(client.paidAmount || 0),
      0
    )
    const totalPaidAmountWithTax = transactions
      .filter((t) => t.clientName === clients.clientName)
      .reduce((sum, t) => sum + (Number(t.totalAmount) || 0), 0)
    const totalPendingFromOurs = filteredData.reduce(
      (sum, client) => sum + Number(client.pendingFromOurs || 0),
      0
    )
    return {
      totalAssets,
      totalProducts,
      totalPendingAmount,
      totalPaidAmountWithTax,
      totalPaidAmount,
      totalPendingFromOurs
    }
  }, [filteredData, clients, transactions])
  // Event handlers
  const handleAddClient = useCallback(async () => {
    setSelectedClient(null)
    setIsUpdateExpense(false)
    setShowModal(true)
  }, [])
  const handleSearchChange = useCallback((value) => {
    setSearchQuery(value)
  }, [])
  const handleImportExcel = useCallback(
    async (filePath) => {
      try {
        const result = await window.api.importExcel(filePath, 'clients')
        if (result.success) {
          toast.success(`Imported ${result.count} rows successfully`)
          await fetchClients()
          setImportFile(false)
        } else {
          toast.error(`Import failed: ${result.error}`)
        }
      } catch (error) {
        toast.error('Failed to import Excel: ' + error.message)
      }
    },
    [fetchClients]
  )
  const handleExportExcel = useCallback(() => {
    try {
      const exportData = filteredData.map((client) => ({
        ID: formatClientId(client.id),
        Date: new Date(client.createdAt).toLocaleDateString(),
        'Client Name': client.clientName,
        'Phone No': client.phoneNo || '-',
        'Pending Amount': client.pendingAmount,
        'Paid Amount': client.paidAmount,
        'Pending From Ours': client.pendingFromOurs,
        Loss: calculateLoss(client.pendingFromOurs, client.pendingAmount),
        'Total Worth': calculateTotalWorth(
          client.pendingFromOurs,
          client.pendingAmount,
          client.paidAmount
        )
      }))
      const ws = XLSX.utils.json_to_sheet(exportData)
      const wb = XLSX.utils.book_new()
      XLSX.utils.book_append_sheet(wb, ws, 'Clients')
      XLSX.writeFile(wb, `clients_${new Date().toISOString().split('T')[0]}.xlsx`)
      toast.success('Data exported successfully')
    } catch (error) {
      toast.error('Failed to export data: ' + error.message)
    }
  }, [filteredData])
  // Effects
  useEffect(() => {
    const timer = setTimeout(() => setShowLoader(false), 500)
    return () => clearTimeout(timer)
  }, [])
  useEffect(() => {
    fetchClients()
  }, [fetchClients])
  const getTransactionDetails = (id) => {
    const transaction = clientHistory.filter((history) => history.pageName === 'Purchase')

    return transaction
  }
  return (
    <div className="select-none gap-10 h-screen w-full overflow-x-auto transition-all duration-300 min-w-[720px] overflow-hidden relative">
      <div className="w-full sticky top-0 z-10">
        <Navbar />
      </div>
      {/* Header */}
      <div className="flex justify-between mt-5 pb-2 items-center">
        <p className="text-3xl font-light mx-7">Clients</p>
        <div className="mx-7 flex gap-2">
          <button
            className="flex items-center gap-2 border border-gray-300 w-fit p-1.5 px-3 rounded-sm hover:bg-black hover:text-white transition-all duration-300 hover:scale-105 cursor-pointer"
            onClick={() => setImportFile(!importFile)}
          >
            <Import size={16} />
            <span className="text-sm">Import</span>
          </button>
          <button
            className="flex items-center gap-2 border border-gray-300 w-fit p-1.5 px-3 rounded-sm hover:bg-black hover:text-white transition-all duration-300 hover:scale-105 cursor-pointer"
            onClick={handleExportExcel}
          >
            <FileUp size={16} />
            <span className="text-sm">Export</span>
          </button>
          <button
            className="text-black flex items-center cursor-pointer gap-1 border border-gray-300 w-fit p-1 px-3 rounded-sm hover:bg-black hover:text-white transition-all duration-300 hover:scale-105"
            onClick={handleAddClient}
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
            <p className="text-sm font-light">Total Assets Value</p>
            <p className="text-2xl ">₹ {toThousands(statistics.totalAssets)}</p>
          </div>
          <div className="mx-5 border-r w-52">
            <p className="text-sm font-light">Total Clients</p>
            <p className="font-light text-sm">
              <span className="font-bold text-2xl">{statistics.totalProducts}</span> Clients
            </p>
          </div>
          <div className="mx-5 border-r w-52">
            <p className="text-sm font-light">Total Pending Amount</p>
            <p className="font-light text-sm">
              <span className=" text-2xl">₹ {toThousands(statistics.totalPendingAmount)}</span>
            </p>
          </div>
          <div className="mx-5 w-52">
            <p className="text-sm font-light">Total Pending From Ours</p>
            <p className="font-light text-sm">
              <span className=" text-2xl">₹ {toThousands(statistics.totalPendingFromOurs)}</span>
            </p>
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
                  placement="bottomEnd"
                  style={{ width: 250 }}
                  searchable
                  virtualized={true}
                  container={() => document.body}
                  menuStyle={{ zIndex: 99999, position: 'absolute' }}
                />
                <SelectPicker
                  data={ACCOUNT_TYPE_OPTIONS}
                  onChange={setAccountTypeFilter}
                  placeholder="Select Account Type"
                  placement="bottomEnd"
                  searchable={false}
                  style={{ width: 150 }}
                  container={() => document.body}
                  menuStyle={{ zIndex: 99999, position: 'absolute' }}
                />
              </div>
            </div>
            {/* Table */}
            <div
              ref={tableContainerRef}
              className="overflow-x-auto customScrollbar border border-gray-200 rounded-2xl h-screen mt-5"
            >
              <table className="min-w-max table-fixed">
                <thead className="relative z-20">
                  <tr className="text-sm sticky top-0 z-20 bg-gradient-to-r from-gray-50 to-gray-100">
                    {TABLE_HEADERS.map((header) => {
                      const IconTable = header.icon
                      const isActive = sortConfig.key === header.key
                      const arrow =
                        isActive && header.sortable ? (
                          sortConfig.direction === 'asc' ? (
                            <ChevronUp size={14} />
                          ) : (
                            <ChevronDown size={14} />
                          )
                        ) : (
                          ''
                        )
                      return (
                        <th
                          key={header.key}
                          className={`px-4 py-3 border-b border-gray-300 ${header.width} ${
                            header.sticky
                          } bg-transparent ${header.sortable ? 'cursor-pointer select-none' : ''}`}
                          onClick={() => header.sortable && handleSort(header.key)}
                          title={header.sortable ? 'Click to sort' : ''}
                        >
                          <div className="flex items-center justify-center gap-2">
                            <IconTable size={16} className="text-gray-500" />
                            <span>{header.label}</span>
                            {header.sortable && (
                              <span
                                className={`text-xs transition-all duration-200 ${
                                  isActive ? 'opacity-100' : 'opacity-30'
                                }`}
                              >
                                {arrow}
                              </span>
                            )}
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
                    visibleData.map((client, index) => (
                      <ClientRow
                        key={client.id}
                        client={client}
                        index={index}
                        onDelete={handleDeleteClient}
                        setOpen={setOpen}
                        setClientHistory={setClientHistory}
                        onEdit={(client) =>
                          handleEditClient(
                            client,
                            setSelectedClient,
                            setIsUpdateExpense,
                            setShowModal
                          )
                        }
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
        <ClientModal
          setShowModal={setShowModal}
          existingClient={selectedClient}
          isUpdateExpense={isUpdateExpense}
          type="client"
        />
      )}
      <Modal
        overflow={overflow}
        open={open}
        onClose={() => setOpen(false)}
        size="lg"
        className="modern-history-modal"
      >
        <Modal.Header className="py-2">
          <div className="flex items-center gap-3">
            <div>
              <Modal.Title>
                <p className="text-2xl font-medium">Transaction History</p>
              </Modal.Title>
              <p className="text-xs font-light text-gray-500 mt-0.5 mx-1">
                <span className="font-bold text-red-500">{clientHistory?.length}</span> Transaction
                {clientHistory?.length !== 1 ? 's' : ''} Found
              </p>
            </div>
          </div>
        </Modal.Header>
        <Modal.Body>
          {clientHistory?.length > 0 ? (
            <>
              {/* Summary Card */}
              <div className="bg-gradient-to-br from-orange-50 to-red-50 border-b-2 border-orange-200 p-2 px-6 mx-4 rounded-2xl shadow-lg overflow-y-auto customScrollbar">
                <div className="grid grid-cols-4 items-center justify-between">
                  <div>
                    <p className="text-xs text-gray-600 font-medium mb-1">Total Paid Amount</p>
                    <div className="flex items-center gap-2">
                      <IndianRupee size={24} className="text-orange-600" />
                      <h2 className="text-2xl font-bold bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-transparent">
                        {toThousands(clientHistory.reduce((total, t) => total + t.paidAmount, 0))}
                      </h2>
                    </div>
                  </div>
                  <div>
                    <p className="text-xs text-gray-600 font-medium mb-1">Total Pending Amount</p>
                    <div className="flex items-center gap-2">
                      <IndianRupee size={24} className="text-orange-600" />
                      <h2 className="text-2xl font-bold bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-transparent">
                        {toThousands(
                          clientHistory.reduce((total, t) => total + t.pendingAmount, 0)
                        )}
                      </h2>
                    </div>
                  </div>
                  <div>
                    <p className="text-xs text-gray-600 font-medium mb-1">
                      Total Pending From Ours
                    </p>
                    <div className="flex items-center gap-2">
                      <IndianRupee size={24} className="text-orange-600" />
                      <h2 className="text-2xl font-bold bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-transparent">
                        {toThousands(
                          clientHistory
                            .filter((f) => f.statusOfTransaction === 'pending')
                            .reduce((total, t) => total + t.pendingFromOurs, 0)
                        )}
                      </h2>
                    </div>
                  </div>
                </div>
              </div>
              {/* Transaction List */}
              <div className="px-4 pb-4 space-y-3 max-h-[400px] my-5">
                <div className="bg-white rounded-2xl shadow-md border border-gray-200 transition-all duration-300 hover:shadow-lg">
                  <table className="min-w-full border-collapse text-sm">
                    {/* Table Header */}
                    <thead className="bg-gradient-to-r from-gray-50 to-gray-100 sticky top-0 z-10">
                      <tr className="text-gray-700">
                        {TABLE_HEADERS_HISTORY.map((header) => {
                          const Icon = header.icon
                          return (
                            <th
                              key={header.key}
                              className={`px-6 py-3 border-b border-gray-200 ${header.width} font-semibold text-left`}
                            >
                              <div className="flex items-center gap-2">
                                <Icon size={16} className="text-gray-500" />
                                <span className="tracking-wide">{header.label}</span>
                              </div>
                            </th>
                          )
                        })}
                      </tr>
                    </thead>
                    {/* Table Body */}
                    <tbody className="divide-y divide-gray-100">
                      {clientHistory.length === 0 ? (
                        <tr>
                          <td colSpan={TABLE_HEADERS_HISTORY.length}>
                            <div className="text-center py-10 text-gray-500 italic">
                              No transaction history found.
                            </div>
                          </td>
                        </tr>
                      ) : (
                        clientHistory.map((t, index) => (
                          <tr
                            key={index}
                            className="hover:bg-gray-50 transition-colors duration-200"
                          >
                            {/* Date */}
                            <td className="px-6 py-3 text-gray-800">
                              {new Date(t.createdAt || t.date).toLocaleDateString('en-IN', {
                                day: '2-digit',
                                month: 'short',
                                year: 'numeric'
                              })}
                            </td>
                            {/* Product */}
                            <td className="px-6 py-3 text-gray-700">
                              {t.productId
                                ? getProductName(t.productId, products)
                                : t.description || '-'}
                            </td>
                            {/* Quantity */}
                            <td className="px-6 py-3 font-medium text-gray-800">
                              {t.quantity || '-'}
                            </td>
                            <td className="px-6 py-3 font-medium text-gray-800">
                              {t.isMultiProduct === 1 ? (
                                <span className="inline-flex items-center justify-center min-w-[3rem] bg-gradient-to-r from-slate-100 to-gray-100 border border-gray-200 px-3 py-1.5 rounded-full text-sm font-semibold text-gray-700 shadow-sm">
                                  {t[0]?.multipleProducts?.map((p) => (
                                    <span key={p.id}>
                                      {p.name} x {p.quantity}
                                    </span>
                                  ))}
                                </span>
                              ) : (
                                <span className="inline-flex items-center justify-center w-full bg-gradient-to-r from-slate-100 to-gray-100 border border-gray-200 px-3 py-1.5 rounded-full text-sm font-semibold text-gray-700 shadow-sm">
                                  ₹{toThousands(t.totalAmountWithTax) || '-'}
                                </span>
                              )}
                            </td>
                            {/* Status */}
                            <td className="px-6 py-3 flex items-center gap-2 relative">
                              <span
                                className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-semibold shadow-sm ${
                                  t.statusOfTransaction === 'pending'
                                    ? 'bg-orange-50 text-orange-300 ring-1 ring-orange-200'
                                    : 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200'
                                }`}
                              >
                                <span
                                  className={`h-2 w-2 rounded-full ${
                                    t.statusOfTransaction === 'pending'
                                      ? 'bg-orange-300'
                                      : 'bg-emerald-500'
                                  }`}
                                ></span>
                                {String(t.statusOfTransaction).charAt(0).toUpperCase() +
                                  String(t.statusOfTransaction).slice(1)}
                              </span>
                              {/* <span className="absolute right-8">
                                {getTransactionDetails(t.transactionId) ? (
                                  <img
                                    src={purchase}
                                    className="w-7 h-7 border rounded-full p-1 border-[#ccc]"
                                  />
                                ) : (
                                  ''
                                )}
                              </span> */}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          ) : (
            <div className="flex items-center justify-center h-full">
              <p className="text-gray-500 border w-full rounded-xl h-32 flex items-center justify-center text-xl">
                No Transactions Found
              </p>
            </div>
          )}
        </Modal.Body>
        <style jsx>{`
          @keyframes fadeIn {
            from {
              opacity: 0;
              transform: translateY(10px);
            }
            to {
              opacity: 1;
              transform: translateY(0);
            }
          }
          .custom-scrollbar::-webkit-scrollbar {
            width: 8px;
          }
          .custom-scrollbar::-webkit-scrollbar-track {
            background: #f1f1f1;
            border-radius: 10px;
          }
          .custom-scrollbar::-webkit-scrollbar-thumb {
            background: linear-gradient(180deg, #3b82f6, #8b5cf6);
            border-radius: 10px;
          }
          .custom-scrollbar::-webkit-scrollbar-thumb:hover {
            background: linear-gradient(180deg, #2563eb, #7c3aed);
          }
        `}</style>
      </Modal>
    </div>
  )
}
export default ClientList
