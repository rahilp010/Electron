/* eslint-disable prettier/prettier */
import { useEffect, useState, useCallback } from 'react'
import {
  CheckCircle,
  ArrowRightLeft,
  History,
  Wallet,
  Send,
  Hash,
  CalendarDays
} from 'lucide-react'
import Navbar from '../UI/Navbar'
import { useDispatch } from 'react-redux'
import { setAccount } from '../../app/features/electronSlice'
import { toast } from 'react-toastify'
import { Input, InputNumber, SelectPicker } from 'rsuite'

const TransferAmount = () => {
  const dispatch = useDispatch()
  const [accounts, setAccounts] = useState([])
  const [transactions, setTransactions] = useState([])

  const [selectedFrom, setSelectedFrom] = useState(null)
  const [selectedTo, setSelectedTo] = useState(null)
  const [amount, setAmount] = useState('')
  const [description, setDescription] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [activeView, setActiveView] = useState('transfer')

  // FORMATTER
  const toINR = (v) =>
    new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0
    }).format(Number(v || 0))

  // Fetch accounts logic
  const loadAccountsAndReceipts = useCallback(async () => {
    try {
      const accs = (await window.api.getAllAccounts()) || []

      const enriched = accs.map((acc) => {
        let credits = 0
        let debits = 0

        const base = Number(acc.closingBalance || acc.openingBalance || 0)
        const computed = base + credits - debits

        return { ...acc, computedBalance: computed }
      })

      enriched.sort((a, b) => new Date(b?.createdAt) - new Date(a?.createdAt))

      setAccounts(enriched)
      dispatch(setAccount(enriched))
    } catch (err) {
      console.error('loadAccountsAndReceipts error', err)
      toast.error('Failed to load accounts')
    }
  }, [dispatch])

  const getTransferHistory = async () => {
    try {
      const response = await window.api.getTransferHistory()
      if (response.success) {
        setTransactions(response.data)
      }
    } catch (err) {
      console.error('getTransferHistory error', err)
      toast.error('Failed to load transfer history')
    }
  }

  useEffect(() => {
    loadAccountsAndReceipts()
    if (activeView === 'history') {
      getTransferHistory()
    }
  }, [loadAccountsAndReceipts, activeView])

  const getAccountById = (id) => accounts.find((a) => String(a.id) === String(id))

  // SWAP FUNCTION
  const handleSwap = () => {
    if (!selectedFrom && !selectedTo) return
    const temp = selectedFrom
    setSelectedFrom(selectedTo)
    setSelectedTo(temp)
  }

  const handleTransfer = async () => {
    setError('')
    setSuccess(false)

    if (!selectedFrom || !selectedTo) {
      setError('Please select both accounts')
      return
    }
    if (String(selectedFrom) === String(selectedTo)) {
      setError('Source and Destination cannot be the same')
      return
    }

    const amt = Number(amount)
    const fromAcc = getAccountById(selectedFrom)

    if (!amt || amt <= 0) {
      setError('Enter a valid amount')
      return
    }
    if (amt > Number(fromAcc.computedBalance || 0)) {
      setError(`Insufficient balance in ${fromAcc.accountName}`)
      return
    }

    try {
      const payload = {
        fromAccountId: selectedFrom,
        toAccountId: selectedTo,
        amount: amt,
        narration: description
      }

      const res = await window.api.transferAmount(payload)

      if (res?.success) {
        // Optimistic UI Update
        setAccounts((prev) =>
          prev.map((acc) => {
            if (String(acc.id) === String(selectedFrom))
              return { ...acc, computedBalance: acc.computedBalance - amt }
            if (String(acc.id) === String(selectedTo))
              return { ...acc, computedBalance: acc.computedBalance + amt }
            return acc
          })
        )

        const tx = {
          id: `tx-${Date.now()}`,
          fromAccountId: selectedFrom,
          toAccountId: selectedTo,
          amount: amt,
          narration: payload.narration,
          date: new Date().toISOString(),
          status: 'completed'
        }

        setTransactions((prev) => [tx, ...prev])
        await loadAccountsAndReceipts()

        toast.success('Transfer Successful')
        setSuccess(true)
        setAmount('')
        setDescription('')
        setTimeout(() => setSuccess(false), 3000)
      } else {
        toast.error(res?.message || 'Transfer failed')
        setError(res?.message)
      }
    } catch (err) {
      setError(err.message)
      toast.error('Error: ' + err.message)
    }
  }

  // --- Helpers for History View ---
  const formatTime = (iso) => {
    try {
      return new Date(iso).toLocaleTimeString('en-IN', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
      })
    } catch {
      return ''
    }
  }

  const groupTransactionsByDate = (txns) => {
    const groups = {}
    txns.forEach((t) => {
      const d = new Date(t.date)
      const isToday = new Date().toDateString() === d.toDateString()
      const dateKey = isToday
        ? 'Today'
        : d.toLocaleDateString('en-IN', { month: 'short', day: '2-digit', year: 'numeric' })

      if (!groups[dateKey]) groups[dateKey] = []
      groups[dateKey].push(t)
    })
    return groups
  }

  const accountOptions = accounts.map((acc) => ({
    label: acc.accountName,
    value: acc.id,
    balance: acc.computedBalance
  }))

  const groupedHistory = groupTransactionsByDate(transactions)

  // --- SUB-COMPONENTS ---
  const AccountCard = ({ type, selectedId, onSelect, placeholder }) => {
    const acc = getAccountById(selectedId)
    const isDebit = type === 'from'

    return (
      <div className="flex flex-col gap-3 w-full">
        <label className="text-xs font-bold uppercase tracking-wider text-gray-500 ml-1">
          {isDebit ? 'Debit From' : 'Credit To'}
        </label>
        <SelectPicker
          data={accountOptions}
          value={selectedId}
          onChange={onSelect}
          searchable
          placeholder={placeholder}
          className="w-full"
          renderMenuItem={(label, item) => (
            <div className="flex justify-between w-full gap-4">
              <span>{label}</span>
              <span className="text-gray-400 text-xs">₹{item.balance}</span>
            </div>
          )}
        />
        <div
          className={`
          relative overflow-hidden rounded-2xl p-6 h-40 transition-all duration-300 shadow-lg border border-opacity-20
          ${!acc ? 'bg-gray-50 border-gray-300 flex items-center justify-center' : ''}
          ${acc ? 'bg-gradient-to-br from-slate-800 to-slate-900 text-white shadow-slate-200' : ''}
        `}
        >
          {!acc ? (
            <div className="text-gray-500 flex flex-col items-center gap-2">
              <Wallet className="w-8 h-8 opacity-20" />
              <span className="text-sm font-medium">Select Account</span>
            </div>
          ) : (
            <div className="flex flex-col justify-between h-full relative z-10">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-sm opacity-70 mb-1">{acc.accountType || 'Savings'}</p>
                  <p className="font-semibold text-lg tracking-wide">{acc.accountName}</p>
                </div>
                <div className="p-2 bg-white/10 rounded-lg">
                  {isDebit ? (
                    <Send className="w-5 h-5 rotate-180" />
                  ) : (
                    <Wallet className="w-5 h-5" />
                  )}
                </div>
              </div>
              <div>
                <p className="text-xs opacity-60">Available Balance</p>
                <p className="text-2xl font-bold tracking-tight">{toINR(acc.computedBalance)}</p>
              </div>
            </div>
          )}
          {acc && (
            <>
              <div className="absolute -top-10 -right-10 w-32 h-32 bg-white/5 rounded-full blur-2xl"></div>
              <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-white/5 rounded-full blur-2xl"></div>
            </>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="h-screen w-full bg-gray-50/50 flex flex-col font-poppins select-none">
      <div className="w-full sticky top-0 z-20 bg-white/80 backdrop-blur-md">
        <Navbar />
      </div>

      <div className="flex-1 overflow-y-auto customScrollbar p-4 md:p-8">
        <div className="max-w-5xl mx-auto">
          {/* Header & Toggle */}
          <div className="flex flex-col md:flex-row justify-between items-center mb-8">
            <p className="text-3xl font-light text-gray-800">Transfer Amount</p>

            <div className="flex bg-gray-200/50 p-1 rounded-full mt-4 md:mt-0">
              <button
                onClick={() => setActiveView('transfer')}
                className={`flex items-center gap-2 px-6 py-2 rounded-full text-sm font-medium transition-all duration-200 ${
                  activeView === 'transfer'
                    ? 'bg-white shadow-sm text-indigo-600'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                <ArrowRightLeft className="w-4 h-4" /> Transfer
              </button>
              <button
                onClick={() => setActiveView('history')}
                className={`flex items-center gap-2 px-6 py-2 rounded-full text-sm font-medium transition-all duration-200 ${
                  activeView === 'history'
                    ? 'bg-white shadow-sm text-indigo-600'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                <History className="w-4 h-4" /> History
              </button>
            </div>
          </div>

          {activeView === 'transfer' ? (
            <div className="bg-white rounded-3xl shadow-2xl shadow-slate-200 p-6 md:p-10 relative border border-gray-200">
              {/* --- Transfer Layout --- */}
              <div className="flex flex-col md:grid md:grid-cols-[1fr_auto_1fr] gap-6 items-center">
                <AccountCard
                  type="from"
                  selectedId={selectedFrom}
                  onSelect={setSelectedFrom}
                  placeholder="Select Sender..."
                />

                <div className="relative pt-8 md:pt-0 top-8">
                  <div className="absolute inset-0 flex items-center justify-center md:hidden">
                    <div className="h-full w-px bg-gray-200"></div>
                  </div>
                  <button
                    onClick={handleSwap}
                    className="relative z-10 p-3 bg-white border border-gray-200 shadow-md rounded-full text-gray-500 hover:text-indigo-600 hover:border-indigo-200 hover:shadow-lg transition-all active:scale-95 group"
                    title="Swap Accounts"
                  >
                    <ArrowRightLeft className="w-5 h-5 group-hover:rotate-180 transition-transform duration-300" />
                  </button>
                </div>

                <AccountCard
                  type="to"
                  selectedId={selectedTo}
                  onSelect={setSelectedTo}
                  placeholder="Select Receiver..."
                />
              </div>

              {/* Input Section */}
              <div className="mt-10 max-w-lg mx-auto space-y-6">
                <div className="space-y-2">
                  <label className="text-sm font-bold text-gray-600 block text-center">
                    Amount to Transfer
                  </label>
                  <InputNumber
                    value={amount}
                    onChange={setAmount}
                    placeholder="0.00"
                    size="lg"
                    prefix="₹"
                    className="!w-full !text-center !text-3xl !font-bold !py-2 !h-auto focus-within:!border-indigo-500"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-medium text-gray-500 block ml-1">
                    Description (Optional)
                  </label>
                  <Input
                    value={description}
                    onChange={setDescription}
                    placeholder="e.g. Monthly Savings"
                    className="!bg-gray-50 focus:!bg-white"
                  />
                </div>

                {error && (
                  <div className="p-3 bg-red-50 text-red-600 text-sm rounded-lg text-center border border-red-100">
                    {error}
                  </div>
                )}
                {success && (
                  <div className="p-3 bg-green-50 text-green-600 text-sm rounded-lg text-center border border-green-100 flex items-center justify-center gap-2">
                    <CheckCircle className="w-4 h-4" /> Transfer Successful!
                  </div>
                )}

                <button
                  onClick={handleTransfer}
                  disabled={!selectedFrom || !selectedTo || !amount}
                  className="w-full py-4 bg-slate-900 text-white rounded-xl font-medium text-lg hover:bg-slate-800 shadow-lg shadow-slate-900/20 disabled:opacity-50 disabled:cursor-not-allowed transition-all hover:-translate-y-0.5 active:translate-y-0"
                >
                  Confirm Transfer
                </button>
              </div>
            </div>
          ) : (
            // --- Refined History View ---
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
              {/* History Header */}
              <div className="p-6 border-b border-gray-100 flex flex-col sm:flex-row justify-between sm:items-center gap-4">
                <div>
                  <p className="text-2xl font-light text-gray-900">Recent Transfers</p>
                </div>
                <div className="bg-indigo-50 text-indigo-700 px-4 py-1.5 rounded-full text-xs font-bold tracking-wide uppercase border border-indigo-100 flex items-center gap-2 w-max">
                  <History className="w-3.5 h-3.5" />
                  {transactions.length} Records
                </div>
              </div>

              {/* History List */}
              <div className="bg-gray-50/50">
                {transactions.length === 0 ? (
                  <div className="p-16 text-center text-gray-400 flex flex-col items-center">
                    <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                      <History className="w-8 h-8 opacity-40" />
                    </div>
                    <p className="text-gray-600 font-medium">No recent transfers</p>
                    <p className="text-sm mt-1">Transfers you make will appear here.</p>
                  </div>
                ) : (
                  Object.entries(groupedHistory).map(([dateLabel, txns], groupIdx) => (
                    <div key={dateLabel}>
                      {/* Date Separator */}
                      <div className="px-6 py-2.5 bg-gray-100/80 border-y border-gray-200 flex items-center gap-2 text-xs font-bold text-gray-500 uppercase tracking-widest">
                        <CalendarDays className="w-3.5 h-3.5" /> {dateLabel}
                      </div>

                      {/* Transactions for Date */}
                      <div className="divide-y divide-gray-100 bg-white">
                        {txns.map((t, i) => {
                          const fromAcc = getAccountById(t.fromAccountId)
                          const toAcc = getAccountById(t.toAccountId)
                          const fromName = fromAcc?.accountName || 'Unknown'
                          const toName = toAcc?.accountName || 'Unknown'
                          const isSuccess = t.status !== 'failed' // Assuming standard is complete

                          return (
                            <div
                              key={i}
                              className="p-4 sm:p-6 flex flex-col sm:flex-row sm:items-center justify-between hover:bg-gray-50/80 transition-colors gap-4"
                            >
                              <div className="flex items-start gap-4">
                                {/* Icon Pill */}
                                <div className="w-10 h-10 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-600 shrink-0 border border-indigo-100 mt-1 sm:mt-0">
                                  <ArrowRightLeft className="w-4 h-4" />
                                </div>

                                {/* Main Detail */}
                                <div>
                                  <div className="flex items-center gap-2">
                                    <p className="font-light text-gray-900 text-sm sm:text-base">
                                      {fromName}{' '}
                                      <span className="text-gray-600 font-normal mx-1">→</span>{' '}
                                      {toName}
                                    </p>
                                  </div>
                                  <div className="flex flex-wrap items-center gap-2 sm:gap-3 mt-1.5">
                                    <p className="text-xs text-gray-500 flex items-center gap-1 font-mono bg-gray-100 px-1.5 py-0.5 rounded">
                                      <Hash className="w-3 h-3 text-gray-400" />
                                      {t.id || `TXN-${Math.floor(1000 + Math.random() * 9000)}`}
                                    </p>
                                    <span className="w-1 h-1 bg-gray-300 rounded-full hidden sm:block"></span>
                                    <p className="text-xs text-gray-500 truncate max-w-[200px] sm:max-w-xs font-medium">
                                      {t.narration || 'Internal Transfer'}
                                    </p>
                                  </div>
                                </div>
                              </div>

                              {/* Amount & Time */}
                              <div className="flex flex-row sm:flex-col items-center sm:items-end justify-between sm:justify-center ml-14 sm:ml-0">
                                <p className="font-bold text-gray-900 text-base">
                                  {toINR(t.amount)}
                                </p>

                                <div className="flex items-center gap-2 mt-1.5">
                                  <span className="text-xs text-gray-400 font-medium">
                                    {formatTime(t.date)}
                                  </span>
                                  <span className="w-1 h-1 bg-gray-300 rounded-full hidden sm:block"></span>
                                  {isSuccess ? (
                                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-green-50 text-green-700 text-[10px] font-bold uppercase tracking-wider border border-green-200">
                                      <CheckCircle className="w-3 h-3" /> Done
                                    </span>
                                  ) : (
                                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-red-50 text-red-700 text-[10px] font-bold uppercase tracking-wider border border-red-200">
                                      Failed
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default TransferAmount
