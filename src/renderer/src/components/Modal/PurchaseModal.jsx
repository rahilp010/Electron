/* eslint-disable prettier/prettier */
/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable react/prop-types */
/* eslint-disable no-unused-vars */

import React, { useCallback, useEffect, useState } from 'react'
import {
  setClients,
  setProducts,
  updateTransaction,
  setTransactions,
  setBankReceipt,
  updateBankReceipt,
  setCashReceipt,
  updateCashReceipt,
  setSettings
} from '../../app/features/electronSlice'
import { CircleX } from 'lucide-react'
import { useDispatch, useSelector } from 'react-redux'
import { toast } from 'react-toastify'
import { SelectPicker, InputNumber, Toggle, Checkbox, Animation, CheckPicker } from 'rsuite'
import ClientModal from './ClientModal'
import ProductModal from './ProductModal'

const PurchaseModal = ({
  setShowModal,
  existingTransaction = null,
  isUpdateExpense = false,
  type = 'transaction'
}) => {
  const dispatch = useDispatch()

  const [nextBillId, setNextBillId] = useState(null)
  const [productModal, setProductModal] = useState(false)
  const [clientModal, setClientModal] = useState(false)
  const [isSubmittingTransaction, setIsSubmittingTransaction] = useState(false)

  /* ---------------- FETCHERS ---------------- */

  const fetchProducts = async () => {
    const res = await window.api.getAllProducts()
    dispatch(setProducts(res))
  }

  const fetchClients = async () => {
    const res = await window.api.getAllClients()
    dispatch(setClients(res))
  }

  const fetchTransactions = async () => {
    const res = await window.api.getAllTransactions()
    dispatch(setTransactions(res))
  }

  const fetchBankReceipt = async () => {
    const res = await window.api.getRecentBankReceipts()
    dispatch(setBankReceipt(res))
  }

  const fetchCashReceipt = async () => {
    const res = await window.api.getRecentCashReceipts()
    dispatch(setCashReceipt(res))
  }

  const fetchSettings = async () => {
    const res = await window.api.getSettings()
    dispatch(setSettings(res))
  }

  const fetchNextTransactionId = async () => {
    const all = await window.api.getAllTransactions()
    if (all?.length) {
      const last = all[all.length - 1]
      setNextBillId(last.id + 1)
    } else {
      setNextBillId(1)
    }
  }

  /* ---------------- STATE ---------------- */

  const products = useSelector((state) => state.electron.products.data || [])
  const clients = useSelector((state) => state.electron.clients.data || [])
  const settings = useSelector((state) => state.electron.settings.data || [])

  const getInitialTransaction = () => {
    if (isUpdateExpense && existingTransaction) {
      return {
        ...existingTransaction
      }
    }

    return {
      id: '',
      clientId: '',
      productId: '',
      quantity: 0,
      sellAmount: 0,
      paymentMethod: 'bank',
      statusOfTransaction: 'pending',
      paymentType: 'full',
      paidAmount: 0,
      pendingAmount: 0,
      taxAmount: [],
      frightCharges: 0,
      pageName: 'Purchase'
    }
  }

  const [transaction, setTransaction] = useState(getInitialTransaction())

  useEffect(() => {
    fetchProducts()
    fetchClients()
    fetchTransactions()
    fetchBankReceipt()
    fetchCashReceipt()
    fetchSettings()
    fetchNextTransactionId()
  }, [])

  useEffect(() => {
    if (isUpdateExpense && existingTransaction?.id) {
      setTransaction(getInitialTransaction())
    }
  }, [existingTransaction?.id])

  /* ---------------- CALCULATIONS ---------------- */

  const selectedProduct = products.find((p) => p.id === transaction.productId)

  const unitPrice = Number(transaction.sellAmount || 0)
  const qty = Number(transaction.quantity || 0)

  const subtotal = unitPrice * qty

  const calculateTax = () => {
    let totalTax = 0

    if (Array.isArray(transaction.taxAmount)) {
      transaction.taxAmount.forEach((t) => {
        totalTax += Number(t.value || 0)
      })
    }

    return totalTax
  }

  const totalTax = calculateTax()
  const grandTotal = subtotal + totalTax

  useEffect(() => {
    if (transaction.paymentType === 'full') {
      setTransaction((prev) => ({
        ...prev,
        paidAmount: grandTotal,
        pendingAmount: 0
      }))
    }

    if (transaction.paymentType === 'partial') {
      setTransaction((prev) => ({
        ...prev,
        pendingAmount: Math.max(0, grandTotal - Number(prev.paidAmount || 0))
      }))
    }
  }, [grandTotal, transaction.paymentType])

  /* ---------------- HANDLERS ---------------- */

  const handleSubmitTransaction = useCallback(
    async (e) => {
      e.preventDefault()

      if (isSubmittingTransaction) return
      setIsSubmittingTransaction(true)

      try {
        if (!transaction.clientId || !transaction.productId) {
          toast.error('Please select client and product')
          return
        }

        if (!qty || qty <= 0) {
          toast.error('Invalid quantity')
          return
        }

        if (!unitPrice || unitPrice <= 0) {
          toast.error('Invalid purchase price')
          return
        }

        if (transaction.paymentType === 'partial') {
          if (transaction.paidAmount > grandTotal) {
            toast.error('Paid amount cannot exceed total')
            return
          }
        }

        const transactionData = {
          id: transaction.id,
          clientId: transaction.clientId,
          productId: transaction.productId,
          date: new Date().toISOString(),

          quantity: qty,
          purchaseAmount: unitPrice,

          paymentMethod: transaction.paymentMethod,
          statusOfTransaction: transaction.statusOfTransaction,
          paymentType: transaction.paymentType,

          paidAmount: Number(transaction.paidAmount || 0),
          pendingAmount: Number(transaction.pendingAmount || 0),
          pendingFromOurs: Number(transaction.pendingAmount || 0),

          taxRate: 0,
          taxAmount: totalTax,
          freightCharges: transaction.frightCharges || 0,
          freightTaxAmount: 0,

          totalAmountWithoutTax: subtotal,
          totalAmountWithTax: grandTotal,

          billNo: transaction.billNo || '',
          dueDate: transaction.dueDate || null,
          description: transaction.description || '',

          methodType: 'Payment',
          pageName: 'Purchase'
        }

        if (!isUpdateExpense) {
          const created = await window.api.createPurchase(transactionData)
          dispatch(setTransactions(created))
          toast.success('Purchase created successfully')
        } else {
          const updated = await window.api.updatePurchase({
            id: transaction.id,
            ...transactionData
          })

          dispatch(updateTransaction(updated.data || updated))
          toast.success('Purchase updated successfully')
        }

        await fetchTransactions()
        setShowModal(false)
      } catch (error) {
        toast.error('Error processing purchase')
      } finally {
        setIsSubmittingTransaction(false)
      }
    },
    [transaction, qty, unitPrice, grandTotal]
  )

  const handleOnChangeEvent = (value, field) => {
    setTransaction((prev) => ({
      ...prev,
      [field]: value
    }))
  }

  const toThousands = (val) => new Intl.NumberFormat('en-IN').format(Number(val || 0))

  const taxOptions = settings.map((s) => ({
    label: `${s.taxName} (${s.taxValue}%)`,
    value: `custom-${s.id}`
  }))

  const formatTransactionId = (id) => (id ? `PB${String(id).slice(-3).toUpperCase()}` : 'PB---')

  /* ---------------- UI ---------------- */

  return (
    <div className="fixed z-50 inset-0 flex items-center justify-center bg-black/50">
      {type === 'transaction' && (
        <form onSubmit={handleSubmitTransaction}>
          <div className="bg-white p-6 rounded-lg shadow-2xl w-full min-w-4xl relative">
            <p className="text-lg font-semibold">
              {isUpdateExpense ? 'Update Purchase' : 'Add Purchase'}
              <span className="ml-3 bg-amber-300 px-3 py-1 rounded-full text-white text-sm">
                {isUpdateExpense
                  ? formatTransactionId(transaction.id)
                  : formatTransactionId(nextBillId)}
              </span>
            </p>

            <CircleX
              className="absolute top-4 right-4 cursor-pointer text-red-500"
              size={26}
              onClick={() => setShowModal(false)}
            />

            <div className="grid grid-cols-2 gap-4 mt-4">
              {/* Client */}
              <SelectPicker
                data={clients.map((c) => ({
                  label: c.clientName,
                  value: c.id
                }))}
                value={transaction.clientId}
                onChange={(v) => handleOnChangeEvent(v, 'clientId')}
                placeholder="Select Client"
                style={{ width: '100%' }}
              />

              {/* Product */}
              <SelectPicker
                data={products.map((p) => ({
                  label: p.productName,
                  value: p.id
                }))}
                value={transaction.productId}
                onChange={(v) => handleOnChangeEvent(v, 'productId')}
                placeholder="Select Product"
                style={{ width: '100%' }}
              />

              <InputNumber
                prefix="₹"
                value={unitPrice}
                onChange={(v) => handleOnChangeEvent(v, 'sellAmount')}
                placeholder="Purchase Price"
                formatter={toThousands}
              />

              <InputNumber
                value={qty}
                onChange={(v) => handleOnChangeEvent(v, 'quantity')}
                placeholder="Quantity"
              />

              <InputNumber prefix="₹" value={grandTotal} disabled formatter={toThousands} />
            </div>

            <div className="flex justify-end mt-6 gap-2">
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="px-6 py-2 bg-gray-500 text-white rounded"
              >
                Cancel
              </button>

              <button
                type="submit"
                disabled={isSubmittingTransaction}
                className="px-6 py-2 bg-indigo-600 text-white rounded"
              >
                {isSubmittingTransaction ? 'Processing...' : isUpdateExpense ? 'Update' : 'Add'}
              </button>
            </div>
          </div>
        </form>
      )}
    </div>
  )
}

export default PurchaseModal
