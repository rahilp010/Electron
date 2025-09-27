/* eslint-disable prettier/prettier */
/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable prettier/prettier */
import { useEffect, useState, useCallback, useMemo } from 'react'
import Loader from '../components/Loader'
import 'rsuite/dist/rsuite-no-reset.min.css'
import { setClients } from '../app/features/electronSlice'
import { useDispatch, useSelector } from 'react-redux'
import { clientApi } from '../API/Api'
import { toast } from 'react-toastify'
import Navbar from '../components/UI/Navbar'
import { DateRangePicker, Input, InputGroup, SelectPicker, Tooltip, Whisper } from 'rsuite'
import SearchIcon from '@mui/icons-material/Search'
import PrintIcon from '@mui/icons-material/Print'

const LedgerReport = () => {
  const dispatch = useDispatch()

  // Loading states
  const [showLoader, setShowLoader] = useState(false)
  const [selectedType, setSelectedType] = useState('Bank')
  const [searchQuery, setSearchQuery] = useState('')
  const [dateRange, setDateRange] = useState(null)
  const [clientFilter, setClientFilter] = useState('')
  const handleOnChange = (value) => setSearchQuery(value)

  // Form validation errors
  const [recentBankReceipts, setRecentBankReceipts] = useState([])
  const [recentCashReceipts, setRecentCashReceipts] = useState([])

  // Redux selectors
  const clients = useSelector((state) => state.electron.clients.data || [])

  // Fetch data functions
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

  const fetchRecentBankReceipts = async () => {
    try {
      setShowLoader(true)
      const receipts = await window.api.getRecentBankReceipts()
      setRecentBankReceipts(
        receipts.map((r) => ({
          ...r,
          clientId: r.clientId || r.party
        }))
      )
    } catch (err) {
      console.error('Error fetching recent receipts:', err)
    } finally {
      setShowLoader(false)
    }
  }

  const fetchRecentCashReceipts = async () => {
    try {
      setShowLoader(true)
      const receipts = await window.api.getRecentCashReceipts()
      setRecentCashReceipts(
        receipts.map((r) => ({
          ...r,
          clientId: r.clientId || r.party
        }))
      )
    } catch (err) {
      console.error('Error fetching recent receipts:', err)
    } finally {
      setShowLoader(false)
    }
  }

  useEffect(() => {
    fetchAllClients()
    fetchRecentBankReceipts()
    fetchRecentCashReceipts()
  }, [])

  // Helper functions
  const getClientName = (id) => {
    const client = clients.find((c) => c?.id === id)
    return client ? client.clientName : ''
  }

  const getAmount = (type, amount) => {
    if (!amount) return 0
    return type === 'Receipt' ? amount : -amount
  }

  const filteredData = useMemo(() => {
    const query = searchQuery.toLowerCase()
    let result = selectedType === 'Bank' ? recentBankReceipts : recentCashReceipts
    result = result.filter((data) => {
      const matchesSearch =
        data?.id?.toString().includes(query) ||
        getClientName(data?.clientId)?.toLowerCase().includes(query) ||
        data?.amount?.toString().includes(query) ||
        data?.description?.toLowerCase().includes(query)

      const matchesClient = clientFilter ? String(data.clientId) === String(clientFilter) : true

      let matchesDate = true
      if (dateRange && dateRange.length === 2) {
        const createdDate = new Date(data.createdAt)
        const start = new Date(dateRange[0])
        const end = new Date(dateRange[1])
        matchesDate = createdDate >= start && createdDate <= end
      }

      return matchesSearch && matchesClient && matchesDate
    })
    return result
  }, [searchQuery, dateRange, selectedType, clientFilter, recentBankReceipts, recentCashReceipts])

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

  const receipts = filteredData

  const balances = calculateRunningBalances(receipts)

  const toThousands = (value) => {
    if (!value) return value
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR'
    }).format(value)
  }

  return (
    <div className="select-none gap-10 h-screen w-full overflow-x-auto transition-all duration-300 min-w-[720px] overflow-auto customScrollbar">
      <div className="w-full sticky top-0 z-50">
        <Navbar />
      </div>

      <div className="flex justify-between mt-5 pb-2 items-center">
        <p className="text-3xl font-light mx-7">Ledger Report</p>
        <div className="mx-7 flex gap-1">
          <div
            onClick={() => setSelectedType('Bank')}
            className={`text-black flex items-center cursor-pointer gap-1 border border-gray-300 w-fit p-1 px-3 rounded-sm hover:bg-black hover:text-white transition-all duration-300 hover:scale-105 ${selectedType === 'Bank' ? 'bg-black text-white' : ''}`}
          >
            Bank
          </div>
          <div
            onClick={() => setSelectedType('Cash')}
            className={`text-black flex items-center cursor-pointer gap-1 border border-gray-300 w-fit p-1 px-3 rounded-sm hover:bg-black hover:text-white transition-all duration-300 hover:scale-105 ${selectedType === 'Cash' ? 'bg-black text-white' : ''}`}
          >
            Cash
          </div>
        </div>
      </div>

      {showLoader && <Loader />}

      <div className="mx-7 my-10">
        <div className="flex justify-between mb-5 relative">
          <div>
            <InputGroup size="md">
              <Input
                placeholder="Search..."
                value={searchQuery || ''}
                onChange={(value) => handleOnChange(value)}
                className={`rounded-xl border-2 indent-2 border-[#d4d9fb] outline-none`}
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
              onChange={(value) => setDateRange(value)}
              placement="bottomEnd"
              container={() => document.body}
            />
            <SelectPicker
              data={clients.map((client) => ({
                label: client?.clientName,
                value: client?.id
              }))}
              onChange={(value) => setClientFilter(value || null)}
              placeholder="Select Client"
              placement="bottomEnd"
              container={() => document.body}
            />
            <div className="p-1 rounded-lg bg-black hover:bg-black/80 transition-all duration-300 hover:scale-105 cursor-pointer">
              <PrintIcon className="p-0.5 text-white" />
            </div>
          </div>
        </div>

        <div className="bg-gray-50 rounded-xl shadow-sm overflow-x-auto customScrollbar max-h-screen relative">
          <table className="min-w-max border-collapse text-sm text-center">
            <thead className="bg-gray-100 sticky top-0">
              <tr className="text-gray-600 border-b">
                <th className="px-6 py-4 border-r border-gray-300 w-[100px] sticky left-0 top-0 z-10 bg-gray-100">
                  Sr No
                </th>
                <th className="px-4 py-3 border-r border-gray-300 w-[170px]">Date</th>
                <th className="px-6 py-3 border-r border-gray-300 w-[200px]">Bank</th>
                <th className="px-6 py-3 border-r border-gray-300 w-[250px]">Party</th>
                <th className="px-6 py-3 border-r border-gray-300 w-[250px]">Debit</th>
                <th className="px-6 py-3 border-r border-gray-300 w-[250px]">Credit</th>
                <th className="px-6 py-3 border-r border-gray-300 w-[250px]">Balance</th>
                <th className="px-6 py-3 border-r border-gray-300 w-[350px]">Description</th>
              </tr>
            </thead>
            <tbody className="text-sm divide-y divide-gray-200">
              {receipts.length === 0 ? (
                <tr className="h-96">
                  <td colSpan={8} className="px-6 py-4 text-xl text-center text-gray-400">
                    No receipts found
                  </td>
                </tr>
              ) : (
                receipts.map((receipt, idx) => (
                  <tr
                    key={idx}
                    className={`transition ${
                      idx ===
                      (selectedType === 'Bank'
                        ? recentBankReceipts.length
                        : recentCashReceipts.length) -
                        1
                        ? 'border-b-0'
                        : ''
                    } ${receipt.type === 'Receipt' ? 'bg-blue-50' : 'bg-red-50'}`}
                  >
                    <td
                      className={`px-6 py-3 w-[100px] sticky left-0 z-30 ${
                        receipt.type === 'Receipt'
                          ? 'text-blue-500 bg-blue-50 font-bold'
                          : 'text-red-500 bg-red-50 font-bold'
                      }`}
                    >
                      {receipt.transactionId}
                    </td>
                    <td className="px-6 py-3 w-[100px]">{receipt.date}</td>
                    <td className="px-6 py-3">{receipt.bank} Bank</td>
                    <td className="px-6 py-3 tracking-wider uppercase">
                      {getClientName(Number(receipt.clientId))}
                    </td>
                    {receipt.type === 'Payment' ? (
                      <td className="px-6 py-3">{toThousands(receipt.amount)}</td>
                    ) : (
                      <td className="px-6 py-3"> - </td>
                    )}
                    {receipt.type === 'Receipt' ? (
                      <td className="px-6 py-3">{toThousands(receipt.amount)}</td>
                    ) : (
                      <td className="px-6 py-3"> - </td>
                    )}
                    <td className="px-6 py-3 font-medium">{toThousands(balances[idx])}</td>
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
                        <span>{receipt.description}</span>
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

export default LedgerReport
