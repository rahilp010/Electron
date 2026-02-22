/* eslint-disable prettier/prettier */
/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable no-case-declarations */
/* eslint-disable react/prop-types */
/* eslint-disable no-unused-vars */
import React, { useCallback, useEffect, useState } from 'react'
import {
  createAccount,
  getAccount,
  setAccount,
  updateAccount // Assuming you have an updateAccount action
} from '../../app/features/electronSlice' // Adjust path as needed
import { CircleX } from 'lucide-react'
import { toast } from 'react-toastify'
import { InputNumber, Toggle, Input, SelectPicker } from 'rsuite'
import { useDispatch, useSelector } from 'react-redux' // Added for dispatch
import { useLocation } from 'react-router-dom'

const CreateAccountModal = ({
  setShowModal,
  existingAccount = null,
  isUpdateAccount = false,
  type = 'account' // Changed default to 'account' for clarity
}) => {
  const dispatch = useDispatch() // Added dispatch
  const location = useLocation()
  const [accountData, setAccountData] = useState({
    // Local state for account
    id: '',
    accountName: '',
    balance: 0,
    status: 'active',
    openingBalance: 0,
    closingBalance: 0,
    accounterType: '',
    createdAt: new Date(),
    updatedAt: new Date(),
    pageName: 'Account'
  })
  const [isSubmitting, setIsSubmitting] = useState(false) // Renamed and added state

  const getInitialAccount = useCallback(() => {
    if (isUpdateAccount && existingAccount) {
      return {
        id: existingAccount.id || '',
        accountName: existingAccount.accountName || '',
        openingBalance: existingAccount.openingBalance || 0,
        status: existingAccount.status || 'active',
        accounterType: existingAccount.accounterType || ''
      }
    }

    return {
      id: '',
      accountName: '',
      openingBalance: 0,
      status: 'active',
      accounterType: ''
    }
  }, [isUpdateAccount, existingAccount])

  const accounts = useSelector((state) => state.electron.account.data)

  const [recentReceipts, setRecentReceipts] = useState([])

  console.log(accounts)

  const fetchAccounts = useCallback(async () => {
    console.log('Fetching accounts...')
    const accounts = await window.api.getAllAccounts()
    dispatch(setAccount(accounts))
  }, [dispatch])

  useEffect(() => {
    fetchAccounts()
  }, [fetchAccounts])

  useEffect(() => {
    const initialAccount = getInitialAccount()
    setAccountData(initialAccount)
  }, [getInitialAccount, isUpdateAccount])

  const handleOnChangeEvent = useCallback((value, fieldName) => {
    setAccountData((prev) => ({ ...prev, [fieldName]: value }))
  }, [])

  const toThousands = useCallback((value) => {
    if (!value) return value
    return new Intl.NumberFormat('en-IN').format(value)
  }, [])

  const handleSubmitAccount = useCallback(
    async (e) => {
      e.preventDefault()
      if (isSubmitting) return
      setIsSubmitting(true)

      try {
        if (!accountData.accountName.trim()) {
          toast.error('Please enter a valid account name')
          return
        }
        if (
          accountData.balance < 0 ||
          accountData.openingBalance < 0 ||
          accountData.closingBalance < 0
        ) {
          toast.error('Balances cannot be negative')
          return
        }
        if (isUpdateAccount && accountData.openingBalance > accountData.closingBalance) {
          toast.error('Opening balance cannot exceed closing balance')
          return
        }

        const formattedAccountData = {
          id: accountData.id || undefined,
          accountName: accountData.accountName.trim(),
          openingBalance: Number(accountData.openingBalance) || 0,
          accounterType: accountData.accounterType,
          status: accountData.status
        }

        let result
        let successMessage

        if (isUpdateAccount && accountData.id) {
          const result = await window.api.updateAccount({
            id: accountData.id,
            ...formattedAccountData
          })

          if (!result?.success) throw new Error(result?.message || 'Update failed')

          dispatch(updateAccount(result.data))
          toast.success('Account updated successfully')
        } else {
          const result = await window.api.createAccount(formattedAccountData)

          if (!result?.success) throw new Error(result?.message || 'Creation failed')

          dispatch(createAccount(result.data))
          toast.success('Account created successfully')
        }

        setShowModal(false)
      } catch (error) {
        console.error('Account submission error:', error)
        toast.error(error.message || 'An error occurred while processing your request')
      } finally {
        setIsSubmitting(false)
      }
    },
    [accountData, isUpdateAccount, setShowModal, dispatch, isSubmitting]
  )

  const accouterTypes = [
    { label: 'Client Account', value: 'Client' },
    { label: 'Main Account', value: 'Main' },
    { label: 'GPay Account', value: 'GPay' }
  ]

  return (
    <div
      className="fixed z-50 inset-0 flex items-center justify-center transition-all duration-300 bg-black/50"
      role="dialog"
      aria-modal="true"
    >
      <form onSubmit={handleSubmitAccount}>
        <div className="bg-white p-6 rounded-lg shadow-2xl w-full min-w-3xl relative">
          {/* Adjusted width for better modal size */}
          <p className="text-lg font-semibold flex items-center gap-3">
            {isUpdateAccount ? 'Update Account' : 'Add Account'}
          </p>
          <CircleX
            className="absolute top-4 right-4 cursor-pointer text-red-400 hover:text-red-600"
            size={30}
            onClick={() => setShowModal(false)}
          />
          <div className="grid grid-cols-2 gap-4 my-4">
            {/* <div>
              <label htmlFor="accountId" className="block text-sm mb-1 text-gray-600">
                Account ID
              </label>
              <Input
                id="accountId"
                value={accountData.id || ''}
                disabled={isUpdateAccount}
                placeholder="Auto-generated on create"
                className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400"
              />
            </div> */}
            <div>
              <label htmlFor="accountName" className="block text-sm mb-1 text-gray-600">
                Account Name
              </label>
              <Input
                id="accountName"
                value={accountData.accountName}
                onChange={(value) => handleOnChangeEvent(value.toUpperCase(), 'accountName')}
                placeholder="Enter Account Name (e.g., Savings, Business Bank)"
                className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400"
              />
            </div>
            {/* <div>
              <label htmlFor="balance" className="block text-sm mb-1 text-gray-600">
                Current Balance
              </label>
              <InputNumber
                id="balance"
                prefix="₹"
                placeholder="0"
                value={accountData.balance}
                onChange={(value) => handleOnChangeEvent(value, 'balance')}
                formatter={toThousands}
                className="w-full"
                min={0}
              />
            </div> */}
            <div>
              <label htmlFor="openingBalance" className="block text-sm mb-1 text-gray-600">
                Opening Balance
              </label>
              <InputNumber
                id="openingBalance"
                prefix="₹"
                placeholder="0"
                value={accountData.openingBalance}
                onChange={(value) => handleOnChangeEvent(value, 'openingBalance')}
                formatter={toThousands}
                className="w-full"
                min={0}
              />
            </div>

            <div>
              <label htmlFor="accounterType" className="block text-sm mb-1 text-gray-600">
                Accounter Type
              </label>
              <SelectPicker
                id="accounterType"
                placeholder="Select Accounter Type"
                value={accountData.accounterType}
                searchable={false}
                data={accouterTypes}
                onChange={(value) => handleOnChangeEvent(value, 'accounterType')}
                className="w-full"
                menuStyle={{ zIndex: 999 }}
                menuMaxHeight={200}
              />
            </div>
          </div>
          <div className="flex items-center justify-between">
            <Toggle
              id="status"
              size="lg"
              checkedChildren="Active"
              unCheckedChildren="Inactive"
              checked={accountData.status === 'active'}
              onChange={(checked) => handleOnChangeEvent(checked ? 'active' : 'inactive', 'status')}
            />
          </div>
          <div className="flex items-center justify-end gap-2 mt-4">
            <button
              type="button"
              onClick={() => setShowModal(false)}
              className="px-7 py-2 bg-gray-500 hover:bg-gray-600 text-white rounded-lg transition-all duration-300"
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !accountData.accountName.trim()}
              className="px-7 py-2 bg-[#566dff] hover:bg-[#566dff]/60 text-white rounded-lg transition-all duration-300 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? 'Processing...' : isUpdateAccount ? 'Update' : 'Create'}
            </button>
          </div>
        </div>
      </form>
    </div>
  )
}

export default CreateAccountModal
