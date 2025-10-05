/* eslint-disable react/no-unknown-property */
/* eslint-disable react/display-name */
/* eslint-disable react/prop-types */
/* eslint-disable no-unused-vars */
import React, { useEffect, useMemo, useState, useCallback, memo } from 'react'
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
  Box
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
import fs from 'fs'
import ImportExcel from '../components/UI/ImportExcel'

// Constants
const TABLE_HEADERS = [
  { key: 'id', label: 'ID', width: 'w-[80px]', sticky: true },
  { key: 'date', label: 'Date', width: 'w-[150px]' },
  { key: 'clientName', label: 'Client Name', width: 'w-[300px]' },
  { key: 'gstNo', label: 'GST No', width: 'w-[200px]' },
  { key: 'phoneNo', label: 'Phone No', width: 'w-[200px]' },
  { key: 'pendingAmount', label: 'Pending Payment', width: 'w-[170px]' },
  { key: 'paidAmount', label: 'Paid Amount', width: 'w-[170px]' },
  { key: 'pendingFromOurs', label: 'Our Pendings', width: 'w-[150px]' },
  { key: 'accountType', label: 'Account Type', width: 'w-[150px]' },
  { key: 'totalWorth', label: 'Total Worth', width: 'w-[150px]' },
  { key: 'action', label: 'Action', width: 'w-[150px]' }
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
      .toUpperCase() || ''
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

// Memoized ClientRow component
const ClientRow = memo(({ client, index, onDelete, onEdit, setClientHistory, setOpen }) => {
  const isEven = index % 2 === 0
  const rowBg = isEven ? 'bg-white' : 'bg-[#f0f0f0]'

  const handleHistory = async (id) => {
    try {
      const response = await window.api.getAllTransactions()
      const filteredResponse = response.filter((transaction) => transaction.clientId === id)
      setClientHistory(filteredResponse)
      console.log('response History', filteredResponse)
    } catch (error) {
      toast.error('Failed to fetch client details: ' + error.message)
    }
  }

  return (
    <tr className={`text-sm text-center ${rowBg}`}>
      <td className={`px-4 py-3 w-[80px] sticky left-0 ${rowBg} z-10 text-xs`}>
        {formatClientId(client?.id)}
      </td>
      <td className="px-4 py-3">{new Date(client.createdAt).toLocaleDateString()}</td>
      <td className="px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2 px-6 uppercase">
          <div className="w-8 h-8 bg-gradient-to-br from-blue-400 to-indigo-500 rounded-full flex items-center justify-center text-white text-xs font-bold">
            {getInitials(client.clientName)}
          </div>
          {client.clientName}
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
            size={14}
            className="text-blue-500 cursor-pointer hover:scale-110 transition-all duration-300"
            onClick={() => {
              setOpen(true)
              handleHistory(client.id)
            }}
          />
        </Whisper>
      </td>
      <td className="px-4 py-3 uppercase">{client.gstNo === '' ? '-' : client.gstNo}</td>
      <td className="px-4 py-3">{client.phoneNo === '' ? '-' : client.phoneNo}</td>
      <td className="px-4 py-3">
        <div className="border border-[#fef08a] text-[#854d0e] bg-[#fef9c3] p-1 rounded-full font-bold text-xs px-2">
          ₹ {toThousands(Number(client.pendingAmount).toFixed(0))}
        </div>
      </td>
      <td className="px-4 py-3 font-bold">
        <div className="border border-indigo-200 text-indigo-600 bg-indigo-100 p-1 rounded-full font-bold text-xs px-2">
          ₹ {toThousands(Number(client.paidAmount).toFixed(0))}
        </div>
      </td>
      <td className="px-4 py-3">
        <div className="text-[#166534] bg-[#dcfce7] border border-[#8ffab5] p-1 rounded-full font-bold text-xs px-2">
          ₹ {toThousands(Number(client.pendingFromOurs).toFixed(0))}
        </div>
      </td>
      <td className="px-4 py-3 tracking-wide">
        <div className="text-[#991b1b] bg-[#fee2e2] border border-[#ffadad] p-1 rounded-full font-bold text-xs px-2">
          {client.accountType}
        </div>
      </td>
      <td className="px-4 py-3 tracking-wide">
        ₹{' '}
        {toThousands(
          calculateTotalWorth(client.pendingFromOurs, client.pendingAmount, client.paidAmount)
        )}
      </td>
      <td className="w-28">
        <div className="flex gap-3 justify-center items-center">
          <button
            className="text-red-500 p-2 border border-red-500 rounded-full hover:bg-red-500 hover:text-white transition-all duration-300 hover:scale-110 cursor-pointer"
            onClick={() => onDelete(client.id)}
            title="Delete client"
          >
            <Trash size={12} />
          </button>
          <button
            className="text-purple-500 p-2 border border-purple-500 rounded-full hover:bg-purple-500 hover:text-white transition-all duration-300 hover:scale-110 cursor-pointer"
            onClick={() => onEdit(client)}
            title="Edit client"
          >
            <PenLine size={12} />
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
  const [importFile, setImportFile] = useState(false)
  const [open, setOpen] = useState(false)
  const [overflow, setOverflow] = useState(true)
  const [clientHistory, setClientHistory] = useState([])

  const clients = useSelector((state) => state.electron.clients.data || [])
  const products = useSelector((state) => state.electron.products.data || [])
  const transactions = useSelector((state) => state.electron.transaction.data || [])

  const TABLE_HEADERS_HISTORY = [
    { key: 'date', label: 'Date', width: 'w-[100px]', icon: Calendar1 },
    { key: 'product', label: 'Product', width: 'w-[150px]', icon: Package },
    { key: 'quantity', label: 'Quantity', width: 'w-[150px]', icon: Box },
    { key: 'status', label: 'Status', width: 'w-[50px]', icon: TrendingUp }
  ]

  // Memoized filtered data
  const filteredData = useMemo(() => {
    if (!Array.isArray(clients)) return []
    const query = searchQuery.toLowerCase()

    return clients.filter((data) => {
      // Search filter
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

      // Client filter
      const matchesClient = !clientFilter || data.id === clientFilter

      // Date filter
      let matchesDate = true
      if (dateRange?.length === 2) {
        const createdDate = new Date(data.createdAt)
        const [start, end] = dateRange
        matchesDate = createdDate >= new Date(start) && createdDate <= new Date(end)
      }

      return matchesSearch && matchesClient && matchesDate
    })
  }, [clients, searchQuery, clientFilter, dateRange])

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
    return product ? product.name : 'Unknown Product'
  }

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
        <div className="border border-gray-200 shadow px-5 py-3 mx-6 rounded-3xl my-4 flex">
          <div className="mx-5 border-r w-52">
            <p className="text-sm font-light">Total Assets Value</p>
            <p className="text-2xl font-bold">₹ {toThousands(statistics.totalAssets)}</p>
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
              <span className="font-bold text-2xl">
                ₹ {toThousands(statistics.totalPendingAmount)}
              </span>
            </p>
          </div>
          <div className="mx-5 w-52">
            <p className="text-sm font-light">Total Pending From Ours</p>
            <p className="font-light text-sm">
              <span className="font-bold text-2xl">
                ₹ {toThousands(statistics.totalPendingFromOurs)}
              </span>
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
                />
                <SelectPicker
                  data={clients.map((client) => ({
                    label: client?.clientName,
                    value: client?.id
                  }))}
                  onChange={setClientFilter}
                  placeholder="Select Client"
                  style={{ width: 150 }}
                />
              </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto customScrollbar border-2 border-gray-200 rounded-lg h-screen mt-5">
              <table className="min-w-max border-collapse table-fixed">
                <thead className="bg-gray-200">
                  <tr className="text-sm sticky top-0">
                    {TABLE_HEADERS.map((header) => (
                      <th
                        key={header.key}
                        className={`px-4 py-3 border-r border-gray-300 ${header.width} ${
                          header.sticky ? 'sticky left-0 bg-gray-200 z-10' : ''
                        }`}
                      >
                        {header.label}
                      </th>
                    ))}
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
                    filteredData.map((client, index) => (
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
        size="md"
        className="modern-history-modal"
      >
        <Modal.Header className="py-2">
          <div className="flex items-center gap-3">
            <div>
              <Modal.Title>
                <p className="text-2xl font-medium">Transaction History</p>
              </Modal.Title>
              <p className="text-xs font-light text-gray-500 mt-0.5 mx-1">
                <span className="font-bold text-red-500">{clientHistory.length}</span> Transaction
                {clientHistory.length !== 1 ? 's' : ''} Found
              </p>
            </div>
          </div>
        </Modal.Header>

        <Modal.Body>
          {clientHistory.length && (
            <>
              {/* Summary Card */}
              <div className="bg-gradient-to-br from-orange-50 to-red-50 border-b-2 border-orange-200 p-2 px-6 mx-4 rounded-2xl shadow-lg">
                <div className="grid grid-cols-4 items-center justify-between">
                  <div>
                    <p className="text-xs text-gray-600 font-medium mb-1">Total Pending Amount</p>
                    <div className="flex items-center gap-2">
                      <IndianRupee size={24} className="text-orange-600" />
                      <h2 className="text-2xl font-bold bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-transparent">
                        {toThousands(
                          clientHistory.reduce((total, t) => total + t.sellAmount * t.quantity, 0)
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
                          clientHistory.reduce((total, t) => total + t.pendingFromOurs, 0)
                        )}
                      </h2>
                    </div>
                  </div>
                </div>
              </div>

              {/* Transaction List */}
              <div className="px-4 pb-4 space-y-3 max-h-[400px] overflow-y-auto custom-scrollbar my-5">
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
                              {new Date(t.createdAt).toLocaleDateString('en-IN', {
                                day: '2-digit',
                                month: 'short',
                                year: 'numeric'
                              })}
                            </td>

                            {/* Product */}
                            <td className="px-6 py-3 text-gray-700">
                              {getProductName(t.productId, products) || '-'}
                            </td>

                            {/* Quantity */}
                            <td className="px-6 py-3 font-medium text-gray-800">{t.quantity}</td>

                            {/* Status */}
                            <td className="px-6 py-3">
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
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
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
