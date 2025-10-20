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
  updateCashReceipt,
  setSettings
} from '../../app/features/electronSlice'
import { CircleX } from 'lucide-react'
import { useDispatch, useSelector } from 'react-redux'
import { toast } from 'react-toastify'
import { SelectPicker, InputNumber, Toggle, Checkbox, Animation, CheckPicker } from 'rsuite'
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

  const fetchCashReceipt = async () => {
    const response = await window.api.getRecentCashReceipts()
    dispatch(setCashReceipt(response))
  }

  const fetchSettings = async () => {
    const response = await window.api.getSettings()
    dispatch(setSettings(response))
  }

  const products = useSelector((state) => state.electron.products.data || [])
  const clients = useSelector((state) => state.electron.clients.data || [])
  const settings = useSelector((state) => state.electron.settings.data || [])
  const safeTransaction = existingTransaction || {}

  const [productModal, setProductModal] = useState(false)
  const [clientModal, setClientModal] = useState(false)
  const [isSubmittingTransaction, setIsSubmittingTransaction] = useState(false)

  const getInitialTransaction = () => {
    if (isUpdateExpense && existingTransaction) {
      return {
        clientId: existingTransaction.clientId || '',
        productId: existingTransaction.productId || 0,
        quantity: Number(existingTransaction.quantity) || 0,
        sellAmount: Number(existingTransaction.sellAmount) || 0,
        purchaseAmount: Number(existingTransaction.purchaseAmount) || 0,
        statusOfTransaction: existingTransaction.statusOfTransaction || 'pending',
        paymentMethod: existingTransaction.paymentMethod || 'bank',
        paymentType: existingTransaction.paymentType || 'full',
        pendingAmount: Number(existingTransaction.pendingAmount) || 0,
        paidAmount: Number(existingTransaction.paidAmount) || 0,
        transactionType: existingTransaction.transactionType || '',
        taxAmount: existingTransaction.taxAmount || [],
        dueDate: existingTransaction.dueDate || ''
      }
    }
    return {
      clientId: '',
      productId: 0,
      quantity: 0,
      sellAmount: 0,
      purchaseAmount: 0,
      statusOfTransaction: 'pending',
      paymentMethod: 'bank',
      paymentType: 'full',
      pendingAmount: 0,
      paidAmount: 0,
      transactionType: '',
      taxAmount: [],
      dueDate: ''
    }
  }

  const [transaction, setTransaction] = useState(getInitialTransaction())

  useEffect(() => {
    fetchProducts()
    fetchClients()
    fetchBankReceipt()
    fetchTransaction()
    fetchSettings()
  }, [])

  useEffect(() => {
    if (isUpdateExpense && existingTransaction?.id) {
      setTransaction(getInitialTransaction())
    }
  }, [isUpdateExpense, existingTransaction?.id])

  const selectedProduct = products.find((p) => p.id === transaction.productId)

  const purchasePrice = selectedProduct?.price || 0
  const subtotal = purchasePrice * transaction.quantity

  const calculateTaxBreakdown = () => {
    let breakdown = {}
    let totalTax = 0

    if (Array.isArray(transaction.taxAmount)) {
      transaction.taxAmount.forEach((tax) => {
        breakdown[tax.name] = tax.value
        totalTax += tax.value
      })
    }

    return { breakdown, totalTax }
  }

  const { breakdown: taxBreakdown, totalTax } = calculateTaxBreakdown()
  const grandTotal = subtotal + totalTax

  useEffect(() => {
    if (transaction.paymentType === 'full') {
      setTransaction((prev) => ({
        ...prev,
        pendingAmount: 0,
        paidAmount: grandTotal
      }))
    }
    // For partial, keep user-input paid fixed, adjust pending
    else if (transaction.paymentType === 'partial') {
      setTransaction((prev) => ({
        ...prev,
        pendingAmount: Math.max(0, grandTotal - prev.paidAmount)
      }))
    }
  }, [subtotal, totalTax, transaction.paymentType])

  const getProductName = (productId) => {
    const product = products.find((p) => p.id === productId)
    return product ? product.name : 'Unknown Product'
  }

  const totalAmount = products.filter((p) => p.id === transaction.productId).map((p) => p.price)

  const totalPurchaseAmount = totalAmount.toString()

  const handleSubmitTransaction = useCallback(
    async (e) => {
      e.preventDefault()

      if (isSubmittingTransaction) return
      setIsSubmittingTransaction(true)

      try {
        // Validation
        if (!transaction.clientId || !transaction.productId) {
          toast.error('Please select client and product')
          return
        } else if (!transaction.quantity || transaction.quantity <= 0) {
          toast.error('Please enter a valid quantity')
          return
        } else if (transaction.paymentType === 'full') {
          transaction.pendingAmount = 0
          transaction.paidAmount = grandTotal
        } else if (
          transaction.statusOfTransaction === 'pending' &&
          transaction.paymentType !== 'partial'
        ) {
          transaction.pendingAmount = transaction.purchaseAmount
          transaction.paidAmount = 0
        } else if (transaction.statusOfTransaction === 'completed') {
          transaction.paymentType = 'full'
          transaction.paidAmount = grandTotal
        } else if (transaction.paymentType === 'partial') {
          if (grandTotal > transaction.pendingAmount + transaction.paidAmount) {
            toast.error('Partial amount should be less than total amount')
            return
          }
        }

        const transactionData = {
          clientId: transaction.clientId,
          productId: transaction.productId,
          quantity: Number(transaction.quantity),
          sellAmount: Number(transaction.sellAmount),
          purchaseAmount: Number(grandTotal),
          statusOfTransaction: transaction.statusOfTransaction || 'pending',
          paymentMethod: transaction.paymentMethod || 'bank',
          paymentType: transaction.paymentType || 'full',
          pendingAmount: Number(transaction.pendingAmount) || 0,
          paidAmount: Number(transaction.paidAmount) || 0,
          transactionType: location.pathname === '/sales' ? 'sales' : 'purchase',
          taxAmount: transaction?.taxAmount || [],
          dueDate: new Date()?.setMonth(new Date().getMonth() + 1)
        }

        if (!isUpdateExpense) {
          const createdTransaction = await window.api.createTransaction(transactionData)
          dispatch(setTransactions(createdTransaction))
          toast.success('Transaction added successfully')

          const baseReceipt = {
            transactionId: createdTransaction.id,
            type: 'Payment',
            date: new Date().toISOString().slice(0, 19).replace('T', ' '),
            statusOfTransaction: createdTransaction.statusOfTransaction,
            party:
              clients.find((c) => c.id === transaction.clientId)?.clientName || 'Unknown Client',
            amount: grandTotal,
            description: `Purchase ${getProductName(transaction.productId)}`,
            taxAmount: transaction.taxAmount || [],
            dueDate: new Date().setMonth(new Date().getMonth() + 1)
          }

          if (transaction.paymentMethod === 'bank') {
            const createdBankReceipt = await window.api.createBankReceipt({
              ...baseReceipt,
              bank: transaction.bank || 'IDBI'
            })
            dispatch(setBankReceipt(createdBankReceipt))
          } else if (transaction.paymentMethod === 'cash') {
            const createdCashReceipt = await window.api.createCashReceipt({
              ...baseReceipt,
              cash: transaction.cash || 'Cash'
            })
            dispatch(setCashReceipt(createdCashReceipt))
          }
        } else {
          const updatedTransaction = await window.api.updateTransaction({
            id: safeTransaction.id,
            ...transactionData
          })
          dispatch(updateTransaction(updatedTransaction))
          toast.success('Transaction updated successfully')

          const baseReceipt = {
            transactionId: updatedTransaction.data.id,
            type: 'Payment',
            date: new Date().toISOString().slice(0, 19).replace('T', ' '),
            statusOfTransaction: updatedTransaction.data.statusOfTransaction,
            party:
              clients.find((c) => c.id === transaction.clientId)?.clientName || 'Unknown Client',
            amount: grandTotal,
            description: `Purchase ${getProductName(transaction.productId)}`,
            taxAmount: transaction.taxAmount || [],
            dueDate: new Date().setMonth(new Date().getMonth() + 1)
          }

          if (transaction.paymentMethod === 'bank') {
            if (transaction.paymentType === 'partial') {
              const updatedBankReceipt = await window.api.updateBankReceipt({
                ...baseReceipt,
                amount: transaction.paidAmount,
                bank: transaction.bank || 'IDBI',
                statusOfTransaction: 'completed',
                description: `Partial Payment ${getProductName(transaction.productId)}`
              })
              if (transaction.pendingAmount > 0) {
                const createdBankReceipt = await window.api.createBankReceipt({
                  ...baseReceipt,
                  amount: transaction.pendingAmount,
                  bank: transaction.bank || 'IDBI'
                })
                dispatch(setBankReceipt(createdBankReceipt))
              }
              dispatch(updateBankReceipt(updatedBankReceipt))
            } else if (transaction.paymentType === 'full') {
              const updatedBankReceipt = await window.api.updateBankReceipt({
                ...baseReceipt,
                amount: grandTotal,
                bank: transaction.bank || 'IDBI'
              })
              dispatch(updateBankReceipt(updatedBankReceipt))
            } else {
              const updatedBankReceipt = await window.api.updateBankReceipt({
                ...baseReceipt,
                amount: grandTotal,
                bank: transaction.bank || 'IDBI'
              })
              dispatch(updateBankReceipt(updatedBankReceipt))
            }
          } else if (transaction.paymentMethod === 'cash') {
            if (transaction.paymentType === 'partial') {
              const updatedCashReceipt = await window.api.updateCashReceipt({
                ...baseReceipt,
                amount: transaction.paidAmount,
                cash: transaction.cash || 'Cash',
                statusOfTransaction: 'completed'
              })
              if (transaction.pendingAmount > 0) {
                const createdCashReceipt = await window.api.createCashReceipt({
                  ...baseReceipt,
                  amount: transaction.pendingAmount,
                  cash: transaction.cash || 'Cash'
                })
                dispatch(setCashReceipt(createdCashReceipt))
              }
              dispatch(updateCashReceipt(updatedCashReceipt))
            } else {
              const updatedCashReceipt = await window.api.updateCashReceipt({
                ...baseReceipt,
                amount: grandTotal,
                cash: transaction.cash || 'Cash'
              })
              dispatch(updateCashReceipt(updatedCashReceipt))
            }
          }
        }
        await fetchTransaction() // Refresh data
        setShowModal(false)
      } catch (error) {
        console.log(error)
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
        const newSubtotal = purchasePrice * value
        const updatedTaxForQuantity = transaction.taxAmount.map((tax) => {
          settings.map((setting) => {})
        })
        setTransaction((prev) => ({ ...prev, quantity: value, taxAmount: updatedTaxForQuantity }))
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
          quantity: 0,
          taxAmount: []
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

      case 'taxAmount':
        const selectedTaxCodes = value || []
        let taxObjects = []

        taxObjects = selectedTaxCodes
          .map((taxCode) => {
            // Check if it's a custom tax from settings
            const customTax = settings.find((s) => `custom-${s.id}` === taxCode)

            if (customTax) {
              return {
                code: `custom-${customTax.id}`,
                name: customTax.taxName,
                value: (subtotal * customTax.taxValue) / 100,
                percentage: customTax.taxValue
              }
            }

            if (taxCode === 'frightChanged') {
              return {
                code: 'frightChanged',
                name: 'Freight Charges',
                value: Number(transaction.frightCharges),
                percentage: 0
              }
            }
          })
          .filter(Boolean)

        setTransaction((prev) => ({ ...prev, taxAmount: taxObjects }))
        break

      case 'pendingAmount':
        setTransaction((prev) => ({
          ...prev,
          pendingAmount: Number(value)
        }))
        break

      case 'paidAmount':
        const currentGrandForPaid = subtotal + totalTax
        setTransaction((prev) => ({
          ...prev,
          paidAmount: Number(value || 0),
          pendingAmount: Math.max(0, currentGrandForPaid - Number(value || 0))
        }))
        break

      case 'frightCharges':
        setTransaction((prev) => ({
          ...prev,
          taxAmount: prev.taxAmount.map((t) =>
            t.code === 'frightChanged' ? { ...t, value: Number(value || 0) } : t
          )
        }))
        break

      default:
        toast.error('Invalid Field Name')
        break
    }
  }

  const handleFrightChange = (value) => {
    handleOnChangeEvent(value, 'frightCharges')
  }

  const toThousands = (value) => {
    if (!value) return value
    return new Intl.NumberFormat('en-IN').format(value)
  }

  // Prepare tax options from settings
  const taxOptions = [
    ...settings.map((setting) => ({
      label: `${setting.taxName} (${setting.taxValue}%)`,
      value: `custom-${setting.id}`
    })),
    { label: 'Freight Charges', value: 'frightChanged' }
  ]

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
          <div className="bg-white p-6 rounded-lg shadow-2xl w-full min-w-4xl relative">
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
                  virtualized={true}
                  onChange={(value) => handleOnChangeEvent(value, 'clientId')}
                  placeholder="Select Client"
                  style={{ width: '100%', zIndex: clientModal ? 1 : 999 }}
                  menuStyle={{ zIndex: clientModal ? 1 : 999 }}
                  menuMaxHeight={250}
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
                  onChange={(value) => {
                    handleOnChangeEvent(value, 'productId')
                  }}
                  placeholder="Select Products"
                  style={{
                    width: '100%',
                    zIndex: productModal ? 1 : 999
                  }}
                  menuStyle={{ zIndex: productModal ? 1 : 999 }}
                  menuMaxHeight={250}
                  virtualized={true}
                  renderMenuItem={(label, item) => (
                    <div className="flex justify-between w-full items-center">
                      <span
                        className="truncate"
                        style={{
                          maxWidth: '500px',
                          display: 'inline-block',
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis'
                        }}
                      >
                        {label}
                      </span>
                      <span
                        className={`text-gray-500 text-xs font-thin tracking-wider ${
                          item.qty > 0 ? 'text-green-400' : 'text-red-400'
                        }`}
                      >
                        Qty: {item.qty}
                      </span>
                    </div>
                  )}
                  renderValue={(value, item) => (
                    <span
                      style={{
                        maxWidth: '250px',
                        display: 'inline-block',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis'
                      }}
                    >
                      {item?.label}
                    </span>
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

              <div className="mb-4">
                <label htmlFor="tax" className="block text-sm mb-1 text-gray-600">
                  Tax
                </label>
                <CheckPicker
                  data={taxOptions}
                  searchable={taxOptions.length > 6}
                  size="md"
                  placeholder="Select Tax"
                  value={transaction.taxAmount.map((t) => t.code)}
                  onChange={(value) => handleOnChangeEvent(value, 'taxAmount')}
                  style={{ width: '100%', zIndex: clientModal ? 1 : 999 }}
                  menuStyle={{ zIndex: clientModal ? 1 : 999 }}
                />
              </div>

              <div>
                <label htmlFor="total" className="block text-sm mb-1 text-gray-600">
                  Total
                </label>
                <InputNumber
                  prefix={<div className="">₹</div>}
                  defaultValue={0}
                  disabled
                  size="xs"
                  value={grandTotal}
                  formatter={toThousands}
                  name="total"
                  id="total"
                  className="w-full border border-gray-300 rounded px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-400"
                />
              </div>

              <Animation.Collapse
                in={transaction.taxAmount.find((t) => t.code === 'frightChanged')}
              >
                <div className="col-span-2">
                  <label htmlFor="frightCharges" className="block text-sm mb-1 text-gray-600">
                    Freight Charges
                  </label>
                  <InputNumber
                    prefix={<div className="">₹</div>}
                    defaultValue={0}
                    size="xs"
                    value={transaction.frightCharges}
                    onChange={(value) => handleFrightChange(value)}
                    formatter={toThousands}
                    min={0}
                    name="frightCharges"
                    id="frightCharges"
                    className="w-full border border-gray-300 rounded px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-400"
                  />
                </div>
              </Animation.Collapse>

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
                  Cash Payment
                </Checkbox>
              </div>

              <Animation.Collapse in={transaction.paymentType === 'partial'}>
                <div className="col-span-2">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-gray-200 rounded-lg border border-gray-200">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Paid Amount
                      </label>
                      <InputNumber
                        prefix="₹"
                        value={transaction.paidAmount}
                        onChange={(val) => handleOnChangeEvent(val ?? 0, 'paidAmount')}
                        formatter={toThousands}
                        size="md"
                        className="w-full"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Pending Amount
                      </label>
                      <InputNumber
                        prefix="₹"
                        value={transaction.pendingAmount}
                        formatter={toThousands}
                        disabled
                        size="md"
                        className="w-full bg-gray-100"
                      />
                    </div>
                  </div>
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
