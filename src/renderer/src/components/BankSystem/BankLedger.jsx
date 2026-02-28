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
  TrendingUp
} from 'lucide-react'
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

  /* ================= FETCH LEDGER ================= */

  const loadLedger = useCallback(async () => {
    setShowLoader(true)

    try {
      const response = await window.api.getAccountLedgerByType(selectedType)

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
  }, [selectedType])

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

  /* ================= RENDER ================= */

  return (
    <div className="select-none h-screen overflow-auto customScrollbar">
      <div className="w-full sticky top-0 z-10">
        <Navbar />
      </div>

      <div className="mx-7 mt-8 space-y-6">
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
