/* eslint-disable prettier/prettier */
/* eslint-disable no-unused-vars */
/* eslint-disable react-hooks/exhaustive-deps */
import { useEffect, useState, useCallback } from 'react'
import { Plus, Info, Import, Edit, X, Trash } from 'lucide-react'
import Loader from '../components/Loader'
import { useNavigate } from 'react-router-dom'
import 'rsuite/dist/rsuite-no-reset.min.css'
import { createBankReceipt, setClients, setProducts } from '../app/features/electronSlice'
import { useDispatch, useSelector } from 'react-redux'
import { clientApi, productApi } from '../API/Api'
import { toast } from 'react-toastify'
import Navbar from '../components/UI/Navbar'
import { DatePicker, Input, SelectPicker, Tooltip, Whisper } from 'rsuite'
import IDBI from '../assets/IDBIBank.png'
import HDFC from '../assets/HDFCBank.png'
import SBI from '../assets/SBI.png'
import CB from '../assets/CBI.png'
import Axis from '../assets/Axisbank.png'

const Bank = () => {
  const navigate = useNavigate()
  const dispatch = useDispatch()

  // Loading states
  const [showLoader, setShowLoader] = useState(false)
  const [isSubmittingTransaction, setIsSubmittingTransaction] = useState(false)
  const [isUpdatingReceipt, setIsUpdatingReceipt] = useState(false)
  const [selectedReceiptId, setSelectedReceiptId] = useState(null)

  // Form state
  const [bankReceipt, setBankReceipt] = useState({
    srNo: '',
    type: 'Receipt',
    bank: 'IDBI',
    date: new Date(),
    party: '',
    amount: '',
    description: ''
  })

  // Form validation errors
  const [errors, setErrors] = useState({})
  const [recentReceipts, setRecentReceipts] = useState([])

  const bankOptions = [
    { label: 'IDBI Bank', value: 'IDBI', icon: IDBI },
    { label: 'HDFC Bank', value: 'HDFC', icon: HDFC },
    { label: 'SBI Bank', value: 'SBI', icon: SBI },
    { label: 'Central Bank', value: 'CB', icon: CB },
    { label: 'Axis Bank', value: 'Axis', icon: Axis }
  ]

  const typeOptions = [
    { label: 'Receipt', value: 'Receipt' },
    { label: 'Payment', value: 'Payment' }
  ]

  // Redux selectors
  const clients = useSelector((state) => state.electron.clients.data || [])

  // Fetch data functions
  const fetchAllProducts = useCallback(async () => {
    try {
      setShowLoader(true)
      const response = await productApi.getAllProducts()
      dispatch(setProducts(response))
    } catch (error) {
      console.error('Error fetching products:', error)
      toast.error('Failed to fetch products')
    } finally {
      setShowLoader(false)
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
    } finally {
      setShowLoader(false)
    }
  }, [dispatch])

  const fetchRecentReceipts = async () => {
    try {
      setShowLoader(true)
      const receipts = await window.api.getRecentBankReceipts()
      setRecentReceipts(receipts)

      // Only set next srNo if we're not updating
      if (!isUpdatingReceipt && receipts.length > 0) {
        const maxSrNo = Math.max(...receipts.map((r) => Number(r.srNo) || 0))
        setBankReceipt((prev) => ({ ...prev, srNo: String(maxSrNo + 1) }))
      } else if (!isUpdatingReceipt) {
        // If no receipts exist, start with 1
        setBankReceipt((prev) => ({ ...prev, srNo: '1' }))
      }
    } catch (err) {
      console.error('Error fetching recent receipts:', err)
    } finally {
      setShowLoader(false)
    }
  }

  useEffect(() => {
    fetchAllProducts()
    fetchAllClients()
    fetchRecentReceipts()
  }, [])

  const getClientName = (id) => {
    const client = clients.find((c) => c?.id === id)
    return client ? client.clientName : ''
  }

  const getAmount = (type, amount) => {
    if (!amount) return 0
    return type === 'Receipt' ? amount : -amount
  }

  const bookAmount = recentReceipts.reduce((acc, receipt) => {
    const amount = getAmount(receipt.type, receipt.amount)
    return acc + amount
  }, 0)

  // Helper functions
  const toThousands = (value) => {
    if (!value) return value
    return new Intl.NumberFormat('en-IN').format(value)
  }

  // Form validation
  const validateForm = () => {
    const newErrors = {}

    if (!bankReceipt.type) {
      newErrors.type = 'Type is required'
    }

    if (!bankReceipt.bank) {
      newErrors.bank = 'Bank is required'
    }

    if (!bankReceipt.date) {
      newErrors.date = 'Date is required'
    }

    if (!bankReceipt.party) {
      newErrors.party = 'Party/Account is required'
    }

    if (!bankReceipt.amount || parseFloat(bankReceipt.amount) <= 0) {
      newErrors.amount = 'Valid amount is required'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  // Form handlers
  const handleInputChange = (field, value) => {
    setBankReceipt((prev) => ({
      ...prev,
      [field]: value
    }))

    // Clear error for this field when user starts typing
    if (errors[field]) {
      setErrors((prev) => ({
        ...prev,
        [field]: ''
      }))
    }
  }

  const handleSubmitBankReceipt = useCallback(
    async (e) => {
      e.preventDefault()

      if (isSubmittingTransaction) return

      if (!validateForm()) {
        toast.error('Please fix the form errors')
        return
      }

      setIsSubmittingTransaction(true)

      try {
        const bankReceiptData = {
          srNo: bankReceipt.srNo,
          type: bankReceipt.type,
          bank: bankReceipt.bank,
          date: new Date(bankReceipt.date).toLocaleString(),
          party: Number(bankReceipt.party),
          amount: parseFloat(bankReceipt.amount) || 0,
          description: bankReceipt.description
        }

        let response
        if (isUpdatingReceipt && selectedReceiptId) {
          // Update existing receipt
          if (window.api && window.api.updateBankReceipt) {
            response = await window.api.updateBankReceipt({
              id: selectedReceiptId,
              ...bankReceiptData
            })
          } else {
            toast.error('Failed to update bank receipt')
          }
          console.log(response)

          toast.success('Bank receipt updated successfully')
        } else {
          // Create new receipt
          if (window.api && window.api.createBankReceipt) {
            response = await window.api.createBankReceipt(bankReceiptData)
            console.log(response)
            dispatch(createBankReceipt(bankReceiptData))
          } else {
            toast.error('Failed to create bank receipt')
          }
          console.log(response)
          toast.success('Bank receipt added successfully')
        }

        fetchRecentReceipts()
        handleClearForm()
      } catch (error) {
        console.error('Error submitting bank receipt:', error)
        toast.error(error.message || 'Failed to submit bank receipt')
      } finally {
        setIsSubmittingTransaction(false)
      }
    },
    [bankReceipt, isSubmittingTransaction, isUpdatingReceipt, selectedReceiptId]
  )

  console.log(bankReceipt)

  const handleClearForm = () => {
    // Reset to create mode
    setIsUpdatingReceipt(false)
    setSelectedReceiptId(null)

    // Get next serial number
    const maxSrNo =
      recentReceipts.length > 0 ? Math.max(...recentReceipts.map((r) => Number(r.srNo) || 0)) : 0

    setBankReceipt({
      srNo: String(maxSrNo + 1),
      type: 'Receipt',
      bank: 'IDBI',
      date: new Date(),
      party: '',
      amount: '',
      description: ''
    })
    setErrors({})
  }

  const handleCancelUpdate = () => {
    handleClearForm()
    toast.info('Update cancelled')
  }

  // Prepare client options for SelectPicker
  const clientOptions = clients.map((client) => ({
    label: client.clientName,
    value: client.id
  }))

  const calculateRunningBalances = (receipts) => {
    let balance = 0
    const balances = []

    for (let i = receipts.length - 1; i >= 0; i--) {
      const receipt = receipts[i]
      const amount = getAmount(receipt.type, receipt.amount)
      balance += amount
      balances[i] = balance
    }

    return balances
  }

  const receipts = recentReceipts
  const balances = calculateRunningBalances(receipts)

  const handleUpdateReceipt = (receipt) => {
    setBankReceipt({
      srNo: receipt.srNo || '',
      type: receipt.type || 'Receipt',
      bank: receipt.bank || 'IDBI',
      date: receipt.date ? new Date(receipt.date).toLocaleString() : new Date().toLocaleString(),
      party: receipt.party ? Number(receipt.party) : '',
      amount: receipt.amount ? String(receipt.amount) : '',
      description: receipt.description || ''
    })

    setIsUpdatingReceipt(true)
    setSelectedReceiptId(receipt.id)
    setErrors({})

    // Scroll to form
    window.scrollTo({ top: 0, behavior: 'smooth' })
    toast.info(`Receipt #${receipt.srNo} loaded for editing`)
  }

  const handleDeleteReceipt = useCallback(
    async (id) => {
      if (!window.confirm('Are you sure you want to delete this purchase?')) return

      try {
        const response = await window.api.deleteBankReceipt(id)
        console.log(response)
        await fetchRecentReceipts()
        toast.success('Purchase deleted successfully')
      } catch (error) {
        toast.error('Failed to delete purchase: ' + error.message)
      }
    },
    [fetchRecentReceipts]
  )

  return (
    <div className="select-none gap-10 h-screen w-full overflow-x-auto transition-all duration-300 min-w-[720px] overflow-auto customScrollbar">
      <div className="w-full sticky top-0 z-10">
        <Navbar />
      </div>

      <div className="flex justify-between mt-5 pb-2 items-center">
        <div className="flex items-center">
          <p className="text-3xl font-light mx-7">Bank Receipt</p>
          {isUpdatingReceipt && (
            <div className="flex items-center gap-2 bg-blue-100 text-blue-800 px-3 py-2 rounded-full text-sm">
              <Edit size={14} />
              <span>Editing Receipt #{bankReceipt.srNo}</span>
            </div>
          )}
        </div>
        <div className="mx-7 flex gap-2">
          <div className="flex items-center gap-2 border border-gray-300 w-fit p-1.5 px-3 rounded-sm hover:bg-black hover:text-white transition-all duration-300 hover:scale-105 cursor-pointer">
            <Import size={16} />
            <p className="text-sm">Import</p>
          </div>
          <div
            className="text-black flex items-center cursor-pointer gap-1 border border-gray-300 w-fit p-1 px-3 rounded-sm hover:bg-black hover:text-white transition-all duration-300 hover:scale-105"
            onClick={() => navigate('/ledger')}
          >
            <Plus size={16} />
            <p className="text-sm">Ledger</p>
          </div>
        </div>
      </div>

      {showLoader && <Loader />}

      <form onSubmit={handleSubmitBankReceipt}>
        <div className="flex items-center gap-5 mx-7 my-5">
          <div>
            <SelectPicker
              data={typeOptions}
              value={bankReceipt.type}
              onChange={(value) => handleInputChange('type', value)}
              size="lg"
              searchable={false}
              placeholder="Select Type"
              style={{ width: 250 }}
            />
            {errors.type && <p className="text-red-500 text-xs mt-1">{errors.type}</p>}
          </div>

          <div className="flex gap-3 items-center bg-gray-100 p-2 px-2 rounded-xl">
            <SelectPicker
              data={bankOptions}
              value={bankReceipt.bank}
              onChange={(value) => handleInputChange('bank', value)}
              size="md"
              searchable={false}
              placeholder="Select Bank"
              style={{ width: 250 }}
              renderMenuItem={(label, item) => (
                <div className="flex items-center gap-3">
                  <img src={item?.icon} alt="" className="w-7 h-7" />
                  <span className="pt-1">{label}</span>
                </div>
              )}
              renderValue={(value, item) => (
                <div className="flex items-center gap-3">
                  <img src={item?.icon} alt="" className="w-7 h-7" />
                  <span className="font-bold pt-0.5">{item?.label}</span>
                </div>
              )}
            />
            <Plus
              size={36}
              color="black"
              className="cursor-pointer bg-white border border-gray-300 p-2 rounded-xl"
              onClick={() => {
                /* Handle add new bank */
              }}
            />
            {errors.bank && <p className="text-red-500 text-xs mt-1">{errors.bank}</p>}
          </div>

          <div>
            <Whisper
              trigger="hover"
              controlId="control-id-hover"
              placement="rightStart"
              speaker={
                <Tooltip className="!bg-white !text-black !shadow-lg rounded-xl p-4 border border-gray-100">
                  <div>
                    <p className="font-thin text-sm">Book Amount</p>
                    <p className="font-bold text-2xl">₹ {toThousands(bookAmount)}</p>
                  </div>
                </Tooltip>
              }
            >
              <Info size={20} className="text-gray-600 cursor-pointer hover:scale-105" />
            </Whisper>
          </div>
        </div>

        <div className="bg-gray-100 p-1 mx-7 rounded-xl">
          <div className="grid grid-cols-4 items-center gap-5 mx-4 my-2">
            <div className="flex flex-col gap-1 indent-0.5">
              <p className="font-light text-sm text-gray-500 tracking-wider">Sr No.</p>
              <Input
                size="lg"
                placeholder="Enter Serial Number"
                style={{ width: 250 }}
                value={bankReceipt.srNo}
                readOnly
                onChange={(value) => handleInputChange('srNo', value)}
              />
              {errors.srNo && <p className="text-red-500 text-xs mt-1">{errors.srNo}</p>}
            </div>

            <div className="flex flex-col gap-1 indent-0.5">
              <p className="font-light text-sm text-gray-500 tracking-wider">Date</p>
              <DatePicker
                size="lg"
                placeholder="Enter Date"
                style={{ width: 250 }}
                value={bankReceipt.date}
                onChange={(value) => handleInputChange('date', value)}
                oneTap
                format="dd-MM-yyyy"
              />
              {errors.date && <p className="text-red-500 text-xs mt-1">{errors.date}</p>}
            </div>

            <div className="flex flex-col gap-1 indent-0.5">
              <p className="font-light text-sm text-gray-500 tracking-wider">
                Party / Account / Ledger
              </p>
              <SelectPicker
                data={clientOptions}
                value={bankReceipt.party}
                onChange={(value) => handleInputChange('party', value)}
                size="lg"
                searchable={clients.length > 5}
                placeholder="Select Party"
                style={{ width: 250 }}
              />
              {errors.party && <p className="text-red-500 text-xs mt-1">{errors.party}</p>}
            </div>

            <div className="flex flex-col gap-1 indent-0.5">
              <p className="font-light text-sm text-gray-500 tracking-wider">Amount</p>
              <Input
                size="lg"
                placeholder="Enter Amount"
                style={{ width: 260 }}
                type="number"
                step="1"
                min="0"
                value={bankReceipt.amount}
                onChange={(value) => handleInputChange('amount', value)}
              />
              {errors.amount && <p className="text-red-500 text-xs mt-1">{errors.amount}</p>}
            </div>

            <div className="flex flex-col gap-1 indent-0.5">
              <p className="font-light text-sm text-gray-500 tracking-wider">Due Date</p>
              <DatePicker
                size="lg"
                placeholder="Enter Date"
                style={{ width: 250 }}
                value={bankReceipt.dueDate}
                onChange={(value) => handleInputChange('dueDate', value)}
                oneTap
                format="dd-MM-yyyy"
              />
              {errors.dueDate && <p className="text-red-500 text-xs mt-1">{errors.dueDate}</p>}
            </div>
          </div>

          <div className="flex items-center gap-5 mx-4 my-5">
            <div className="w-full">
              <Input
                as="textarea"
                rows={3}
                placeholder="Description"
                value={bankReceipt.description}
                onChange={(value) => handleInputChange('description', value)}
              />
              {errors.description && (
                <p className="text-red-500 text-xs mt-1">{errors.description}</p>
              )}
            </div>
          </div>

          <div className="flex justify-end gap-3 mx-5 my-5">
            {isUpdatingReceipt && (
              <button
                type="button"
                onClick={handleCancelUpdate}
                className="text-gray-600 bg-gray-200 px-6 py-2 rounded-lg hover:bg-gray-300 transition-all duration-300 cursor-pointer flex items-center gap-2"
              >
                <X size={16} />
                Cancel
              </button>
            )}
            <button
              type="button"
              onClick={handleClearForm}
              className="text-white bg-black px-8 py-2 rounded-lg hover:bg-black/80 transition-all duration-300 cursor-pointer"
            >
              {isUpdatingReceipt ? 'Reset' : 'Clear'}
            </button>
            <button
              type="submit"
              disabled={isSubmittingTransaction}
              className="text-white bg-black px-8 py-2 rounded-lg hover:bg-black/80 transition-all duration-300 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {isUpdatingReceipt && <Edit size={16} />}
              {isSubmittingTransaction ? 'Saving...' : isUpdatingReceipt ? 'Updating...' : 'Save'}
            </button>
          </div>
        </div>
      </form>

      {/* Recent Receipts Section */}
      <div className="mx-7 my-10">
        <h2 className="text-xl font-light mb-4">
          Last 3 Receipts{' '}
          {isUpdatingReceipt && (
            <span className="text-sm text-blue-600">(Click any row to edit)</span>
          )}
        </h2>
        <div className="bg-gray-50 rounded-xl shadow-sm overflow-x-auto customScrollbar max-h-screen">
          <table className="min-w-max border-collapse text-sm text-center">
            <thead className="bg-gray-100 border-b">
              <tr>
                <th className="px-6 py-4 border-r border-gray-300 w-[100px] font-medium text-gray-600 sticky left-0 z-8 bg-gray-100">
                  Sr No
                </th>
                <th className="px-4 py-3 font-medium border-r border-gray-300 w-[170px] text-gray-600">
                  Date
                </th>
                <th className="px-6 py-3 font-medium border-r border-gray-300 w-[200px] text-gray-600">
                  Bank
                </th>
                <th className="px-6 py-3 font-medium border-r border-gray-300 w-[250px] text-gray-600">
                  Party
                </th>
                <th className="px-6 py-3 font-medium border-r border-gray-300 w-[250px] text-gray-600">
                  Debit
                </th>
                <th className="px-6 py-3 font-medium border-r border-gray-300 w-[250px] text-gray-600">
                  Credit
                </th>
                <th className="px-6 py-3 font-medium border-r border-gray-300 w-[250px] text-gray-600">
                  Balance
                </th>
                <th className="px-6 py-3 font-medium border-r border-gray-300 w-[350px] text-gray-600">
                  Description
                </th>
                <th className="px-6 py-3 font-medium border-r border-gray-300 w-[100px] text-gray-600">
                  Action
                </th>
              </tr>
            </thead>
            <tbody className={`text-sm divide-y divide-gray-200`}>
              {recentReceipts.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-6 py-4 text-center text-gray-400">
                    No receipts found
                  </td>
                </tr>
              ) : (
                recentReceipts.slice(0, 3).map((receipt, idx) => (
                  <tr
                    key={receipt.id || idx}
                    className={`transition cursor-pointer hover:shadow-md ${
                      idx === recentReceipts.length - 1 ? 'border-b-0' : ''
                    } ${
                      receipt.type === 'Receipt'
                        ? 'bg-blue-50 hover:bg-blue-100'
                        : 'bg-red-50 hover:bg-red-100'
                    } ${selectedReceiptId === receipt.id ? 'ring-2 ring-blue-500' : ''}`}
                    onClick={() => handleUpdateReceipt(receipt)}
                    title="Click to edit this receipt"
                  >
                    <td
                      className={`px-6 py-3 w-[100px] sticky left-0 z-8 ${
                        receipt.type === 'Receipt'
                          ? 'bg-blue-50 text-blue-500 font-bold hover:bg-blue-100'
                          : 'bg-red-50 text-red-500 font-bold hover:bg-red-100'
                      } ${selectedReceiptId === receipt.id ? 'ring-2 ring-blue-500' : ''}`}
                    >
                      {receipt.srNo}
                    </td>
                    <td className="px-6 py-3 w-[100px]">
                      {receipt.date ? new Date(receipt.date).toLocaleDateString('en-GB') : ''}
                    </td>
                    <td className="px-6 py-3">{receipt.bank} Bank</td>
                    <td className="px-6 py-3 tracking-wider uppercase">
                      {getClientName(Number(receipt.party))}
                    </td>
                    {receipt.type === 'Payment' ? (
                      <td className="px-6 py-3">₹ {toThousands(receipt.amount)}</td>
                    ) : (
                      <td className="px-6 py-3">-</td>
                    )}
                    {receipt.type === 'Receipt' ? (
                      <td className="px-6 py-3">₹ {toThousands(receipt.amount)}</td>
                    ) : (
                      <td className="px-6 py-3">-</td>
                    )}
                    <td className="px-6 py-3">₹ {toThousands(balances[idx])}</td>
                    <td className="px-6 py-3 max-w-[350px] truncate">
                      <Whisper
                        trigger="hover"
                        controlId="control-id-hover"
                        placement="leftStart"
                        speaker={
                          <Tooltip>
                            <div>
                              <p>{receipt.description}</p>
                            </div>
                          </Tooltip>
                        }
                      >
                        {receipt.description}
                      </Whisper>
                    </td>
                    <td className="px-6 py-3">
                      <button
                        className="text-red-500 p-2 border border-red-500 rounded-full hover:bg-red-500 hover:text-white transition-all duration-300 hover:scale-110 cursor-pointer"
                        onClick={(e) => {
                          e.stopPropagation() // prevent triggering row click
                          handleDeleteReceipt(receipt?.id)
                        }}
                        title="Delete product"
                      >
                        <Trash size={12} />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

export default Bank
