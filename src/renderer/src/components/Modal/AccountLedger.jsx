/* eslint-disable prettier/prettier */
/* eslint-disable react/no-unknown-property */
/* eslint-disable no-unused-vars */
/* eslint-disable react/display-name */
/* eslint-disable react/prop-types */

import { memo, useCallback, useEffect, useMemo, useState, forwardRef } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { clientApi } from '../../API/Api'
import { setClients } from '../../app/features/electronSlice'
import { toast } from 'react-toastify'
import { Tooltip, Whisper } from 'rsuite'
import {
  TrendingUp,
  TrendingDown,
  Calendar,
  Building2,
  FileText,
  DollarSign,
  BarChart3,
  Printer,
  Banknote
} from 'lucide-react'

// ======================
// CONSTANTS
// ======================

const TABLE_HEADERS = [
  { key: 'date', label: 'Date', width: 'w-[170px]', icon: Calendar },
  { key: 'account', label: 'Account Type', width: 'w-[200px]', icon: Building2 },
  { key: 'debit', label: 'Debit', width: 'w-[200px]', icon: TrendingDown },
  { key: 'credit', label: 'Credit', width: 'w-[200px]', icon: TrendingUp },
  { key: 'balance', label: 'Balance', width: 'w-[200px]', icon: BarChart3 },
  { key: 'description', label: 'Description', width: 'w-[350px]', icon: FileText }
]

// ======================
// UTIL
// ======================

const toThousands = (value) => {
  if (!value || isNaN(value)) return '₹0'
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR'
  }).format(value)
}

// ======================
// ROW COMPONENT
// ======================

const TransactionRow = memo(({ entry, balance }) => {
  const isDebit = entry.entryType === 'debit'
  const balanceColor = balance >= 0 ? 'text-emerald-600' : 'text-red-600'

  return (
    <tr className="transition-all duration-200 hover:shadow-md transform hover:scale-[1.001]">
      <td className="px-6 py-4">{new Date(entry.date).toLocaleDateString('en-IN')}</td>

      <td className="px-6 py-4">
        <span className="capitalize">{entry.referenceType}</span>
      </td>

      <td className="px-6 py-4">
        {isDebit ? (
          <span className="font-semibold text-red-600">{toThousands(entry.amount)}</span>
        ) : (
          '-'
        )}
      </td>

      <td className="px-6 py-4">
        {!isDebit ? (
          <span className="font-semibold text-emerald-600">{toThousands(entry.amount)}</span>
        ) : (
          '-'
        )}
      </td>

      <td className="px-6 py-4">
        <span className={`font-semibold ${balanceColor}`}>{toThousands(balance)}</span>
      </td>

      <td className="px-6 py-4 max-w-[350px]">
        <Whisper
          trigger="hover"
          placement="leftStart"
          speaker={<Tooltip>{entry.narration || 'No description provided'}</Tooltip>}
        >
          <span className="truncate cursor-pointer">
            {entry.narration || 'No description provided'}
          </span>
        </Whisper>
      </td>
    </tr>
  )
})

// ======================
// MAIN COMPONENT
// ======================

const AccountLedger = forwardRef(({ client }, ref) => {
  const dispatch = useDispatch()
  const [ledgerData, setLedgerData] = useState([])
  const [showLoader, setShowLoader] = useState(false)

  console.log('ledgerData', ledgerData)

  // ======================
  // FETCH CLIENTS
  // ======================

  const fetchAllClients = useCallback(async () => {
    try {
      const response = await clientApi.getAllClients()
      dispatch(setClients(response))
    } catch (error) {
      toast.error('Failed to fetch accounts')
    }
  }, [dispatch])

  // ======================
  // FETCH LEDGER
  // ======================

  useEffect(() => {
    if (!client?.id) return

    const loadLedger = async () => {
      setShowLoader(true)
      const response = await window.api.getClientLedger(client.id)
      if (response.success) {
        setLedgerData(response.data)
      }
      setShowLoader(false)
    }

    loadLedger()
  }, [client])

  // ======================
  // SORTED DATA
  // ======================

  const sortedTransactions = useMemo(() => {
    return [...ledgerData].sort((a, b) => new Date(a.date) - new Date(b.date))
  }, [ledgerData])

  const displayTransactions = useMemo(() => [...sortedTransactions].reverse(), [sortedTransactions])

  const displayBalances = useMemo(
    () => [...sortedTransactions.map((t) => t.balanceAfter)].reverse(),
    [sortedTransactions]
  )

  // ======================
  // STATISTICS
  // ======================

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

  // ======================
  // PRINT
  // ======================

  const handlePrintPDF = useCallback(() => {
    window.print()
  }, [])

  const closingBalanceColor = statistics.closingBalance >= 0 ? 'text-emerald-600' : 'text-red-600'

  return (
    <div className="space-y-6 mx-7 -mt-4">
      {/* PRINT BUTTON */}
      <div className="flex justify-end">
        <button
          className="text-black flex items-center gap-1 border border-gray-300 p-1 px-3 rounded-sm hover:bg-black hover:text-white transition-all duration-300 hover:scale-105"
          onClick={handlePrintPDF}
        >
          <Printer size={16} />
          <span className="text-sm">Print</span>
        </button>
      </div>

      {/* STATISTICS */}
      <div className="border border-gray-200 shadow-lg px-2 py-5 rounded-2xl my-4 flex overflow-x-auto bg-gradient-to-r from-white to-gray-50">
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
          <p className={`text-xl font-light ${closingBalanceColor}`}>
            {toThousands(statistics.closingBalance)}
          </p>
        </div>
      </div>

      {/* TABLE */}
      <div className="bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-200">
        <div className="overflow-x-auto customScrollbar max-h-[600px] relative">
          <table className="min-w-max border-collapse text-sm w-full">
            <thead className="bg-gradient-to-r from-gray-100 to-gray-200 sticky top-0 z-10">
              <tr>
                {TABLE_HEADERS.map((header) => {
                  const Icon = header.icon
                  return (
                    <th
                      key={header.key}
                      className={`px-6 py-4 border-r border-gray-200 ${header.width} font-semibold text-left`}
                    >
                      <div className="flex items-center gap-2">
                        <Icon size={16} className="text-gray-500" />
                        {header.label}
                      </div>
                    </th>
                  )
                })}
              </tr>
            </thead>

            <tbody className="divide-y divide-gray-100">
              {displayTransactions.length === 0 ? (
                <tr>
                  <td colSpan={TABLE_HEADERS.length} className="text-center py-12">
                    No transactions found
                  </td>
                </tr>
              ) : (
                displayTransactions.map((entry, index) => (
                  <TransactionRow key={entry.id} entry={entry} balance={displayBalances[index]} />
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
})

export default AccountLedger
