/* eslint-disable react/display-name */
/* eslint-disable react/prop-types */
/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable no-unused-vars */
import React, { useEffect, useState, useMemo, useCallback, memo } from 'react'
import { FileUp, Import, PenLine, Plus, Trash, X } from 'lucide-react'
import Loader from '../components/Loader'
import SearchIcon from '@mui/icons-material/Search'
import { DateRangePicker, SelectPicker, Whisper, Tooltip, InputGroup, Input } from 'rsuite'
import 'rsuite/dist/rsuite-no-reset.min.css'
import {
  deleteTransaction,
  setClients,
  setProducts,
  setTransactions
} from '../app/features/electronSlice'
import { useDispatch, useSelector } from 'react-redux'
import { toast } from 'react-toastify'
import TransactionModal from '../components/Modal/TransactionModal'
import HistoryToggleOffIcon from '@mui/icons-material/HistoryToggleOff'
import CreditScoreIcon from '@mui/icons-material/CreditScore'
import Navbar from '../components/UI/Navbar'
import { useLocation } from 'react-router-dom'
import ImportExcel from '../components/UI/ImportExcel'
import * as XLSX from 'xlsx'

// Constants
const TABLE_HEADERS = [
  { key: 'id', label: 'ID', width: 'w-[80px]', sticky: true },
  { key: 'date', label: 'Date', width: 'w-[150px]' },
  { key: 'clientName', label: 'Client Name', width: 'w-[200px]' },
  { key: 'productName', label: 'Product Name', width: 'w-[230px]' },
  { key: 'quantity', label: 'Quantity', width: 'w-[150px]' },
  { key: 'sellingPrice', label: 'Selling Price', width: 'w-[170px]', conditional: true },
  { key: 'totalAmount', label: 'Total Amount', width: 'w-[200px]' },
  { key: 'pendingAmount', label: 'Pending Amount', width: 'w-[200px]' },
  { key: 'paidAmount', label: 'Paid Amount', width: 'w-[200px]' },
  { key: 'paymentStatus', label: 'Payment Status', width: 'w-[170px]' },
  { key: 'action', label: 'Action', width: 'w-[150px]' }
]

const STATUS_OPTIONS = [
  { label: 'Completed', value: 'completed' },
  { label: 'Pending', value: 'pending' },
  { label: 'Partial', value: 'partial' }
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
  const client = clients.find((c) => c?.id === clientId)
  return client ? client.clientName : 'Unknown Client'
}

const getProductName = (productId, products) => {
  const product = products.find((p) => p?.id === productId)
  return product ? product.name : 'Unknown Product'
}

const getInitials = (name) => {
  return (
    name
      ?.split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase() || '??'
  )
}

const getPaymentStatusComponent = (transaction) => {
  const { statusOfTransaction, paymentType } = transaction

  if (statusOfTransaction === 'completed') {
    return (
      <div className="flex items-center text-[#166534] bg-[#dcfce7] border border-[#8ffab5] px-2 py-1 rounded-full justify-center text-xs font-medium">
        Completed
      </div>
    )
  }

  if (statusOfTransaction === 'pending' && paymentType === 'partial') {
    return (
      <div className="flex items-center border border-[#8a94fe] text-[#0e1a85] bg-[#c3d3fe] px-2 py-1 rounded-full justify-center text-xs font-medium">
        Partial
      </div>
    )
  }

  if (statusOfTransaction === 'pending') {
    return (
      <div className="flex items-center border border-[#fef08a] text-[#854d0e] bg-[#fef9c3] px-2 py-1 rounded-full justify-center text-xs font-medium">
        Pending
      </div>
    )
  }

  return (
    <div className="flex items-center text-gray-500 bg-gray-50 border border-gray-200 px-2 py-1 rounded-full justify-center text-xs font-medium">
      -
    </div>
  )
}

