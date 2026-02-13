/* eslint-disable prettier/prettier */
import { useEffect, useState, useCallback } from 'react'
import { CheckCircle, ArrowRightLeft, History, Wallet, Send } from 'lucide-react'
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
      const bankReceipts = (await window.api.getRecentBankReceipts()) || []
      const cashReceipts = (await window.api.getRecentCashReceipts()) || []

      const receipts = [...bankReceipts, ...cashReceipts].map((r) => ({
        ...r,
        date: r.date || r.createdAt || new Date().toISOString()
      }))

      const enriched = accs.map((acc) => {
        const matching = receipts.filter((r) => {
          if (r.transactionAccount && String(r.transactionAccount) === String(acc.id)) return true
          if (r.sendTo && String(r.sendTo).toLowerCase() === String(acc.accountName).toLowerCase())
            return true
          return false
        })

        let credits = 0
        let debits = 0
        matching.forEach((r) => {
          if (r.type === 'Receipt') credits += Number(r.amount || 0)
          else if (r.type === 'Payment') debits += Number(r.amount || 0)
        })

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

  useEffect(() => {
    loadAccountsAndReceipts()
  }, [loadAccountsAndReceipts])

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
        narration: description || `Transfer to ${getAccountById(selectedTo)?.accountName}`
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
          description: payload.narration,
          date: new Date().toISOString(),
          status: 'completed'
        }

        setTransactions((prev) => [tx, ...prev])
        await loadAccountsAndReceipts()

        toast.success('Transfer Successful')
        setSuccess(true)
        setAmount('')
        setDescription('')
        // Optional: Reset selection or keep for next transfer
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

  // Generate RSuite compatible options
  const accountOptions = accounts.map((acc) => ({
    label: acc.accountName,
    value: acc.id,
    balance: acc.computedBalance
  }))

  const formatDate = (iso) => {
    try {
      return new Date(iso).toLocaleString('en-IN', {
        day: '2-digit',
        month: 'short',
        hour: '2-digit',
        minute: '2-digit'
      })
    } catch {
      return iso
    }
  }

  // --- SUB-COMPONENTS ---

  // The Card Component that shows the selected account details
  const AccountCard = ({ type, selectedId, onSelect, placeholder }) => {
    const acc = getAccountById(selectedId)
    const isDebit = type === 'from'

    return (
      <div className="flex flex-col gap-3 w-full">
        <label className="text-xs font-bold uppercase tracking-wider text-gray-500 ml-1">
          {isDebit ? 'Debit From' : 'Credit To'}
        </label>

        {/* Account Selector */}
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

        {/* Visual Card */}
        <div
          className={`
          relative overflow-hidden rounded-2xl p-6 h-40 transition-all duration-300 shadow-lg border border-opacity-20
          ${!acc ? 'bg-gray-50 border-gray-300 flex items-center justify-center' : ''}
          ${acc && isDebit ? 'bg-gradient-to-br from-slate-800 to-slate-900 text-white shadow-slate-200' : ''}
          ${acc && !isDebit ? 'bg-gradient-to-br from-slate-800 to-slate-900 text-white shadow-slate-200' : ''}
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
                {isDebit ? (
                  <div className="p-2 bg-white/10 rounded-lg">
                    <Send className="w-5 h-5 rotate-180" />
                  </div>
                ) : (
                  <div className="p-2 bg-white/10 rounded-lg">
                    <Wallet className="w-5 h-5" />
                  </div>
                )}
              </div>
              <div>
                <p className="text-xs opacity-60">Available Balance</p>
                <p className="text-2xl font-bold tracking-tight">{toINR(acc.computedBalance)}</p>
              </div>
            </div>
          )}
          {/* Decorator Circles */}
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
      <div className="w-full sticky top-0 z-20 bg-white/80 backdrop-blur-md border-b border-gray-100">
        <Navbar />
      </div>

      <div className="flex-1 overflow-y-auto customScrollbar p-4 md:p-8">
        <div className="max-w-5xl mx-auto">
          {/* Header & Toggle */}
          <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-800">Transfer Amount</h1>
              <p className="text-sm text-gray-500">Move money between your internal accounts</p>
            </div>

            <div className="flex bg-gray-200/50 p-1 rounded-xl">
              <button
                onClick={() => setActiveView('transfer')}
                className={`flex items-center gap-2 px-6 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                  activeView === 'transfer'
                    ? 'bg-white shadow-sm text-indigo-600'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                <ArrowRightLeft className="w-4 h-4" /> Transfer
              </button>
              <button
                onClick={() => setActiveView('history')}
                className={`flex items-center gap-2 px-6 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
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
            <div className="bg-white rounded-3xl shadow-2xl shadow-slate-200 p-6 md:p-10 relative">
              {/* --- Transfer Layout --- */}
              <div className="flex flex-col md:grid md:grid-cols-[1fr_auto_1fr] gap-6 items-center">
                {/* From Section */}
                <AccountCard
                  type="from"
                  selectedId={selectedFrom}
                  onSelect={setSelectedFrom}
                  placeholder="Select Sender..."
                />

                {/* Swap Button (Center) */}
                <div className="relative pt-8 md:pt-0 top-8">
                  <div className="absolute inset-0 flex items-center justify-center md:hidden">
                    <div className="h-full w-px bg-gray-200"></div>
                  </div>
                  <button
                    onClick={handleSwap}
                    className="relative z-10 p-3 bg-white border border-gray-700 shadow-md rounded-full text-gray-500 hover:text-indigo-600 hover:border-indigo-200 hover:shadow-lg transition-all active:scale-95 group"
                    title="Swap Accounts"
                  >
                    <ArrowRightLeft className="w-5 h-5 group-hover:rotate-180 transition-transform duration-300" />
                  </button>
                </div>

                {/* To Section */}
                <AccountCard
                  type="to"
                  selectedId={selectedTo}
                  onSelect={setSelectedTo}
                  placeholder="Select Receiver..."
                />
              </div>

              {/* Input Section */}
              <div className="mt-10 max-w-lg mx-auto space-y-6">
                {/* Amount Input */}
                <div className="space-y-2">
                  <label className="text-sm font-bold text-gray-600 block text-center">
                    Amount to Transfer
                  </label>
                  <div className="relative">
                    <InputNumber
                      value={amount}
                      onChange={setAmount}
                      placeholder="0.00"
                      size="lg"
                      prefix="₹"
                      className="!w-full !text-center !text-3xl !font-bold !py-2 !h-auto focus-within:!border-indigo-500"
                    />
                  </div>
                </div>

                {/* Description Input */}
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

                {/* Feedback Messages */}
                {error && (
                  <div className="p-3 bg-red-50 text-red-600 text-sm rounded-lg text-center border border-red-100 animate-pulse">
                    {error}
                  </div>
                )}

                {success && (
                  <div className="p-3 bg-green-50 text-green-600 text-sm rounded-lg text-center border border-green-100 flex items-center justify-center gap-2">
                    <CheckCircle className="w-4 h-4" /> Transfer Successful!
                  </div>
                )}

                {/* Action Button */}
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
            // --- History View ---
            <div className="bg-white rounded-3xl shadow-sm border border-gray-200 overflow-hidden">
              <div className="p-6 border-b border-gray-100">
                <h3 className="font-semibold text-gray-800">Transaction History</h3>
              </div>
              <div className="divide-y divide-gray-100">
                {transactions.length === 0 ? (
                  <div className="p-10 text-center text-gray-400 flex flex-col items-center">
                    <History className="w-10 h-10 mb-3 opacity-20" />
                    <p>No recent transfers in this session.</p>
                  </div>
                ) : (
                  transactions.map((t, i) => {
                    const from = getAccountById(t.fromAccountId)?.accountName || 'Unknown'
                    const to = getAccountById(t.toAccountId)?.accountName || 'Unknown'
                    return (
                      <div
                        key={i}
                        className="p-5 flex items-center justify-between hover:bg-gray-50 transition-colors"
                      >
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-600">
                            <ArrowRightLeft className="w-5 h-5" />
                          </div>
                          <div>
                            <p className="font-medium text-gray-900">
                              {from} <span className="text-gray-400 mx-1">→</span> {to}
                            </p>
                            <p className="text-xs text-gray-500">
                              {t.description || 'Fund Transfer'}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-gray-900">{toINR(t.amount)}</p>
                          <p className="text-xs text-gray-400">{formatDate(t.date)}</p>
                        </div>
                      </div>
                    )
                  })
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
