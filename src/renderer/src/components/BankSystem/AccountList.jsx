/* eslint-disable prettier/prettier */
/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable react/prop-types */
import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { setAccount, deleteAccount } from '../../app/features/electronSlice'
import { InputGroup, Input } from 'rsuite'
import { Plus, PenLine, Trash, ChevronUp, ChevronDown, FileUp, SearchIcon } from 'lucide-react'
import * as XLSX from 'xlsx'
import { toast } from 'react-toastify'
import Navbar from '../UI/Navbar'
import CreateAccountModal from '../Modal/CreateAccountModal'
const AccountList = () => {
  const dispatch = useDispatch()
  const accounts = useSelector((state) => state.electron.account?.data || [])
  const [showModal, setShowModal] = useState(false)
  const [selectedAccount, setSelectedAccount] = useState(null)
  const [isUpdateAccount, setIsUpdateAccount] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [sortConfig, setSortConfig] = useState({ key: 'id', direction: 'asc' })
  const [recentReceipts, setRecentReceipts] = useState([])

  const fetchAccounts = useCallback(async () => {
    const res = await window.api.getAllAccounts()
    dispatch(setAccount(res))
  }, [])

  const fetchRecentReceipts = useCallback(async () => {
    try {
      const bankReceipts = await window.api.getRecentBankReceipts()
      const cashReceipts = await window.api.getRecentCashReceipts()

      const receipts = [...(bankReceipts || []), ...(cashReceipts || [])]

      const sorted = receipts.sort((a, b) => b.id - a.id) // latest first
      setRecentReceipts(sorted)
    } catch (err) {
      console.error('Error fetching recent receipts:', err)
      toast.error('Failed to fetch recent receipts')
    }
  }, [])

  useEffect(() => {
    fetchAccounts()
    fetchRecentReceipts()
  }, [fetchAccounts, fetchRecentReceipts])

  const filteredAccounts = useMemo(() => {
    let data = [...accounts]
    if (searchQuery) {
      data = data.filter((acc) => acc.accountName.toLowerCase().includes(searchQuery.toLowerCase()))
    }
    data = data.map((acc) => {
      console.log(recentReceipts)

      const matchingReceipts = recentReceipts.filter((r) => {
        const txnAcc = r.transactionAccount ? String(r.transactionAccount).trim() : ''
        const accId = String(acc.id).trim()

        if (txnAcc && txnAcc === accId) return true

        if (r.sendTo && r.sendTo.toLowerCase().trim() === acc.accountName.toLowerCase().trim())
          return true

        return false
      })

      let credits = 0
      let debits = 0

      matchingReceipts.forEach((r) => {
        if (r.type === 'Receipt') credits += r.amount || 0
        else if (r.type === 'Payment') debits += r.amount || 0
      })

      const previousBalance = acc.closingBalance || acc.openingBalance || 0

      const computedBalance = previousBalance + credits - debits

      return {
        ...acc,
        balance: computedBalance,
        closingBalance: computedBalance
      }
    })

    data.sort((a, b) => {
      const dateA = new Date(a?.createdAt || a?.date || 0)
      const dateB = new Date(b?.createdAt || b?.date || 0)
      return dateB - dateA
    })
    if (sortConfig.key) {
      data.sort((a, b) => {
        const x = a[sortConfig.key]
        const y = b[sortConfig.key]
        if (x < y) return sortConfig.direction === 'asc' ? -1 : 1
        if (x > y) return sortConfig.direction === 'asc' ? 1 : -1
        return 0
      })
    }
    return data
  }, [accounts, searchQuery, sortConfig, recentReceipts])
  const requestSort = (key) => {
    setSortConfig((prev) => ({
      key,
      direction: prev.direction === 'asc' ? 'desc' : 'asc'
    }))
  }
  const handleDelete = useCallback(
    async (id) => {
      if (!window.confirm('Are you sure you want to delete this account?')) return
      try {
        await window.api.deleteAccount(id)
        dispatch(deleteAccount(id))
        toast.success('Account deleted successfully')
      } catch (error) {
        toast.error('Failed to delete account: ' + error.message)
      }
    },
    [dispatch]
  )
  const handleExport = () => {
    const ws = XLSX.utils.json_to_sheet(accounts)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'Accounts')
    XLSX.writeFile(wb, 'accounts.xlsx')
  }

  const toThousands = (value) => {
    if (!value || isNaN(value)) return '0'
    return new Intl.NumberFormat('en-IN').format(Number(value))
  }

  console.log('🧾 recentReceipts:', recentReceipts)

  return (
    <div className="max-h-screen w-full select-none bg-gray-50 customScrollbar overflow-auto">
      <Navbar />
      {/* Header Section */}
      <div className="flex justify-between items-center mt-6 px-7">
        <h2 className="text-3xl font-light text-gray-800">Accounts</h2>
        <div className="flex gap-3">
          <button
            onClick={handleExport}
            className="flex items-center gap-2 px-4 py-2.5 bg-white border border-gray-300 rounded-lg shadow-sm hover:shadow-md hover:border-gray-400 transition-all duration-200 text-gray-700 font-medium"
          >
            <FileUp size={16} /> Export
          </button>
          <button
            onClick={() => {
              setSelectedAccount(null)
              setIsUpdateAccount(false)
              setShowModal(true)
            }}
            className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 border border-blue-600 rounded-lg shadow-sm hover:shadow-md hover:bg-blue-700 transition-all duration-200 text-white font-medium"
          >
            <Plus size={16} /> Add Account
          </button>
        </div>
      </div>
      {/* Search Section */}
      <div className="w-72 my-4 mx-5">
        <InputGroup size="md">
          <Input
            placeholder="Search clients..."
            value={searchQuery}
            onChange={setSearchQuery}
            className="rounded-xl border-2 indent-2 border-[#d4d9fb] outline-none"
          />
          <InputGroup.Button>
            <SearchIcon />
          </InputGroup.Button>
        </InputGroup>
      </div>

      {/* Table Section */}
      <div className="mt-8 mx-5 bg-white border border-gray-200 rounded-2xl shadow-lg customScrollbar overflow-auto h-[calc(100vh-200px)]">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gradient-to-r from-gray-50 to-gray-100 sticky top-0">
              <tr>
                {[
                  { key: 'id', label: 'ID', width: 'w-20' },
                  { key: 'accountName', label: 'Account Name', width: 'w-48' },
                  { key: 'balance', label: 'Balance', width: 'w-32' },
                  { key: 'openingBalance', label: 'Opening Balance', width: 'w-36' },
                  { key: 'closingBalance', label: 'Closing Balance', width: 'w-36' },
                  { key: 'status', label: 'Status', width: 'w-24' }
                ].map((col) => {
                  const active = sortConfig.key === col.key
                  return (
                    <th
                      key={col.key}
                      onClick={() => requestSort(col.key)}
                      className={`${col.width} px-4 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors duration-150`}
                    >
                      <div className="flex items-center gap-1">
                        {col.label}
                        {active && (
                          <span className="ml-1">
                            {sortConfig.direction === 'asc' ? (
                              <ChevronUp size={14} className="text-blue-600" />
                            ) : (
                              <ChevronDown size={14} className="text-blue-600" />
                            )}
                          </span>
                        )}
                      </div>
                    </th>
                  )
                })}
                <th className="w-32 px-4 py-4 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredAccounts.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center text-gray-500 text-lg">
                    <div className="flex flex-col items-center gap-2">
                      <div className="w-12 h-12 mx-auto text-gray-400">
                        <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={1}
                            d="M9 12h6m-6 3h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                          />
                        </svg>
                      </div>
                      No Accounts Found
                    </div>
                  </td>
                </tr>
              ) : (
                filteredAccounts.map((acc, index) => (
                  <tr
                    key={acc?.id}
                    className={`transition-all duration-200 ${
                      index % 2 === 0 ? 'hover:bg-gray-50' : 'hover:bg-gray-50'
                    }`}
                  >
                    <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {acc?.id}
                    </td>
                    <td className="px-4 py-4 text-sm font-semibold text-gray-900 uppercase">
                      {acc?.accountName}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                      ₹{acc?.balance?.toLocaleString()}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                      ₹{acc?.openingBalance?.toLocaleString()}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                      ₹{acc?.closingBalance?.toLocaleString()}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap gap-2 relative">
                      <span
                        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold shadow-sm ${
                          acc?.status !== 'active'
                            ? 'bg-red-50 text-red-300 ring-1 ring-red-200'
                            : 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200'
                        }`}
                      >
                        <span
                          className={`h-2 w-2 rounded-full ${
                            acc?.status === 'active' ? 'bg-green-300' : 'bg-red-500'
                          }`}
                        ></span>
                        {String(acc?.status).slice(0, 1).toUpperCase() +
                          String(acc?.status).slice(1)}
                      </span>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex justify-center items-center gap-2">
                        <button
                          onClick={() => {
                            setSelectedAccount(acc)
                            setIsUpdateAccount(true)
                            setShowModal(true)
                          }}
                          className="p-2 rounded-full text-purple-600 border border-purple-600 hover:bg-purple-600 hover:text-white transition-all duration-200 shadow-sm hover:shadow-md"
                          title="Edit Account"
                        >
                          <PenLine size={14} />
                        </button>
                        <button
                          onClick={() => handleDelete(acc?.id)}
                          className="p-2 rounded-full text-red-600 border border-red-600 hover:bg-red-600 hover:text-white transition-all duration-200 shadow-sm hover:shadow-md"
                          title="Delete Account"
                        >
                          <Trash size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
      {/* MODAL */}
      {showModal && (
        <CreateAccountModal
          setShowModal={setShowModal}
          existingAccount={selectedAccount}
          isUpdateAccount={isUpdateAccount}
        />
      )}
    </div>
  )
}
export default AccountList
