/* eslint-disable no-case-declarations */
/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable prettier/prettier */
import { useCallback, useEffect, useState } from 'react'
import Navbar from './Navbar'
import { useSelector } from 'react-redux'
import { Animation, Checkbox, CheckPicker, InputNumber, SelectPicker } from 'rsuite'
import { toast } from 'react-toastify'
import {
  setBankReceipt,
  setCashReceipt,
  setClients,
  setProducts,
  setTransactions
} from '../../app/features/electronSlice'
import { useDispatch } from 'react-redux'
import { useLocation } from 'react-router-dom'

const PurchaseBill = () => {
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

  const [productModal, setProductModal] = useState(false)
  const [clientModal, setClientModal] = useState(false)
  const [isSubmittingTransaction, setIsSubmittingTransaction] = useState(false)

  const getInitialTransaction = () => {
    return {
      clientId: '',
      productId: '',
      quantity: 0,
      sellAmount: 0,
      purchaseAmount: 0,
      statusOfTransaction: 'pending',
      paymentMethod: 'bank',
      paymentType: 'full',
      pendingAmount: 0,
      paidAmount: 0,
      transactionType: '',
      taxAmount: []
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
    setTransaction(getInitialTransaction())
  }, [])

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

  // Update paid/pending when subtotal or taxes change
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
          transaction.paidAmount = 0
        } else if (
          transaction.statusOfTransaction === 'pending' &&
          transaction.paymentType !== 'partial'
        ) {
          transaction.pendingAmount = transaction.purchaseAmount * transaction.quantity
          transaction.paidAmount = 0
        } else if (transaction.statusOfTransaction === 'completed') {
          transaction.pendingAmount = 0
          transaction.paidAmount = transaction.purchaseAmount * transaction.quantity
        } else if (transaction.paymentType === 'partial') {
          if (
            transaction.purchaseAmount * transaction.quantity >=
            transaction.pendingAmount + transaction.paidAmount
          ) {
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
          taxAmount: transaction.taxAmount || []
        }

        const createdTransaction = await window.api.createTransaction(transactionData)
        console.log('createdTransaction', createdTransaction)
        dispatch(setTransactions(createdTransaction))
        toast.success('Transaction added successfully')

        const baseReceipt = {
          transactionId: createdTransaction.id,
          type: 'Payment',
          date: new Date().toISOString().slice(0, 19).replace('T', ' '),
          statusOfTransaction: createdTransaction.statusOfTransaction,
          party: clients.find((c) => c.id === transaction.clientId)?.clientName || 'Unknown Client',
          amount: grandTotal,
          description: `Purchase ${getProductName(transaction.productId)}`,
          taxAmount: transaction.taxAmount || []
        }

        if (transaction.statusOfTransaction === 'completed') {
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
        } else if (transaction.statusOfTransaction === 'partial') {
          if (transaction.paidAmount > 0) {
            if (transaction.paymentMethod === 'bank') {
              const createdBankReceipt = await window.api.createBankReceipt({
                ...baseReceipt,
                amount: transaction.paidAmount,
                bank: transaction.bank || 'IDBI'
              })
              dispatch(setBankReceipt(createdBankReceipt))
            } else if (transaction.paymentMethod === 'cash') {
              const createdCashReceipt = await window.api.createCashReceipt({
                ...baseReceipt,
                amount: transaction.paidAmount,
                cash: transaction.cash || 'Cash'
              })
              dispatch(setCashReceipt(createdCashReceipt))
            }
          }
        }

        await fetchTransaction() // Refresh data
        setTransaction(getInitialTransaction())
      } catch (error) {
        toast.error('An error occurred while processing your request', error)
      } finally {
        setIsSubmittingTransaction(false)
      }
    },
    [dispatch, transaction]
  )

  const handleOnChangeEvent = (value, fieldName) => {
    switch (fieldName) {
      case 'quantity':
        const newSubtotal = purchasePrice * value
        const updatedTaxForQuantity = transaction.taxAmount.map((tax) => {
          switch (tax.code) {
            case 'i-18':
              return { ...tax, value: newSubtotal * 0.18 }
            case 'i-28':
              return { ...tax, value: newSubtotal * 0.28 }
            case 's-9':
              return { ...tax, value: newSubtotal * 0.09 }
            case 'c-9':
              return { ...tax, value: newSubtotal * 0.09 }
            default:
              return tax
          }
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

      case 'paidAmount':
        const currentGrandForPaid = subtotal + totalTax
        setTransaction((prev) => ({
          ...prev,
          paidAmount: Number(value || 0),
          pendingAmount: Math.max(0, currentGrandForPaid - Number(value || 0))
        }))
        break

      case 'taxAmount':
        const selectedValues = value || []
        let taxObjects = []
        let preservedFrightValue = 0

        // Preserve fright value if still selected
        if (selectedValues.includes('frightChanged')) {
          const existingFright = transaction.taxAmount.find((t) => t.code === 'frightChanged')
          preservedFrightValue = existingFright?.value || 0
        }

        taxObjects = selectedValues
          .map((val) => {
            switch (val) {
              case 'i-18':
                return { code: 'i-18', name: 'IGST 18%', value: subtotal * 0.18 }
              case 'i-28':
                return { code: 'i-28', name: 'IGST 28%', value: subtotal * 0.28 }
              case 's-9':
                return { code: 's-9', name: 'SGST 9%', value: subtotal * 0.09 }
              case 'c-9':
                return { code: 'c-9', name: 'CGST 9%', value: subtotal * 0.09 }
              case 'frightChanged':
                return {
                  code: 'frightChanged',
                  name: 'Freight Charges',
                  value: preservedFrightValue
                }
              default:
                return null
            }
          })
          .filter(Boolean)

        setTransaction((prev) => ({ ...prev, taxAmount: taxObjects }))
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

  const toThousands = (value) => {
    if (!value) return value
    return new Intl.NumberFormat('en-IN').format(value)
  }

  const handleFrightChange = (value) => {
    handleOnChangeEvent(value, 'frightCharges')
  }

  return (
    <div className="select-none flex flex-col h-screen overflow-hidden bg-gray-50 min-w-0">
      <div className="w-full sticky top-0 z-10 bg-white">
        <Navbar />
      </div>
      <div className="flex justify-between mt-5 pb-2 items-center mx-4 lg:mx-7">
        <p className="text-3xl font-light text-gray-900">Purchase Bill</p>
      </div>

      <div className="flex-1 overflow-auto px-4 lg:px-7 py-4">
        <form onSubmit={handleSubmitTransaction} className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Side - Form */}
            <div className="lg:col-span-2 space-y-6">
              <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
                <div className="p-6 space-y-6">
                  {/* Client & Product Selection */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label
                        htmlFor="client"
                        className="block text-sm font-medium text-gray-700 mb-2"
                      >
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
                        style={{ width: '100%' }}
                        menuStyle={{ zIndex: 999 }}
                        menuMaxHeight={200}
                        renderExtraFooter={() => (
                          <div className="px-3 py-2 border-t border-gray-200 bg-gray-50">
                            <p
                              className="text-blue-600 text-sm font-medium cursor-pointer hover:text-blue-700"
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
                          width: '100%',
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
                  </div>

                  {/* Quantity & Tax Selection */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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

                    <div>
                      <label className="block text-sm font-medium text-gray-900 mb-2">Taxes</label>
                      <CheckPicker
                        data={[
                          { label: 'IGST 18%', value: 'i-18' },
                          { label: 'IGST 28%', value: 'i-28' },
                          { label: 'SGST 9%', value: 's-9' },
                          { label: 'CGST 9%', value: 'c-9' },
                          { label: 'Freight Charges', value: 'frightChanged' }
                        ]}
                        searchable={false}
                        placeholder="Select Applicable Taxes"
                        value={transaction.taxAmount.map((t) => t.code)}
                        onChange={(value) => handleOnChangeEvent(value, 'taxAmount')}
                        className="w-full"
                        style={{ width: '100%' }}
                      />
                    </div>
                  </div>

                  {/* Freight Charges Input */}
                  {transaction.taxAmount.some((t) => t.code === 'frightChanged') && (
                    <Animation.Collapse in={true}>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Freight Charges (₹)
                        </label>
                        <InputNumber
                          value={
                            transaction.taxAmount.find((t) => t.code === 'frightChanged')?.value ||
                            0
                          }
                          onChange={handleFrightChange}
                          className="w-full"
                          size="md"
                          formatter={toThousands}
                        />
                      </div>
                    </Animation.Collapse>
                  )}

                  {/* Payment Options */}
                  <div className="space-y-4">
                    <div className="flex items-center space-x-3">
                      <Checkbox
                        value="partial"
                        checked={transaction.paymentType === 'partial'}
                        onChange={(_, checked) =>
                          handleOnChangeEvent(checked ? 'partial' : 'full', 'paymentType')
                        }
                      />
                      <span className="text-sm font-medium text-gray-700">Partial Payment</span>
                    </div>

                    <Animation.Collapse in={transaction.paymentType === 'partial'}>
                      <div>
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

                    {/* Payment Method */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Payment Method
                      </label>
                      <SelectPicker
                        data={[
                          { label: 'Bank Transfer', value: 'bank' },
                          { label: 'Cash', value: 'cash' }
                        ]}
                        value={transaction.paymentMethod}
                        onChange={(value) => handleOnChangeEvent(value, 'paymentMethod')}
                        placeholder="Select Payment Method"
                        style={{ width: '100%' }}
                        className="w-full"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Side - Calculation Summary */}
            <div className="lg:col-span-1 space-y-6">
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden sticky top-0 lg:top-4">
                <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
                  <h2 className="text-lg font-medium text-gray-900">Bill Summary</h2>
                </div>

                <div className="p-3 px-6 space-y-4">
                  {/* Product Info */}
                  {selectedProduct && (
                    <div className="bg-indigo-50 rounded-lg p-2 px-4 border border-gray-200">
                      <p className="text-xs text-gray-500 font-medium uppercase tracking-wide mb-2">
                        Selected Product
                      </p>
                      <p className="text-base font-semibold text-gray-900 mb-1">
                        {selectedProduct.name}
                      </p>
                      <p className="text-sm text-gray-600">
                        ₹{toThousands(purchasePrice)} × {toThousands(transaction.quantity)}
                      </p>
                    </div>
                  )}

                  {/* Subtotal */}
                  <div className="flex justify-between items-center py-2 border-b border-gray-200">
                    <span className="text-gray-700 font-medium">Subtotal</span>
                    <span className="text-lg font-semibold text-gray-900">
                      ₹{toThousands(subtotal)}
                    </span>
                  </div>

                  {/* Tax Breakdown */}
                  {Object.keys(taxBreakdown).length > 0 && (
                    <div className="space-y-3">
                      <p className="text-sm font-medium text-gray-700 pl-4">Taxes</p>
                      {Object.entries(taxBreakdown).map(([tax, amount]) => (
                        <div key={tax} className="flex justify-between items-center text-sm pl-4">
                          <span className="text-gray-600 capitalize">{tax}</span>
                          <span className="font-medium text-gray-900">
                            +₹{toThousands(Number(amount.toFixed(2)))}
                          </span>
                        </div>
                      ))}
                      <div className="flex justify-between items-center py-3 border-t border-gray-200 bg-gray-50 rounded-lg">
                        <span className="text-gray-700 font-semibold">Total Taxes</span>
                        <span className="text-lg font-bold text-gray-900">
                          ₹{toThousands(totalTax.toFixed(2))}
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Grand Total */}
                  <div className="bg-gray-900 rounded-lg p-4">
                    <div className="flex justify-between items-center">
                      <span className="text-white font-semibold text-sm uppercase tracking-wide">
                        Grand Total
                      </span>
                      <span className="text-2xl font-bold text-white">
                        ₹{toThousands(grandTotal.toFixed(2))}
                      </span>
                    </div>
                  </div>

                  {/* Payment Status for Partial */}
                  {transaction.paymentType === 'partial' && grandTotal > 0 && (
                    <div className="bg-amber-50 rounded-lg p-4 border border-amber-200">
                      <div className="space-y-3">
                        <div className="flex justify-between text-sm">
                          <span className="text-amber-800 font-medium">Paid Amount</span>
                          <span className="font-semibold text-amber-900">
                            ₹{toThousands(transaction.paidAmount.toFixed(2))}
                          </span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-amber-800 font-medium">Pending Amount</span>
                          <span className="font-semibold text-amber-900">
                            ₹{toThousands(transaction.pendingAmount.toFixed(2))}
                          </span>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Submit Button */}
                  <button
                    type="submit"
                    className="w-full bg-gray-900 hover:bg-black text-white font-semibold py-3 px-4 rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm disabled:shadow-none cursor-pointer"
                  >
                    {isSubmittingTransaction ? (
                      <span className="flex items-center justify-center gap-2">
                        <svg className="animate-spin h-4 w-4 text-white" viewBox="0 0 24 24">
                          <circle
                            className="opacity-25"
                            cx="12"
                            cy="12"
                            r="10"
                            stroke="currentColor"
                            strokeWidth="4"
                            fill="none"
                          />
                          <path
                            className="opacity-75"
                            fill="currentColor"
                            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                          />
                        </svg>
                        Processing...
                      </span>
                    ) : (
                      'Create Purchase Bill'
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
  )
}

export default PurchaseBill
