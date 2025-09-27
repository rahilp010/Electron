/* eslint-disable prettier/prettier */
/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable no-case-declarations */
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
  updateCashReceipt
} from '../../app/features/electronSlice'
import { CircleX } from 'lucide-react'
import { useDispatch, useSelector } from 'react-redux'
import { toast } from 'react-toastify'
import { SelectPicker, InputNumber, Toggle, Checkbox, Animation } from 'rsuite'
import ClientModal from './ClientModal'
import ProductModal from './ProductModal'
import { useLocation } from 'react-router-dom'

const PurchaseModal = ({
  setShowModal,
  existingTransaction = null,
  isUpdateExpense = false,
  type = 'transaction'
}) => {
  const dispatch = useDispatch()
  const location = useLocation()

  const fetchProducts = async () => {
    const response = await window.api.getAllProducts()
    dispatch(setProducts(response))
  }

  const fetchClients = async () => {
    const response = await window.api.getAllClients()
    dispatch(setClients(response))
  }

  const fetchTransaction = async () => {
    const response = await window.api.getAllTransactions()
    dispatch(setTransactions(response))
  }

  const fetchBankReceipt = async () => {
    const response = await window.api.getRecentBankReceipts()
    dispatch(setBankReceipt(response))
  }

  const products = useSelector((state) => state.electron.products.data || [])
  const clients = useSelector((state) => state.electron.clients.data || [])
  const safeTransaction = existingTransaction || {}

  const [productModal, setProductModal] = useState(false)
  const [clientModal, setClientModal] = useState(false)
  const [isSubmittingTransaction, setIsSubmittingTransaction] = useState(false)

  const getInitialTransaction = () => {
    if (isUpdateExpense && existingTransaction) {
      return {
        clientId: existingTransaction.clientId || '',
        productId: existingTransaction.productId || '',
        quantity: Number(existingTransaction.quantity) || 0,
        sellAmount: Number(existingTransaction.sellAmount) || 0,
        statusOfTransaction: existingTransaction.statusOfTransaction || 'pending',
        paymentMethod: existingTransaction.paymentMethod || 'bank',
        paymentType: existingTransaction.paymentType || 'full',
        pendingAmount: Number(existingTransaction.pendingAmount) || 0,
        paidAmount: Number(existingTransaction.paidAmount) || 0,
        transactionType: existingTransaction.transactionType || ''
      }
    }
    return {
      clientId: '',
      productId: '',
      quantity: 0,
      sellAmount: 0,
      statusOfTransaction: 'pending',
      paymentMethod: 'bank',
      paymentType: 'full',
      pendingAmount: 0,
      paidAmount: 0,
      transactionType: ''
    }
  }

  const [transaction, setTransaction] = useState(getInitialTransaction())

  useEffect(() => {
    fetchProducts()
    fetchClients()
    fetchBankReceipt()
    fetchTransaction()
  }, [])

  useEffect(() => {
    if (isUpdateExpense && existingTransaction?.id) {
      console.log('Initializing transaction for update:', existingTransaction)
      setTransaction({
        clientId: existingTransaction.clientId || '',
        productId: existingTransaction.productId || '',
        quantity: existingTransaction.quantity || 0,
        sellAmount: Number(existingTransaction.sellAmount) || 0,
        statusOfTransaction: existingTransaction.statusOfTransaction || 'pending',
        paymentMethod: existingTransaction.paymentMethod || 'bank',
        paymentType: existingTransaction.paymentType || 'full',
        pendingAmount: Number(existingTransaction.pendingAmount) || 0,
        paidAmount: Number(existingTransaction.paidAmount) || 0,
        transactionType: existingTransaction.transactionType || ''
      })
    }
  }, [isUpdateExpense, existingTransaction?.id])

  const totalAmount = products.filter((p) => p.id === transaction.productId).map((p) => p.price)

  const totalPurchaseAmount = totalAmount.toString()

  const selectedProduct = products.find((p) => p.id === transaction.productId)

  const bankReceipt = useSelector((state) => state.electron.bankReceipt.data || [])

  console.log('bankReceipt', bankReceipt)

  const getProductName = (productId) => {
    const product = products.find((p) => p.id === productId)
    return product ? product.name : 'Unknown Product'
  }

  const handleSubmitTransaction = useCallback(
    async (e) => {
      e.preventDefault()

      if (isSubmittingTransaction) return
      setIsSubmittingTransaction(true)

      try {
        // Validation
        if (!transaction.clientId || !transaction.productId) {
          toast.error('Please enter details')
          return
        } else if (!transaction.quantity || transaction.quantity <= 0) {
          toast.error('Please enter a valid quantity')
          return
        } else if (transaction.paymentType === 'full') {
          transaction.pendingAmount = 0
          transaction.paidAmount = 0
        } else if (
          transaction.statusOfTransaction === 'pending' &&
          transaction.paymentType !== 'partial'
        ) {
          transaction.pendingAmount = Number(totalPurchaseAmount) * transaction.quantity
          transaction.paidAmount = 0
        } else if (transaction.statusOfTransaction === 'completed') {
          transaction.pendingAmount = 0
          transaction.paidAmount = Number(totalPurchaseAmount) * transaction.quantity
        } else if (transaction.paymentType === 'partial') {
          if (Number(totalPurchaseAmount) >= transaction.pendingAmount + transaction.paidAmount) {
            toast.error('Partial amount should be less than total amount')
            return
          }
        }

        const transactionData = {
          clientId: transaction.clientId,
          productId: transaction.productId,
          quantity: Number(transaction.quantity),
          sellAmount: Number(transaction.sellAmount),
          statusOfTransaction: transaction.statusOfTransaction || 'pending',
          paymentMethod: transaction.paymentMethod || 'bank',
          paymentType: transaction.paymentType || 'full',
          pendingAmount: Number(transaction.pendingAmount) || 0,
          paidAmount: Number(transaction.paidAmount) || 0,
          transactionType: location.pathname === '/sales' ? 'sales' : 'purchase'
        }

        if (!isUpdateExpense) {
          const createdTransaction = await window.api.createTransaction(transactionData)
          dispatch(setTransactions(createdTransaction))
          toast.success('Transaction added successfully')

          if (location.pathname === '/purchase') {
            if (transaction.paymentMethod === 'bank') {
              const bankReceiptData = {
                transactionId: createdTransaction.id, // ✅ Correct transaction ID
                type: 'Payment',
                bank: transaction.bank || 'IDBI',
                date: new Date().toISOString().slice(0, 19).replace('T', ' '),
                statusOfTransaction: transaction.statusOfTransaction || 'pending',
                party:
                  clients.find((c) => c.id === transaction.clientId)?.clientName ||
                  'Unknown Client',
                amount: selectedProduct?.price * transaction.quantity || 0,
                description: `Purchase ${getProductName(transaction.productId)}`
              }

              const createdBankReceipt = await window.api.createBankReceipt(bankReceiptData || {})
              dispatch(setBankReceipt(createdBankReceipt))
            } else if (transaction.paymentMethod === 'cash') {
              const cashReceiptData = {
                transactionId: createdTransaction.id, // ✅ Correct transaction ID
                type: 'Payment',
                cash: transaction.cash || 'Cash',
                date: new Date().toISOString().slice(0, 19).replace('T', ' '),
                statusOfTransaction: transaction.statusOfTransaction || 'pending',
                party:
                  clients.find((c) => c.id === transaction.clientId)?.clientName ||
                  'Unknown Client',
                amount: selectedProduct?.price * transaction.quantity || 0,
                description: `Purchase ${getProductName(transaction.productId)}`
              }

              const createdCashReceipt = await window.api.createCashReceipt(cashReceiptData || {})
              dispatch(setCashReceipt(createdCashReceipt))
            }
          }
        } else {
          const updatedTransaction = await window.api.updateTransaction({
            id: safeTransaction.id,
            ...transactionData
          })
          dispatch(updateTransaction(updatedTransaction))
          toast.success('Transaction updated successfully')

          if (location.pathname === '/purchase') {
            // Build bankReceiptData for update
            if (transaction.paymentMethod === 'bank') {
              const bankReceiptData = {
                transactionId: updatedTransaction.data.id,
                type: 'Payment',
                bank: transaction.bank || 'IDBI',
                date: new Date().toISOString().slice(0, 19).replace('T', ' '),
                statusOfTransaction: transaction.statusOfTransaction || 'pending',
                party:
                  clients.find((c) => c.id === transaction.clientId)?.clientName ||
                  'Unknown Client',
                amount: updatedTransaction.data.pendingAmount || 0,
                description: `Purchase ${getProductName(transaction.productId)}`
              }
              const updatedBankReceipt = await window.api.updateBankReceipt(bankReceiptData)
              dispatch(updateBankReceipt(updatedBankReceipt))
            } else if (transaction.paymentMethod === 'cash') {
              const cashReceiptData = {
                transactionId: updatedTransaction.data.id,
                type: 'Payment',
                cash: transaction.cash || 'Cash',
                date: new Date().toISOString().slice(0, 19).replace('T', ' '),
                party:
                  clients.find((c) => c.id === transaction.clientId)?.clientName ||
                  'Unknown Client',
                amount: updatedTransaction.data.pendingAmount || 0,
                description: `Purchase ${getProductName(transaction.productId)}`
              }
              const updatedCashReceipt = await window.api.updateCashReceipt(cashReceiptData)
              dispatch(updateCashReceipt(updatedCashReceipt))
            }
          }
        }
        await fetchTransaction() // Refresh data
        setShowModal(false)
      } catch (error) {
        toast.error('An error occurred while processing your request', error)
      } finally {
        setIsSubmittingTransaction(false)
      }
    },
    [dispatch, isUpdateExpense, safeTransaction, transaction, setShowModal]
  )

  const handleOnChangeEvent = (value, fieldName) => {
    switch (fieldName) {
      case 'quantity':
        setTransaction((prev) => ({ ...prev, quantity: value }))
        break

      case 'sellingPrice':
        setTransaction((prev) => ({ ...prev, sellAmount: Number(value) }))
        break

      case 'clientId':
        setTransaction((prev) => ({ ...prev, clientId: value }))
        break

      case 'productId':
        setTransaction((prev) => ({
          ...prev,
          productId: value,
          // Reset quantity when product changes to avoid stock issues
          quantity: 0
        }))
        break

      case 'statusOfTransaction':
        setTransaction((prev) => ({ ...prev, statusOfTransaction: value }))
        break

      case 'paymentType':
        setTransaction((prev) => ({ ...prev, paymentType: value }))
        break

      case 'paymentMethod':
        setTransaction((prev) => ({ ...prev, paymentMethod: value }))
        break

      case 'pendingAmount':
        setTransaction((prev) => ({
          ...prev,
          pendingAmount: Number(value)
        }))
        break

      case 'paidAmount':
        setTransaction((prev) => ({ ...prev, paidAmount: Number(value) }))
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
      {productModal && (
        <ProductModal
          isUpdateExpense={isUpdateExpense}
          setShowModal={() => setProductModal(false)}
          type="product"
        />
      )}
      {clientModal && (
        <ClientModal
          isUpdateExpense={isUpdateExpense}
          setShowModal={() => setClientModal(false)}
          type="client"
        />
      )}
      {type === 'transaction' ? (
        <form onSubmit={handleSubmitTransaction}>
          <div className="bg-white p-6 rounded-lg shadow-2xl w-full max-w-xl relative">
            <p className="text-lg font-semibold mb-4">
              {isUpdateExpense ? 'Update Purchase' : 'Add Purchase'}
            </p>
            <CircleX
              className="absolute top-4 right-4 cursor-pointer text-red-400 hover:text-red-600"
              size={30}
              onClick={() => setShowModal(false)}
            />

            <div className="grid grid-cols-2 gap-4 my-2">
              <div>
                <label htmlFor="client" className="block text-sm mb-1 text-gray-600">
                  Client
                </label>
                <SelectPicker
                  data={clients.map((client) => ({
                    label: client.clientName,
                    value: client.id
                  }))}
                  value={transaction.clientId}
                  onChange={(value) => handleOnChangeEvent(value, 'clientId')}
                  placeholder="Select Client"
                  style={{ width: 300, zIndex: clientModal ? 1 : 999 }}
                  menuStyle={{ zIndex: clientModal ? 1 : 999 }}
                  menuMaxHeight={200}
                  renderExtraFooter={() => (
                    <div className="px-3 py-1 border-t border-gray-200">
                      <p
                        className="text-blue-600 text-sm tracking-wider cursor-pointer font-bold"
                        onClick={() => setClientModal(true)}
                      >
                        + Create Client
                      </p>
                    </div>
                  )}
                />
              </div>

              <div>
                <label htmlFor="product" className="block text-sm mb-1 text-gray-600">
                  Products
                </label>
                <SelectPicker
                  data={products.map((product) => ({
                    label: `${product.name}`,
                    value: product.id,
                    qty: product.quantity
                  }))}
                  value={transaction.productId}
                  onChange={(value) => handleOnChangeEvent(value, 'productId')}
                  placeholder="Select Products"
                  style={{
                    width: 300,
                    zIndex: productModal ? 1 : 999
                  }}
                  menuStyle={{ zIndex: productModal ? 1 : 999 }}
                  menuMaxHeight={200}
                  renderMenuItem={(label, item) => (
                    <div className="flex justify-between w-full">
                      <span>{label}</span>
                      <span
                        className={`text-gray-500 text-xs font-thin tracking-wider ${
                          item.qty > 0 ? 'text-green-400' : 'text-red-400'
                        }`}
                      >
                        Qty: {item.qty}
                      </span>
                    </div>
                  )}
                  renderExtraFooter={() => (
                    <div className="px-3 py-1 border-t border-gray-200">
                      <p
                        className="text-blue-600 text-sm tracking-wider cursor-pointer font-bold"
                        onClick={() => setProductModal(true)}
                      >
                        + Create Product
                      </p>
                    </div>
                  )}
                />
              </div>

              <div>
                <label htmlFor="productPrice" className="block text-sm mb-1 text-gray-600">
                  Product Price
                </label>
                <InputNumber
                  prefix="₹"
                  defaultValue={0}
                  size="xs"
                  formatter={toThousands}
                  disabled
                  value={selectedProduct?.price || 0}
                  className="w-full border border-gray-300 rounded px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-400"
                />
              </div>

              <div>
                <label htmlFor="quantity" className="block text-sm mb-1 text-gray-600">
                  Quantity
                </label>
                <InputNumber
                  defaultValue={0}
                  size="xs"
                  formatter={toThousands}
                  value={Number(transaction.quantity)}
                  onChange={(value) => handleOnChangeEvent(value, 'quantity')}
                  className="w-full border border-gray-300 rounded px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-400"
                />
              </div>

              {location.pathname === '/sales' && (
                <div>
                  <label htmlFor="sellingPrice" className="block text-sm mb-1 text-gray-600">
                    Selling Price
                  </label>
                  <InputNumber
                    prefix={<div className="">₹</div>}
                    defaultValue={0}
                    size="xs"
                    value={transaction.sellAmount}
                    onChange={(value) => handleOnChangeEvent(value, 'sellingPrice')}
                    formatter={toThousands}
                    min={0}
                    name="sellingPrice"
                    id="sellingPrice"
                    className="w-full border border-gray-300 rounded px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-400"
                  />
                </div>
              )}

              <div>
                <label htmlFor="total" className="block text-sm mb-1 text-gray-600">
                  Total
                </label>
                <InputNumber
                  prefix={<div className="">₹</div>}
                  defaultValue={0}
                  disabled
                  size="xs"
                  value={
                    location.pathname === '/purchase'
                      ? selectedProduct?.price * transaction.quantity || 0
                      : transaction.sellAmount * transaction.quantity || 0
                  }
                  formatter={toThousands}
                  name="total"
                  id="total"
                  className="w-full border border-gray-300 rounded px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-400"
                />
              </div>

              {location.pathname === '/purchase' && <div></div>}

              <div className="text-xs grid-cols-2 grid items-center ">
                <div>
                  <label className="block text-sm mb-1 text-gray-600">Status</label>
                  <Toggle
                    size="lg"
                    checkedChildren="Completed"
                    unCheckedChildren="Pending"
                    checked={transaction.statusOfTransaction === 'completed'}
                    onChange={(checked) =>
                      handleOnChangeEvent(checked ? 'completed' : 'pending', 'statusOfTransaction')
                    }
                  />
                </div>
                <Checkbox
                  value="partial"
                  checked={transaction.paymentType === 'partial'}
                  onChange={(_, checked) =>
                    handleOnChangeEvent(checked ? 'partial' : 'full', 'paymentType')
                  }
                  className="text-sm text-gray-600 -ml-5 mt-5"
                >
                  Partial Payment
                </Checkbox>
              </div>

              <div>
                <Checkbox
                  value="cash"
                  checked={transaction.paymentMethod === 'cash'}
                  onChange={(_, checked) =>
                    handleOnChangeEvent(checked ? 'cash' : 'bank', 'paymentMethod')
                  }
                  className="text-sm text-gray-600 -ml-5 mt-5"
                >
                  Cash
                </Checkbox>
              </div>

              <Animation.Collapse in={transaction.paymentType === 'partial'}>
                <div>
                  <label htmlFor="pending" className="block text-sm mb-1 text-gray-600">
                    Pending
                  </label>
                  <InputNumber
                    prefix={<div className="">₹</div>}
                    value={transaction.pendingAmount}
                    size="xs"
                    formatter={toThousands}
                    onChange={(val) => handleOnChangeEvent(val ?? 0, 'pendingAmount')}
                    onBlur={(e) =>
                      handleOnChangeEvent(Number(e.target.value) || 0, 'pendingAmount')
                    }
                    id="pendingAmount"
                    className="w-full border border-gray-300 rounded px-2 py-1.5 
                                               focus:outline-none focus:ring-2 focus:ring-blue-400 h-9"
                  />
                </div>
              </Animation.Collapse>
              <Animation.Collapse in={transaction.paymentType === 'partial'}>
                <div>
                  <label htmlFor="paid" className="block text-sm mb-1 text-gray-600">
                    Paid
                  </label>
                  <InputNumber
                    prefix={<div className="">₹</div>}
                    value={
                      Number(totalPurchaseAmount) * transaction.quantity - transaction.pendingAmount
                    }
                    size="xs"
                    formatter={toThousands}
                    onChange={(val) => handleOnChangeEvent(val ?? 0, 'paidAmount')}
                    onBlur={(e) => handleOnChangeEvent(Number(e.target.value) || 0, 'paidAmount')}
                    id="paidAmount"
                    className="w-full border border-gray-300 rounded px-2 py-1.5 
                                               focus:outline-none focus:ring-2 focus:ring-blue-400 h-9"
                  />
                </div>
              </Animation.Collapse>
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
                disabled={isSubmittingTransaction}
                className="px-7 py-2 bg-[#566dff] hover:bg-[#566dff]/60 text-white rounded-lg transition-all duration-300 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmittingTransaction ? 'Processing...' : isUpdateExpense ? 'Update' : 'Add'}
              </button>
            </div>
          </div>
        </form>
      ) : null}
    </div>
  )
}

export default PurchaseModal
