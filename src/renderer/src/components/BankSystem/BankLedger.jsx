/* eslint-disable prettier/prettier */
/* eslint-disable no-unused-vars */
/* eslint-disable react/display-name */
/* eslint-disable react/prop-types */

import React, { memo, useCallback, useEffect, useMemo, useState } from 'react'
import { toast } from 'react-toastify'
import { Tooltip, Whisper } from 'rsuite'
import {
  Calendar,
  FileText,
  CreditCard,
  ClockArrowDown,
  Printer,
  Banknote,
  Landmark,
  TrendingDown,
  TrendingUp,
  Search,
  Wallet
} from 'lucide-react'
import { Input } from 'rsuite'
import Navbar from '../../components/UI/Navbar'

const TABLE_HEADERS = [
  { key: 'date', label: 'Date', width: 'w-[150px]', icon: Calendar },
  { key: 'debit', label: 'Debit', width: 'w-[150px]', icon: ClockArrowDown },
  { key: 'credit', label: 'Credit', width: 'w-[150px]', icon: CreditCard },
  { key: 'balance', label: 'Balance', width: 'w-[150px]' },
  { key: 'description', label: 'Description', width: 'w-[350px]', icon: FileText }
]

const toThousands = (value) => {
  if (value === null || value === undefined || isNaN(Number(value))) return '₹0'
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR'
  }).format(Number(value))
}

/* ======================= ROW ======================= */

const TransactionRow = memo(({ entry }) => {
  const isDebit = entry.entryType === 'debit'
  const isCredit = entry.entryType === 'credit'
  const borderColor = isDebit
    ? 'border-l-red-400'
    : isCredit
      ? 'border-l-green-400'
      : 'border-l-gray-300'

  return (
    <tr
      className={`transition-all duration-200 text-center hover:shadow-md transform hover:scale-[1.001] border-l-4 ${borderColor}`}
    >
      <td className="px-6 py-4">
        {new Date(entry.date).toLocaleDateString('en-IN', {
          day: '2-digit',
          month: 'short',
          year: 'numeric'
        })}
      </td>

      <td className="px-6 py-4">
        {isDebit ? (
          <span className="font-semibold text-red-600 flex gap-2 items-center">
            {toThousands(entry.amount)}
            <TrendingDown size={14} />
          </span>
        ) : (
          <span className="text-gray-400 text-xs">-</span>
        )}
      </td>

      <td className="px-6 py-4">
        {isCredit ? (
          <span className="font-semibold text-green-600 flex gap-2 items-center">
            {toThousands(entry.amount)}
            <TrendingUp size={14} />
          </span>
        ) : (
          <span className="text-gray-400 text-xs">-</span>
        )}
      </td>

      <td className="px-6 py-4">
        <div className="inline-flex items-center justify-center gap-1 bg-gradient-to-r from-slate-50 to-gray-100 text-gray-700 border border-gray-300 w-full py-1.5 rounded-full text-sm font-semibold shadow-sm hover:shadow-md transition-all duration-300">
          {toThousands(isDebit ? entry.balanceAfter || 0 : entry.balanceAfter || 0)}
        </div>
      </td>

      <td className="px-6 py-4 max-w-[350px] text-left">
        <Whisper
          trigger="hover"
          placement="leftStart"
          speaker={<Tooltip>{entry.narration || 'No description'}</Tooltip>}
        >
          <span className="block max-w-[350px] truncate whitespace-nowrap overflow-hidden text-ellipsis cursor-pointer">
            {entry.narration || 'No description'}
          </span>
        </Whisper>
      </td>
    </tr>
  )
})

/* ======================= MAIN ======================= */