// Memoized TransactionRow component
const TransactionRow = memo(
  ({ transaction, index, clients, products, location, onEdit, onDelete }) => {
    const isEven = index % 2 === 0
    const rowBg = isEven ? 'bg-white' : 'bg-[#f0f0f0]'
    const clientName = getClientName(transaction?.clientId, clients)
    const productName = getProductName(transaction?.productId, products)
    const totalAmount = (transaction?.sellAmount || 0) * (transaction?.quantity || 0)

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
            <span>₹ {toThousands(Number(transaction?.pendingAmount).toFixed(0))}</span>
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
            <span>₹ {toThousands(Number(transaction?.paidAmount).toFixed(0))}</span>
          </Whisper>
        )
      }

      if (transaction?.statusOfTransaction === 'pending') {
        return '-'
      }

      return <CreditScoreIcon className="text-green-600" />
    }

    return (
      <tr className={`text-sm text-center ${rowBg}`}>
        <td className={`px-4 py-3 w-[80px] sticky left-0 ${rowBg} z-10 text-xs`}>
          {formatTransactionId(transaction?.id)}
        </td>
        <td className="px-4 py-3">{new Date(transaction?.createdAt).toLocaleDateString()}</td>
        <td className="px-4 py-3">
          <div className="flex items-center gap-2 px-6">
            <div className="w-7 h-7 bg-blue-100 rounded-full flex items-center border border-blue-300 justify-center text-xs font-medium text-blue-600 mr-3">
              {getInitials(clientName)}
            </div>
            {clientName}
          </div>
        </td>
        <td className="px-4 py-3 tracking-wide font-medium">{String(productName).toUpperCase()}</td>
        <td className="px-4 py-3">
          <span className="bg-gray-300 px-2 py-1 rounded-full text-xs font-medium">
            {transaction?.quantity || 0}
          </span>
        </td>
        {location.pathname === '/purchase' && (
          <td className="px-4 py-3 font-bold text-indigo-500">
            ₹ {toThousands(Number(transaction?.sellAmount).toFixed(0))}
          </td>
        )}
        <td className="px-4 py-3 font-semibold">
          ₹ {toThousands(Number(transaction?.sellAmount).toFixed(0))}
        </td>
        <td className="px-4 py-3">{renderPendingAmount()}</td>
        <td className="px-4 py-3">{renderPaidAmount()}</td>
        <td className="px-4 py-3 tracking-wide">{getPaymentStatusComponent(transaction)}</td>
        <td className="w-28">
          <div className="flex gap-3 justify-center items-center">
            <button
              className="text-purple-500 p-2 border border-purple-500 rounded-full hover:bg-purple-500 hover:text-white transition-all duration-300 hover:scale-110"
              onClick={() => onEdit(transaction)}
              title="Edit transaction"
            >
              <PenLine size={12} />
            </button>
            <button
              className="text-red-500 p-2 border border-red-500 rounded-full hover:bg-red-500 hover:text-white transition-all duration-300 hover:scale-110"
              onClick={() => onDelete(transaction?.id)}
              title="Delete transaction"
            >
              <Trash size={12} />
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
      const response = await window.api.getAllTransactions()
      dispatch(setTransactions(response))
    } catch (error) {
      console.error('Error fetching transactions:', error)
      toast.error('Failed to fetch transactions')
    }
  }, [dispatch])

  const handleDeleteTransaction = useCallback(
    async (id) => {
      if (!window.confirm('Are you sure you want to delete this transaction?')) return

      try {
        const response = await window.api.deleteTransaction(id)
        dispatch(deleteTransaction(response))
        await fetchAllTransactions()
        toast.success('Transaction deleted successfully')
      } catch (error) {
        toast.error('Failed to delete transaction: ' + error.message)
      }
    },
    [dispatch, fetchAllTransactions]
  )

  const handleEditTransaction = useCallback(
    async (transaction, setSelectedTransaction, setIsUpdateExpense, setShowModal) => {
      try {
        const response = await window.api.getTransactionById(transaction.id)
        setSelectedTransaction(response)
        setIsUpdateExpense(true)
        setShowModal(true)
      } catch (error) {
        console.error('Error fetching transaction:', error)
        toast.error('Failed to load transaction data: ' + error.message)
      }
    },
    []
  )

  return {
    fetchAllProducts,
    fetchAllClients,
    fetchAllTransactions,
    handleDeleteTransaction,
    handleEditTransaction
  }
}

