/* eslint-disable prettier/prettier */
/* eslint-disable react/prop-types */
/* eslint-disable react/display-name */
/* eslint-disable no-unused-vars */
/* eslint-disable react-hooks/exhaustive-deps */
import React, { useEffect, useState, useCallback, useMemo } from 'react'
import {
  Plus,
  Info,
  Trash,
  Edit,
  Import,
  Save,
  RotateCcw,
  AlertCircle,
  IndianRupee
} from 'lucide-react'
import Loader from '../components/Loader'
import { useNavigate } from 'react-router-dom'
import 'rsuite/dist/rsuite-no-reset.min.css'
import {
  createCashReceipt,
  setClients,
  setProducts,
  deleteCashReceipt,
  updateClient,
  updateTransaction
} from '../app/features/electronSlice'
import { useDispatch, useSelector } from 'react-redux'
import { clientApi, productApi } from '../API/Api'
import { toast } from 'react-toastify'
import Navbar from '../components/UI/Navbar'
import { DatePicker, Input, SelectPicker, Tooltip, Whisper } from 'rsuite'
import cash from '../assets/cash.png'
import ImportExcel from '../components/UI/ImportExcel'
import {
  TrendingUp,
  TrendingDown,
  Calendar,
  Building2,
  FileText,
  CreditCard,
  Banknote,
  BarChart3,
  User
} from 'lucide-react'

// Constants
const TABLE_HEADERS = [
  // { key: 'srNo', label: 'ID', width: 'w-[100px]', icon: FileText, sticky: true },
  { key: 'date', label: 'Date', width: 'w-[150px]', icon: Calendar },
  { key: 'cash', label: 'Cash', width: 'w-[200px]', icon: Building2 },
  { key: 'party', label: 'Party', width: 'w-[250px]', icon: User },
  { key: 'debit', label: 'Debit', width: 'w-[200px]', icon: TrendingDown },
  { key: 'credit', label: 'Credit', width: 'w-[200px]', icon: TrendingUp },
  { key: 'balance', label: 'Balance', width: 'w-[200px]', icon: BarChart3 },
  { key: 'description', label: 'Description', width: 'w-[450px]', icon: FileText },
  { key: 'actions', label: 'Actions', width: 'w-[100px]', icon: Edit }
]

// Utility functions
const toThousands = (value) => {
  if (!value || isNaN(value)) return '0'
  return new Intl.NumberFormat('en-IN').format(Number(value))
}

