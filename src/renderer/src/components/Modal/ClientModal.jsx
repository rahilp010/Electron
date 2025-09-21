/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable react/prop-types */
/* eslint-disable no-unused-vars */
import React, { useCallback, useEffect, useState } from 'react'
import { setClients, updateClient } from '../../app/features/electronSlice'
import { CircleX } from 'lucide-react'
import { useDispatch, useSelector } from 'react-redux'
import { toast } from 'react-toastify'
import { Input, InputNumber, SelectPicker } from 'rsuite'

const ClientModal = ({
  setShowModal,
  existingClient = null,
  isUpdateExpense = false,
  type = 'client'
}) => {
  const dispatch = useDispatch()

  const accountTypeOptions = [
    { value: 'Creditors', label: 'Creditors' },
    { value: 'Debtors', label: 'Debtors' }
  ]

  const fetchClients = async () => {
    const response = await window.api.getAllClients()
    dispatch(setClients(response))
  }

  const clients = useSelector((state) => state.electron.clients.data || [])
  const safeClient = existingClient || {}

  const [isSubmittingClient, setIsSubmittingClient] = useState(false)

  const getInitialClient = () => {
    if (isUpdateExpense && existingClient) {
      console.log('Initializing with existing client:', existingClient)
      return {
        clientName: existingClient.clientName || '',
        phoneNo: existingClient.phoneNo || '',
        gstNo: existingClient.gstNo || '',
        address: existingClient.address || '',
        pendingAmount: Number(existingClient.pendingAmount) || '',
        paidAmount: Number(existingClient.paidAmount) || '',
        pendingFromOurs: existingClient.pendingFromOurs || '',
        accountType: existingClient.accountType || ''
      }
    }
    return {
      clientName: '',
      phoneNo: '',
      gstNo: '',
      address: '',
      pendingAmount: '',
      paidAmount: '',
      pendingFromOurs: '',
      accountType: ''
    }
  }

  // Simplified state - only use transaction object
  const [client, setClient] = useState(getInitialClient())

  // Initialize component
  useEffect(() => {
    fetchClients()
  }, [])

  // Initialize transaction data for updates
  useEffect(() => {
    if (isUpdateExpense && existingClient?.id) {
      console.log('Initializing client for update:', existingClient)
      setClient({
        clientName: existingClient.clientName || '',
        phoneNo: existingClient.phoneNo || '',
        gstNo: existingClient.gstNo || '',
        address: existingClient.address || '',
        pendingAmount: Number(existingClient.pendingAmount) || '',
        paidAmount: Number(existingClient.paidAmount) || '',
        pendingFromOurs: existingClient.pendingFromOurs || '',
        accountType: existingClient.accountType || ''
      })
    }
  }, [isUpdateExpense, existingClient?.id])

  const handleSubmitClient = useCallback(
    async (e) => {
      e.preventDefault()

      if (isSubmittingClient) return
      setIsSubmittingClient(true)

      try {
        // Validation
        if (!client.clientName) {
          toast.error('Please enter client name')
          return
        }

        if (!client.accountType) {
          toast.error('Please select account type')
          return
        }

        if (!client.pendingAmount || client.pendingAmount < 0) {
          toast.error('Please enter a valid pending amount')
          return
        }

        if (!client.paidAmount || client.paidAmount < 0) {
          toast.error('Please enter a valid paid amount')
          return
        }

        const clientData = {
          clientName: client.clientName,
          phoneNo: client.phoneNo,
          gstNo: client.gstNo,
          address: client.address,
          pendingAmount: Number(client.pendingAmount),
          paidAmount: Number(client.paidAmount),
          pendingFromOurs: client.pendingFromOurs,
          accountType: client.accountType
        }

        console.log('Submitting client:', clientData)

        if (!isUpdateExpense) {
          try {
            const response = await window.api.createClient(clientData)
            console.log(response)
            dispatch(setClients(response))
            toast.success('Client added successfully')
            fetchClients()
          } catch (error) {
            console.error('Transaction Submit Error:', error)
            toast.error('An error occurred while processing your request')
          }
        } else {
          try {
            const response = await window.api.updateClient({
              id: safeClient.id,
              ...clientData
            })
            dispatch(updateClient(response))
            toast.success('Client updated successfully')
            fetchClients()
          } catch (error) {
            console.error('Client Submit Error:', error)
            toast.error('An error occurred while processing your request')
          }
        }

        setShowModal(false)
      } catch (error) {
        console.error('Client Submit Error:', error)
        toast.error('An error occurred while processing your request')
      } finally {
        setIsSubmittingClient(false)
      }
    },
    [dispatch, isUpdateExpense, safeClient, client, setShowModal]
  )

  const handleOnChangeEvent = (value, fieldName) => {
    switch (fieldName) {
      case 'clientName':
        setClient((prev) => ({ ...prev, clientName: value }))
        break

      case 'phoneNo':
        setClient((prev) => ({ ...prev, phoneNo: value }))
        break

      case 'gstNo':
        setClient((prev) => ({ ...prev, gstNo: value }))
        break

      case 'address':
        setClient((prev) => ({ ...prev, address: value }))
        break

      case 'pendingAmount':
        setClient((prev) => ({ ...prev, pendingAmount: value }))
        break

      case 'paidAmount':
        setClient((prev) => ({ ...prev, paidAmount: value }))
        break

      case 'pendingFromOurs':
        setClient((prev) => ({ ...prev, pendingFromOurs: value }))
        break

      case 'accountType':
        setClient((prev) => ({ ...prev, accountType: value }))
        break

      default:
        toast.error('Invalid Field Name')
        break
    }
  }

  const toThousands = (value) => {
    if (!value) return value
    return new Intl.NumberFormat('en-IN').format(value)
  }

  return (
    <div
      className="fixed z-50 inset-0 flex items-center justify-center transition-all duration-300 bg-black/50"
      role="dialog"
      aria-modal="true"
    >
      {type === 'client' ? (
        <form onSubmit={handleSubmitClient}>
          <div className="bg-white p-6 rounded-lg shadow-2xl w-full max-w-2xl relative">
            <p className="text-lg font-semibold mb-4">
              {isUpdateExpense ? 'Update Client' : 'Add Client'}
            </p>
            <CircleX
              className="absolute top-4 right-4 cursor-pointer text-red-400 hover:text-red-600"
              size={30}
              onClick={() => setShowModal(false)}
            />

            <div className="grid grid-cols-2 gap-4 my-2">
              <div>
                <label htmlFor="name" className="block text-sm mb-1 text-gray-600">
                  Client Name
                </label>
                <Input
                  size="sm"
                  value={client.clientName}
                  placeholder="Enter Client Name"
                  onChange={(value) => handleOnChangeEvent(value, 'clientName')}
                  className="w-full border border-gray-300 rounded px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-400 h-9 items-center tracking-wide"
                />
              </div>
              <div>
                <label htmlFor="quantity" className="block text-sm mb-1 text-gray-600">
                  Phone No
                </label>
                <Input
                  size="sm"
                  value={client.phoneNo}
                  placeholder="Enter phone no"
                  onChange={(value) => handleOnChangeEvent(value, 'phoneNo')}
                  className="w-full border border-gray-300 rounded px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-400 h-9 items-center tracking-wide"
                />
              </div>
              <div className="col-span-2">
                <label htmlFor="quantity" className="block text-sm mb-1 text-gray-600">
                  Address
                </label>
                <Input
                  as="textarea"
                  rows={2}
                  size="sm"
                  value={client.address}
                  placeholder="Enter address"
                  onChange={(value) => handleOnChangeEvent(value, 'address')}
                  className="w-full border border-gray-300 rounded px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-400 h-9 items-center tracking-wide"
                />
              </div>
              <div className="grid grid-cols-3 col-span-2 gap-4">
                <div>
                  <label htmlFor="quantity" className="block text-sm mb-1 text-gray-600">
                    Account Type
                  </label>
                  <SelectPicker
                    data={accountTypeOptions}
                    searchable={false}
                    value={client.accountType}
                    onChange={(value) => handleOnChangeEvent(value, 'accountType')}
                    placeholder="Account Type"
                    style={{ width: 300, zIndex: 999 }}
                    menuStyle={{ zIndex: 999 }}
                    menuMaxHeight={200}
                  />
                </div>
                <div>
                  <label htmlFor="quantity" className="block text-sm mb-1 text-gray-600">
                    GST No
                  </label>
                  <Input
                    value={client.gstNo}
                    onChange={(value) => handleOnChangeEvent(value, 'gstNo')}
                    placeholder="GST No"
                    className="w-full border border-gray-300 rounded px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-400 h-9 items-center tracking-wide"
                  />
                </div>
                <div className="mb-4">
                  <label htmlFor="price" className="block text-sm mb-1 text-gray-600">
                    Pending Amount
                  </label>
                  <InputNumber
                    prefix="₹"
                    defaultValue={0}
                    size="xs"
                    formatter={toThousands}
                    value={client.pendingAmount}
                    onChange={(value) => handleOnChangeEvent(value, 'pendingAmount')}
                    className="w-full border border-gray-300 rounded px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-400"
                  />
                </div>
              </div>
              <div className="mb-4">
                <label htmlFor="price" className="block text-sm mb-1 text-gray-600">
                  Paid Amount
                </label>
                <InputNumber
                  prefix="₹"
                  defaultValue={0}
                  size="xs"
                  value={client.paidAmount}
                  onChange={(value) => handleOnChangeEvent(value, 'paidAmount')}
                  formatter={toThousands}
                  className="w-full border border-gray-300 rounded px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-400"
                />
              </div>

              <div className="mb-4">
                <label htmlFor="price" className="block text-sm mb-1 text-gray-600">
                  Pending From Ourside
                </label>
                <InputNumber
                  prefix="₹"
                  defaultValue={0}
                  size="xs"
                  value={client.pendingFromOurs}
                  onChange={(value) => handleOnChangeEvent(value, 'pendingFromOurs')}
                  formatter={toThousands}
                  className="w-full border border-gray-300 rounded px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-400"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 mt-4">
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="px-7 py-2 bg-gray-500 hover:bg-gray-600 text-white rounded-lg transition-all duration-300"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmittingClient}
                className="px-7 py-2 bg-[#566dff] hover:bg-[#566dff]/60 text-white rounded-lg transition-all duration-300 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmittingClient ? 'Processing...' : isUpdateExpense ? 'Update' : 'Add'}
              </button>
            </div>
          </div>
        </form>
      ) : null}
    </div>
  )
}

export default ClientModal