// Main Component
const Transaction = () => {
  const dispatch = useDispatch()
  const location = useLocation()
  const {
    fetchAllProducts,
    fetchAllClients,
    fetchAllTransactions,
    handleDeleteTransaction,
    handleEditTransaction
  } = useTransactionOperations()

  // State management
  const [showLoader, setShowLoader] = useState(false)
  const [showModal, setShowModal] = useState(false)
  const [selectedTransaction, setSelectedTransaction] = useState(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [isUpdateExpense, setIsUpdateExpense] = useState(false)
  const [dateRange, setDateRange] = useState([])
  const [clientFilter, setClientFilter] = useState('')
  const [productFilter, setProductFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [importFile, setImportFile] = useState(false)

  const products = useSelector((state) => state.electron.products.data || [])
  const clients = useSelector((state) => state.electron.clients.data || [])
  const transactions = useSelector((state) => state.electron.transaction.data || [])

  // Memoized filtered data
  const filteredData = useMemo(() => {
    if (!Array.isArray(transactions)) return []
    const query = searchQuery?.toLowerCase()

    return transactions.filter((data) => {
      // Only show sales transactions
      if (data?.transactionType !== 'sales') return false

      // Search filter
      const matchesSearch =
        !query ||
        [
          data?.id?.toString(),
          getClientName(data?.clientId, clients)?.toLowerCase(),
          data?.sellAmount?.toString(),
          getProductName(data?.productId, products)?.toLowerCase(),
          data?.quantity?.toString(),
          data?.statusOfTransaction?.toLowerCase()
        ].some((field) => field?.includes(query))

      // Client filter
      const matchesClient = !clientFilter || String(data.clientId) === String(clientFilter)

      // Product filter
      const matchesProduct = !productFilter || String(data.productId) === String(productFilter)

      // Status filter
      const matchesStatus = !statusFilter || data?.statusOfTransaction === statusFilter

      // Date filter
      let matchesDate = true
      if (dateRange?.length === 2) {
        const createdDate = new Date(data.createdAt)
        const [start, end] = dateRange
        matchesDate = createdDate >= new Date(start) && createdDate <= new Date(end)
      }

      return matchesSearch && matchesClient && matchesProduct && matchesDate && matchesStatus
    })
  }, [
    transactions,
    searchQuery,
    clientFilter,
    productFilter,
    dateRange,
    statusFilter,
    clients,
    products
  ])

  // Memoized statistics
  const statistics = useMemo(() => {
    const salesTransactions = transactions.filter((t) => t?.transactionType === 'sales')

    const totalSales = salesTransactions.reduce((total, item) => total + (item.totalAmount || 0), 0)

    const totalPendingAmount = salesTransactions.reduce((total, item) => {
      if (item.statusOfTransaction === 'pending' && item.paymentType === 'full') {
        return total + (item.totalAmount || 0)
      }
      if (item.statusOfTransaction === 'pending' && item.paymentType === 'partial') {
        return total + (item.pendingAmount || 0)
      }
      return total
    }, 0)

    return { totalSales, totalPendingAmount }
  }, [transactions])

  // Event handlers
  const handleCreateTransaction = useCallback(() => {
    setSelectedTransaction(null)
    setIsUpdateExpense(false)
    setShowModal(true)
  }, [])

  const handleSearchChange = useCallback((value) => {
    setSearchQuery(value)
  }, [])

  const handleImportExcel = useCallback(
    async (filePath) => {
      try {
        const result = await window.api.importExcel(filePath, 'transactions')

        if (result.success) {
          toast.success(`Imported ${result.count} transactions successfully`)
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
      const exportData = filteredData.map((transaction) => ({
        ID: formatTransactionId(transaction.id),
        Date: new Date(transaction.createdAt).toLocaleDateString(),
        'Client Name': getClientName(transaction.clientId, clients),
        'Product Name': getProductName(transaction.productId, products),
        Quantity: transaction.quantity,
        'Sell Amount': transaction.sellAmount,
        'Total Amount': transaction.sellAmount,
        'Pending Amount': transaction.pendingAmount || 0,
        'Paid Amount': transaction.paidAmount || 0,
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
  }, [filteredData, clients, products])

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
            className="flex items-center gap-2 border border-gray-300 w-fit p-1.5 px-3 rounded-sm hover:bg-gray-50 transition-colors"
            onClick={() => setImportFile(!importFile)}
          >
            <Import size={16} />
            <span className="text-sm">Import</span>
          </button>
          <button
            className="flex items-center gap-2 border border-gray-300 w-fit p-1.5 px-3 rounded-sm hover:bg-gray-50 transition-colors"
            onClick={handleExportExcel}
          >
            <FileUp size={16} />
            <span className="text-sm">Export</span>
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
        <div className="border border-gray-200 shadow px-5 py-3 mx-6 rounded-3xl my-4 flex">
          <div className="mx-5 border-r w-52">
            <p className="text-sm font-light mb-1">Total Sales</p>
            <p className="text-2xl font-light">₹ {toThousands(statistics.totalSales)}</p>
          </div>
          <div className="mx-5 border-r w-52">
            <p className="text-sm font-light mb-1">Total Pending Amount</p>
            <p className="text-2xl font-light">₹ {toThousands(statistics.totalPendingAmount)}</p>
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
                />
                <SelectPicker
                  data={products.map((product) => ({
                    label: product?.name,
                    value: product?.id
                  }))}
                  onChange={setProductFilter}
                  placeholder="Select Product"
                  style={{ width: 150 }}
                />
                <SelectPicker
                  data={clients.map((client) => ({
                    label: client?.clientName,
                    value: client?.id
                  }))}
                  placement="bottomEnd"
                  onChange={setClientFilter}
                  placeholder="Select Client"
                  style={{ width: 150 }}
                />
                <SelectPicker
                  data={STATUS_OPTIONS}
                  onChange={setStatusFilter}
                  placeholder="Select Status"
                  style={{ width: 150 }}
                />
              </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto customScrollbar border-2 border-gray-200 rounded-lg h-screen mt-5">
              <table className="min-w-max border-collapse table-fixed">
                <thead className="bg-gray-200">
                  <tr className="text-sm sticky top-0">
                    {visibleHeaders.map((header) => (
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
                    <tr className="text-center h-80">
                      <td
                        colSpan={visibleHeaders.length}
                        className="text-center font-light tracking-wider text-gray-500 text-lg"
                      >
                        No Data Found
                      </td>
                    </tr>
                  ) : (
                    filteredData.map((transaction, index) => (
                      <TransactionRow
                        key={transaction?.id || index}
                        transaction={transaction}
                        index={index}
                        clients={clients}
                        products={products}
                        location={location}
                        onEdit={(transaction) =>
                          handleEditTransaction(
                            transaction,
                            setSelectedTransaction,
                            setIsUpdateExpense,
                            setShowModal
                          )
                        }
                        onDelete={handleDeleteTransaction}
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
        <TransactionModal
          setShowModal={setShowModal}
          existingTransaction={selectedTransaction}
          isUpdateExpense={isUpdateExpense}
          type="transaction"
        />
      )}
    </div>
  )
}

export default Transaction
