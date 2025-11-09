/* eslint-disable prettier/prettier */
/* eslint-disable no-unused-vars */
/* eslint-disable no-case-declarations */
/* eslint-disable react-hooks/exhaustive-deps */
import { useCallback, useEffect, useState, useMemo } from 'react'
import Navbar from './Navbar'
import { useSelector, useDispatch } from 'react-redux'
import {
  Animation,
  Checkbox,
  CheckPicker,
  InputNumber,
  SelectPicker,
  Button,
  Tag,
  Table,
  IconButton,
  Tooltip,
  Whisper,
  Message
} from 'rsuite'
import { toast } from 'react-toastify'
import {
  setBankReceipt,
  setCashReceipt,
  setClients,
  setProducts,
  setSettings,
  setTransactions
} from '../../app/features/electronSlice'
import { useLocation } from 'react-router-dom'
import ProductModal from '../Modal/ProductModal'
// 💡 Added PrinterIcon for the new print button
import {
  PlusIcon,
  TrashIcon,
  PrinterIcon,
  Plus,
  Calendar,
  Building2,
  CreditCard,
  TrendingUp,
  FileText,
  BarChart3
} from 'lucide-react'

const PurchaseBill = () => {
  const dispatch = useDispatch()
  const location = useLocation()

  // Fetch functions
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

  const fetchSettings = async () => {
    const response = await window.api.getSettings()
    dispatch(setSettings(response))
  }

  const products = useSelector((state) => state.electron.products.data || [])
  const clients = useSelector((state) => state.electron.clients.data || [])
  const settings = useSelector((state) => state.electron.settings.data || [])

  // UI modals and submission state
  const [productModal, setProductModal] = useState(false)
  const [clientModal, setClientModal] = useState(false) // Assuming you have a ClientModal component
  const [isSubmittingTransaction, setIsSubmittingTransaction] = useState(false)

  // 💡 State for the external product dropdown
  const [productToAdd, setProductToAdd] = useState(null)

  // Each product entry
  const getEmptyEntry = () => ({
    id: cryptoRandomId(),
    productId: '',
    quantity: 1,
    taxCodes: [],
    freight: 0,
    sellAmount: 0 // This is the Purchase Price in this context
  })

  // 💡 Product entries now start as an empty array
  const [productEntries, setProductEntries] = useState([])

  // Transaction-level meta (client, payment)
  const [transactionMeta, setTransactionMeta] = useState({
    clientId: '',
    paymentMethod: 'bank',
    paymentType: 'full',
    paidAmount: 0,
    statusOfTransaction: 'pending'
  })

  // Small helper to generate unique ids for list keys
  function cryptoRandomId() {
    try {
      return `id_${crypto.getRandomValues(new Uint32Array(1))[0].toString(36)}`
    } catch {
      return `id_${Math.random().toString(36).slice(2, 9)}`
    }
  }

  // Fetch data on mount
  useEffect(() => {
    fetchProducts()
    fetchClients()
    fetchBankReceipt()
    fetchTransaction()
    fetchSettings()
  }, [])

  // 💡 Cleaned up and consolidated tax options
  const taxPickerOptions = useMemo(() => {
    return [
      ...settings.map((s) => ({
        label: `${s.taxName} (${s.taxValue}%)`,
        value: `custom-${s.id}`,
        meta: s
      })),
      { label: 'Freight Charges', value: 'frightChanged' }
    ]
  }, [settings])

  // Helper: product lookup
  const findProduct = (id) => products.find((p) => p.id === id)

  // 💡 Memoized helper to get the selected client object
  const selectedClient = useMemo(
    () => clients.find((c) => c.id === transactionMeta.clientId),
    [clients, transactionMeta.clientId]
  )

  // Calculate per-entry derived values
  const computeEntryDetails = (entry) => {
    const product = findProduct(entry.productId)
    // Use sellAmount from entry as the source of truth for price
    const purchasePrice = Number(entry.sellAmount || 0)
    const subtotal = purchasePrice * Number(entry.quantity || 0)

    const taxObjects = (entry.taxCodes || [])
      .map((code) => {
        const custom = settings.find((s) => `custom-${s.id}` === code)
        if (custom) {
          const value = (subtotal * custom.taxValue) / 100
          return {
            code: `custom-${custom.id}`,
            name: custom.taxName,
            value,
            percentage: custom.taxValue
          }
        }
        if (code === 'frightChanged') {
          return {
            code: 'frightChanged',
            name: 'Freight Charges',
            value: Number(entry.freight || 0),
            percentage: 0
          }
        }
        return null
      })
      .filter(Boolean)

    const totalTax = taxObjects.reduce((s, t) => s + Number(t.value || 0), 0)

    // 💡 Corrected total (freight is included in totalTax if selected):
    const total = subtotal + totalTax

    return { product, purchasePrice, subtotal, taxObjects, totalTax, total }
  }

  // Aggregate across all entries
  const aggregated = useMemo(() => {
    const items = productEntries
      .filter((e) => e.productId)
      .map((e) => {
        const details = computeEntryDetails(e)
        return {
          ...e,
          ...details
        }
      })

    const subtotalAll = items.reduce((s, it) => s + Number(it.subtotal || 0), 0)

    // This is purely for display if needed, but should not be in grandTotal
    const freightAll = items.reduce((s, it) => s + Number(it.freight || 0), 0)

    const taxMap = {}
    items.forEach((it) => {
      ;(it.taxObjects || []).forEach((t) => {
        if (!taxMap[t.code]) {
          taxMap[t.code] = { ...t }
        } else {
          taxMap[t.code].value += Number(t.value || 0)
        }
      })
    })
    const taxArray = Object.values(taxMap)
    const totalTaxAll = taxArray.reduce((s, t) => s + Number(t.value || 0), 0)

    // 💡 Corrected grandTotal (taxAll already includes freight if selected):
    const grandTotal = subtotalAll + totalTaxAll

    return {
      items,
      subtotalAll,
      freightAll, // We can keep this for display, but it's not part of the total
      taxArray,
      totalTaxAll,
      grandTotal
    }
  }, [productEntries, settings, products])

  // Update product entry helper
  const updateEntry = (id, patch) => {
    setProductEntries((prev) => prev.map((p) => (p.id === id ? { ...p, ...patch } : p)))
  }

  // 💡 New function to add a specific product from the dropdown
  const handleAddProductEntry = () => {
    if (!productToAdd) {
      toast.error('Please select a product to add.')
      return
    }

    const product = findProduct(productToAdd) // Use existing helper
    if (!product) {
      toast.error('Selected product not found.')
      return
    }

    // Check if product is already in the list
    const isAlreadyAdded = productEntries.some((entry) => entry.productId === product.id)
    if (isAlreadyAdded) {
      toast.warn('This product is already in the bill. You can update its quantity in the table.')
      setProductToAdd(null) // Clear selection
      return
    }

    const newEntry = {
      ...getEmptyEntry(), // Get base structure with a new random id
      productId: product.id,
      sellAmount: product.price || 0, // Pre-fill price
      quantity: 1 // Default quantity
    }

    setProductEntries((prev) => [...prev, newEntry])
    setProductToAdd(null) // Clear the selection after adding
  }

  const removeEntry = (id) => {
    setProductEntries((prev) => prev.filter((p) => p.id !== id))
  }

  // Handle transaction meta change
  const handleMetaChange = (field, value) => {
    setTransactionMeta((prev) => ({ ...prev, [field]: value }))
  }

  // Format numbers as INR
  const toThousands = (value) => {
    if (value === null || value === undefined || Number.isNaN(Number(value))) return '0'
    return new Intl.NumberFormat('en-IN', { maximumFractionDigits: 2 }).format(Number(value))
  }

  // When partial/full toggle changes, update paid/pending
  useEffect(() => {
    if (transactionMeta.paymentType === 'full') {
      setTransactionMeta((prev) => ({ ...prev, paidAmount: aggregated.grandTotal }))
    }
    // No else needed, partial payments retain their custom amount
  }, [aggregated.grandTotal, transactionMeta.paymentType])

  // Submit handler
  const handleSubmitTransaction = useCallback(
    async (e) => {
      e.preventDefault()
      if (isSubmittingTransaction) return
      setIsSubmittingTransaction(true)

      try {
        // validation
        if (!transactionMeta.clientId) {
          toast.error('Please select client')
          setIsSubmittingTransaction(false)
          return
        }

        // 💡 This check is now more important
        if (aggregated.items.length === 0) {
          toast.error('Please add at least one product')
          setIsSubmittingTransaction(false)
          return
        }

        for (const it of aggregated.items) {
          if (!it.quantity || Number(it.quantity) <= 0) {
            toast.error('Please enter a valid quantity for all products')
            setIsSubmittingTransaction(false)
            return
          }
          if (!it.productId) {
            toast.error('Please select products for all rows')
            setIsSubmittingTransaction(false)
            return
          }
        }

        // Payment logic
        let paidAmount = Number(transactionMeta.paidAmount || 0)
        let pendingAmount = 0
        const grandTotal = Number(aggregated.grandTotal || 0)

        if (transactionMeta.paymentType === 'full') {
          paidAmount = grandTotal
          pendingAmount = 0
        } else {
          pendingAmount = Math.max(0, grandTotal - paidAmount)
        }

        // Tax array
        const aggregatedTax = aggregated.taxArray.map((t) => ({
          code: t.code,
          name: t.name,
          value: Number(t.value || 0),
          percentage: t.percentage || 0
        }))

        // Build items payload
        const itemsPayload = aggregated.items.map((it) => ({
          productId: it.productId,
          quantity: Number(it.quantity),
          unitPrice: Number(it.purchasePrice || 0),
          subtotal: Number(it.subtotal || 0),
          freight: Number(it.freight || 0), // Still pass freight per-item
          taxes: (it.taxObjects || []).map((tx) => ({
            code: tx.code,
            name: tx.name,
            value: Number(tx.value || 0),
            percentage: tx.percentage || 0
          })),
          total: Number(it.total || 0),
          sellAmount: Number(it.sellAmount || 0) // Sticking to original logic
        }))

        // Transaction payload
        const transactionData = {
          clientId: transactionMeta.clientId,
          productId: aggregated.items[0]?.productId || '',
          quantity: aggregated.items.reduce((s, i) => s + Number(i.quantity || 0), 0),
          sellAmount: 0,
          purchaseAmount: Number(grandTotal || 0),
          statusOfTransaction: transactionMeta.statusOfTransaction || 'pending',
          paymentMethod: transactionMeta.paymentMethod || 'bank',
          paymentType: transactionMeta.paymentType || 'full',
          pendingAmount: Number(pendingAmount || 0),
          paidAmount: Number(paidAmount || 0),
          transactionType: 'purchase', // Hardcoded for PurchaseBill
          taxAmount: aggregatedTax,
          dueDate: new Date().setMonth(new Date().getMonth() + 1),
          items: itemsPayload
        }

        // Call backend
        const createdTransaction = await window.api.createTransaction(transactionData)
        dispatch(setTransactions(createdTransaction))
        toast.success('Transaction added successfully')

        // Build receipt
        const partyName = selectedClient?.clientName || 'Unknown Client'

        const baseReceipt = {
          transactionId: createdTransaction.id || createdTransaction?.transactionId || null,
          type: 'Payment',
          date: new Date().toISOString().slice(0, 19).replace('T', ' '),
          statusOfTransaction:
            createdTransaction.statusOfTransaction || transactionMeta.statusOfTransaction,
          party: partyName,
          amount: grandTotal,
          description:
            'Purchase: ' +
            aggregated.items.map((it) => `${findProduct(it.productId)?.name || 'Item'}`).join(', '),
          taxAmount: aggregatedTax,
          dueDate: new Date().setMonth(new Date().getMonth() + 1)
        }

        if (transactionMeta.paymentMethod === 'bank') {
          const createdBankReceipt = await window.api.createBankReceipt({
            ...baseReceipt,
            bank: transactionMeta.bank || 'IDBI'
          })
          dispatch(setBankReceipt(createdBankReceipt))
        } else if (transactionMeta.paymentMethod === 'cash') {
          const createdCashReceipt = await window.api.createCashReceipt({
            ...baseReceipt,
            cash: transactionMeta.cash || 'Cash'
          })
          dispatch(setCashReceipt(createdCashReceipt))
        }

        // refresh and reset
        await fetchTransaction()
        // 💡 Reset product entries to empty array
        setProductEntries([])
        setTransactionMeta({
          clientId: '',
          paymentMethod: 'bank',
          paymentType: 'full',
          paidAmount: 0,
          statusOfTransaction: 'pending'
        })
      } catch (error) {
        console.error(error)
        toast.error('An error occurred while processing your request')
      } finally {
        setIsSubmittingTransaction(false)
      }
    },
    [productEntries, transactionMeta, aggregated, clients, dispatch, selectedClient]
  )

  // UI main return
  return (
    // 💡 Added print-specific classes to root
    <div className="select-none flex flex-col h-screen overflow-hidden bg-gray-50 min-w-0 print:h-auto print:overflow-visible">
      {/* 💡 Added print:hidden to Navbar */}
      <div className="w-full sticky top-0 z-10 bg-white print:hidden">
        <Navbar />
      </div>

      <div className="flex justify-between mt-5 pb-2 items-center mx-4 lg:mx-7 print:hidden">
        <p className="text-3xl font-light text-gray-900">Purchase Bill</p>
      </div>

      {productModal && <ProductModal setShowModal={() => setProductModal(false)} type="product" />}

      {/* 💡 Added print:overflow-visible */}
      <div className="flex-1 overflow-auto px-4 lg:px-7 py-4 print:overflow-visible">
        <form onSubmit={handleSubmitTransaction} className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
            {/* 💡 Left Side - Form (wrapped in a space-y-6 div) */}
            {/* 💡 Added print:hidden to the entire form column */}
            <div className="lg:col-span-2 space-y-6 print:hidden">
              {/* 💡 Card 1: Bill Details (Client + Table) */}
              <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
                <div className="p-6 space-y-6">
                  {/* Client Selection */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Client</label>
                      <SelectPicker
                        data={clients.map((client) => ({
                          label: client.clientName,
                          value: client.id
                        }))}
                        value={transactionMeta.clientId}
                        onChange={(value) => handleMetaChange('clientId', value)}
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
                      <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
                      <SelectPicker
                        data={[
                          { label: 'Pending', value: 'pending' },
                          { label: 'Completed', value: 'completed' }
                        ]}
                        value={transactionMeta.statusOfTransaction}
                        onChange={(value) => handleMetaChange('statusOfTransaction', value)}
                        style={{ width: '100%' }}
                      />
                    </div>
                  </div>

                  {/* 💡 Modified product adding section */}
                  <div className="p-6 border-t border-gray-200 flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                    <div className="flex-1">
                      <SelectPicker
                        data={products.map((product) => ({
                          label: `${product.name}`,
                          value: product.id,
                          qty: product.quantity
                        }))}
                        value={productToAdd}
                        onChange={setProductToAdd}
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
                    <Plus onClick={handleAddProductEntry} size={34} className="p-2 bg-blue-300" />
                  </div>
                </div>

                {/* 💡 Enhanced Minimal Table Inspired by PendingCollectionReport */}
                <div className="bg-white shadow-xl overflow-hidden border border-gray-200 mx-2 my-2">
                  <div className="overflow-x-auto customScrollbar max-h-[400px] relative">
                    <table className="min-w-max border-collapse text-sm p-2 w-full">
                      <thead className="bg-gradient-to-r from-gray-100 to-gray-200 sticky top-0 z-10">
                        <tr className="text-gray-700">
                          <th className="px-4 py-3 border-r border-gray-200 w-[180px] font-semibold text-left">
                            Product
                          </th>
                          <th className="px-4 py-3 border-r border-gray-200 w-[90px] font-semibold text-center">
                            Qty
                          </th>
                          <th className="px-4 py-3 border-r border-gray-200 w-[120px] font-semibold text-center">
                            Unit ₹
                          </th>
                          <th className="px-4 py-3 border-r border-gray-200 w-[160px] font-semibold text-left">
                            Taxes
                          </th>
                          <th className="px-4 py-3 border-r border-gray-200 w-[120px] font-semibold text-center">
                            Freight ₹
                          </th>
                          <th className="px-4 py-3 border-r border-gray-200 w-[140px] font-semibold text-center">
                            Total ₹
                          </th>
                          <th className="px-4 py-3 font-semibold text-center w-[80px]">Action</th>
                        </tr>
                      </thead>

                      <tbody className="divide-y divide-gray-100">
                        {productEntries.length === 0 ? (
                          <tr className="h-60">
                            <td colSpan={7} className="text-center">
                              <div className="flex flex-col items-center gap-3 py-10">
                                <div className="w-14 h-14 bg-gray-100 rounded-full flex items-center justify-center">
                                  <FileText size={28} className="text-gray-400" />
                                </div>
                                <p className="text-gray-600 font-medium">No products added yet</p>
                                <p className="text-gray-400 text-sm">
                                  Select a product above and click “Add Product” to begin
                                </p>
                              </div>
                            </td>
                          </tr>
                        ) : (
                          productEntries.map((rowData, index) => {
                            const details = computeEntryDetails(rowData)
                            const isEven = index % 2 === 0
                            return (
                              <tr
                                key={rowData.id}
                                className={`transition-all duration-150 ${
                                  isEven ? 'bg-white' : 'bg-gray-50'
                                } hover:bg-blue-50`}
                              >
                                {/* Product Column */}
                                <td className="px-4">
                                  <SelectPicker
                                    data={products.map((p) => ({ label: p.name, value: p.id }))}
                                    value={rowData.productId}
                                    onChange={(val) =>
                                      updateEntry(rowData.id, {
                                        productId: val,
                                        sellAmount: products.find((p) => p.id === val)?.price || 0
                                      })
                                    }
                                    placeholder="Select"
                                    size="sm"
                                    block
                                    cleanable={false}
                                    menuStyle={{ zIndex: 9999 }}
                                  />
                                </td>

                                {/* Quantity */}
                                <td className="px-4 py-3 text-center">
                                  <InputNumber
                                    value={rowData.quantity}
                                    onChange={(val) =>
                                      updateEntry(rowData.id, { quantity: Number(val || 0) })
                                    }
                                    min={0}
                                    size="sm"
                                    style={{ width: '90px' }}
                                  />
                                </td>

                                {/* Unit Price */}
                                <td className="px-4 py-3 text-center">
                                  <InputNumber
                                    value={rowData.sellAmount}
                                    onChange={(val) =>
                                      updateEntry(rowData.id, { sellAmount: Number(val || 0) })
                                    }
                                    prefix="₹"
                                    size="sm"
                                    style={{ width: '110px' }}
                                  />
                                </td>

                                {/* Taxes */}
                                <td className="px-4 py-3">
                                  <CheckPicker
                                    data={taxPickerOptions}
                                    value={rowData.taxCodes}
                                    onChange={(vals) => updateEntry(rowData.id, { taxCodes: vals })}
                                    size="sm"
                                    searchable
                                    placeholder="Select"
                                    block
                                  />
                                </td>

                                {/* Freight */}
                                <td className="px-4 py-3 text-center">
                                  <InputNumber
                                    value={rowData.freight}
                                    onChange={(val) =>
                                      updateEntry(rowData.id, { freight: Number(val || 0) })
                                    }
                                    prefix="₹"
                                    size="sm"
                                    style={{ width: '100px' }}
                                  />
                                </td>

                                {/* Total */}
                                <td className="px-4 py-3 text-center font-semibold text-gray-800">
                                  ₹{toThousands(details.total.toFixed(2))}
                                </td>

                                {/* Action */}
                                <td className="px-3 py-3 text-center">
                                  <IconButton
                                    icon={<TrashIcon size={16} />}
                                    appearance="ghost"
                                    color="red"
                                    size="xs"
                                    circle
                                    onClick={() => removeEntry(rowData.id)}
                                  />
                                </td>
                              </tr>
                            )
                          })
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>

              {/* 💡 Card 2: Payment Details */}
              <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden p-6">
                <h3 className="text-lg font-medium text-gray-800 mb-6">Payment Details</h3>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 items-center gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Payment Method
                      </label>
                      <SelectPicker
                        data={[
                          { label: 'Bank Transfer', value: 'bank' },
                          { label: 'Cash', value: 'cash' }
                        ]}
                        value={transactionMeta.paymentMethod}
                        onChange={(value) => handleMetaChange('paymentMethod', value)}
                        placeholder="Select Payment Method"
                        style={{ width: '100%' }}
                        searchable={false}
                        className="w-full"
                      />
                    </div>

                    <div className="mt-6 flex items-center">
                      <Checkbox
                        value="partial"
                        checked={transactionMeta.paymentType === 'partial'}
                        onChange={(_, checked) =>
                          handleMetaChange('paymentType', checked ? 'partial' : 'full')
                        }
                      >
                        <span className="text-sm font-medium text-gray-700">Partial Payment</span>
                      </Checkbox>
                    </div>
                  </div>

                  <Animation.Collapse in={transactionMeta.paymentType === 'partial'}>
                    <div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-gray-100 rounded-lg border border-gray-200">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Paid Amount
                          </label>
                          <InputNumber
                            prefix="₹"
                            value={transactionMeta.paidAmount}
                            onChange={(val) => handleMetaChange('paidAmount', Number(val || 0))}
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
                            value={Math.max(
                              0,
                              aggregated.grandTotal - (transactionMeta.paidAmount || 0)
                            )}
                            formatter={toThousands}
                            disabled
                            size="md"
                            className="w-full bg-gray-50" // 💡 Changed disabled style
                          />
                        </div>
                      </div>
                    </div>
                  </Animation.Collapse>
                  
                </div>
              </div>
            </div>

            {/* 💡 Right Side - Calculation Summary */}
            {/* 💡 Added print-specific classes to make this the *only* thing that prints */}
            <div className="lg:col-span-1 space-y-6 print:w-full print:m-0 print:p-0">
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden sticky top-0 lg:top-0 print:shadow-none print:border-none print:sticky-static">
                <div className="bg-gray-50 px-6 py-4 border-b border-gray-200 flex justify-between items-center">
                  <h2 className="text-lg font-medium bg-gradient-to-b from-gray-50 to-gray-100 text-gray-900">
                    Bill Summary
                  </h2>
                  {/* 💡 Print Button */}
                  <IconButton
                    icon={<PrinterIcon />}
                    size="sm"
                    appearance="subtle"
                    onClick={() => window.print()}
                    className="print:hidden"
                  >
                    Print
                  </IconButton>
                </div>

                <div className="p-3 px-6 space-y-4">
                  {/* 💡 Added Client Info for printing */}
                  {selectedClient && (
                    <div className="pb-3 border-b border-gray-200">
                      <p className="text-sm text-gray-500 mb-1">Client</p>
                      <p className="text-lg font-semibold text-gray-900">
                        {selectedClient.clientName}
                      </p>
                    </div>
                  )}

                  {/* Items summary */}
                  <div>
                    <p className="text-sm text-gray-600 mb-2">Items</p>
                    <div className="space-y-2 max-h-44 overflow-auto pr-2 print:max-h-none print:overflow-visible">
                      {aggregated.items.length === 0 && (
                        <p className="text-xs text-gray-500">No products selected</p>
                      )}
                      {aggregated.items.map((it) => (
                        <div key={it.id} className="flex justify-between items-center">
                          <div>
                            <p className="text-sm font-medium">{it.product?.name || '—'}</p>
                            <p className="text-xs text-gray-500">
                              ₹{toThousands(it.purchasePrice)} × {toThousands(it.quantity)}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="text-sm font-semibold">₹{toThousands(it.total)}</p>
                            <p className="text-xs text-gray-500">incl. taxes</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Subtotal */}
                  <div className="flex justify-between items-center py-2 border-b border-gray-200">
                    <span className="text-gray-700 font-medium">Subtotal</span>
                    <span className="text-lg font-semibold text-gray-900">
                      ₹{toThousands(aggregated.subtotalAll)}
                    </span>
                  </div>

                  {/* 💡 Removed redundant Freight display, as it's part of taxes now */}

                  {/* Tax Breakdown */}
                  {aggregated.taxArray.length > 0 && (
                    <div className="space-y-3 pt-2">
                      <p className="text-sm font-medium text-gray-700">Taxes & Charges</p>
                      {aggregated.taxArray.map((t) => (
                        <div
                          key={t.code}
                          className="flex justify-between items-center text-sm pl-4"
                        >
                          <span className="text-gray-600 capitalize">{t.name}</span>
                          <span className="font-medium text-gray-900">
                            +₹{toThousands(Number(t.value.toFixed(2)))}
                          </span>
                        </div>
                      ))}
                      <div className="flex justify-between items-center py-3 border-t border-gray-200">
                        <span className="text-gray-700 font-semibold">Total Taxes & Charges</span>
                        <span className="text-lg font-bold text-gray-900">
                          ₹{toThousands(aggregated.totalTaxAll.toFixed(2))}
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
                        ₹{toThousands(aggregated.grandTotal.toFixed(2))}
                      </span>
                    </div>
                  </div>

                  {/* Payment Status for Partial */}
                  {transactionMeta.paymentType === 'partial' && aggregated.grandTotal > 0 && (
                    <div className="bg-amber-50 rounded-lg p-4 border border-amber-200">
                      <div className="space-y-3">
                        <div className="flex justify-between text-sm">
                          <span className="text-amber-800 font-medium">Paid Amount</span>
                          <span className="font-semibold text-amber-900">
                            ₹{toThousands(transactionMeta.paidAmount.toFixed(2))}
                          </span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-amber-800 font-medium">Pending Amount</span>
                          <span className="font-semibold text-amber-900">
                            ₹
                            {toThousands(
                              Math.max(
                                0,
                                aggregated.grandTotal - transactionMeta.paidAmount
                              ).toFixed(2)
                            )}
                          </span>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Submit Button */}
                  <button
                    type="submit"
                    className="w-full bg-gray-900 hover:bg-black text-white font-semibold py-3 px-4 rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm disabled:shadow-none cursor-pointer print:hidden"
                    disabled={isSubmittingTransaction}
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

        <style>
          {`
  @media (max-width: 1440px) {
    .rs-picker-toggle, .rs-input-number-input {
      height: 32px !important;
      font-size: 0.85rem !important;
    }
    td, th {
      padding: 6px 8px !important;
    }
  }

  @media (max-width: 1024px) {
    table {
      min-width: 850px;
    }
  }

  .customScrollbar::-webkit-scrollbar {
    width: 6px;
    height: 6px;
  }
  .customScrollbar::-webkit-scrollbar-thumb {
    background-color: rgba(100, 116, 139, 0.4);
    border-radius: 3px;
  }
`}
        </style>
      </div>
    </div>
  )
}

export default PurchaseBill