const formatDate = (dateString) => {
  if (!dateString) return '-'
  return new Date(dateString).toLocaleDateString('en-IN')
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

// Memoized Receipt Row Component
const ReceiptRow = React.memo(
  ({ receipt, index, balance, clients, onEdit, onDelete, isSelected }) => {
    const isReceipt = receipt.type === 'Receipt'
    // const clientName = clients.find((c) => c.id === receipt.party)?.clientName || 'Unknown Client'

    return (
      <tr
        className={`transition-all duration-200 cursor-pointer group hover:shadow-lg transform hover:scale-[1.001]
        border-l-4 ${isReceipt ? 'border-l-emerald-400' : 'border-l-red-400'}
      `}
        // onClick={() => onEdit(receipt)}
        title="Click to edit this receipt"
        style={{ animationDelay: `${index * 100}ms` }}
      >
        <td
          className={`px-6 py-4 z-30 font-bold
      `}
        >
          <div className="flex items-center gap-2">
            <Calendar size={14} className="text-gray-500" />
            <span className="font-medium text-gray-700">{formatDate(receipt.date)}</span>
          </div>
        </td>

        <td className="px-6 py-4">
          <div className="flex items-center gap-2">
            <div className="p-1 rounded-full bg-blue-200">
              <Building2 size={14} className="text-blue-600" />
            </div>
            <span className="font-medium text-gray-700">{receipt.cash}</span>
          </div>
        </td>

        <td className="px-6 py-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-br from-blue-400 to-indigo-500 rounded-full flex items-center justify-center text-white text-xs font-bold">
              {getInitials(clients.find((c) => c.id === receipt.clientId)?.clientName)}
            </div>
            <span className="font-medium text-gray-800">
              {clients.find((c) => c.id === receipt.clientId)?.clientName || 'Ram Bhasore'}
            </span>
          </div>
        </td>

        <td className="px-6 py-4">
          {receipt.type === 'Payment' || receipt.type === 'Salary' ? (
            <div className="flex items-center gap-2">
              <TrendingDown size={14} className="text-red-600" />
              <span className="font-semibold text-red-600 bg-red-100 px-3 py-1 rounded-full">
                ₹{toThousands(receipt.amount)}
              </span>
            </div>
          ) : (
            <span className="text-gray-400 italic">-</span>
          )}
        </td>

        <td className="px-6 py-4">
          {receipt.type === 'Receipt' ? (
            <div className="flex items-center gap-2">
              <TrendingUp size={14} className="text-emerald-600" />
              <span className="font-semibold text-emerald-600 bg-emerald-100 px-3 py-1 rounded-full">
                ₹{toThousands(receipt.amount)}
              </span>
            </div>
          ) : (
            <span className="text-gray-400 italic">-</span>
          )}
        </td>

        <td className="px-6 py-4">
          <div className="flex items-center gap-2">
            <BarChart3 size={14} className={balance >= 0 ? 'text-emerald-600' : 'text-red-600'} />
            <span className={`font-bold ${balance >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
              ₹{toThousands(balance)}
            </span>
          </div>
        </td>

        <td className="px-6 py-4 max-w-[350px]">
          <Whisper
            trigger="hover"
            placement="leftStart"
            speaker={
              <Tooltip>
                <div className="max-w-xs">
                  <p className="text-sm">{receipt.description || 'No description'}</p>
                </div>
              </Tooltip>
            }
          >
            <div className="flex items-center gap-2 cursor-help">
              <FileText size={14} className="text-gray-400 flex-shrink-0" />
              <span className="truncate text-gray-600">
                {receipt.description || 'No description'}
              </span>
            </div>
          </Whisper>
        </td>

        <td className="px-6 py-4">
          <button
            className="text-red-500 p-2 border border-red-500 rounded-full hover:bg-red-500 transition-all duration-200 hover:scale-110 hover:text-white "
            onClick={(e) => {
              e.stopPropagation()
              onDelete(receipt?.id)
            }}
            title="Delete receipt"
          >
            <Trash size={12} />
          </button>
        </td>
      </tr>
    )
  }
)

const Cash = () => {
  const navigate = useNavigate()
  const dispatch = useDispatch()

  // Loading states
  const [showLoader, setShowLoader] = useState(false)
  const [isSubmittingTransaction, setIsSubmittingTransaction] = useState(false)
  const [isUpdatingReceipt, setIsUpdatingReceipt] = useState(false)
  const [selectedReceiptId, setSelectedReceiptId] = useState(null)
  const [importFile, setImportFile] = useState(false)

  // Form state
  const [cashReceipt, setCashReceipt] = useState({
    id: '',
    transactionId: '',
    clientId: '',
    productId: '',
    srNo: '',
    type: 'Receipt',
    cash: 'Cash Account',
    date: new Date(),
    amount: '',
    description: '',
    dueDate: null,
    taxAmount: '',
    statusOfTransaction: 'pending',
    pendingAmount: '',
    pendingFromOurs: '',
    paidAmount: '',
    quantity: '',
    paymentType: 'full'
  })

  // Form validation errors
  const [errors, setErrors] = useState({})
  const [recentReceipts, setRecentReceipts] = useState([])

  const cashOptions = [{ label: 'Cash Account', value: 'Cash Account', icon: cash }]

  const STATIC_CASH_BALANCES = {
    'Cash Account': 2377100
  }

  const typeOptions = [
    { label: 'Receipt', value: 'Receipt', color: 'emerald', icon: TrendingUp },
    { label: 'Payment', value: 'Payment', color: 'red', icon: TrendingDown },
    { label: 'Salary', value: 'Salary', color: 'blue', icon: IndianRupee }
  ]

  // Redux selectors
  const clients = useSelector((state) => state.electron.clients.data || [])

  // Memoized statistics
  const statistics = useMemo(() => {
    const totalReceipts = recentReceipts
      .filter((r) => r.type === 'Receipt')
      .reduce((sum, r) => sum + (Number(r.amount) || 0), 0)

    const totalPayments = recentReceipts
      .filter((r) => r.type === 'Payment')
      .reduce((sum, r) => sum + (Number(r.amount) || 0), 0)

    const netBalance = totalReceipts - totalPayments
    const transactionCount = recentReceipts.length

    return { totalReceipts, totalPayments, netBalance, transactionCount }
  }, [recentReceipts])

  // Fetch data functions
  const fetchAllProducts = useCallback(async () => {
    try {
      setShowLoader(true)
      const response = await productApi.getAllProducts()
      dispatch(setProducts(response))
    } catch (error) {
      console.error('Error fetching products:', error)
      toast.error('Failed to fetch products')
    }
  }, [dispatch])

  const fetchAllClients = useCallback(async () => {
    try {
      setShowLoader(true)
      const response = await clientApi.getAllClients()
      dispatch(setClients(response))
    } catch (error) {
      console.error('Error fetching clients:', error)
      toast.error('Failed to fetch clients')
    }
  }, [dispatch])

  const fetchRecentReceipts = useCallback(async () => {
    try {
      setShowLoader(true)
      const receipts = await window.api.getRecentCashReceipts()
      setRecentReceipts(receipts)

      // Only set next srNo if we're not updating
      if (!isUpdatingReceipt && receipts.length > 0) {
        const maxSrNo = Math.max(...receipts.map((r) => Number(r.srNo) || 0))
        setCashReceipt((prev) => ({ ...prev, srNo: String(maxSrNo + 1) }))
      } else if (!isUpdatingReceipt) {
        // If no receipts exist, start with 1
        setCashReceipt((prev) => ({ ...prev, srNo: '1' }))
      }
    } catch (err) {
      console.error('Error fetching recent receipts:', err)
    } finally {
      setShowLoader(false)
    }
  }, [isUpdatingReceipt])

  // Running balance calculation
  const balances = useMemo(() => {
    const receipts = [...recentReceipts].reverse()
    let balance = 0
    const calculatedBalances = []

    receipts.forEach((receipt, idx) => {
      const amount = getAmount(receipt.type, receipt.amount)
      balance += amount
      calculatedBalances[receipts.length - 1 - idx] = balance
    })

    return calculatedBalances
  }, [recentReceipts])

  // Form validation
  const validateForm = useCallback(() => {
    const newErrors = {}

    if (!cashReceipt.type) newErrors.type = 'Type is required'
    if (!cashReceipt.cash) newErrors.cash = 'Cash is required'
    if (!cashReceipt.date) newErrors.date = 'Date is required'
    if (!cashReceipt.clientId) newErrors.party = 'Party/Account is required'
    if (!cashReceipt.amount || Number(cashReceipt.amount) <= 0) {
      newErrors.amount = 'Valid amount is required'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }, [cashReceipt])

  // Event handlers
  const handleInputChange = useCallback(
    (field, value) => {
      setCashReceipt((prev) => ({ ...prev, [field]: value }))
      if (errors[field]) {
        setErrors((prev) => ({ ...prev, [field]: '' }))
      }
    },
    [errors]
  )

  const handleClearForm = useCallback(() => {
    // Reset to create mode
    setIsUpdatingReceipt(false)
    setSelectedReceiptId(null)

    // Get next serial number
    const maxSrNo =
      recentReceipts.length > 0 ? Math.max(...recentReceipts.map((r) => Number(r.srNo) || 0)) : 0

    setCashReceipt({
      id: null,
      srNo: String(maxSrNo + 1),
      type: 'Receipt',
      cash: 'Cash Account',
      date: new Date(),
      amount: '',
      description: '',
      dueDate: '',
      taxAmount: '',
      pendingAmount: '',
      pendingFromOurs: '',
      paidAmount: '',
      statusOfTransaction: 'pending',
      quantity: 0,
      paymentType: 'full'
    })
    setErrors({})
  }, [recentReceipts])

  const handleSubmitCashReceipt = useCallback(
    async (e) => {
      e.preventDefault()

      if (isSubmittingTransaction) return

      if (!validateForm()) {
        toast.error('Please fix the form errors')
        return
      }

      setIsSubmittingTransaction(true)

      try {
        // Prepare the data to send (omit id for new receipts)

        const transaction = await window.api.createTransaction({
          clientId: cashReceipt?.clientId,
          productId: null,
          quantity: cashReceipt?.quantity || 0,
          totalAmount: cashReceipt?.amount || 0,
          sellAmount: cashReceipt?.sellAmount || 0,
          purchaseAmount: cashReceipt?.purchaseAmount || 0,
          paymentMethod: 'cash',
          statusOfTransaction: 'pending',
          paymentType: cashReceipt?.paymentType || 'full',
          pendingAmount: cashReceipt?.pendingAmount || 0,
          paidAmount: cashReceipt?.paidAmount || 0,
          taxAmount: cashReceipt?.taxAmount || '',
          dueDate: cashReceipt?.dueDate
            ? new Date(cashReceipt.dueDate)
            : new Date().setMonth(new Date().getMonth() + 1),
          transactionType: cashReceipt?.type === 'Receipt' ? 'sales' : 'purchase',
          pageName: 'Cash'
        })

        const cashReceiptData = {
          clientId: cashReceipt?.clientId,
          productId: cashReceipt?.productId || null,
          transactionId: transaction.id,
          srNo: cashReceipt.srNo,
          type: cashReceipt.type,
          cash: cashReceipt.cash,
          date: new Date(cashReceipt.date),
          amount: Number(cashReceipt.amount) || 0,
          description: cashReceipt.description,
          dueDate: cashReceipt.dueDate
            ? new Date(cashReceipt.dueDate)
            : new Date().setMonth(new Date().getMonth() + 1),
          taxAmount: cashReceipt.taxAmount || [],
          statusOfTransaction: cashReceipt?.type === 'Salary' ? 'completed' : 'pending',
          pendingAmount: cashReceipt.type === 'Receipt' ? Number(cashReceipt.amount) : 0,
          pendingFromOurs: cashReceipt.type === 'Payment' ? Number(cashReceipt.amount) : 0,
          paidAmount: cashReceipt.paidAmount || 0,
          quantity: cashReceipt.quantity || 0,
          paymentType: cashReceipt.paymentType || 'full',
          pageName: 'Cash'
        }

        let response
        if (isUpdatingReceipt && selectedReceiptId) {
          response = await window.api.updateCashReceipt({
            id: selectedReceiptId,
            ...cashReceiptData
          })
          toast.success('Cash receipt updated successfully')
        } else {
          response = await window.api.createCashReceipt(cashReceiptData)

          setCashReceipt((prev) => ({
            ...prev,
            id: response.id,
            transactionId: transaction.id
          }))

          dispatch(createCashReceipt(cashReceiptData))
          toast.success('Cash receipt added successfully')

          // Update client balances
          const clientFiltered = clients.find((c) => c.id === cashReceipt.clientId)

          if (cashReceipt.type === 'Receipt') {
            const updateData = await window.api.updateClient({
              id: clientFiltered?.id,
              ...clientFiltered,
              pendingAmount: clientFiltered?.pendingAmount + Number(cashReceipt.amount)
            })
            dispatch(updateClient(updateData))
          } else if (cashReceipt.type === 'Payment') {
            const updateData = await window.api.updateClient({
              id: clientFiltered?.id,
              ...clientFiltered,
              pendingFromOurs: clientFiltered?.pendingFromOurs + Number(cashReceipt.amount)
            })
            dispatch(updateClient(updateData))
          } else if (cashReceipt.type === 'Salary') {
            const updateData = await window.api.updateClient({
              id: clientFiltered?.id,
              ...clientFiltered,
              salaryHistory: JSON.stringify([
                ...clientFiltered.salaryHistory,
                {
                  amount: Number(cashReceipt.amount),
                  date: new Date().toISOString(),
                  type: cashReceipt.type
                }
              ])
            })
            dispatch(updateClient(updateData))
            const updateTransactionData = await window.api.updateTransaction({
              id: transaction.id,
              ...transaction,
              statusOfTransaction: 'completed',
              pageName: 'Salary'
            })
            dispatch(updateTransaction(updateTransactionData))
          }
        }

        await fetchRecentReceipts()
        handleClearForm()
      } catch (error) {
        console.error('Error submitting cash receipt:', error)
        toast.error(error.message || 'Failed to submit cash receipt')
      } finally {
        setIsSubmittingTransaction(false)
      }
    },
    [
      cashReceipt,
      isSubmittingTransaction,
      isUpdatingReceipt,
      selectedReceiptId,
      validateForm,
      fetchRecentReceipts,
      dispatch,
      clients,
      handleClearForm
    ]
  )

  const handleUpdateReceipt = useCallback((receipt) => {
    setCashReceipt({
      id: receipt.id,
      srNo: receipt.srNo || '',
      clientId: receipt.clientId,
      productId: receipt.productId || null,
      transactionId: receipt.transactionId,
      pendingAmount: receipt.pendingAmount,
      pendingFromOurs: receipt.pendingFromOurs,
      paidAmount: receipt.paidAmount,
      type: receipt.type || 'Receipt',
      cash: receipt.cash || 'Cash Account',
      date: receipt.date ? new Date(receipt.date) : new Date(),
      amount: receipt.amount ? String(receipt.amount) : '',
      description: receipt.description || '',
      dueDate: receipt.dueDate ? new Date(receipt.dueDate) : null,
      taxAmount: receipt.taxAmount || '',
      statusOfTransaction: receipt.statusOfTransaction || 'pending',
      quantity: receipt.quantity || 0,
      paymentType: receipt.paymentType || 'full'
    })

    setIsUpdatingReceipt(true)
    setSelectedReceiptId(receipt.id)
    setErrors({})
    window.scrollTo({ top: 0, behavior: 'smooth' })
    toast.info(`Receipt #${receipt.transactionId} loaded for editing`)
  }, [])

  const handleDeleteReceipt = useCallback(
    async (receipt) => {
      if (!window.confirm('Are you sure you want to delete this purchase?')) return
      console.log('Deleting receipt:', receipt)

      try {
        const res = await window.api.deleteCashReceipt(receipt)
        console.log('Delete response:', res)
        if (!res.success) throw new Error(res.message || 'Failed to delete')

        await fetchRecentReceipts()
        dispatch(deleteCashReceipt(receipt))
        toast.success('Receipt deleted successfully')
        // ...client balance updates
      } catch (error) {
        console.error('Delete error:', error)
        toast.error('Failed to delete receipt: ' + error.message)
      }
    },
    [fetchRecentReceipts, clients, dispatch]
  )

  const handleImportExcel = useCallback(
    async (filePath) => {
      try {
        const result = await window.api.importExcel(filePath, 'bank_receipts')

        if (result.success) {
          toast.success(`Imported ${result.count} bank receipts successfully`)
          await fetchRecentReceipts()
          setImportFile(false)
        } else {
          toast.error(`Import failed: ${result.error}`)
        }
      } catch (error) {
        toast.error('Failed to import Excel: ' + error.message)
      }
    },
    [fetchRecentReceipts]
  )

  // Prepare client options for SelectPicker
  const clientOptions = clients.map((client) => ({
    label: client.clientName,
    value: client.id
  }))

  const selectedCashBalance = useMemo(() => {
    return STATIC_CASH_BALANCES[cashReceipt.cash] || 0
  }, [cashReceipt.cash])

  // Effects
  useEffect(() => {
    fetchAllProducts()
    fetchAllClients()
    fetchRecentReceipts()
  }, [fetchAllProducts, fetchAllClients, fetchRecentReceipts])

  return (
    <div className="select-none gap-10 h-screen w-full overflow-x-auto transition-all duration-300 min-w-[720px] overflow-auto customScrollbar">
      <div className="w-full sticky top-0 z-10">
        <Navbar />
      </div>

      <div className="flex justify-between mt-5 pb-2 items-center mb-5">
        <div className="flex items-center gap-4 mx-7">
          <p className="text-3xl font-light">Cash Receipt</p>
          {isUpdatingReceipt && (
            <div className="flex items-center gap-2 bg-blue-100 text-blue-800 px-3 py-2 rounded-full text-sm">
              <Edit size={14} />
              <span>Editing Receipt #{cashReceipt.srNo}</span>
            </div>
          )}
        </div>
        <div className="mx-7 flex gap-2">
          <button
            className="flex items-center gap-2 border border-gray-300 w-fit p-1.5 px-3 rounded-lg hover:bg-gray-50 transition-all duration-200 hover:shadow-md"
            onClick={() => setImportFile(!importFile)}
          >
            <Import size={16} />
            <span className="text-sm">Import</span>
          </button>
          <button
            className="text-black flex items-center cursor-pointer gap-1 border border-gray-300 w-fit p-1 px-3 rounded-lg hover:bg-black hover:text-white transition-all duration-300 hover:scale-105"
            onClick={() => navigate('/ledger')}
          >
            <Plus size={16} />
            <span className="text-sm">Ledger</span>
          </button>
        </div>
      </div>

      {importFile && (
        <ImportExcel onFileSelected={handleImportExcel} onClose={() => setImportFile(false)} />
      )}

      {showLoader && <Loader />}

      <form
        onSubmit={handleSubmitCashReceipt}
        className="bg-white rounded-2xl shadow-xl mx-7 mb-8 overflow-hidden border border-gray-200"
      >
        {/* Form Header */}
        <div className="bg-gradient-to-r from-gray-50 to-gray-100 px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
            <CreditCard size={20} />
            {isUpdatingReceipt ? 'Update Cash Receipt' : 'Create New Cash Receipt'}
          </h3>
        </div>

        {/* Type and Bank Selection */}
        <div className="p-6">
          <div className="flex items-center gap-5 mb-6">
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Transaction Type
              </label>
              <SelectPicker
                data={typeOptions.map((opt) => ({
                  ...opt,
                  label: (
                    <div className="flex items-center gap-2">
                      <opt.icon size={16} />
                      {opt.label}
                    </div>
                  )
                }))}
                value={cashReceipt.type}
                onChange={(value) => handleInputChange('type', value)}
                size="lg"
                searchable={false}
                placeholder="Select Type"
                className="w-full"
              />
              {errors.type && (
                <div className="flex items-center gap-1 mt-1 text-red-500 text-xs">
                  <AlertCircle size={12} />
                  {errors.type}
                </div>
              )}
            </div>

            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-2">Select Account</label>
              <div className="flex gap-3 items-center">
                <SelectPicker
                  data={cashOptions}
                  value={cashReceipt.cash}
                  onChange={(value) => handleInputChange('cash', value)}
                  size="lg"
                  searchable={false}
                  placeholder="Select Account"
                  className="flex-1"
                  renderMenuItem={(label, item) => (
                    <div className="flex justify-between">
                      <div className="flex items-center gap-3">
                        <img src={item?.icon} alt="" className="w-7 h-7" />
                        <span className="pt-1">{label}</span>
                      </div>
                      <p className="text-sm text-gray-500 mt-2">
                        Available Balance:{' '}
                        <span className="font-semibold text-emerald-600">
                          {cashReceipt.cash === item.value
                            ? toThousands(selectedCashBalance + statistics?.netBalance)
                            : toThousands('')}
                        </span>
                      </p>
                    </div>
                  )}
                  renderValue={(value, item) => (
                    <div className="flex items-center gap-3">
                      <img src={item?.icon} alt="" className="w-7 h-7" />
                      <span className="font-bold pt-0.5">{item?.label}</span>
                    </div>
                  )}
                />
                <Whisper
                  trigger="hover"
                  placement="top"
                  speaker={
                    <Tooltip className="!bg-white !text-black !shadow-lg rounded-xl p-4 border border-gray-100">
                      <div>
                        <p className="font-thin text-sm">Cash Balance</p>
                        <p className="font-bold text-2xl">
                          ₹ {toThousands(selectedCashBalance + statistics?.netBalance)}
                        </p>
                      </div>
                    </Tooltip>
                  }
                >
                  <div className="p-3 bg-blue-100 rounded-xl cursor-help hover:bg-blue-200 transition-colors">
                    <Info size={20} className="text-blue-600" />
                  </div>
                </Whisper>
              </div>
              {errors.bank && (
                <div className="flex items-center gap-1 mt-1 text-red-500 text-xs">
                  <AlertCircle size={12} />
                  {errors.bank}
                </div>
              )}
            </div>
          </div>

          {/* Form Fields Grid */}
          <div className="grid grid-cols-4 gap-6 mb-5">
            {/* Date */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Transaction Date
              </label>
              <DatePicker
                format="dd-MM-yyyy"
                oneTap
                value={cashReceipt.date}
                onChange={(value) => handleInputChange('date', value)}
                className="w-full"
                size="lg"
              />
              {errors.date && (
                <div className="flex items-center gap-1 mt-1 text-red-500 text-xs">
                  <AlertCircle size={12} />
                  {errors.date}
                </div>
              )}
            </div>

            {/* Party */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Party / Account
              </label>
              <SelectPicker
                data={clientOptions}
                value={cashReceipt.clientId}
                onChange={(value) => handleInputChange('clientId', value)}
                size="lg"
                searchable
                placeholder="Select Client"
                className="w-full"
              />
              {errors.clientId && (
                <div className="flex items-center gap-1 mt-1 text-red-500 text-xs">
                  <AlertCircle size={12} />
                  {errors.clientId}
                </div>
              )}
            </div>

            {/* Amount */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Amount</label>
              <Input
                type="number"
                size="lg"
                value={cashReceipt.amount}
                onChange={(value) => handleInputChange('amount', value)}
                placeholder="Enter Amount"
                className="w-full"
              />
              {errors.amount && (
                <div className="flex items-center gap-1 mt-1 text-red-500 text-xs">
                  <AlertCircle size={12} />
                  {errors.amount}
                </div>
              )}
            </div>

            {/* Due Date */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Due Date (Optional)
              </label>
              <DatePicker
                format="dd-MM-yyyy"
                oneTap
                value={cashReceipt.dueDate}
                onChange={(value) => handleInputChange('dueDate', value)}
                className="w-full"
                size="lg"
              />
            </div>

            {/* Description */}
            <div className="col-span-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
              <Input
                as="textarea"
                rows={3}
                value={cashReceipt.description}
                onChange={(value) => handleInputChange('description', value)}
                placeholder="Enter Description"
                className="w-full"
              />
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end gap-3">
            <button
              type="button"
              className="flex items-center gap-2 px-5 py-2 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700 transition-all duration-200"
              onClick={handleClearForm}
            >
              <RotateCcw size={16} />
              Clear
            </button>

            <button
              type="submit"
              disabled={isSubmittingTransaction}
              className="flex items-center gap-2 px-5 py-2 rounded-lg bg-gradient-to-r from-blue-500 to-indigo-600 text-white font-medium hover:shadow-lg hover:scale-105 transition-all duration-300 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {isSubmittingTransaction ? (
                <Loader />
              ) : isUpdatingReceipt ? (
                <>
                  <Save size={16} />
                  Update Receipt
                </>
              ) : (
                <>
                  <Plus size={16} />
                  Add Receipt
                </>
              )}
            </button>
          </div>
        </div>
      </form>

      {/* Receipts Table */}
      <div className="bg-white rounded-2xl shadow-xl mx-7 mb-10 overflow-hidden border border-gray-200">
        <div className="bg-gradient-to-r from-gray-50 to-gray-100 px-6 py-4 border-b border-gray-200 flex justify-between items-center">
          <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
            <Banknote size={20} />
            Recent Cash Receipts
          </h3>
          <span className="text-sm text-gray-500">{recentReceipts.length} Records</span>
        </div>

        <div className="overflow-x-auto customScrollbar">
          <table className="min-w-max table-fixed">
            <thead className="bg-gray-100 text-gray-600 text-sm uppercase font-semibold sticky top-0 z-20 shadow-sm">
              <tr>
                {TABLE_HEADERS.map((header) => (
                  <th
                    key={header.key}
                    className={`px-6 py-3 text-left ${header.width} whitespace-nowrap`}
                  >
                    <div className="flex items-center gap-2">
                      <header.icon size={14} />
                      {header.label}
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="text-sm">
              {recentReceipts.length > 0 ? (
                [...recentReceipts]
                  .sort((a, b) => new Date(b.date) - new Date(a.date))
                  .map((receipt, index) => (
                    <ReceiptRow
                      key={receipt.id}
                      receipt={receipt}
                      index={index}
                      balance={balances[index]}
                      clients={clients}
                      onEdit={handleUpdateReceipt}
                      onDelete={handleDeleteReceipt}
                      isSelected={selectedReceiptId === receipt.id}
                    />
                  ))
              ) : (
                <tr>
                  <td
                    colSpan={TABLE_HEADERS.length}
                    className="px-6 py-10 text-center text-gray-400 italic"
                  >
                    No bank receipts found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

export default Cash