const BankLedger = () => {
  const [ledgerData, setLedgerData] = useState([])
  const [selectedType, setSelectedType] = useState('Bank')
  const [showLoader, setShowLoader] = useState(false)

  const [gpayAccounts, setGpayAccounts] = useState([])
  const [selectedGpayAccount, setSelectedGpayAccount] = useState(null)
  const [showSideBar, setShowSideBar] = useState(true)
  const [sidebarSearch, setSidebarSearch] = useState('')

  useEffect(() => {
    const fetchGpayAccounts = async () => {
      try {
        const response = await window.api.getAllAccounts()
        const gAccounts = response.filter((acc) => acc.accounterType === 'GPay')
        setGpayAccounts(gAccounts)
        if (gAccounts.length > 0) {
          setSelectedGpayAccount(gAccounts[0])
        }
      } catch (e) {
        console.error(e)
      }
    }
    fetchGpayAccounts()
  }, [])

  /* ================= FETCH LEDGER ================= */

  const loadLedger = useCallback(async () => {
    setShowLoader(true)

    try {
      let response
      if (selectedType === 'GPay') {
        if (selectedGpayAccount) {
          response = await window.api.getAccountLedger(selectedGpayAccount.id)
        } else {
          response = { success: true, data: [] }
        }
      } else {
        response = await window.api.getAccountLedgerByType(selectedType)
      }

      if (response?.success) {
        console.log(response)
        setLedgerData(response.data || [])
      } else {
        setLedgerData([])
      }
    } catch (error) {
      toast.error('Failed to fetch ledger')
      setLedgerData([])
    }

    setShowLoader(false)
  }, [selectedType, selectedGpayAccount])

  useEffect(() => {
    loadLedger()
  }, [loadLedger])

  /* ================= SORT ================= */

  const sortedData = useMemo(() => {
    return [...ledgerData].sort((a, b) => new Date(b.date) - new Date(a.date))
  }, [ledgerData])

  /* ================= STATISTICS ================= */

  const statistics = useMemo(() => {
    const totalDebit = ledgerData
      .filter((e) => e.entryType === 'debit')
      .reduce((sum, e) => sum + Number(e.amount || 0), 0)

    const totalCredit = ledgerData
      .filter((e) => e.entryType === 'credit')
      .reduce((sum, e) => sum + Number(e.amount || 0), 0)

    const closingBalance =
      ledgerData.length > 0 ? ledgerData[ledgerData.length - 1].balanceAfter : 0

    return {
      totalDebit,
      totalCredit,
      closingBalance,
      transactionCount: ledgerData.length
    }
  }, [ledgerData])

  const closingColor = statistics.closingBalance >= 0 ? 'text-emerald-600' : 'text-red-600'

  /* ================= PRINT ================= */

  const handlePrint = () => {
    window.print()
  }

  const filteredSidebarGpays = useMemo(() => {
    if (!sidebarSearch) return gpayAccounts
    const query = sidebarSearch.toLowerCase()
    return gpayAccounts.filter((acc) => acc.accountName?.toLowerCase().includes(query))
  }, [gpayAccounts, sidebarSearch])

  const getInitials = (name) => {
    if (!name) return 'GP'
    return name.substring(0, 2).toUpperCase()
  }

  const showGpaySidebar = selectedType === 'GPay' && gpayAccounts.length > 1

  /* ================= RENDER ================= */

  return (
    <div className="select-none h-screen overflow-x-auto min-w-[720px] customScrollbar overflow-auto relative">
      <div className="w-full sticky top-0 z-50">
        <Navbar />
      </div>

      {showGpaySidebar && (
        <div
          className={`fixed left-0 top-0 h-screen z-40 shadow-2xl transition-all duration-500 ease-out overflow-hidden
            ${showSideBar ? 'w-80' : 'w-4'}`}
          style={{ backdropFilter: 'blur(10px)' }}
        >
          {/* Sidebar Toggle Button */}
          <div
            className="absolute right-0 top-1/2 transform -translate-y-1/2 bg-gray-500 text-white text-xs px-1 py-10 rounded-r cursor-pointer hover:bg-gray-500 font-extrabold z-50"
            onClick={() => setShowSideBar(!showSideBar)}
          >
            {showSideBar ? '<' : '>'}
          </div>

          {/* Sidebar Content */}
          <div
            className={`h-full flex flex-col transition-all duration-500 ease-out bg-white/80
              ${showSideBar ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-4'}`}
          >
            <div className="p-4 mt-18">
              <div className="relative">
                <Input
                  type="text"
                  placeholder="Search GPay..."
                  value={sidebarSearch}
                  onChange={(value) => setSidebarSearch(value)}
                  className="w-full pl-8 pr-4 py-2 focus:outline-none text-sm shadow-2xl"
                />
                <Search size={16} className="absolute right-3 top-2.5 text-gray-400" />
              </div>
            </div>

            <div className="flex-1 overflow-y-auto customScrollbar p-2">
              <div className="space-y-1">
                {filteredSidebarGpays.map((acc, index) => (
                  <div
                    key={acc.id}
                    className={`group relative p-3 rounded-lg cursor-pointer transition-all duration-200 mx-2
                      ${
                        selectedGpayAccount?.id === acc.id
                          ? 'bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-100 border border-indigo-200 rounded-xl text-indigo-700 text-sm font-semibold shadow-sm transition-all duration-300 transform scale-[1.02]'
                          : 'hover:bg-white/60 hover:shadow-sm'
                      }`}
                    onClick={() => setSelectedGpayAccount(acc)}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-10 h-10 rounded-full flex items-center justify-center text-xs font-light transition-all duration-200
                          ${
                            selectedGpayAccount?.id === acc.id
                              ? 'bg-gradient-to-br from-blue-400 to-indigo-500 text-white shadow-md backdrop-blur-sm'
                              : 'bg-gradient-to-br from-blue-400 to-indigo-500 text-white group-hover:from-blue-500 group-hover:to-indigo-600'
                          }`}
                      >
                        {getInitials(acc.accountName)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-light truncate text-sm text-gray-800">
                          {acc.accountName}
                        </p>
                        <p className="text-xs truncate font-light text-gray-500">
                          Balance: {toThousands(acc.closingBalance || 0)}
                        </p>
                      </div>
                    </div>
                    {selectedGpayAccount?.id === acc.id && (
                      <div className="absolute right-2 top-1/2 transform -translate-y-1/2">
                        <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {filteredSidebarGpays.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  <Wallet size={32} className="mx-auto mb-2 opacity-50" />
                  <p className="text-sm">No GPay found</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      <div
        className={`transition-all duration-500 ease-out mx-7 mt-8 space-y-6 ${
          showGpaySidebar && showSideBar ? 'ml-[340px]' : ''
        }`}
      >
        {/* HEADER */}
        <div className="flex justify-between items-center">
          <p className="text-3xl font-light">Account Ledger</p>

          <button
            onClick={handlePrint}
            className="flex items-center gap-2 px-4 py-1.5 rounded-xl 
              bg-white border border-blue-200 text-blue-600 hover:bg-blue-50"
          >
            <Printer size={18} />
            <span className="text-sm">Print</span>
          </button>
        </div>

        {/* TABS */}
        <div className="flex gap-4">
          <button
            onClick={() => setSelectedType('Bank')}
            className={`flex items-center gap-2 px-6 py-2 rounded-xl font-medium transition
              ${
                selectedType === 'Bank'
                  ? 'bg-blue-600 text-white'
                  : 'bg-white border border-gray-300 text-gray-600 hover:bg-gray-100'
              }`}
          >
            <Landmark size={18} />
            Bank
          </button>

          <button
            onClick={() => setSelectedType('Cash')}
            className={`flex items-center gap-2 px-6 py-2 rounded-xl font-medium transition
              ${
                selectedType === 'Cash'
                  ? 'bg-blue-600 text-white'
                  : 'bg-white border border-gray-300 text-gray-600 hover:bg-gray-100'
              }`}
          >
            <Banknote size={18} />
            Cash
          </button>

          <button
            onClick={() => setSelectedType('GPay')}
            className={`flex items-center gap-2 px-6 py-2 rounded-xl font-medium transition
              ${
                selectedType === 'GPay'
                  ? 'bg-blue-600 text-white'
                  : 'bg-white border border-gray-300 text-gray-600 hover:bg-gray-100'
              }`}
          >
            <CreditCard size={18} />
            GPay
          </button>
        </div>

        {/* STATISTICS */}

        <div className="border border-gray-200 shadow-lg px-6 py-5 rounded-2xl my-4 flex overflow-x-auto bg-gradient-to-r from-white to-gray-50">
          <div className="border-r w-52 flex-shrink-0">
            <p className="text-gray-600 text-sm">Transactions</p>
            <p className="text-xl font-bold">{statistics.transactionCount}</p>
          </div>

          <div className="mx-4 border-r w-52 flex-shrink-0">
            <p className="text-gray-600 text-sm">Total Debits</p>
            <p className="text-xl font-light">{toThousands(statistics.totalDebit)}</p>
          </div>

          <div className="border-r w-52 flex-shrink-0">
            <p className="text-gray-600 text-sm">Total Credits</p>
            <p className="text-xl font-light">{toThousands(statistics.totalCredit)}</p>
          </div>

          <div className="mx-4 w-52 flex-shrink-0">
            <p className="text-gray-600 text-sm">Closing Balance</p>
            <p className={`text-xl font-light ${closingColor}`}>
              {toThousands(statistics.closingBalance)}
            </p>
          </div>
        </div>

        {/* TABLE */}
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-200 mb-10">
          <div className="overflow-x-auto max-h-[600px]">
            <table className="min-w-max border-collapse text-sm w-full">
              <thead className="bg-gradient-to-r from-gray-100 to-gray-200 sticky top-0">
                <tr>
                  {TABLE_HEADERS.map((header) => (
                    <th
                      key={header.key}
                      className={`px-6 py-4 border-r border-gray-200 ${header.width} font-semibold text-center`}
                    >
                      {header.label}
                    </th>
                  ))}
                </tr>
              </thead>

              <tbody>
                {sortedData.length === 0 ? (
                  <tr>
                    <td colSpan={TABLE_HEADERS.length} className="text-center py-12">
                      No transactions found
                    </td>
                  </tr>
                ) : (
                  sortedData.map((entry) => <TransactionRow key={entry.id} entry={entry} />)
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {showLoader && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 shadow-2xl">Loading...</div>
        </div>
      )}
    </div>
  )
}

export default BankLedger
