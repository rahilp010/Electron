/* eslint-disable no-undef */
/* eslint-disable react/display-name */
/* eslint-disable react/prop-types */
/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable no-unused-vars */
import React, { useEffect, useState, useMemo, useCallback } from 'react'
import { FileUp, Import, PenLine, Plus, Trash } from 'lucide-react'
import Loader from '../components/Loader'
import { useNavigate } from 'react-router-dom'
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
import { clientApi, productApi, transactionApi } from '../API/Api'
import { toast } from 'react-toastify'
import HistoryToggleOffIcon from '@mui/icons-material/HistoryToggleOff'
import CreditScoreIcon from '@mui/icons-material/CreditScore'
import Navbar from '../components/UI/Navbar'
import PurchaseModal from '../components/Modal/PurchaseModal'
import ImportExcel from '../components/UI/ImportExcel'
import * as XLSX from 'xlsx'

// Constants
const TABLE_HEADERS = [
  { key: 'id', label: 'ID', width: 'w-[80px]', sticky: true },
  { key: 'date', label: 'Date', width: 'w-[150px]' },
  { key: 'clientName', label: 'Client Name', width: 'w-[200px]' },
  { key: 'productName', label: 'Product Name', width: 'w-[230px]' },
  { key: 'quantity', label: 'Quantity', width: 'w-[150px]' },
  { key: 'totalAmount', label: 'Total Amount', width: 'w-[200px]' },
  { key: 'pendingAmount', label: 'Pending Amount', width: 'w-[200px]' },
  { key: 'paidAmount', label: 'Paid Amount', width: 'w-[200px]' },
  { key: 'paymentStatus', label: 'Payment Status', width: 'w-[170px]' },
  { key: 'action', label: 'Action', width: 'w-[150px]' }
]

