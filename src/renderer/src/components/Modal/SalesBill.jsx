/* eslint-disable prettier/prettier */
/* eslint-disable no-unused-vars */
/* eslint-disable react/prop-types */
import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react'
import { InputNumber, SelectPicker, CheckPicker, Toggle, Animation, Checkbox, Input } from 'rsuite'
import { motion, AnimatePresence } from 'framer-motion'
import {
  CircleX,
  Trash,
  Package,
  Box,
  CreditCard,
  BarChart3,
  IndianRupee,
  FileText,
  MoreHorizontal,
  User,
  Plus,
  Truck,
  ArrowRight,
  Download,
  Calendar
} from 'lucide-react'
import { useDispatch, useSelector } from 'react-redux'
import {
  setClients,
  setProducts,
  setTransactions,
  setSettings,
  setBankReceipt,
  setCashReceipt,
  setAccount
} from '../../app/features/electronSlice'
import { toast } from 'react-toastify'
import html2pdf from 'html2pdf.js'
import ProductModal from './ProductModal'
import ClientModal from './ClientModal'
import PaymentMethod from '../UI/PaymentMethod' // Assuming this component exists
const TABLE_HEADERS = [
  { key: 'productId', label: 'Product', width: 'w-[350px]', icon: Package },
  { key: 'quantity', label: 'Qty', width: 'w-[150px]', icon: Box },
  { key: 'price', label: 'Price', width: 'w-[200px]', icon: CreditCard },
  { key: 'taxAmount', label: 'Taxes', width: 'w-[200px]', icon: BarChart3 },
  { key: 'total', label: 'Total', width: 'w-[200px]', icon: IndianRupee },
  { key: 'description', label: 'Description', width: 'w-[350px]', icon: FileText },
  { key: 'action', label: 'Action', width: 'w-[10px]', icon: MoreHorizontal }
]
const SalesRow = ({ index, row, products, settings, onChange, onRemove, toThousands }) => {
  const selectedProduct = products.find((p) => p.id === row.productId)
  const price = row.price ?? selectedProduct?.price ?? 0
  const subtotal = price * (row.quantity || 0)
  const taxTotal = Array.isArray(row.taxAmount)
    ? row.taxAmount.reduce((acc, t) => acc + (t.value || 0), 0)
    : 0
  const freightObj = row.taxAmount?.find((t) => t.code === 'freightCharges')
  const total = subtotal + taxTotal + (freightObj ? freightObj.value : 0)
  const taxOptions = [
    ...settings.map((s) => ({
      label: `${s.taxName} (${s.taxValue}%)`,
      value: `custom-${s.id}`
    }))
  ]
  return (
    <motion.tr
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.15, ease: 'easeOut' }}
      className="border-b border-white/10 hover:bg-white/10 transition-colors duration-200"
    >
      <td className="px-3 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
        <SelectPicker
          data={products.map((p) => ({ label: p.name, value: p.id, qty: p.quantity || 0 }))}
          value={row.productId}
          placeholder="Select Product"
          virtualized={true}
          menuMaxHeight={200}
          menuStyle={{ zIndex: 99999, position: 'absolute' }}
          className="w-full [&_.rs-picker-toggle]:rounded-lg [&_.rs-picker-toggle]:border-gray-300/50 [&_.rs-picker-toggle]:bg-white/50 hover:[&_.rs-picker-toggle]:bg-white/70"
          onChange={(val) => onChange(index, 'productId', val)}
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
        />
      </td>
      <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-500 text-right">
        <InputNumber
          min={1}
          value={row.quantity}
          onChange={(val) => onChange(index, 'quantity', val)}
          className="w-20 [&_.rs-input-number-btn-group]:hidden [&_.rs-input]:h-10 [&_.rs-input]:rounded-lg [&_.rs-input]:bg-white/50 hover:[&_.rs-input]:bg-white/70 [&_.rs-input]:border-gray-300/50"
        />
      </td>
      <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-500 text-right">
        <InputNumber
          prefix="₹"
          value={price}
          onChange={(val) => onChange(index, 'price', val)}
          className="w-24 [&_.rs-input-number-btn-group]:hidden [&_.rs-input]:h-10 [&_.rs-input]:rounded-lg [&_.rs-input]:bg-white/50 hover:[&_.rs-input]:bg-white/70 [&_.rs-input]:border-gray-300/50"
        />
      </td>
      <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-500">
        <CheckPicker
          data={taxOptions}
          value={Array.isArray(row.taxAmount) ? row.taxAmount.map((t) => t.code) : []}
          placeholder="Select Taxes"
          virtualized={true}
          menuMaxHeight={200}
          menuStyle={{ zIndex: 99999, position: 'absolute' }}
          className="w-full max-w-xs [&_.rs-picker-toggle]:rounded-lg [&_.rs-picker-toggle]:border-gray-300/50 0 [&_.rs-picker-toggle]:bg-white/50 hover:[&_.rs-picker-toggle]:bg-white/70"
          onChange={(val) => onChange(index, 'taxAmount', val)}
        />
      </td>
      <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-900 text-right font-medium">
        <InputNumber
          prefix="₹"
          disabled
          value={total}
          className="bg-indigo-100/50 w-24 [&_.rs-input]:h-10 [&_.rs-input]:rounded-lg"
        />
      </td>
      <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-900 text-right font-medium">
        <Input
          value={row.description || ''}
          onChange={(val) => onChange(index, 'description', val)}
          placeholder="Description"
          style={{ width: '100%' }}
          className="!rounded-lg border-white/50 bg-white/50 shadow-sm focus:ring-2 focus:ring-indigo-200 focus:bg-white/70"
        />
      </td>
      <td className="px-3 py-4 whitespace-nowrap text-right text-sm font-medium">
        <button
          type="button"
          onClick={() => onRemove(index)}
          className="group relative p-2 rounded-full bg-red-100/70 text-red-600 hover:bg-red-100/100 transition-all duration-300 hover:scale-110 cursor-pointer border border-red-200 flex items-center justify-center shadow-sm hover:shadow-md w-full"
          aria-label="Remove row"
        >
          <Trash size={16} className="group-hover:rotate-12 transition-transform duration-300" />
        </button>
      </td>
    </motion.tr>
  )
}
const SalesBill = ({ setShowSalesBillModal, existingTransaction, isUpdateExpense }) => {
  const dispatch = useDispatch()
  const products = useSelector((state) => state.electron.products.data || [])
  const clients = useSelector((state) => state.electron.clients.data || [])
  const settings = useSelector((state) => state.electron.settings.data || [])
  const [clientModal, setClientModal] = useState(false)
  const [productModal, setProductModal] = useState(false)
  const [showPaymentModal, setShowPaymentModal] = useState(false)
  const [salesBill, setSalesBill] = useState({
    clientId: '',
    billNumber: '',
    billDate: new Date().toISOString().split('T')[0],
    paymentType: 'full',
    paymentMethod: 'bank',
    statusOfTransaction: 'pending',
    freightCharges: 0,
    paidAmount: 0,
    freightTaxAmount: [],
    products: [{ productId: '', quantity: 1, taxAmount: [], price: 0, description: '' }]
  })
  const [nextBillId, setNextBillId] = useState(null)
  /* ========= Prefill for Update ========= */
  useEffect(() => {
    if (!existingTransaction || !isUpdateExpense) return
    const init = existingTransaction
    let productsList = []
    // If it's a multi-product transaction → use multipleProducts array
    if (
      init.multipleProducts &&
      Array.isArray(init.multipleProducts) &&
      init.multipleProducts.length > 0
    ) {
      productsList = init.multipleProducts.map((item) => ({
        productId: item.productId,
        quantity: item.quantity || 1,
        price: item.sellAmount || item.price || 0,
        taxAmount: item.taxAmount || [],
        description: item.description || ''
      }))
    }
    // Fallback: single product (old format)
    else if (init.productId) {
      productsList = [
        {
          productId: init.productId,
          quantity: init.quantity || 1,
          price: init.sellAmount || 0,
          taxAmount: init.taxAmount || [],
          description: init.description || ''
        }
      ]
    }
    setSalesBill((prev) => ({
      ...prev,
      clientId: init.clientId || '',
      billNumber: init.billNo || '',
      billDate:
        init.date?.split('T')[0] ||
        init.createdAt?.split('T')[0] ||
        new Date().toISOString().split('T')[0],
      paymentType: init.paymentType || 'full',
      paymentMethod: init.paymentMethod || 'bank',
      statusOfTransaction: init.statusOfTransaction || 'pending',
      paidAmount: init.paidAmount || 0,
      freightCharges: init.freightCharges || 0,
      products:
        productsList.length > 0
          ? productsList
          : [{ productId: '', quantity: 1, taxAmount: [], price: 0, description: '' }]
    }))
  }, [existingTransaction, isUpdateExpense])
  const fetchAllData = useCallback(async () => {
    try {
      const [p, c, s] = await Promise.all([
        window.api.getAllProducts(),
        window.api.getAllClients(),
        window.api.getSettings()
      ])
      dispatch(setProducts(p))
      dispatch(setClients(c))
      dispatch(setSettings(s))
    } catch (err) {
      console.error('fetchAllData error', err)
    }
  }, [dispatch])
  const fetchNextTransactionId = async () => {
    const allTransactions = await window.api.getAllTransactions()
    if (allTransactions?.length) {
      const lastTransaction = allTransactions[allTransactions.length - 1]
      setNextBillId(lastTransaction.id + 1)
    } else {
      setNextBillId(1)
    }
  }
  useEffect(() => {
    fetchAllData()
    fetchNextTransactionId()
  }, [fetchAllData])
  const inputRef = useRef(null)
  useEffect(() => {
    setTimeout(() => {
      inputRef.current?.focus?.()
    }, 200)
  }, [])
  const toThousands = (v) => new Intl.NumberFormat('en-IN').format(Number(v) || 0)
  const handleProductChange = (index, field, value) => {
    setSalesBill((prev) => {
      const updatedRows = [...prev.products]
      const row = { ...updatedRows[index] }
      if (field === 'productId') {
        row.productId = value
        const selected = products.find((p) => p.id === value)
        row.price = selected?.price || 0
      }
      if (field === 'quantity') {
        row.quantity = Number(value) || 0
      }
      if (field === 'price') {
        row.price = Number(value) || 0
      }
      if (field === 'description') {
        row.description = value
      }
      if (field === 'taxAmount') {
        const selectedCodes = value || []

        row.taxAmount = selectedCodes.map((code) => {
          const st = settings.find((s) => `custom-${s.id}` === code)
          const base = (row.price || 0) * (row.quantity || 0)

          return {
            code,
            name: st.taxName,
            percentage: st.taxValue,
            value: (base * st.taxValue) / 100 // ✔ calculate here ONCE
          }
        })
      }
      updatedRows[index] = row
      return { ...prev, products: updatedRows }
    })
  }
  const handleAddRow = () => {
    setSalesBill((prev) => ({
      ...prev,
      products: [
        ...prev.products,
        { productId: '', quantity: 1, taxAmount: [], price: 0, description: '' }
      ]
    }))
  }
  const handleRemoveRow = (index) => {
    setSalesBill((prev) => ({
      ...prev,
      products: prev.products.filter((_, i) => i !== index)
    }))
  }
  const productRowTotals = useMemo(() => {
    return salesBill.products.map((p) => {
      const price = Number(p.price || 0)
      const qty = Number(p.quantity || 0)
      const base = price * qty
      const tax = Array.isArray(p.taxAmount)
        ? p.taxAmount.reduce((a, t) => a + (t.value || 0), 0)
        : 0
      const total = base + tax
      return { base, tax, total }
    })
  }, [salesBill.products])

  const billSubTotal = useMemo(() => {
    return productRowTotals.reduce((s, r) => s + r.base, 0)
  }, [productRowTotals])

  const billTaxTotal = useMemo(() => {
    return productRowTotals.reduce((s, r) => s + r.tax, 0)
  }, [productRowTotals])

  const billFreight = useMemo(() => {
    return Number(salesBill.freightCharges || 0)
  }, [salesBill.freightCharges])

  const billFreightTax = useMemo(() => {
    return (salesBill.freightTaxAmount || []).reduce((s, t) => s + (t?.value || 0), 0)
  }, [salesBill.freightTaxAmount])

  const grandTotal = useMemo(() => {
    const productTotals = productRowTotals.reduce((s, r) => s + r.total, 0)
    console.log(productTotals)
    console.log('1', billFreight)
    console.log('2', billFreightTax)

    const total = productTotals // Freight added ONCE here
    return total
  }, [productRowTotals, billFreight, billFreightTax])

  /* ========= Validation ========= */
  const validateForm = () => {
    if (!salesBill.clientId) {
      toast.error('Please select a client')
      return false
    }
    const validRows = salesBill.products.filter((it) => it.productId && it.quantity > 0)
    if (validRows.length === 0) {
      toast.error('Add at least one product with valid quantity')
      return false
    }
    if (salesBill.paymentType === 'partial' && (salesBill.paidAmount || 0) <= 0) {
      toast.error('Enter paid amount for partial payment')
      return false
    }
    return true
  }
  /* ========= Generate Invoice HTML ========= */
  const generateInvoiceHtml = useCallback(() => {
    const toThousands = (v) => new Intl.NumberFormat('en-IN').format(Number(v) || 0)
    let number = 0
    const selectedClient = clients.find((c) => c.id === salesBill.clientId)
    if (!selectedClient) return ''
    const now = new Date()
    const billDateObj = salesBill.billDate ? new Date(salesBill.billDate) : now
    const invoiceDate = billDateObj.toLocaleDateString('en-US', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    })
    const invoiceNumber = `SB-${billDateObj.getFullYear()}${String(billDateObj.getMonth() + 1).padStart(2, '0')}${String(billDateObj.getDate()).padStart(2, '0')}-${number}`
    number++
    const validProducts = salesBill.products.filter((p) => p.productId && p.quantity > 0)
    if (!validProducts.length) return ''
    const totalBase = validProducts.reduce((sum, p) => sum + (p.price || 0) * (p.quantity || 0), 0)
    const aggregatedItems = validProducts.map((p, idx) => {
      const product = products.find((pr) => pr.id === p.productId)
      const base = (p.price || 0) * (p.quantity || 0)
      const taxSum = (p.taxAmount || []).reduce((a, t) => a + Number(t?.value || 0), 0)
      let total = base + taxSum
      let allocatedFreight = 0
      if (billFreight > 0 && totalBase > 0) {
        const share = base / totalBase
        allocatedFreight = Math.round(billFreight * share * 100) / 100
        total += allocatedFreight
      }
      let allocatedFreightTax = 0
      if (billFreightTax > 0 && totalBase > 0) {
        const share = base / totalBase
        allocatedFreightTax = Math.round(billFreightTax * share * 100) / 100
        total += allocatedFreightTax
      }
      const taxesCharges = taxSum + allocatedFreight + allocatedFreightTax
      return {
        id: idx + 1,
        productName: product?.name || '-',
        quantity: p.quantity || 0,
        price: p.price || 0,
        taxesCharges,
        total
      }
    })
    const finalItems = aggregatedItems.length > 0 ? aggregatedItems : []
    const subTotalToShow = aggregatedItems.length > 0 ? billSubTotal : 0
    const grandTotalToShow = aggregatedItems.length > 0 ? grandTotal : 0
    const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Sales Invoice</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background: #fff; padding: 24px; color: #333; }
    .container { max-width: 900px; margin: 0 auto; background: #fff; padding: 40px; border: 1px solid #eee; box-shadow: 0 10px 25px rgba(0,0,0,0.1); }
    .header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 32px; padding-bottom: 16px; border-bottom: 2px solid #111; }
    .invoice-title { font-size: 28px; font-weight: 800; letter-spacing: .5px; color: #111; }
    .invoice-meta { font-size: 13px; margin: 4px 0; color: #333; }
    .info-boxes { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 20px; }
    .info-box { border: 1px solid #ddd; border-radius: 12px; padding: 20px; background: linear-gradient(135deg, #fafafa 0%, #f0f0f0 100%); box-shadow: 0 2px 8px rgba(0,0,0,0.05); }
    .table-container { margin: 20px 0; overflow-x: auto; border-radius: 12px; box-shadow: 0 4px 12px rgba(0,0,0,0.05); }
    table { width: 100%; border-collapse: collapse; font-size: 13px; background: white; }
    thead { background: linear-gradient(135deg, #111 0%, #333 100%); color: white; }
    th { padding: 12px 10px; text-align: left; font-weight: 700; font-size: 11px; letter-spacing: .6px; }
    td { padding: 12px 10px; border-bottom: 1px solid #eee; }
    .footer-section { display: grid; grid-template-columns: 1.5fr 1fr; gap: 20px; margin-top: 28px; }
    .notes-section { background: linear-gradient(135deg, #fafafa 0%, #f0f0f0 100%); padding: 20px; border-radius: 12px; border-left: 4px solid #111; box-shadow: 0 2px 8px rgba(0,0,0,0.05); }
    .totals-section { background: linear-gradient(135deg, #111 0%, #333 100%); color: #fff; padding: 20px; border-radius: 12px; box-shadow: 0 4px 12px rgba(0,0,0,0.1); }
    .total-row { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid rgba(255,255,255,.15); font-size: 14px; }
    .total-row:last-child { border-bottom: none; margin-top: 8px; padding-top: 14px; border-top: 2px solid rgba(255,255,255,.35); font-weight: 800; font-size: 16px; }
    @media print { body { padding: 0; } .container { border: none; padding: 20px; box-shadow: none; } }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div></div>
      <div>
        <div class="invoice-title">SALES INVOICE</div>
        <div class="invoice-meta"><strong>Invoice No:</strong> ${invoiceNumber}</div>
        <div class="invoice-meta"><strong>Date:</strong> ${invoiceDate}</div>
      </div>
    </div>
    <div class="info-boxes">
      <div class="info-box">
        <div style="font-weight:800;margin-bottom:8px;">Bill To</div>
        <div style="font-size:13px;line-height:1.6">
          <strong>${selectedClient.clientName}</strong><br>
          Address: ${selectedClient.address || '-'}<br>
          GSTIN: ${selectedClient.gstin || '-'}<br>
          Phone: ${selectedClient.phone || '-'}
        </div>
      </div>
      <div class="info-box">
        <div style="font-weight:800;margin-bottom:8px;">Payment Details</div>
        <div style="font-size:13px;line-height:1.6">
          <div><strong>Payment Method:</strong> ${salesBill.paymentMethod === 'bank' ? 'Bank Transfer' : 'Cash'}</div>
          <div><strong>Status:</strong> ${salesBill.statusOfTransaction}</div>
          <div><strong>Reference No:</strong> ${salesBill.referenceNo || '-'}</div>
        </div>
      </div>
    </div>
    <div class="table-container">
      <table>
        <thead>
          <tr>
            <th>#</th>
            <th>Product</th>
            <th>Qty</th>
            <th>Unit Price (₹)</th>
            <th>Tax/Charges (₹)</th>
            <th>Line Total (₹)</th>
          </tr>
        </thead>
        <tbody>
          ${finalItems
            .map(
              (it) => `
          <tr>
            <td>${it.id}</td>
            <td>${it.productName}</td>
            <td>${it.quantity}</td>
            <td>${(it.price || 0).toFixed(2)}</td>
            <td>${(it.taxesCharges || 0).toFixed(2)}</td>
            <td>${(it.total || 0).toFixed(2)}</td>
          </tr>
          `
            )
            .join('')}
        </tbody>
      </table>
    </div>
    <div class="footer-section">
      <div class="notes-section">
        <div style="font-weight:800;margin-bottom:6px;">Notes & Terms</div>
        <div style="font-size:12px;line-height:1.7;color:#444;">Thank you for your business! Payment terms are Net 14 days from the invoice date. Please include the invoice number with your payment. For any queries, contact accounts.</div>
      </div>
      <div class="totals-section">
        <div class="total-row"><span>Subtotal:</span><span>₹ ${subTotalToShow.toFixed(2)}</span></div>
        <div class="total-row"><span>Freight:</span><span>₹ ${(billFreight || 0).toFixed(2)}</span></div>
        ${billFreightTax > 0 ? `<div class="total-row"><span>Freight Tax:</span><span>₹ ${billFreightTax.toFixed(2)}</span></div>` : ''}
        <div class="total-row"><span>Grand Total:</span><span>₹ ${grandTotalToShow.toFixed(2)}</span></div>
      </div>
    </div>
  </div>
</body>
</html>
 `
    return html
  }, [salesBill, products, clients, billSubTotal, billFreight, grandTotal, billFreightTax])

  /* ========= Submit Handler ========= */
  const handleSubmit = async (paymentData) => {
    try {
      const validRows = salesBill.products.filter((it) => it.productId && it.quantity > 0)
      const rowsDetailed = validRows.map((r) => {
        const price = Number(r.price || 0)
        const qty = Number(r.quantity || 0)
        const base = price * qty
        const taxes = (r.taxAmount || [])
          .map((t) => {
            if (typeof t === 'object') return t
            const st = settings.find((s) => `custom-${s.id}` === t)
            if (st) {
              return {
                code: `custom-${st.id}`,
                name: st.taxName,
                percentage: st.taxValue,
                value: (base * st.taxValue) / 100
              }
            }
            return null
          })
          .filter(Boolean)
        const taxTotal = taxes.reduce((a, t) => a + (t.value || 0), 0)
        const total = base + taxTotal
        return { ...r, base, taxes, taxTotal, total }
      })
      const totalBase = rowsDetailed.reduce((s, r) => s + r.base, 0)
      if (billFreight > 0 && totalBase > 0) {
        rowsDetailed.forEach((r) => {
          const share = r.base / totalBase
          const allocated = Math.round(billFreight * share * 100) / 100
          r.taxes.push({
            code: 'freightCharges',
            name: 'Freight Charges',
            percentage: 0,
            value: allocated
          })
          r.total = r.total + allocated
          r.taxTotal = r.taxTotal + allocated
        })
        const allocatedSum = rowsDetailed.reduce(
          (s, r) => s + (r.taxes.find((t) => t.code === 'freightCharges')?.value || 0),
          0
        )
        const drift = Math.round((billFreight - allocatedSum) * 100) / 100
        if (Math.abs(drift) >= 0.01) {
          rowsDetailed[0].taxes = rowsDetailed[0].taxes.map((t) =>
            t.code === 'freightCharges' ? { ...t, value: t.value + drift } : t
          )
          rowsDetailed[0].total += drift
          rowsDetailed[0].taxTotal += drift
        }
      }
      // Freight tax allocation
      const totalFreightTax = billFreightTax
      if (totalFreightTax > 0 && totalBase > 0) {
        salesBill.freightTaxAmount.forEach((ft) => {
          const ftValueTotal = ft.value
          let allocatedSumFt = 0
          rowsDetailed.forEach((r) => {
            const share = r.base / totalBase
            const allocatedFt = Math.round(ftValueTotal * share * 100) / 100
            r.taxes.push({
              code: `freightTax-${ft.id}`,
              name: `${ft.name} on Freight`,
              percentage: ft.rate,
              value: allocatedFt
            })
            r.total += allocatedFt
            r.taxTotal += allocatedFt
            allocatedSumFt += allocatedFt
          })
          const driftFt = Math.round((ftValueTotal - allocatedSumFt) * 100) / 100
          if (Math.abs(driftFt) >= 0.01) {
            const firstFt = rowsDetailed[0].taxes.find((t) => t.code === `freightTax-${ft.id}`)
            if (firstFt) firstFt.value += driftFt
            rowsDetailed[0].total += driftFt
            rowsDetailed[0].taxTotal += driftFt
          }
        })
      }
      let paidDistribution = []
      const totalBillAmount = rowsDetailed.reduce((s, r) => s + r.total, 0)
      if (salesBill.statusOfTransaction !== 'completed') {
        paidDistribution = rowsDetailed.map(() => 0)
      } else {
        if (salesBill.paymentType === 'full') {
          paidDistribution = rowsDetailed.map((r) => Math.round(r.total * 100) / 100)
        } else if (salesBill.paymentType === 'partial') {
          const totalToDistribute = Number(salesBill.paidAmount || 0)
          let runningAllocated = 0
          rowsDetailed.forEach((r, i) => {
            if (i === rowsDetailed.length - 1) {
              const leftover = Math.round((totalToDistribute - runningAllocated) * 100) / 100
              paidDistribution.push(leftover)
              runningAllocated += leftover
            } else {
              const share = totalBillAmount > 0 ? r.total / totalBillAmount : 0
              const allocated = Math.round(totalToDistribute * share * 100) / 100
              paidDistribution.push(allocated)
              runningAllocated += allocated
            }
          })
        } else {
          paidDistribution = rowsDetailed.map(() => 0)
        }
      }
      const clientInfo = clients.find((c) => c.id === salesBill.clientId)
      const clientAccountName = clientInfo?.clientName || `Client-${salesBill.clientId}`
      const createdTransactionIds = []
      for (let i = 0; i < rowsDetailed.length; i++) {
        const row = rowsDetailed[i]
        const itemPaid = Number(paidDistribution[i] || 0)
        const sellAmount = Math.round(row.total * 100) / 100
        const pendingAmount =
          salesBill.paymentType === 'full'
            ? 0
            : salesBill.paymentType === 'partial'
              ? Math.max(0, Math.round((sellAmount - itemPaid) * 100) / 100)
              : sellAmount
        const allocatedFreight = row.taxes.find((t) => t.code === 'freightCharges')?.value || 0
        const allocatedFreightTaxes = row.taxes
          .filter((t) => t.code.startsWith('freightTax-'))
          .map((t) => ({
            id: t.code.split('-')[2],
            name: t.name.replace(' on Freight', ''),
            rate: t.percentage,
            value: t.value
          }))
        const transactionData = {
          clientId: salesBill.clientId,
          productId: row.productId,
          multipleProducts: rowsDetailed,
          quantity: Number(row.quantity),
          sellAmount: Number(row.price),
          purchaseAmount: sellAmount,
          paymentType: salesBill.paymentType,
          paymentMethod: salesBill.paymentMethod,
          billNo: salesBill.billNumber,
          statusOfTransaction: salesBill.statusOfTransaction,
          pageName: 'Sales',
          transactionType: 'sales',
          pendingAmount: pendingAmount,
          freightCharges: allocatedFreight,
          freightTaxAmount: allocatedFreightTaxes,
          paidAmount: itemPaid,
          dueDate: new Date().setMonth(new Date().getMonth() + 1),
          taxAmount: row.taxes.map((t) => ({ ...t })) || [],
          date: salesBill.billDate || new Date().toISOString().slice(0, 19).replace('T', ' '),
          isMultiProduct: rowsDetailed.length > 1 ? 1 : 0,
          sendTo: paymentData?.sendTo || salesBill.sendTo || '',
          chequeNumber: paymentData?.chequeNumber || '',
          transactionAccount: paymentData?.transactionAccount || '',
          pendingFromOurs: Number(0),
          description: `Sales of ${products.find((p) => p.id === row.productId)?.name || ''}`,
          type: 'Receipt',
          cash: salesBill.paymentMethod === 'cash' ? 'Cash' : '',
          bank: salesBill.paymentMethod === 'bank' ? 'IDBI' : '',
          totalAmount: Number(row.price) + allocatedFreight + allocatedFreightTaxes
        }
        const createdTransaction = await window.api.createTransaction(transactionData)
        createdTransactionIds.push(createdTransaction.id)
        if (itemPaid > 0) {
          const baseReceipt = {
            transactionId: createdTransaction.id,
            type: 'Receipt',
            date: salesBill.billDate || new Date().toISOString().slice(0, 19).replace('T', ' '),
            statusOfTransaction: createdTransaction.statusOfTransaction,
            clientId: createdTransaction.clientId,
            paymentType: createdTransaction.paymentType,
            party: clients.find((c) => c.id === salesBill.clientId)?.clientName || 'Unknown Client',
            amount: itemPaid,
            description: `Sales ${products.find((p) => p.id === row.productId)?.name || ''} to ${clientInfo?.clientName || 'Unknown'}`,
            taxAmount: row.taxes || [],
            dueDate: null,
            productId: createdTransaction.productId || '',
            pendingAmount: createdTransaction.pendingAmount || 0,
            paidAmount: createdTransaction.paidAmount || 0,
            sendTo: paymentData?.sendTo || salesBill.sendTo || '',
            chequeNumber: paymentData?.chequeNumber || '',
            transactionAccount: paymentData?.transactionAccount || ''
          }
          if (salesBill.paymentMethod === 'bank') {
            await window.api
              .createBankReceipt({
                ...baseReceipt,
                bank: 'IDBI',
                sendTo: paymentData?.sendTo || '',
                amount: itemPaid
              })
              .catch((e) => {
                console.error('createBankReceipt failed', e)
              })
          } else {
            await window.api
              .createCashReceipt({
                ...baseReceipt,
                cash: 'Cash',
                sendTo: paymentData?.sendTo || '',
                amount: itemPaid
              })
              .catch((e) => {
                console.error('createCashReceipt failed', e)
              })
          }
        }
      }
      // Create a single ledger entry for the total sales (managing multiple product entries as aggregate)
      const totalAmount = totalBillAmount
      const SALES_ACCOUNT_ID = 3 // Assuming Sales account ID is 3; adjust as needed
      let salesAccount = null
      try {
        salesAccount = await window.api.getAccountById(SALES_ACCOUNT_ID)
      } catch (err) {
        console.warn('Failed to fetch Sales account', err)
      }
      const salesAccountName = salesAccount ? salesAccount.accountName : 'Sales'
      const salesLedgerTx = {
        debitAccount: salesAccountName,
        creditAccount: clientAccountName,
        amount: totalAmount,
        paymentMethod: 'credit',
        description: `Sales bill ${salesBill.billNumber || 'N/A'} to ${clientAccountName}`,
        referenceId: nextBillId,
        createdAt: new Date().toISOString()
      }
      try {
        if (typeof window.api.createLedgerTransaction === 'function') {
          await window.api.createLedgerTransaction(salesLedgerTx)
        } else {
          console.warn(
            'createLedgerTransaction not available on window.api; skipping sales ledger creation.'
          )
        }
      } catch (err) {
        console.error('Failed to create sales ledger transaction', err)
        toast.warn('Sales ledger transaction creation failed (check console).')
      }
      const transactionsAll = await window.api.getAllTransactions()
      dispatch(setTransactions(transactionsAll))
      toast.success('All sales items added successfully')
      setShowSalesBillModal(false)
    } catch (err) {
      console.error('Error saving sales bill', err)
      toast.error('Error saving sales bill: ' + (err.message || err))
    }
  }
  const handleUpdate = async (paymentData) => {
    try {
      if (!existingTransaction) {
        toast.error('No transaction found to update.')
        return
      }
      const validRows = salesBill.products.filter((p) => p.productId && p.quantity > 0)
      if (validRows.length === 0) {
        toast.error('Add at least one product')
        return
      }

      // Recalculate rows (unchanged)
      const rowsDetailed = validRows.map((r) => {
        const price = Number(r.price || 0)
        const qty = Number(r.quantity || 0)
        const base = price * qty
        const taxes = (r.taxAmount || []).map((t) => {
          const st = settings.find((s) => `custom-${s.id}` === t.code)
          const percentage = st?.taxValue ?? t.percentage ?? 0
          return {
            code: t.code,
            name: st?.taxName || t.name,
            percentage,
            value: (base * percentage) / 100
          }
        })
        const taxTotal = taxes.reduce((a, t) => a + (t.value || 0), 0)
        return { ...r, base, taxes, taxTotal, total: base + taxTotal }
      })

      const totalBase = rowsDetailed.reduce((s, r) => s + r.base, 0)
      let totalBillAmount = totalBase

      // Allocate freight proportionally (unchanged)
      const billFreight = Number(salesBill.freightCharges || 0)
      if (billFreight > 0 && totalBase > 0) {
        rowsDetailed.forEach((r) => {
          const share = r.base / totalBase
          const allocated = Math.round(billFreight * share * 100) / 100
          r.taxes.push({
            // Add as tax for consistency with calculateTotalWithTax filter
            code: 'freightCharges',
            name: 'Freight Charges',
            percentage: 0,
            value: allocated
          })
          r.total += allocated
          r.taxTotal += allocated
        })
        // Fix drift (add to first row if needed)
        const allocatedSum = rowsDetailed.reduce(
          (s, r) => s + (r.taxes.find((t) => t.code === 'freightCharges')?.value || 0),
          0
        )
        const drift = Math.round((billFreight - allocatedSum) * 100) / 100
        if (Math.abs(drift) >= 0.01) {
          const firstFreight = rowsDetailed[0].taxes.find((t) => t.code === 'freightCharges')
          if (firstFreight) firstFreight.value += drift
          rowsDetailed[0].total += drift
          rowsDetailed[0].taxTotal += drift
        }
        totalBillAmount += billFreight
      }

      // Allocate freight tax (unchanged, but push to taxes array for filter compatibility)
      const billFreightTax = (salesBill.freightTaxAmount || []).reduce(
        (s, t) => s + (t?.value || 0),
        0
      )
      if (billFreightTax > 0 && totalBase > 0) {
        salesBill.freightTaxAmount.forEach((ft) => {
          const ftValueTotal = ft.value
          let allocatedSumFt = 0
          rowsDetailed.forEach((r) => {
            const share = r.base / totalBase
            const allocatedFt = Math.round(ftValueTotal * share * 100) / 100
            r.taxes.push({
              code: `freightTax-${ft.id}`,
              name: `${ft.name} on Freight`,
              percentage: ft.rate,
              value: allocatedFt
            })
            r.total += allocatedFt
            r.taxTotal += allocatedFt
            allocatedSumFt += allocatedFt
          })
          const driftFt = Math.round((ftValueTotal - allocatedSumFt) * 100) / 100
          if (Math.abs(driftFt) >= 0.01) {
            const firstFt = rowsDetailed[0].taxes.find((t) => t.code === `freightTax-${ft.id}`)
            if (firstFt) firstFt.value += driftFt
            rowsDetailed[0].total += driftFt
            rowsDetailed[0].taxTotal += driftFt
          }
        })
        totalBillAmount += billFreightTax
      }

      // Paid/pending logic (unchanged)
      let totalPaid = 0
      if (salesBill.paymentType === 'full') {
        totalPaid = totalBillAmount
      } else if (salesBill.paymentType === 'partial') {
        totalPaid = Number(salesBill.paidAmount || 0)
      }

      // Fetch and update related transactions (unchanged)
      const allTransactions = await window.api.getAllTransactions()
      const relatedTransactions = allTransactions.filter(
        (tx) =>
          tx.billNo === existingTransaction.billNo &&
          tx.clientId === existingTransaction.clientId &&
          tx.pageName === 'Sales'
      )

      // Delete old receipts (unchanged)
      for (const tx of relatedTransactions) {
        if (tx.paymentMethod === 'cash') {
          await window.api.deleteCashReceiptByTransaction(tx.id).catch(() => {})
        } else {
          await window.api.deleteBankReceiptByTransaction(tx.id).catch(() => {})
        }
      }

      // Update/create each transaction (minor tweak: use updated taxes with allocations)
      for (let i = 0; i < rowsDetailed.length; i++) {
        const row = rowsDetailed[i]
        const itemTotal = row.total
        const itemPaid =
          salesBill.paymentType === 'full'
            ? itemTotal
            : salesBill.paymentType === 'partial'
              ? Math.round((itemTotal / totalBillAmount) * totalPaid * 100) / 100
              : 0
        const pending = Math.max(0, itemTotal - itemPaid)
        let targetTx = relatedTransactions[i]

        const allocatedFreight = row.taxes.find((t) => t.code === 'freightCharges')?.value || 0

        const allocatedFreightTaxes = row.taxes
          .filter((t) => t.code.startsWith('freightTax-'))
          .map((t) => ({
            id: t.code.split('-')[2],
            name: t.name.replace(' on Freight', ''),
            rate: t.percentage,
            value: Number(t.value || 0)
          }))

        const updatedTxData = {
          id: targetTx?.id || existingTransaction.id,
          clientId: salesBill.clientId,
          productId: row.productId,
          multipleProducts: rowsDetailed,
          quantity: row.quantity,
          sellAmount: row.price,
          purchaseAmount: itemTotal, // Now includes new charges
          paymentType: salesBill.paymentType,
          paymentMethod: salesBill.paymentMethod,
          billNo: salesBill.billNumber,
          statusOfTransaction: salesBill.statusOfTransaction,
          pageName: 'Sales',
          transactionType: 'sales',
          pendingAmount: pending,
          dueDate: new Date().setMonth(new Date().getMonth() + 1),
          paidAmount: itemPaid,
          taxAmount: row.taxes, // Includes allocated freight/taxes (filtered later by calculateTotalWithTax)
          freightCharges: row.taxes.find((t) => t.code === 'freightCharges')?.value || 0, // Per-row allocation
          freightTaxAmount: allocatedFreightTaxes,
          date: salesBill.billDate || new Date().toISOString().slice(0, 10),
          isMultiProduct: rowsDetailed.length > 1 ? 1 : 0,
          sendTo: paymentData?.sendTo || salesBill.sendTo || '',
          chequeNumber: paymentData?.chequeNumber || '',
          transactionAccount: paymentData?.transactionAccount || '',
          pendingFromOurs: Number(0),
          description: `Sales of ${products.find((p) => p.id === row.productId)?.name || ''}`,
          type: 'Receipt',
          cash: salesBill.paymentMethod === 'cash' ? 'Cash' : '',
          bank: salesBill.paymentMethod === 'bank' ? 'IDBI' : '',
          totalAmount: Number(row.price) + allocatedFreight + allocatedFreightTaxes
        }

        if (targetTx) {
          await window.api.updateTransaction(updatedTxData)
        } else {
          await window.api.createTransaction(updatedTxData)
        }

        // Recreate receipt if paid > 0 (unchanged)
        if (itemPaid > 0) {
          const receiptBase = {
            transactionId: targetTx?.id || existingTransaction.id,
            type: 'Receipt',
            date: salesBill.billDate || new Date().toISOString().slice(0, 19).replace('T', ' '),
            statusOfTransaction: salesBill.statusOfTransaction,
            clientId: salesBill.clientId,
            paymentType: salesBill.paymentType,
            party: clients.find((c) => c.id === salesBill.clientId)?.clientName || 'Unknown',
            amount: itemPaid,
            description: `Sales of ${products.find((p) => p.id === row.productId)?.name || ''}`,
            productId: row.productId,
            taxAmount: row.taxes,
            pageName: 'Sales',
            pendingAmount: pending,
            paidAmount: itemPaid,
            sendTo: paymentData?.sendTo || '',
            chequeNumber: paymentData?.chequeNumber || '',
            transactionAccount: paymentData?.transactionAccount || '',
            billNo: salesBill.billNumber
          }
          if (salesBill.paymentMethod === 'bank') {
            await window.api.createBankReceipt({ ...receiptBase, bank: 'IDBI', amount: itemPaid })
          } else {
            await window.api.createCashReceipt({ ...receiptBase, cash: 'Cash', amount: itemPaid })
          }
        }
      }

      // NEW: Sync Ledger (delete old + create new with updated totalBillAmount)
      const clientInfo = clients.find((c) => c.id === salesBill.clientId)
      const clientAccountName = clientInfo?.clientName || `Client-${salesBill.clientId}`
      const SALES_ACCOUNT_ID = 3 // Adjust as needed
      let salesAccount = null
      try {
        salesAccount = await window.api.getAccountById(SALES_ACCOUNT_ID)
      } catch (err) {
        console.warn('Failed to fetch Sales account', err)
      }
      const salesAccountName = salesAccount ? salesAccount.accountName : 'Sales'

      // Step 1: Delete old ledger(s) for this bill
      try {
        // TODO: Implement if missing—e.g., backend query: WHERE description LIKE '%billNumber%' AND creditAccount = clientAccountName
        const oldLedgers =
          (await window.api.getLedgerTransactionsByBill?.(
            salesBill.billNumber,
            clientAccountName
          )) || []
        console.log(`Deleting ${oldLedgers.length} old ledgers for bill ${salesBill.billNumber}`) // Debug
        for (const oldLedger of oldLedgers) {
          await window.api.deleteLedgerTransaction(oldLedger.id).catch((err) => {
            console.warn(`Failed to delete ledger ${oldLedger.id}:`, err)
          })
        }
      } catch (err) {
        console.error('Ledger cleanup failed:', err)
        toast.warn('Old ledger cleanup skipped—totals may drift. Check console.')
      }

      // Step 2: Create new ledger with updated total (includes new charges)
      const ledgerTx = {
        debitAccount: salesAccountName,
        creditAccount: clientAccountName,
        amount: totalBillAmount, // Full updated total—now reflects added charges
        paymentMethod: 'credit',
        description: `Sales bill ${salesBill.billNumber} to ${clientAccountName}`,
        referenceId: existingTransaction.id || nextBillId,
        createdAt: new Date().toISOString()
      }
      try {
        if (typeof window.api.createLedgerTransaction === 'function') {
          await window.api.createLedgerTransaction(ledgerTx)
          console.log(`Created ledger for updated bill total: ₹${totalBillAmount}`) // Debug
        } else {
          console.warn('createLedgerTransaction unavailable—skipping ledger sync.')
        }
      } catch (err) {
        console.error('Ledger creation failed:', err)
        toast.warn('Ledger update failed—added amounts may not reflect in reports.')
      }

      toast.success('Sales bill updated successfully!')
      const list = await window.api.getAllTransactions()
      dispatch(setTransactions(list))
      setShowSalesBillModal(false)
    } catch (err) {
      console.error('Update failed:', err)
      toast.error('Update failed')
    }
  }
  /* ========= Next Handler ========= */
  const handleNext = async () => {
    if (!validateForm()) return
    setShowPaymentModal(true)
  }
  const [accounts, setAccounts] = useState([])
  useEffect(() => {
    const fetchAccounts = async () => {
      const accounts = await window.api.getAllAccounts()
      setAccounts(accounts)
    }
    fetchAccounts()
  }, [])
  const cashAccount = accounts.find((acc) => acc.accountName.toUpperCase() === 'CASH ACCOUNT')
  const bankAccount = accounts.find((acc) => acc.accountName.toUpperCase() === 'BANK ACCOUNT')
  const CASH_ACCOUNT_ID = cashAccount?.id
  const BANK_ACCOUNT_ID = bankAccount?.id
  const handlePaymentConfirm = async (paymentData) => {
    try {
      // Update local state for UI only
      setSalesBill((prev) => ({
        ...prev,
        paymentMethod: paymentData.method,
        referenceNo: paymentData.account,
        sendTo: paymentData.sendTo, // Option B stored here
        paidAmount: salesBill.statusOfTransaction === 'completed' ? paymentData.amount : 0
      }))
      // Payment amount that actually changed (for ledger & account update)
      const amount = Number(paymentData.amount || 0)
      if (amount <= 0) {
        toast.error('Payment amount must be greater than zero.')
        return
      }
      let sourceAccountId = null
      if (paymentData.account) {
        sourceAccountId = paymentData.account
      } else if (paymentData.method === 'cash') {
        sourceAccountId = CASH_ACCOUNT_ID
      } else {
        sourceAccountId = BANK_ACCOUNT_ID
      }
      // Try to fetch source account (if exists)
      let sourceAccount = null
      try {
        if (typeof window.api.getAccountById === 'function') {
          sourceAccount = await window.api.getAccountById(sourceAccountId)
        } else if (typeof accountApi.getAccountById === 'function') {
          // fallback to REST api wrapper if available
          sourceAccount = await accountApi.getAccountById(sourceAccountId)
        } else {
          // no API to fetch account, leave sourceAccount null
          console.warn('No getAccountById available on window.api or accountApi')
        }
      } catch (err) {
        console.warn('Failed to fetch account by id', sourceAccountId, err)
      }
      // Determine source account display name for ledger
      let fromAccountName = paymentData.sendTo || (sourceAccount ? sourceAccount.accountName : null)
      // Prepare ledger transaction object:
      // debitAccount: client (we're paying supplier/client)
      // creditAccount: source (bank/cash/check)
      // amount: amount
      const clientInfo = clients.find((c) => c.id === salesBill.clientId)
      const clientAccountName = clientInfo?.clientName || `Client-${salesBill.clientId}`
      const ledgerTx = {
        debitAccount: clientAccountName,
        creditAccount: fromAccountName || `Account-${sourceAccountId}`,
        amount: amount,
        paymentMethod: paymentData.method || salesBill.paymentMethod || 'bank',
        description: `Sales payment via ${paymentData.method || 'bank'} for Bill ${salesBill.billNumber || ''}`,
        referenceId: nextBillId,
        createdAt: new Date().toISOString()
      }
      // Update source account balance (subtract amount)
      // if (sourceAccount) {
      // try {
      // // ensure numeric balance
      // const prevBal = Number(sourceAccount.balance || 0)
      // const newBal = Math.round((prevBal - amount) * 100) / 100
      // const updatedAccount = { ...sourceAccount, balance: newBal }
      // // call update API
      // if (typeof window.api.updateAccount === 'function') {
      // const response = await window.api.updateAccount(updatedAccount)
      // dispatch(setAccount(response))
      // } else if (typeof accountApi.updateAccount === 'function') {
      // const response = await accountApi.updateAccount(updatedAccount)
      // dispatch(setAccount(response))
      // } else {
      // console.warn('No updateAccount method found on window.api or accountApi')
      // }
      // } catch (err) {
      // console.error('Failed to update source account balance', err)
      // // continue but warn user
      // toast.warn('Failed to update source account balance (check console).')
      // }
      // } else {
      // // If no account object available (maybe external cash), you can still create ledger tx with label
      // console.warn('Source account not found, ledger will be created with name only.')
      // }
      // Create ledger transaction record
      try {
        if (typeof window.api.createLedgerTransaction === 'function') {
          await window.api.createLedgerTransaction(ledgerTx)
        } else {
          console.warn(
            'createLedgerTransaction not available on window.api; skipping ledger creation.'
          )
        }
      } catch (err) {
        console.error('Failed to create ledger transaction', err)
        toast.warn('Ledger transaction creation failed (check console).')
      }
      // Continue with existing sales submission which will create receipts & transactions for each row.
      // Pass paymentData so handleSubmit uses sendTo/amount etc.
      if (isUpdateExpense) {
        await handleUpdate(paymentData) // Now passes paymentData with sendTo
      } else {
        await handleSubmit(paymentData)
      }
      setShowPaymentModal(false)
    } catch (error) {
      console.error('Payment processing failed:', error)
      toast.error('Payment processing failed')
    }
  }
  // 🧾 PDF Export Handler
  const handlePdfExport = useCallback(() => {
    const html = generateInvoiceHtml()
    if (!html) {
      toast.error('No valid data for PDF')
      return
    }
    const opt = {
      filename: `sales-invoice-${new Date().toISOString().slice(0, 10)}.pdf`,
      margin: [10, 10, 10, 10],
      html2canvas: { scale: 2, useCORS: true },
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
    }
    html2pdf()
      .set(opt)
      .from(html)
      .save()
      .catch((err) => {
        console.error('PDF generation failed', err)
        toast.error('Failed to generate PDF. Check console for details.')
      })
  }, [generateInvoiceHtml])
  const formatTransactionId = (id) => {
    if (!id) return ''
    const padded = id.toString().padStart(6, '0')
    return `SB${padded}`
  }
  // --- Framer Motion variants for modal and panels ---
  const modalVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1 },
    exit: { opacity: 0 }
  }
  const panelVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { duration: 0.15, ease: 'easeOut' } },
    exit: { opacity: 0, transition: { duration: 0.1 } }
  }
  useEffect(() => {
    if (isUpdateExpense && existingTransaction && showPaymentModal) {
      // Fetch existing receipt to get sendTo, etc.
      const fetchExistingReceipt = async () => {
        try {
          let existingReceipt
          if (existingTransaction.paymentMethod === 'cash') {
            existingReceipt = await window.api.getCashReceiptByTransactionId(existingTransaction.id)
          } else {
            existingReceipt = await window.api.getBankReceiptByTransactionId(existingTransaction.id)
          }
          if (existingReceipt) {
            // Set local state or pass to modal (e.g., via props or context)
            setSalesBill((prev) => ({
              ...prev,
              sendTo: existingReceipt.sendTo || ''
              // Add other fields like chequeNumber if needed
            }))
            // If modal has internal state, you may need to expose a prop like initialSendTo
          }
        } catch (err) {
          console.error('Failed to fetch existing receipt:', err)
        }
      }
      fetchExistingReceipt()
    }
  }, [isUpdateExpense, existingTransaction, showPaymentModal])
  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-50 bg-black/30 flex items-center justify-center print:hidden backdrop-blur-md pointer-events-auto"
        variants={modalVariants}
        initial="hidden"
        animate="visible"
        exit="exit"
      >
        {productModal && (
          <ProductModal
            isUpdateExpense={false}
            setShowModal={() => setProductModal(false)}
            type="product"
          />
        )}
        {clientModal && (
          <ClientModal
            isUpdateExpense={false}
            setShowModal={() => setClientModal(false)}
            type="client"
          />
        )}
        {showPaymentModal && (
          <PaymentMethod
            overflow
            open={showPaymentModal}
            grandTotal={grandTotal}
            clientId={salesBill.clientId}
            clientName={clients.find((c) => c.id === salesBill.clientId)?.clientName || ''}
            setOpen={setShowPaymentModal}
            onConfirm={handlePaymentConfirm}
          />
        )}
        <div
          id="purchase-bill-container"
          className="w-full h-full flex items-center justify-center relative"
        >
          <motion.div
            layout={false}
            variants={panelVariants}
            className="flex flex-col lg:flex-row gap-2 mx-4 w-full max-w-[95vw] lg:max-w-[1400px]"
          >
            {/* ===== Main Form Panel ===== */}
            <motion.div className="bg-white backdrop-blur-lg flex-1 rounded-3xl shadow-xl p-6 overflow-y-auto max-h-[95vh] ring-1 ring-white/30 border border-white/20 customScrollbar">
              <div className="flex justify-between items-center mb-8">
                <div className="flex gap-2">
                  <div className="flex items-center gap-3">
                    <div>
                      <p className="text-2xl font-bold text-gray-900">
                        {isUpdateExpense ? 'Update Sales Bill' : 'Create Sales Bill'}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 bg-white/40 text-indigo-700 font-medium p-2 text-sm rounded-full px-3 ring-1 ring-indigo-200">
                    <FileText size={16} />
                    {formatTransactionId(nextBillId)}
                  </div>
                </div>
                <button
                  className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-100/50 rounded-full transition-all duration-200"
                  onClick={() => setShowSalesBillModal(false)}
                  aria-label="Close modal"
                >
                  <CircleX size={24} />
                </button>
              </div>
              <form className="space-y-8">
                {/* Top row */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div className="relative">
                    <label className="block text-sm font-semibold mb-2 text-gray-700 flex items-center gap-2">
                      <User size={16} className="text-indigo-500" />
                      Client
                    </label>
                    <SelectPicker
                      data={clients.map((c) => ({ label: c.clientName, value: c.id }))}
                      value={salesBill.clientId}
                      onChange={(v) => setSalesBill((prev) => ({ ...prev, clientId: v }))}
                      placeholder="Select a client..."
                      style={{ width: '100%' }}
                      container={() => document.getElementById('purchase-bill-container')}
                      menuStyle={{
                        zIndex: 99999,
                        position: 'absolute',
                        borderRadius: '12px',
                        overflow: 'hidden'
                      }}
                      virtualized={true}
                      className="[&_.rs-picker-toggle]:rounded-xl 0 [&_.rs-picker-toggle]:border-white/50 [&_.rs-picker-toggle]:bg-white/50 [&_.rs-picker-toggle]:shadow-sm hover:[&_.rs-picker-toggle]:bg-white/70 hover:[&_.rs-picker-toggle]:ring-1 hover:[&_.rs-picker-toggle]:ring-indigo-200"
                      renderExtraFooter={() => (
                        <div className="px-4 py-2 border-t border-gray-200 bg-gray-50">
                          <p
                            className="text-indigo-600 text-sm font-semibold tracking-wide cursor-pointer hover:text-indigo-700 transition-colors flex items-center gap-1"
                            onClick={() => setClientModal(true)}
                          >
                            <Plus size={14} /> Create New Client
                          </p>
                        </div>
                      )}
                    />
                  </div>
                  <div className="relative">
                    <label className="block text-sm font-semibold mb-2 text-gray-700 flex items-center gap-2">
                      <FileText size={16} className="text-gray-500" />
                      Bill Number
                    </label>
                    <Input
                      value={salesBill.billNumber}
                      onChange={(v) => setSalesBill((prev) => ({ ...prev, billNumber: v }))}
                      placeholder="Enter bill number"
                      style={{ width: '100%' }}
                      className="!rounded-lg border-white/50 bg-white/50 shadow-sm focus:ring-2 focus:ring-indigo-200 focus:bg-white/70"
                      ref={inputRef}
                    />
                  </div>
                  <div className="relative">
                    <label className="block text-sm font-semibold mb-2 text-gray-700 flex items-center gap-2">
                      <Calendar size={16} className="text-blue-500" />
                      Bill Date
                    </label>
                    <input
                      type="date"
                      value={salesBill.billDate}
                      onChange={(e) =>
                        setSalesBill((prev) => ({
                          ...prev,
                          billDate: e.target.value
                        }))
                      }
                      className="w-full rounded-lg border border-gray-300 bg-white/50 shadow-sm focus:ring-2 focus:ring-indigo-200 focus:outline-none h-10 px-3"
                    />
                  </div>
                </div>
                {/* Product list */}
                <motion.div className="bg-white rounded-2xl shadow-md border border-gray-200 transition-all duration-300 hover:shadow-lg overflow-auto customScrollbar">
                  <table className="w-full table-fixed border-collapse rounded-2xl">
                    <colgroup>
                      <col className="w-[250px]" /> {/* Product */}
                      <col className="w-[200px]" /> {/* Qty */}
                      <col className="w-[250px]" /> {/* Price */}
                      <col className="w-[300px]" /> {/* Taxes */}
                      <col className="w-[250px]" /> {/* Total */}
                      <col className="w-[350px]" /> {/* Description */}
                      <col className="w-[150px]" /> {/* Action */}
                    </colgroup>
                    <thead className="bg-gradient-to-r from-gray-50 to-gray-100 sticky top-0 z-10">
                      <tr className="text-gray-700">
                        {TABLE_HEADERS.map((header) => {
                          const Icon = header.icon
                          return (
                            <th
                              key={header.key}
                              className="px-6 py-3 border-b border-gray-200 font-semibold text-left"
                            >
                              <div className="flex items-center gap-2">
                                <Icon size={16} className="text-gray-500" />
                                <span className="tracking-wide text-sm">{header.label}</span>
                              </div>
                            </th>
                          )
                        })}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {salesBill.products.map((row, index) => (
                        <SalesRow
                          key={`${row.productId}-${index}`}
                          index={index}
                          row={row}
                          products={products}
                          settings={settings}
                          onChange={handleProductChange}
                          onRemove={handleRemoveRow}
                          toThousands={toThousands}
                        />
                      ))}
                    </tbody>
                  </table>
                  <div className="flex justify-center p-4">
                    <button
                      type="button"
                      onClick={handleAddRow}
                      className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                    >
                      <Plus size={16} />
                      Add Product Row
                    </button>
                  </div>
                </motion.div>
                {/* Payment & Freight */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <motion.div className="bg-white rounded-2xl shadow-md border border-gray-200 transition-all duration-300 hover:shadow-lg overflow-auto customScrollbar">
                    <div className="flex items-center justify-between p-4 bg-white/60 rounded-xl border border-indigo-100">
                      <span className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                        <CreditCard size={16} className="text-indigo-500" />
                        Payment Status
                      </span>
                      <Toggle
                        size="lg"
                        checkedChildren="Completed"
                        unCheckedChildren="Pending"
                        checked={salesBill.statusOfTransaction === 'completed'}
                        onChange={(checked) =>
                          setSalesBill((prev) => {
                            if (checked) {
                              // Force full on completed
                              return {
                                ...prev,
                                statusOfTransaction: 'completed',
                                paymentType: 'full',
                                paidAmount: grandTotal
                              }
                            }
                            return { ...prev, statusOfTransaction: 'pending' }
                          })
                        }
                        className="data-[checked=true]:bg-green-500"
                      />
                    </div>
                    <div className="flex flex-wrap items-center gap-6 p-4 bg-white/60 rounded-xl border border-gray-100">
                      <Checkbox
                        checked={salesBill.paymentType === 'partial'}
                        onChange={(_, checked) =>
                          setSalesBill((prev) => ({
                            ...prev,
                            paymentType: checked ? 'partial' : 'full'
                          }))
                        }
                        className="text-sm font-medium"
                      >
                        Partial Payment
                      </Checkbox>
                      <Checkbox
                        checked={salesBill.paymentMethod === 'cash'}
                        onChange={(_, checked) =>
                          setSalesBill((prev) => ({
                            ...prev,
                            paymentMethod: checked ? 'cash' : 'bank'
                          }))
                        }
                        className="text-sm font-medium"
                      >
                        Cash Payment
                      </Checkbox>
                    </div>
                    <Animation.Collapse in={salesBill.paymentType === 'partial'}>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-6 bg-white/70 rounded-xl border border-gray-200 shadow-inner">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Paid Amount
                          </label>
                          <InputNumber
                            prefix="₹"
                            value={salesBill.paidAmount}
                            onChange={(val) =>
                              setSalesBill((prev) => ({
                                ...prev,
                                paidAmount: Number(val) || 0
                              }))
                            }
                            className="w-full [&_.rs-input-number-btn-group]:hidden [&_.rs-input]:h-12 [&_.rs-input]:rounded-xl [&_.rs-input]:shadow-sm"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Pending Amount
                          </label>
                          <InputNumber
                            prefix="₹"
                            value={Math.max(0, grandTotal - (salesBill.paidAmount || 0))}
                            disabled
                            className="w-full [&_.rs-input-number-btn-group]:hidden [&_.rs-input]:h-12 [&_.rs-input]:rounded-xl [&_.rs-input]:shadow-sm bg-gray-100/50"
                          />
                        </div>
                      </div>
                    </Animation.Collapse>
                  </motion.div>
                  <motion.div className="bg-white rounded-2xl shadow-md border border-gray-200 transition-all duration-300 hover:shadow-lg overflow-auto customScrollbar">
                    <div className="p-4 bg-white/60 rounded-xl border border-green-100">
                      <label className="block text-sm font-semibold mb-2 text-gray-700 flex items-center gap-2">
                        <Truck size={16} className="text-green-500" />
                        Freight Charges
                      </label>
                      <InputNumber
                        prefix="₹"
                        value={salesBill.freightCharges}
                        onChange={(v) =>
                          setSalesBill((prev) => {
                            const freight = Number(v) || 0
                            const updatedTaxes = (prev.freightTaxAmount || []).map((tax) => ({
                              ...tax,
                              value: (freight * tax.rate) / 100
                            }))
                            return {
                              ...prev,
                              freightCharges: freight,
                              freightTaxAmount: updatedTaxes
                            }
                          })
                        }
                        className="w-full [&_.rs-input-number-btn-group]:hidden p-0.5 [&_.rs-input]:rounded-xl"
                      />
                    </div>
                    <div className="p-4 bg-white/60 rounded-xl border border-gray-100">
                      <label className="block text-sm font-semibold mb-2 text-gray-700">
                        Freight Tax
                      </label>
                      <CheckPicker
                        data={settings.map((t) => ({
                          label: `${t.taxName} (${t.taxValue}%)`,
                          value: t.id,
                          rate: t.taxValue,
                          name: t.taxName
                        }))}
                        value={salesBill.freightTaxAmount?.map((t) => t.id) || []}
                        placement="top"
                        placeholder="Select Freight Taxes"
                        virtualized={false}
                        preventOverflow={false}
                        container={() => document.getElementById('purchase-bill-container')}
                        menuMaxHeight={200}
                        menuStyle={{ zIndex: 99999, position: 'absolute' }}
                        className="w-full max-w-xs [&_.rs-picker-toggle]:rounded-lg [&_.rs-picker-toggle]:border-gray-300/50 [&_.rs-picker-toggle]:bg-white/50 hover:[&_.rs-picker-toggle]:bg-white/70"
                        onChange={(selectedIds) => {
                          if (!selectedIds || selectedIds.length === 0) {
                            setSalesBill((prev) => ({ ...prev, freightTaxAmount: [] }))
                            return
                          }
                          const selectedTaxes = settings.filter((t) => selectedIds.includes(t.id))
                          const updatedFreightTaxes = selectedTaxes.map((t) => ({
                            id: t.id,
                            name: t.taxName,
                            rate: t.taxValue,
                            value: ((salesBill.freightCharges || 0) * t.taxValue) / 100
                          }))
                          setSalesBill((prev) => ({
                            ...prev,
                            freightTaxAmount: updatedFreightTaxes
                          }))
                        }}
                        cleanable={true} // Allow clear
                      />
                    </div>
                  </motion.div>
                </div>
              </form>
            </motion.div>
            {/* ===== Rate Breakdown Sidebar ===== */}
            <motion.aside className="bg-white backdrop-blur-lg w-full lg:w-[320px] flex-shrink-0 rounded-3xl shadow-xl p-6 relative max-h-[95vh] border border-white/20 ring-1 ring-white/30 overflow-y-auto customScrollbar">
              <div className="sticky top-6">
                <div className="flex items-center gap-3 py-4 px-1 ">
                  <h3 className="text-xl font-bold">Bill Summary</h3>
                </div>
                <motion.div className="space-y-4 text-sm">
                  <div className="p-4 bg-gradient-to-br from-indigo-50/50 to-blue-50/50 rounded-xl border border-indigo-100">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600 font-medium">Subtotal</span>
                      <span className="font-bold text-gray-800 text-lg">
                        ₹ {toThousands(billSubTotal)}
                      </span>
                    </div>
                  </div>
                  <div className="bg-white rounded-lg p-3 shadow-md border border-gray-200 transition-all duration-300 hover:shadow-lg overflow-auto customScrollbar">
                    <p className="text-sm font-bold mb-3 flex items-center gap-2">Tax Breakdown</p>
                    {(() => {
                      const taxSummary = {}
                      salesBill.products.forEach((p) => {
                        ;(p.taxAmount || []).forEach((t) => {
                          const name = t.name || ''
                          const value = Number(t.value || 0)

                          if (!name) return

                          taxSummary[name] = (taxSummary[name] || 0) + value
                        })
                      })
                      const entries = Object.entries(taxSummary)
                      return entries.length === 0 ? (
                        <p className="text-sm text-gray-400 italic">No taxes applied yet</p>
                      ) : (
                        <div className="space-y-2">
                          {entries.map(([name, value]) => (
                            <div key={name} className="flex justify-between text-gray-700 py-1">
                              <span className="text-xs">{name}</span>
                              <span className="text-xs font-medium">
                                ₹ {toThousands(Number(value).toFixed(2))}
                              </span>
                            </div>
                          ))}
                          <div className="pt-2 border-t border-gray-200/50 mt-2">
                            <div className="flex justify-between text-sm font-semibold text-gray-800">
                              <span>Total Tax</span>
                              <span>₹ {toThousands(billTaxTotal)}</span>
                            </div>
                          </div>
                        </div>
                      )
                    })()}
                  </div>
                  {billFreight > 0 && (
                    <div className="p-4 bg-gradient-to-br from-green-50/50 to-emerald-50/50 rounded-xl border border-green-100">
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600 font-medium flex items-center gap-1">
                          <Truck size={14} className="text-green-500" />
                          Freight
                        </span>
                        <span className="font-bold text-gray-800">
                          ₹ {toThousands(billFreight)}
                        </span>
                      </div>
                    </div>
                  )}
                  {(salesBill.freightTaxAmount || []).length > 0 && (
                    <div className="space-y-2 pl-4 mt-2">
                      {(salesBill.freightTaxAmount || []).map((tax) => (
                        <div
                          key={tax?.id}
                          className="flex justify-between text-gray-600 py-1 bg-white/50 rounded-lg px-3"
                        >
                          <span className="text-xs">{tax?.name}</span>
                          <span className="text-xs">
                            ₹ {toThousands(Number(tax.value || 0).toFixed(2))}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                  <div className="border-t border-white/30"></div>
                  <div className="px-3 text-center">
                    <div className="flex flex-col justify-between items-end mb-2">
                      <span className="text-sm font-light">Grand Total</span>
                      <span className="text-3xl font-bold">₹ {toThousands(grandTotal)}</span>
                    </div>
                    <div className="w-full bg-white/20 rounded-full h-1 mt-2">
                      <div className="bg-white h-1 rounded-full" style={{ width: '100%' }}></div>
                    </div>
                  </div>
                  {salesBill.paymentType === 'partial' && (
                    <Animation.Collapse in={salesBill.paymentType === 'partial'}>
                      <div className="mt-4 p-5 bg-gradient-to-r from-green-50/50 to-emerald-50/50 border border-green-200/50 rounded-2xl shadow-sm">
                        <p className="text-sm font-bold text-green-700 mb-4 flex items-center gap-2">
                          <CreditCard size={16} /> Payment Progress
                        </p>
                        <div className="space-y-3">
                          <div className="flex justify-between">
                            <span className="text-gray-600">Paid</span>
                            <span className="font-semibold text-green-700">
                              ₹ {toThousands(salesBill.paidAmount)}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">Pending</span>
                            <span className="font-semibold text-red-600">
                              ₹ {toThousands(Math.max(0, grandTotal - (salesBill.paidAmount || 0)))}
                            </span>
                          </div>
                        </div>
                        <div className="w-full mt-4 bg-gray-200 rounded-full h-3 overflow-hidden shadow-inner">
                          <div
                            className="bg-gradient-to-r from-green-500 to-emerald-500 h-3 rounded-full shadow-md transition-all duration-500"
                            style={{
                              width: `${grandTotal > 0 ? Math.min(100, ((salesBill.paidAmount || 0) / grandTotal) * 100) : 0}%`
                            }}
                          ></div>
                        </div>
                        <p className="text-xs text-gray-500 mt-2 text-center font-medium">
                          {Math.round(((salesBill.paidAmount || 0) / (grandTotal || 1)) * 100)}%
                          paid
                        </p>
                      </div>
                    </Animation.Collapse>
                  )}
                  <div className="border-t border-white/30 space-y-3">
                    {/* Next Button */}
                    {isUpdateExpense ? (
                      <button
                        type="button"
                        onClick={() => {
                          if (!validateForm()) return
                          setShowPaymentModal(true) // Show modal, prefilled below
                        }}
                        className="w-full flex items-center justify-center gap-2 px-6 py-4
      bg-gradient-to-r from-indigo-500 via-purple-600 to-indigo-700
      text-white rounded-2xl font-bold shadow-lg hover:shadow-xl
      transition-all duration-300 transform hover:scale-[1.03] active:scale-[0.98] cursor-pointer"
                      >
                        Next: Review Payment
                        <ArrowRight size={18} />
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={handleNext}
                        className="w-full flex items-center justify-center gap-2 px-6 py-4
      bg-gradient-to-r from-indigo-500 via-purple-600 to-indigo-700
      text-white rounded-2xl font-bold shadow-lg hover:shadow-xl
      transition-all duration-300 transform hover:scale-[1.03] active:scale-[0.98] cursor-pointer"
                      >
                        Next: Payment Method
                        <ArrowRight size={18} />
                      </button>
                    )}
                    {/* PDF Download Button */}
                    <div className="flex flex-col sm:flex-row gap-3">
                      <button
                        type="button"
                        onClick={handlePdfExport}
                        className="flex items-center justify-center gap-2 w-full px-6 py-3
        bg-gradient-to-r from-gray-100 via-gray-200 to-gray-300
        hover:from-gray-200 hover:via-gray-300 hover:to-gray-400
        text-gray-700 rounded-xl font-semibold shadow-sm hover:shadow-md
        border border-gray-300/50 transition-all duration-200"
                      >
                        <Download size={16} /> Download PDF
                      </button>
                    </div>
                  </div>
                </motion.div>
              </div>
            </motion.aside>
          </motion.div>
        </div>
      </motion.div>
    </AnimatePresence>
  )
}
export default SalesBill
