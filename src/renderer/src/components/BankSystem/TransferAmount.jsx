/* eslint-disable prettier/prettier */
import { useEffect, useState, useCallback, useRef } from 'react'
import {
  CheckCircle,
  ChevronRight,
  ChevronLeft
} from 'lucide-react'
import Navbar from '../UI/Navbar'
import { useDispatch } from 'react-redux'
import { setAccount } from '../../app/features/electronSlice'
import { toast } from 'react-toastify'
import { Input, InputNumber } from 'rsuite'

const TransferAmount = () => {
  const dispatch = useDispatch()
  const [accounts, setAccounts] = useState([])
  const [recentReceipts, setRecentReceipts] = useState([]) // bank + cash receipts for balance calc
  const [transactions, setTransactions] = useState([]) // local history for immediate feedback

  const [selectedFrom, setSelectedFrom] = useState(null)
  const [selectedTo, setSelectedTo] = useState(null)
  const [amount, setAmount] = useState('')
  const [description, setDescription] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [activeView, setActiveView] = useState('transfer')
  const carouselFromRef = useRef(null)
  const carouselToRef = useRef(null)

  // FORMATTER
  const toINR = (v) =>
    new Intl.NumberFormat('en-IN', {
      style: 'decimal'
    }).format(Number(v || 0))

  // Fetch accounts and recent receipts (bank + cash) then compute balances
  const loadAccountsAndReceipts = useCallback(async () => {
    try {
      // fetch accounts
      const accs = (await window.api.getAllAccounts()) || []
      // fetch receipts that we'll use to compute dynamic balances
      const bankReceipts = (await window.api.getRecentBankReceipts()) || []
      const cashReceipts = (await window.api.getRecentCashReceipts()) || []

      const receipts = [...bankReceipts, ...cashReceipts].map((r) => ({
        ...r,
        // unify date field if some use createdAt
        date: r.date || r.createdAt || new Date().toISOString()
      }))

      // compute balance per account similar to AccountList.jsx logic:
      // find receipts that reference this account; accumulate credit/debit
      const enriched = accs.map((acc) => {
        // receipts referencing this account:
        // - r.transactionAccount === acc.id (explicit)
        // - OR r.sendTo (string) === acc.accountName (case-insensitive)
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

        return {
          ...acc,
          _matchingReceipts: matching,
          computedBalance: computed
        }
      })

      // sort so latest created first (similar to AccountList)
      enriched.sort((a, b) => {
        const dateA = new Date(a?.createdAt || a?.date || 0)
        const dateB = new Date(b?.createdAt || b?.date || 0)
        return dateB - dateA
      })

      setAccounts(enriched)
      setRecentReceipts(receipts)
      // update accounts in redux too (so other pages get updated)
      dispatch(setAccount(enriched))
    } catch (err) {
      console.error('loadAccountsAndReceipts error', err)
      toast.error('Failed to load accounts')
    }
  }, [dispatch])

  useEffect(() => {
    loadAccountsAndReceipts()
  }, [loadAccountsAndReceipts])

  // helper to get account object by id
  const getAccountById = (id) => accounts.find((a) => String(a.id) === String(id))

  // perform transfer
  const handleTransfer = async () => {
    setError('')
    setSuccess(false)

    if (!selectedFrom || !selectedTo) {
      setError('Please select both From and To accounts')
      return
    }

    if (String(selectedFrom) === String(selectedTo)) {
      setError('Cannot transfer to the same account')
      return
    }

    const amt = Number(amount)
    if (!amt || amt <= 0) {
      setError('Enter a valid amount')
      return
    }

    const fromAcc = getAccountById(selectedFrom)
    if (!fromAcc) {
      setError('From account not found')
      return
    }

    if (amt > Number(fromAcc.computedBalance || 0)) {
      setError('Insufficient balance in selected From account')
      return
    }

    // call backend transfer API - using the same param names used in PaymentMethod.jsx
    try {
      const payload = {
        fromAccount: selectedFrom,
        toAccount: selectedTo,
        amount: amt,
        description: description || `Transfer from ${fromAcc.accountName}`
      }

      const res = await window.api.transferAmount(payload)

      console.log('🔥 TRANSFER RESPONSE:', res)

      // Expecting API to return something like { success: true, data: {...} } or created transaction
      if (res && (res.success === true || res.status === 'success' || res.id || res.data)) {
        // update local accounts balances immediately for responsiveness (optimistic)
        setAccounts((prev) =>
          prev.map((acc) => {
            if (String(acc.id) === String(selectedFrom)) {
              return { ...acc, computedBalance: Number(acc.computedBalance || 0) - amt }
            }
            if (String(acc.id) === String(selectedTo)) {
              return { ...acc, computedBalance: Number(acc.computedBalance || 0) + amt }
            }
            return acc
          })
        )

        // push to local transactions history: prefer using returned object if present
        const tx = res?.data ||
          res || {
            id: `tx-${Date.now()}`,
            fromAccountId: selectedFrom,
            toAccountId: selectedTo,
            amount: amt,
            description: payload.description,
            date: new Date().toISOString(),
            status: 'completed'
          }

        setTransactions((prev) => [tx, ...prev])

        // refresh receipts/accounts from API to reflect actual persisted state
        await loadAccountsAndReceipts()

        toast.success(res?.message || 'Transfer successful')
        setSuccess(true)
        setAmount('')
        setDescription('')
        setSelectedFrom(null)
        setSelectedTo(null)
        setTimeout(() => setSuccess(false), 2200)
      } else {
        // API responded with failure
        console.error('transferAmount failed response', res)
        toast.error(res?.message || 'Transfer failed')
        setError(res?.message || 'Transfer failed')
      }
    } catch (err) {
      console.error('transferAmount error', err)
      setError(err.message || 'Transfer failed')
      toast.error('Transfer failed: ' + (err.message || 'Unknown error'))
    }
  }

  // simple format for history dates
  const formatDate = (iso) => {
    try {
      const d = new Date(iso)
      return d.toLocaleString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })
    } catch {
      return iso
    }
  }

  // carousel scroll helpers (same behavior as your existing file)
  const scrollCarousel = (direction, carouselRef) => {
    const carousel = carouselRef?.current
    if (!carousel) return
    const scrollAmount = 280
    carousel.scrollBy({
      left: direction === 'left' ? -scrollAmount : scrollAmount,
      behavior: 'smooth'
    })
  }

  // derived lists for selects (exclude disabled accounts)
  // const accountOptions = useMemo(
  //   () =>
  //     accounts.map((a) => ({ label: a.accountName, value: a.id, balance: a.computedBalance || 0 })),
  //   [accounts]
  // )

  return (
    <div className="max-h-screen select-none gap-10 h-screen w-full overflow-x-auto transition-all duration-300 min-w-[720px] overflow-scroll customScrollbar">
      <div className="w-full sticky top-0 z-10">
        <Navbar />
      </div>

      <div className="max-w-7xl mx-auto p-6">
        <div className="flex justify-between mt-5 pb-2 items-center">
          <p className="text-3xl font-light">Transfer Amount</p>
          <div className="flex gap-3">
            <button
              onClick={() => setActiveView('transfer')}
              className={`text-black flex items-center gap-1 border border-gray-300 px-3 py-1 rounded-sm ${activeView === 'transfer' ? 'bg-black text-white' : ''}`}
            >
              Transfer Money
            </button>
            <button
              onClick={() => setActiveView('history')}
              className={`text-black flex items-center gap-1 border border-gray-300 px-3 py-1 rounded-sm ${activeView === 'history' ? 'bg-black text-white' : ''}`}
            >
              Transaction History
            </button>
          </div>
        </div>

        <div className="space-y-6">
          {/* Account cards */}
          <div className="bg-white rounded-3xl p-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {accounts.length === 0 ? (
                <div className="text-sm text-gray-500 col-span-3">No accounts found.</div>
              ) : (
                accounts.map((acc) => (
                  <div
                    key={acc.id}
                    className="p-4 rounded-2xl bg-gradient-to-br from-indigo-500 to-indigo-600 text-white"
                  >
                    <p className="text-sm opacity-90 mb-1">{acc.accountName}</p>
                    <p className="text-2xl font-bold">₹ {toINR(acc.computedBalance)}</p>
                    <p className="text-xs opacity-75 mt-2">
                      {acc.accountType || acc.type || 'Account'}
                    </p>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Transfer card */}
          {activeView === 'transfer' && (
            <div className="bg-white rounded-3xl shadow-xl p-8">
              {success && (
                <div className="mb-6 p-4 bg-green-50 border-2 border-green-200 rounded-2xl flex items-center gap-3">
                  <CheckCircle className="w-6 h-6 text-green-600" />
                  <div>
                    <p className="font-semibold text-green-900">Transfer Successful!</p>
                    <p className="text-sm text-green-700">Your funds have been transferred.</p>
                  </div>
                </div>
              )}

              {error && (
                <div className="mb-6 p-4 bg-red-50 border-2 border-red-200 rounded-2xl">
                  <p className="text-red-700 font-medium">{error}</p>
                </div>
              )}

              <h3 className="text-xl font-bold text-gray-900 mb-6">Select Accounts</h3>

              <div className="grid md:grid-cols-2 gap-8 relative">
                {/* FROM */}
                <div>
                  <label className="text-sm font-medium text-gray-600 mb-3 block">
                    From Account
                  </label>
                  <div className="flex items-center gap-2 mb-3">
                    <button
                      onClick={() => scrollCarousel('left', carouselFromRef)}
                      className="p-2 bg-white rounded-full shadow"
                      title="Scroll left"
                    >
                      <ChevronLeft className="w-5 h-5 text-gray-700" />
                    </button>
                    <div
                      id="from-carousel"
                      ref={carouselFromRef}
                      className="flex gap-3 overflow-x-auto py-1 px-2 rounded-lg"
                      style={{ scrollBehavior: 'smooth' }}
                    >
                      {accounts.map((acc) => (
                        <button
                          key={acc.id}
                          onClick={() => setSelectedFrom(acc.id)}
                          className={`min-w-[200px] p-3 rounded-xl shadow-sm text-left ${selectedFrom === acc.id ? 'ring-2 ring-indigo-300' : 'border border-gray-100'}`}
                        >
                          <div className="flex justify-between items-center">
                            <div>
                              <div className="text-sm text-gray-700 font-medium">
                                {acc.accountName}
                              </div>
                              <div className="text-xs text-gray-500 mt-1">
                                ₹ {toINR(acc.computedBalance)}
                              </div>
                            </div>
                            <div className="text-xs text-gray-400">
                              {acc.accountType || acc.type || ''}
                            </div>
                          </div>
                        </button>
                      ))}
                    </div>
                    <button
                      onClick={() => scrollCarousel('right', carouselFromRef)}
                      className="p-2 bg-white rounded-full shadow"
                      title="Scroll right"
                    >
                      <ChevronRight className="w-5 h-5 text-gray-700" />
                    </button>
                  </div>
                </div>

                {/* TO */}
                <div>
                  <label className="text-sm font-medium text-gray-600 mb-3 block">To Account</label>
                  <div className="flex items-center gap-2 mb-3">
                    <button
                      onClick={() => scrollCarousel('left', carouselToRef)}
                      className="p-2 bg-white rounded-full shadow"
                    >
                      <ChevronLeft className="w-5 h-5 text-gray-700" />
                    </button>
                    <div
                      id="to-carousel"
                      ref={carouselToRef}
                      className="flex gap-3 overflow-x-auto py-1 px-2 rounded-lg"
                    >
                      {accounts.map((acc) => (
                        <button
                          key={acc.id}
                          onClick={() => setSelectedTo(acc.id)}
                          className={`min-w-[200px] p-3 rounded-xl shadow-sm text-left ${selectedTo === acc.id ? 'ring-2 ring-indigo-300' : 'border border-gray-100'}`}
                        >
                          <div className="flex justify-between items-center">
                            <div>
                              <div className="text-sm text-gray-700 font-medium">
                                {acc.accountName}
                              </div>
                              <div className="text-xs text-gray-500 mt-1">
                                ₹ {toINR(acc.computedBalance)}
                              </div>
                            </div>
                            <div className="text-xs text-gray-400">
                              {acc.accountType || acc.type || ''}
                            </div>
                          </div>
                        </button>
                      ))}
                    </div>
                    <button
                      onClick={() => scrollCarousel('right', carouselToRef)}
                      className="p-2 bg-white rounded-full shadow"
                    >
                      <ChevronRight className="w-5 h-5 text-gray-700" />
                    </button>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6 items-end">
                <div>
                  <label className="text-sm text-gray-600">Amount</label>
                  <InputNumber
                    prefix="₹"
                    value={amount}
                    onChange={(val) => setAmount(val)}
                    className="w-full"
                  />
                </div>
                <div>
                  <label className="text-sm text-gray-600">Description</label>
                  <Input
                    value={description}
                    onChange={(v) => setDescription(v)}
                    placeholder="Optional description"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleTransfer}
                    className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50"
                  >
                    Transfer
                  </button>
                  <button
                    onClick={() => {
                      setSelectedFrom(null)
                      setSelectedTo(null)
                      setAmount('')
                      setDescription('')
                      setError('')
                    }}
                    className="px-4 py-2 border rounded-lg"
                  >
                    Clear
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* History view */}
          {activeView === 'history' && (
            <div className="bg-white rounded-3xl p-6">
              <h3 className="text-lg font-semibold mb-4">Recent Transfers</h3>
              <div className="space-y-3">
                {/* first show local transactions */}
                {transactions.length === 0 ? (
                  <div className="text-sm text-gray-500">No transfers yet.</div>
                ) : (
                  transactions.map((t, idx) => {
                    const fromAcc = getAccountById(t.fromAccountId) || {}
                    const toAcc = getAccountById(t.toAccountId) || {}
                    return (
                      <div
                        key={t.id || idx}
                        className="flex justify-between items-center border rounded-lg p-3"
                      >
                        <div>
                          <div className="font-medium">
                            {fromAcc.accountName || t.fromAccount || '—'} →{' '}
                            {toAcc.accountName || t.toAccount || '—'}
                          </div>
                          <div className="text-xs text-gray-500">{t.description || ''}</div>
                        </div>
                        <div className="text-right">
                          <div className="font-semibold">₹ {toINR(t.amount)}</div>
                          <div className="text-xs text-gray-400">{formatDate(t.date)}</div>
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