const ASSETS_TYPE_OPTIONS = [
  { label: 'Raw Material', value: 'Raw Material' },
  { label: 'Finished Goods', value: 'Finished Goods' },
  { label: 'Assets', value: 'Assets' }
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

const getInitials = (name) => {
  if (!name || name === 'Unknown Client') return '??'
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
}

const getPaymentStatusComponent = (transaction) => {
  const { statusOfTransaction, paymentType } = transaction

  if (statusOfTransaction === 'completed') {
    return (
      <span className="flex items-center text-[#166534] bg-[#dcfce7] border border-[#8ffab5] px-2 py-1 rounded-full justify-center text-xs font-medium">
        Completed
      </span>
    )
  }

  if (statusOfTransaction === 'pending' && paymentType === 'partial') {
    return (
      <span className="flex items-center border border-[#8a94fe] text-[#0e1a85] bg-[#c3d3fe] px-2 py-1 rounded-full justify-center text-xs font-medium">
        Partial
      </span>
    )
  }

  if (statusOfTransaction === 'pending') {
    return (
      <span className="flex items-center border border-[#fef08a] text-[#854d0e] bg-[#fef9c3] px-2 py-1 rounded-full justify-center text-xs font-medium">
        Pending
      </span>
    )
  }

  return <span className="text-gray-500">-</span>
}

// Memoized PurchaseRow component
const PurchaseRow = React.memo(
  ({ transaction, index, clients, products, onEdit, onDelete, onUpdateStatus }) => {
    const isEven = index % 2 === 0
    const rowBg = isEven ? 'bg-white' : 'bg-[#f0f0f0]'
    const clientName = getClientName(transaction?.clientId, clients)
    const productName = getProductName(transaction?.productId, products)
    const totalAmountProduct = products.filter((p) => p.name === productName).map((p) => p.price)
    const totalAmount = (totalAmountProduct || 0) * (transaction?.quantity || 0)

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
          <div className="flex items-center gap-2 px-6 truncate">
            <div
              className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-200 bg-gradient-to-br from-blue-400 to-indigo-500 text-white group-hover:from-blue-500 group-hover:to-indigo-600 backdrop-blur-sm`}
            >
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
        <td className="px-4 py-3 font-semibold">
          ₹ {toThousands(Number(transaction?.purchaseAmount).toFixed(0))}
        </td>
        <td className="px-4 py-3">{renderPendingAmount()}</td>
        <td className="px-4 py-3">{renderPaidAmount()}</td>
        <td className="px-4 py-3 tracking-wide">
          {/* <PaymentStatusDropdown transaction={transaction} onUpdateStatus={onUpdateStatus} />
           */}
          {transaction?.statusOfTransaction === 'completed' ? (
            <span className="flex items-center text-[#166534] bg-[#dcfce7] border border-[#8ffab5] px-2 py-1 rounded-full justify-center text-xs font-medium">
              Completed
            </span>
          ) : (
            <span className="flex items-center border border-[#fef08a] text-[#854d0e] bg-[#fef9c3] px-2 py-1 rounded-full justify-center text-xs font-medium">
              Pending
            </span>
          )}
        </td>

        <td className="w-28">
          <div className="flex gap-3 justify-center items-center">
            <button
              className="text-purple-500 p-2 border border-purple-500 rounded-full hover:bg-purple-500 hover:text-white transition-all duration-300 hover:scale-110 cursor-pointer"
              onClick={() => onEdit(transaction)}
              title="Edit purchase"
            >
              <PenLine size={12} />
            </button>
            <button
              className="text-red-500 p-2 border border-red-500 rounded-full hover:bg-red-500 hover:text-white transition-all duration-300 hover:scale-110 cursor-pointer"
              onClick={() => onDelete(transaction?.id)}
              title="Delete purchase"
            >
              <Trash size={12} />
            </button>
          </div>
        </td>
      </tr>
    )
  }
)

// Custom hook for purchase operations
const usePurchaseOperations = () => {
  const dispatch = useDispatch()

  const fetchAllProducts = useCallback(async () => {
    try {
      const response = await productApi.getAllProducts()
      dispatch(setProducts(response))
    } catch (error) {
      console.error('Error fetching products:', error)
      toast.error('Failed to fetch products')
    }
  }, [dispatch])

  const fetchAllClients = useCallback(async () => {
    try {
      const response = await clientApi.getAllClients()
      dispatch(setClients(response))
    } catch (error) {
      console.error('Error fetching clients:', error)
      toast.error('Failed to fetch clients')
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

  const transactions = useSelector((state) => state.electron.transaction.data || [])
  const bankReceiptData = useSelector((state) => state.electron.bankReceipt.data || [])

  const handleDeleteTransaction = useCallback(
    async (id) => {
      if (!window.confirm('Are you sure you want to delete this purchase?')) return

      try {
        const response = await transactionApi.deleteTransaction(id)
        console.log(response)
        dispatch(deleteTransaction(response))
        await fetchAllTransactions()
        toast.success('Purchase deleted successfully')
      } catch (error) {
        toast.error('Failed to delete purchase: ' + error.message)
      }
    },
    [dispatch, fetchAllTransactions]
  )

  const handleEditTransaction = useCallback(
    async (transaction, setSelectedTransaction, setIsUpdateExpense, setShowModal) => {
      try {
        const response = await transactionApi.getTransactionById(transaction.id)
        setSelectedTransaction(response)
        setIsUpdateExpense(true)
        setShowModal(true)
      } catch (error) {
        console.error('Error fetching transaction:', error)
        toast.error('Failed to load purchase data: ' + error.message)
      }
    },
    []
  )

  const handleUpdatePaymentStatus = useCallback(
    async (transactionId, newStatus) => {
      console.log('Updating Transaction:', transactionId, newStatus)
      try {
        // Call API (assuming your backend supports update)
        const response = await transactionApi.updateTransaction(transactionId, {
          statusOfTransaction: newStatus
        })

        console.log(response)

        // Update redux with new transaction
        await fetchAllTransactions()

        toast.success(`Payment status updated to ${newStatus}`)
      } catch (error) {
        toast.error('Failed to update payment status: ' + error.message)
      }
    },
    [fetchAllTransactions]
  )

  return {
    fetchAllProducts,
    fetchAllClients,
    fetchAllTransactions,
    handleDeleteTransaction,
    handleEditTransaction,
    handleUpdatePaymentStatus
  }
}

const PaymentStatusDropdown = ({ transaction, onUpdateStatus }) => {
  const options = [
    { label: 'Pending', value: 'pending' },
    { label: 'Completed', value: 'completed' }
  ]

  return (
    <SelectPicker
      cleanable={false}
      searchable={false}
      data={options}
      value={transaction?.statusOfTransaction}
      onChange={(value) => onUpdateStatus(transaction.id, value)}
      style={{ width: 130 }}
      placement="auto"
    />
  )
}

// Main Component
const Purchase = () => {
  const navigate = useNavigate()
  const dispatch = useDispatch()
  const {
    fetchAllProducts,
    fetchAllClients,
    fetchAllTransactions,
    handleDeleteTransaction,
    handleEditTransaction,
    handleUpdatePaymentStatus
  } = usePurchaseOperations()

  // State management
  const [showLoader, setShowLoader] = useState(false)
  const [showModal, setShowModal] = useState(false)
  const [selectedTransaction, setSelectedTransaction] = useState(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [isUpdateExpense, setIsUpdateExpense] = useState(false)
  const [dateRange, setDateRange] = useState([])
  const [clientFilter, setClientFilter] = useState('')
  const [productFilter, setProductFilter] = useState('')
  const [assetsTypeFilter, setAssetsTypeFilter] = useState('')
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
      // Only show purchase transactions
      if (data?.transactionType !== 'purchase') return false

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

      // Client filter - handle nested object structure
      const matchesClient =
        !clientFilter || String(data.clientId?.id || data.clientId) === String(clientFilter)

      // Product filter - handle nested object structure
      const matchesProduct =
        !productFilter || String(data.productId?.id || data.productId) === String(productFilter)

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
    const purchaseTransactions = transactions.filter((t) => t?.transactionType === 'purchase')

    const currentPID = purchaseTransactions.map((p) => p.productId)

    const productName = getProductName(currentPID[0], products)

    const totalAmountProduct = products.filter((p) => p.name === productName).map((p) => p.price)

    const totalPurchases = purchaseTransactions.reduce(
      (total, item) => total + (item.purchaseAmount || 0),
      0
    )

    const totalProducts = purchaseTransactions.reduce(
      (total, item) => total + (item.quantity || 0),
      0
    )

    const totalPendingAmount = purchaseTransactions.reduce(
      (total, item) => total + (item.pendingAmount || 0),
      0
    )

    return { totalPurchases, totalProducts, totalPendingAmount }
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
        const result = await window.api.importExcel(filePath, 'purchases')

        if (result.success) {
          toast.success(`Imported ${result.count} purchases successfully`)
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
        'Total Amount': toThousands(transaction.purchaseAmount || 0),
        'Pending Amount': toThousands(transaction.pendingAmount || 0),
        'Paid Amount': toThousands(transaction.paidAmount || 0),
        'Payment Status': transaction.statusOfTransaction,
        'Payment Type': transaction.paymentType
      }))

      const ws = XLSX.utils.json_to_sheet(exportData)
      const wb = XLSX.utils.book_new()
      XLSX.utils.book_append_sheet(wb, ws, 'Purchases')
      XLSX.writeFile(wb, `purchases_${new Date().toISOString().split('T')[0]}.xlsx`)

      toast.success('Data exported successfully')
    } catch (error) {
      toast.error('Failed to export data: ' + error.message)
    }
  }, [filteredData, clients, products])

  const generatePDF = async () => {
    try {
      const savePath = `purchases_${new Date().toISOString().split('T')[0]}.pdf`
      const response = await window.api.generatePDF({ tableName: 'transactions', savePath })
      if (response.success) {
        toast.success(`PDF saved to: ${savePath}`)
      } else {
        toast.error(`Error: ${response.error}`)
      }
    } catch (err) {
      toast.error(`Error: ${err.message}`)
    }
  }

  // Effects
  useEffect(() => {
    setShowLoader(true)
    Promise.all([fetchAllProducts(), fetchAllClients(), fetchAllTransactions()]).finally(() => {
      setShowLoader(false)
    })
  }, [fetchAllProducts, fetchAllClients, fetchAllTransactions])

  return (
    <div className="select-none gap-10 h-screen w-full overflow-x-auto transition-all duration-300 min-w-[720px] overflow-hidden">
      <div className="w-full sticky top-0 z-10">
        <Navbar />
      </div>

      {/* Header */}
      <div className="flex justify-between mt-5 pb-2 items-center">
        <p className="text-3xl font-light mx-7">Purchase</p>
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
            <p className="text-sm font-light">Total Purchase Value</p>
            <p className="text-2xl font-bold">₹ {toThousands(statistics.totalPurchases)}</p>
          </div>
          <div className="mx-5 border-r w-52">
            <p className="text-sm font-light">Total Products Purchased</p>
            <p className="font-light text-sm">
              <span className="font-bold text-2xl">{statistics.totalProducts}</span> Products
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
        </div>

        {/* Main Content */}
        <div className="w-full h-[calc(100%-40px)] my-3 bg-white overflow-y-auto customScrollbar relative">
          <div className="mx-7 my-5">
            {/* Filters */}
            <div className="flex justify-between mb-4">
              <div>
                <InputGroup size="md">
                  <Input
                    placeholder="Search purchases..."
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
                  data={ASSETS_TYPE_OPTIONS}
                  onChange={setAssetsTypeFilter}
                  placeholder="Select Assets Type"
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
                    <tr className="text-center h-80">
                      <td
                        colSpan={TABLE_HEADERS.length}
                        className="text-center font-light tracking-wider text-gray-500 text-lg"
                      >
                        No Data Found
                      </td>
                    </tr>
                  ) : (
                    filteredData.map((transaction, index) => (
                      <PurchaseRow
                        key={transaction?.id || index}
                        transaction={transaction}
                        index={index}
                        clients={clients}
                        products={products}
                        onEdit={(transaction) =>
                          handleEditTransaction(
                            transaction,
                            setSelectedTransaction,
                            setIsUpdateExpense,
                            setShowModal
                          )
                        }
                        onDelete={handleDeleteTransaction}
                        onUpdateStatus={handleUpdatePaymentStatus}
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
        <PurchaseModal
          setShowModal={setShowModal}
          existingTransaction={selectedTransaction}
          isUpdateExpense={isUpdateExpense}
          type="transaction"
        />
      )}
    </div>
  )
}

export default Purchase
