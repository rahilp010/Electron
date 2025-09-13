/* eslint-disable prettier/prettier */
/* eslint-disable no-unused-vars */
/* eslint-disable react-hooks/exhaustive-deps */
import { useEffect, useState, useCallback } from 'react'
import { Plus, Info } from 'lucide-react'
import Loader from '../components/Loader'
import { useNavigate } from 'react-router-dom'
import 'rsuite/dist/rsuite-no-reset.min.css'
import { createCashReceipt, setClients, setProducts } from '../app/features/electronSlice'
import { useDispatch, useSelector } from 'react-redux'
import { clientApi, productApi } from '../API/Api'
import { toast } from 'react-toastify'
import Navbar from '../components/UI/Navbar'
import { DatePicker, Input, SelectPicker, Tooltip, Whisper } from 'rsuite'
import cash from '../assets/cash.png'

const Cash = () => {
  const navigate = useNavigate()
  const dispatch = useDispatch()

  // Loading states
  const [showLoader, setShowLoader] = useState(false)
  const [isSubmittingTransaction, setIsSubmittingTransaction] = useState(false)

  // Form state
  const [cashReceipt, setCashReceipt] = useState({
    srNo: 0,
    type: 'Receipt',
    cash: 'Cash Account',
    date: new Date(),
    party: '',
    amount: '',
    description: ''
  })

  // Form validation errors
  const [errors, setErrors] = useState({})
  const [recentReceipts, setRecentReceipts] = useState([])

  const cashOptions = [{ label: 'Cash Account', value: 'Cash Account', icon: cash }]

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
      const receipts = await window.api.getRecentCashReceipts()
      setRecentReceipts(receipts)

      if (receipts.length > 0) {
        const maxSrNo = Math.max(...receipts.map((r) => Number(r.srNo) || 0))
        setCashReceipt((prev) => ({ ...prev, srNo: String(maxSrNo + 1) }))
      } else {
        // If no receipts exist, start with 1
        setCashReceipt((prev) => ({ ...prev, srNo: '1' }))
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

    if (!cashReceipt.type) {
      newErrors.type = 'Type is required'
    }

    if (!cashReceipt.cash) {
      newErrors.cash = 'Cash is required'
    }

    if (!cashReceipt.date) {
      newErrors.date = 'Date is required'
    }

    if (!cashReceipt.party) {
      newErrors.party = 'Party/Account is required'
    }

    if (!cashReceipt.amount || parseFloat(cashReceipt.amount) <= 0) {
      newErrors.amount = 'Valid amount is required'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  // Form handlers
  const handleInputChange = (field, value) => {
    setCashReceipt((prev) => ({
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
        const cashReceiptData = {
          srNo: cashReceipt.srNo,
          type: cashReceipt.type,
          cash: cashReceipt.cash,
          date: new Date(cashReceipt.date).toLocaleDateString(),
          party: Number(cashReceipt.party),
          amount: parseFloat(cashReceipt.amount) || 0,
          description: cashReceipt.description
        }

        // Use the window.api if available, otherwise use a fallback API call
        let response
        if (window.api && window.api.createCashReceipt) {
          response = await window.api.createCashReceipt(cashReceiptData)
          dispatch(createCashReceipt(cashReceiptData))
        } else {
          // Fallback API call - you'll need to implement this based on your API structure
          // response = await bankReceiptApi.create(bankReceiptData)
          console.log('Cash receipt data:', cashReceiptData)
          // Simulate success for now
          response = { success: true, data: cashReceiptData }
        }

        toast.success('Cash receipt added successfully')
        fetchRecentReceipts()
        // Clear form after successful submission
        handleClearForm()
      } catch (error) {
        console.error('Error submitting cash receipt:', error)
        toast.error(error.message || 'Failed to submit cash receipt')
      } finally {
        setIsSubmittingTransaction(false)
      }
    },
    [cashReceipt, isSubmittingTransaction]
  )

  const handleClearForm = () => {
    setCashReceipt((prev) => ({
      srNo: String(Number(prev.srNo) + 1),
      type: 'Receipt',
      cash: 'Cash Account',
      date: new Date(),
      party: '',
      amount: '',
      description: ''
    }))
    setErrors({})
  }

  // Prepare client options for SelectPicker
  const clientOptions = clients.map((client) => ({
    label: client.clientName,
    value: client.id
  }))

  return (
    <div className="select-none gap-10 h-screen w-full overflow-x-auto transition-all duration-300 min-w-[720px] overflow-auto customScrollbar">
      <div className="w-full sticky top-0 z-10">
        <Navbar />
      </div>

      <div className="flex justify-between mt-5 pb-2 items-center">
        <p className="text-3xl font-light mx-7">Cash Receipt</p>
        <div className="mx-7 flex gap-2">
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

      <form onSubmit={handleSubmitCashReceipt}>
        <div className="flex items-center gap-5 mx-7 my-5">
          <div>
            <SelectPicker
              data={typeOptions}
              value={cashReceipt.type}
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
              data={cashOptions}
              value={cashReceipt.cash}
              onChange={(value) => handleInputChange('cash', value)}
              size="md"
              searchable={false}
              placeholder="Select Cash"
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
            {errors.cash && <p className="text-red-500 text-xs mt-1">{errors.cash}</p>}
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
          <div className="flex items-center gap-5 mx-4 my-2">
            <div className="flex flex-col gap-1 indent-0.5">
              <p className="font-light text-sm text-gray-500 tracking-wider">Sr No.</p>
              <Input
                size="lg"
                placeholder="Enter Serial Number"
                style={{ width: 250 }}
                value={cashReceipt.srNo}
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
                value={cashReceipt.date}
                onChange={(value) => handleInputChange('date', value)}
              />
              {errors.date && <p className="text-red-500 text-xs mt-1">{errors.date}</p>}
            </div>

            <div className="flex flex-col gap-1 indent-0.5">
              <p className="font-light text-sm text-gray-500 tracking-wider">
                Party / Account / Ledger
              </p>
              <SelectPicker
                data={clientOptions}
                value={cashReceipt.party}
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
                step="0.01"
                min="0"
                value={cashReceipt.amount}
                onChange={(value) => handleInputChange('amount', value)}
              />
              {errors.amount && <p className="text-red-500 text-xs mt-1">{errors.amount}</p>}
            </div>
          </div>

          <div className="flex items-center gap-5 mx-4 my-5">
            <div className="w-full">
              <Input
                as="textarea"
                rows={3}
                placeholder="Description"
                value={cashReceipt.description}
                onChange={(value) => handleInputChange('description', value)}
              />
              {errors.description && (
                <p className="text-red-500 text-xs mt-1">{errors.description}</p>
              )}
            </div>
          </div>

          <div className="flex justify-end gap-3 mx-5 my-5">
            <button
              type="button"
              onClick={handleClearForm}
              className="text-white bg-gray-600 px-8 py-2 rounded-lg hover:bg-gray-700 transition-all duration-300 cursor-pointer"
            >
              Clear
            </button>
            <button
              type="submit"
              disabled={isSubmittingTransaction}
              className="text-white bg-black px-8 py-2 rounded-lg hover:bg-black/80 transition-all duration-300 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmittingTransaction ? 'Saving...' : 'Save'}
            </button>
          </div>
        </div>
      </form>

      {/* Recent Receipts Section */}
      <div className="mx-7 my-10">
        <h2 className="text-xl font-light mb-4">Last 3 Receipts</h2>
        <div className="bg-gray-50 rounded-xl shadow-sm overflow-x-auto customScrollbar max-h-screen ">
          <table className="min-w-max border-collapse text-sm text-center">
            <thead className="bg-gray-100 border-b">
              <tr className="sticky top-0 z-8">
                <th className="px-6 py-4 border-r border-gray-300 w-[100px] font-medium text-gray-600 sticky left-0 z-8 bg-gray-100">
                  Sr No
                </th>
                <th className="px-4 py-3 font-medium border-r border-gray-300 w-[170px] text-gray-600">
                  Date
                </th>
                <th className="px-6 py-3 font-medium border-r border-gray-300 w-[200px] text-gray-600">
                  Cash
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
              </tr>
            </thead>
            <tbody className={`text-sm divide-y divide-gray-200`}>
              {recentReceipts.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-4 text-center text-gray-400">
                    No receipts found
                  </td>
                </tr>
              ) : (
                recentReceipts.slice(0, 3).map((receipt, idx) => (
                  <tr
                    key={idx}
                    className={`transition ${idx === recentReceipts.length - 1 ? 'border-b-0' : ''} ${receipt.type === 'Receipt' ? 'bg-blue-100' : 'bg-red-100'}`}
                  >
                    <td
                      className={`px-6 py-3 w-[100px] sticky left-0 z-8 ${receipt.type === 'Receipt' ? 'bg-blue-100' : 'bg-red-100'}`}
                    >
                      {receipt.srNo}
                    </td>
                    <td className="px-6 py-3 w-[100px]">
                      {receipt.date}
                      {console.log(receipt.date)}
                    </td>
                    <td className="px-6 py-3">{receipt.cash}</td>
                    <td className="px-6 py-3">{getClientName(Number(receipt.party))}</td>
                    <td className="px-6 py-3">₹ {toThousands(receipt.amount)}</td>
                    <td className="px-6 py-3">₹ {toThousands(receipt.amount)}</td>
                    <td className="px-6 py-3">₹ {toThousands(receipt.amount)}</td>
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

export default Cash
