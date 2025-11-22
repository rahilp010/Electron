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
  const freightObj = row.taxAmount?.find((t) => t.code === 'frightChanged')
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
          className="w-full [&_.rs-picker-toggle]:rounded-lg [&_.rs-picker-toggle]:border-gray-300/50  [&_.rs-picker-toggle]:bg-white/50 hover:[&_.rs-picker-toggle]:bg-white/70"
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
    frightCharges: 0,
    paidAmount: 0,
    freightTaxAmount: [],
    products: [{ productId: '', quantity: 1, taxAmount: [], price: 0, description: '' }]
  })

  const [nextBillId, setNextBillId] = useState(null)
  useEffect(() => {
    if (!existingTransaction || !isUpdateExpense) return

    const init = existingTransaction

    // Prefill main fields
    setSalesBill((prev) => ({
      ...prev,
      clientId: init.clientId,
      billNumber: init.billNo || '',
      billDate: init.date || init.createdAt?.split('T')[0] || prev.billDate,
      paymentType: init.paymentType || 'full',
      paymentMethod: init.paymentMethod || 'bank',
      statusOfTransaction: init.statusOfTransaction,
      paidAmount: init.paidAmount || 0,
      frightCharges: 0,
      freightTaxAmount: [],
      products: [
        {
          productId: init.productId,
          quantity: init.quantity,
          price: init.sellAmount,
          taxAmount: init.taxAmount || [],
          description: init.description || ''
        }
      ]
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
      const updated = [...prev.products]
      const row = { ...updated[index] }
      if (field === 'productId') {
        row.productId = value
        const sel = products.find((p) => p.id === value)
        row.price = sel?.price || 0
      }
      if (field === 'quantity') row.quantity = Number(value) || 0
      if (field === 'price') row.price = Number(value) || 0
      if (field === 'description') {
        row.description = value
      }
      if (field === 'taxAmount') {
        const codes = value || []
        row.taxAmount = codes
          .map((code) => {
            if (code === 'frightChanged')
              return {
                code: 'frightChanged',
                name: 'Freight Charges',
                percentage: 0,
                value: Number(salesBill.frightCharges || 0) / (codes.length || 1)
              }
            const s = settings.find((t) => `custom-${t.id}` === code)
            if (s) {
              const base = (row.price || 0) * (row.quantity || 0)
              return {
                code,
                name: s.taxName,
                percentage: s.taxValue,
                value: (base * s.taxValue) / 100
              }
            }
            return null
          })
          .filter(Boolean)
      }
      updated[index] = row
      return { ...prev, products: updated }
    })
  }

  const handleAddRow = () =>
    setSalesBill((prev) => ({
      ...prev,
      products: [
        ...prev.products,
        { productId: '', quantity: 1, taxAmount: [], price: 0, description: '' }
      ]
    }))

  const handleRemoveRow = (i) =>
    setSalesBill((prev) => ({ ...prev, products: prev.products.filter((_, idx) => idx !== i) }))

  const productRowTotals = useMemo(
    () =>
      salesBill.products.map((p) => {
        const price = Number(p.price || 0)
        const qty = Number(p.quantity || 0)
        const base = price * qty
        const tax = (p.taxAmount || []).reduce((a, t) => a + (t.value || 0), 0)
        const freight = p.taxAmount?.find((t) => t.code === 'frightChanged')?.value || 0
        const total = base + tax + freight
        return { base, tax, freight, total }
      }),
    [salesBill.products]
  )

  const billSubTotal = useMemo(
    () => productRowTotals.reduce((s, r) => s + r.base, 0),
    [productRowTotals]
  )

  const billTaxTotal = useMemo(() => {
    return productRowTotals.reduce((s, r) => s + r.tax, 0)
  }, [productRowTotals])

  const billFreight = useMemo(() => Number(salesBill.frightCharges || 0), [salesBill.frightCharges])

  const billFreightTax = useMemo(() => {
    return (salesBill.freightTaxAmount || []).reduce((s, t) => s + (t?.value || 0), 0)
  }, [salesBill.freightTaxAmount])

  const grandTotal = useMemo(() => {
    const productTotals = productRowTotals.reduce((s, r) => s + r.total, 0)
    const total = productTotals + billFreight + billFreightTax
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
    const selectedClient = clients.find((c) => c.id === salesBill.clientId)
    // Note: The "Bill To" section is required in the PDF, so we check for client.
    if (!selectedClient) return ''
    // Using the current date
    const now = new Date()
    const invoiceDate = now.toLocaleDateString('en-GB') // DD/MM/YYYY
    const invoiceNumber = `SB-${nextBillId?.toString().padStart(6, '0') || '000001'}`
    // Filter valid products and compute totalBase
    const validProducts = salesBill.products.filter((p) => p.productId && p.quantity > 0)
    const totalBase = validProducts.reduce((sum, p) => sum + (p.price || 0) * (p.quantity || 0), 0)
    // Now aggregate items with freight allocation
    const aggregatedItems = validProducts.map((p, idx) => {
      const product = products.find((pr) => pr.id === p.productId)
      const base = (p.price || 0) * (p.quantity || 0)
      const taxSum = Array.isArray(p.taxAmount)
        ? p.taxAmount.reduce((acc, t) => acc + (t.value || 0), 0)
        : 0
      let total = base + taxSum
      // Allocate freight proportionally
      let allocatedFreight = 0
      if (billFreight > 0 && totalBase > 0) {
        const share = base / totalBase
        allocatedFreight = Math.round(billFreight * share * 100) / 100
        total += allocatedFreight
      }

      // Taxes/Charges = taxSum + allocatedFreight
      const taxesCharges = taxSum + allocatedFreight
      return {
        id: idx + 1,
        productName: product?.name || '-',
        quantity: p.quantity || 0,
        price: p.price || 0,
        taxesCharges,
        total
      }
    })
    // Use the single item from the PDF as a fallback for the preview
    // if no items are added in the form yet.
    const finalItems =
      aggregatedItems.length > 0
        ? aggregatedItems
        : [
            { id: 1, productName: 'Data', quantity: 1, price: 600, taxesCharges: 0, total: 600 } // From PDF [cite: 11]
          ]

    // Use PDF totals if no items are added, otherwise use calculated totals
    const subTotalToShow = aggregatedItems.length > 0 ? billSubTotal : 600 //
    const grandTotalToShow = aggregatedItems.length > 0 ? grandTotal : 600 //
    // Full HTML matching the sample layout
    const html = `
<!DOCTYPE html>
<html>
 <head>
  <meta charset="utf-8">
  <title>Sales Invoice</title>
  <style>
  @media print { body { -webkit-print-color-adjust: exact; } }
  body { font-family: Arial, sans-serif; margin: 0; padding: 20px; font-size: 12px; line-height: 1.4; color: #333; }
  .header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 20px; }
  .company-info { flex: 1; }
  .company-name { font-size: 18px; font-weight: bold; margin-bottom: 5px; color: #000; }
  .company-details { font-size: 11px; line-height: 1.5; }
  .logo { width: 60px; height: auto; margin-bottom: 5px; }
  
  /* STYLES FOR RIGHT-SIDE HEADER INFO */
  .invoice-details { text-align: right; }
  .invoice-title { font-size: 24px; font-weight: bold; text-align: right; margin: 0; color: #000; }
  .invoice-meta { text-align: right; font-size: 12px; margin: 2px 0; }
  .invoice-meta strong { display: inline-block; min-width: 80px; text-align: left; font-weight: bold; color: #000; }

  /* ADJUSTED BILL-TO STYLES */
  .bill-to {
   display: block;
   width: 45%;
   vertical-align: top;
   border: 1px solid #aaa; /* Sharper border */
   background: #f9f9f9;
   padding: 10px;
   margin: 20px 0;
   box-sizing: border-box;
   font-size: 11px;
  }
  .bill-to strong { display: block; margin-bottom: 5px; font-size: 12px; color: #000; font-weight: bold; }

  /* TABLE STYLES */
  table { width: 100%; border-collapse: collapse; margin: 20px 0; }
  th, td { border: 1px solid #aaa; padding: 8px; text-align: left; font-size: 11px; } /* Sharper border */
  th { background: #f9f9f9; font-weight: bold; color: #000; }
  td:nth-child(1), td:nth-child(3) { text-align: center; } /* # and Qty */
  td:nth-child(4), td:nth-child(5), td:nth-child(6) { text-align: right; } /* Unit, Taxes, Total */
  th:nth-child(4), th:nth-child(5), th:nth-child(6) { text-align: right; }

  /* NEW FOOTER STYLES (2-COLUMN) */
  .footer-container {
   display: flex;
   justify-content: space-between;
   margin-top: 20px;
   align-items: flex-end; /* Align to bottom */
  }
  .footer-left { width: 60%; }
  .footer-right { width: 35%; }

  .totals {
   width: 100%;
   border: 1px solid #aaa; /* Sharper border */
   padding: 10px;
   text-align: right;
   box-sizing: border-box;
   background: #f9f9f9;
  }
  .totals p {
   margin: 5px 0;
   font-size: 12px;
   display: flex;
   justify-content: space-between;
  }
        /* UPDATED: Label is bold, value is normal */
  .totals p span { text-align: left; font-weight: bold; color: #000; }
  .totals p strong { font-weight: normal; color: #333; }

  .notes { margin-top: 20px; font-size: 11px; }
  .notes strong { display: block; margin-bottom: 5px; font-size: 12px; color: #000; font-weight: bold; }

  .signature-line {
   margin-top: 50px; /* Space above signature */
   border-top: 1px solid #000; /* Black line */
   padding-top: 5px;
   font-size: 11px;
   color: #000; /* Black text */
   font-weight: bold; /* Bold text as requested */
  }
  @page { size: A4; margin: 1cm; }
  </style>
 </head>
 <body>
  <div class="header">
  <div class="company-info">
   <img src="/assets/logo.png" alt="Company Logo" class="logo" style="width:60px;height:auto;">
   <div class="company-name">Your Company Name Pvt. Ltd.</div>
  <div class="company-details">
  123 Business Road, Ahmedabad, Gujarat - 380001<br>
  Email: info@yourcompany.com | Phone: +91 99999 99999<br>
  GSTIN: 22AAAAA0000A1Z5
  </div>
  </div>
  <div class="invoice-details">
   <div class="invoice-title">SALES INVOICE</div>
   <div class="invoice-meta"><strong>Invoice No:</strong> ${invoiceNumber}</div>
  <div class="invoice-meta"><strong>Date:</strong> ${invoiceDate}</div>
 
  <div class="invoice-meta" style="margin-top: 5px;"><strong>Payment Method:</strong> ${
    salesBill.paymentMethod === 'bank' ? 'Bank Transfer' : 'Cash'
  }</div>
  <div class="invoice-meta"><strong>Status:</strong> ${salesBill.statusOfTransaction}</div>
  </div>
 </div>
  <div class="bill-to">
  <strong>Bill To</strong>
  ${selectedClient.clientName}<br>
  ${selectedClient.address || '123 Client Address, City, State'}
 </div>
 <table>
  <thead>
   <tr>
  <th>#</th>
  _ <th>Product</th>
  <th>Qty</th>
  <th>Unit (₹)</th>
  <th>Taxes/Charges (₹)</th>
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
   <td>${toThousands(it.price.toFixed(2))}</td>
   <td>${toThousands(it.taxesCharges.toFixed(2))}</td>
   <td>${toThousands(it.total.toFixed(2))}</td>
  </tr>
  `
    )
    .join('')}
 </tbody>
 </table>
 <div class="footer-container">

 <div class="footer-left">
  <div class="notes">
  <strong>Notes</strong><br>
  Thank you for your business. Please clear any dues by the due
  date mentioned in your account.
  </div>
  <div class="signature-line">
  Receiver's Signature
  </div>
 </div>
 <div class="footer-right">
  <div class="totals">
          <p><span>Subtotal:</span> <strong>₹${toThousands(subTotalToShow.toFixed(2))}</strong></p>
  <p><span>Grand Total:</span> <strong>₹${toThousands(grandTotalToShow.toFixed(2))}</strong></p>
  </div>
  <div class="signature-line" style="text-align: right;">
  Authorized Signatory
  </div>
 </div>
 </div>
 </body>
 </html>
 `
    return html
  }, [salesBill, products, clients, billSubTotal, billFreight, grandTotal, nextBillId])

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
            if (t === 'freightCharges') {
              return { code: 'freightCharges', name: 'Freight Charges', percentage: 0, value: 0 }
            }
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

      const totalBase = rowsDetailed.reduce((s, r) => s + r.total, 0)

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

      let paidDistribution = []
      const totalBillAmount = rowsDetailed.reduce((s, r) => s + r.total, 0)

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
        const transactionData = {
          clientId: salesBill.clientId,
          productId: row.productId,
          quantity: Number(row.quantity),
          sellAmount: row.price,
          purchaseAmount: row.total,
          billNo: salesBill.billNumber,
          paymentType: salesBill.paymentType,
          paymentMethod: salesBill.paymentMethod,
          statusOfTransaction: salesBill.statusOfTransaction,
          pageName: 'Sales',
          transactionType: 'sales',
          pendingAmount: pendingAmount,
          paidAmount: itemPaid,
          freightCharges: billFreight,
          freightTaxAmount: row.taxes.find((t) => t.code === 'freightCharges')?.value || 0,
          totalAmount: sellAmount,
          taxAmount: row.taxes.map((t) => ({ ...t })) || [],
          dueDate: new Date().setMonth(new Date().getMonth() + 1),
          date: salesBill.billDate || new Date().toISOString().slice(0, 19).replace('T', ' ')
        }
        const createdTransaction = await window.api.createTransaction(transactionData)
        if (itemPaid > 0) {
          const baseReceipt = {
            transactionId: createdTransaction.id,
            type: 'Receipt',
            date: salesBill.billDate || new Date().toISOString().slice(0, 19).replace('T', ' '),
            statusOfTransaction: createdTransaction.statusOfTransaction,
            clientId: createdTransaction.clientId,
            paymentType: createdTransaction.paymentType,
            party: clients.find((c) => c.id === salesBill.clientId)?.clientName || 'Unknown',
            amount: paymentData?.amount || itemPaid,
            description: `Sale ${products.find((p) => p.id === row.productId)?.name || ''} to ${clients.find((c) => c.id === salesBill.clientId)?.clientName || 'Unknown'}`,
            productId: createdTransaction.productId,
            taxAmount: row.taxes,
            pageName: 'Sales',
            pendingAmount: createdTransaction.pendingAmount || 0,
            paidAmount: createdTransaction.paidAmount || 0,
            sendTo: paymentData?.sendTo || salesBill.sendTo || '',
            chequeNumber: paymentData?.chequeNumber || '',
            transactionAccount: paymentData?.transactionAccount || ''
          }
          if (salesBill.paymentMethod === 'bank') {
            const response = await window.api
              .createBankReceipt({
                ...baseReceipt,
                bank: 'IDBI',
                sendTo: paymentData?.sendTo || '',
                amount: itemPaid
              })
              .catch((e) => {
                console.error('createBankReceipt failed', e)
              })
            dispatch(setBankReceipt(response))
          } else {
            const response = await window.api
              .createCashReceipt({
                ...baseReceipt,
                cash: 'Cash',
                amount: itemPaid,
                sendTo: paymentData?.sendTo || ''
              })
              .catch((e) => {
                console.error('createCashReceipt failed', e)
              })

            dispatch(setCashReceipt(response))
          }
        }
      }
      // Create a single ledger entry for the total purchase (managing multiple product entries as aggregate)
      const totalAmount = totalBillAmount
      const SALES_ACCOUNT_ID = 3 // Assuming Purchases account ID is 3; adjust as needed
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

      // Single-row model (your updateExpense mode uses only one row)
      const row = salesBill.products[0]
      if (!row || !row.productId) {
        toast.error('Select a product')
        return
      }

      const price = Number(row.price || 0)
      const qty = Number(row.quantity || 0)
      const base = price * qty
      const taxes = (row.taxAmount || []).map((t) => ({
        ...t,
        value: t.percentage && t.percentage > 0 ? (base * t.percentage) / 100 : Number(t.value || 0)
      }))

      const taxTotal = taxes.reduce((a, t) => a + (t.value || 0), 0)
      let total = base + taxTotal

      // Freight apply if needed
      if (salesBill.frightCharges > 0) {
        total += Number(salesBill.frightCharges || 0)
      }

      // Payment logic
      let paidAmount = 0
      let pendingAmount = total
      if (salesBill.paymentType === 'full') {
        paidAmount = total
        pendingAmount = 0
      } else if (salesBill.paymentType === 'partial') {
        paidAmount = Number(salesBill.paidAmount || 0)
        pendingAmount = Math.max(0, total - paidAmount)
      }

      // ---------------------------------------------
      // 1️⃣ UPDATE TRANSACTION BASED ON ID
      // ---------------------------------------------
      const updatedTxData = {
        id: existingTransaction.id,
        clientId: salesBill.clientId,
        productId: row.productId,
        quantity: qty,
        sellAmount: price,
        purchaseAmount: total,
        billNo: existingTransaction.billNo,
        paymentType: salesBill.paymentType,
        paymentMethod: salesBill.paymentMethod,
        statusOfTransaction: salesBill.statusOfTransaction,
        pageName: 'Sales',
        transactionType: 'sales',
        pendingAmount,
        paidAmount,
        totalAmount: total,
        taxAmount: taxes,
        dueDate: existingTransaction.dueDate,
        date: salesBill.billDate || new Date().toISOString().slice(0, 19).replace('T', ' ')
      }

      await window.api.updateTransaction(updatedTxData)

      // ---------------------------------------------
      // 2️⃣ UPDATE RECEIPTS FOR THIS transactionId
      // ---------------------------------------------
      // Remove EXISTING receipts for this transaction only

      try {
        // Remove EXISTING receipts for this transaction only
        let deleteResult = null
        if (existingTransaction.paymentMethod === 'cash') {
          deleteResult = await window.api.deleteCashReceiptByTransaction(existingTransaction.id)
        } else if (existingTransaction.paymentMethod === 'bank') {
          deleteResult = await window.api.deleteBankReceiptByTransaction(existingTransaction.id)
        }

        if (!deleteResult?.success) {
          console.warn('Receipt deletion warning:', deleteResult?.message)
        } else {
          console.log('Receipt deleted successfully:', deleteResult)
        }
      } catch (deleteErr) {
        console.error('Receipt deletion failed:', deleteErr)
        toast.warn('Failed to clean up old receipt; proceeding with update.')
      }

      // Recreate receipt only if paidAmount > 0
      if (paidAmount > 0) {
        const receiptBase = {
          transactionId: existingTransaction.id,
          type: 'Receipt',
          date: salesBill.billDate,
          statusOfTransaction: salesBill.statusOfTransaction,
          cash: 'cash',
          bank: 'IDBI',
          clientId: salesBill.clientId,
          paymentType: salesBill.paymentType,
          party: clients.find((c) => c.id === salesBill.clientId)?.clientName || 'Unknown',
          amount: paidAmount,
          description: `Sales of ${
            products.find((p) => p.id === row.productId)?.name || ''
          }`,
          productId: row.productId,
          taxAmount: taxes,
          pageName: 'Sales',
          pendingAmount,
          paidAmount,
          sendTo: paymentData?.sendTo || '',
          chequeNumber: paymentData?.chequeNumber || '',
          transactionAccount: paymentData?.transactionAccount || '',
          billNo: existingTransaction.billNo
        }

        if (salesBill.paymentMethod === 'bank') {
          await window.api.createBankReceipt(receiptBase)
        } else {
          await window.api.createCashReceipt(receiptBase)
        }
      }

      // ---------------------------------------------
      // 3️⃣ REFRESH UI
      // ---------------------------------------------
      const list = await window.api.getAllTransactions()
      dispatch(setTransactions(list))

      toast.success('Sales bill updated successfully')
      setShowSalesBillModal(false)
    } catch (err) {
      console.error('Update error:', err)
      toast.error('Failed to update')
    }
  }

  /* ========= Next Handler ========= */
  const handleNext = async () => {
    if (!validateForm()) return
    setShowPaymentModal(true)
  }

  const BANK_ACCOUNT_ID = 1
  const CASH_ACCOUNT_ID = 2

  const handlePaymentConfirm = async (paymentData) => {
    try {
      // Update local state for UI only
      setSalesBill((prev) => ({
        ...prev,
        paymentMethod: paymentData.method,
        referenceNo: paymentData.account,
        sendTo: paymentData.sendTo, // Option B stored here
        paidAmount: paymentData.amount
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
        amount,
        paymentMethod: paymentData.method || salesBill.paymentMethod || 'bank',
        description: `Sales payment via ${paymentData.method || 'bank'} for Bill ${salesBill.billNumber || ''}`,
        referenceId: salesBill.billNumber || null,
        createdAt: new Date().toISOString()
      }

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

      // 3) Continue with existing sales submission which will create receipts & transactions for each row.
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
    <>
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
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3 relative">
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
                        style={{ width: '100%', zIndex: 999999 }}
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
                        <Calendar className="text-blue-500" size={16} />
                        Bill Date
                      </label>

                      <Input
                        type="date"
                        value={salesBill.billDate}
                        onChange={(v) =>
                          setSalesBill((prev) => ({
                            ...prev,
                            billDate: v
                          }))
                        }
                        className="!rounded-lg border-white/50 bg-white/50 shadow-sm focus:ring-2 focus:ring-indigo-200 focus:bg-white/70"
                        style={{ width: '100%' }}
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
                            setSalesBill((prev) => ({
                              ...prev,
                              statusOfTransaction: checked ? 'completed' : 'pending'
                            }))
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
                          value={salesBill.frightCharges}
                          onChange={(v) =>
                            setSalesBill((prev) => {
                              const freight = Number(v) || 0
                              const updatedTaxes = (prev.freightTaxAmount || []).map((tax) => ({
                                ...tax,
                                value: (freight * tax.rate) / 100
                              }))
                              return {
                                ...prev,
                                frightCharges: freight,
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
                          value={salesBill.freightTaxAmount?.map((tax) => tax.id) || []}
                          placeholder="Select Freight Taxes"
                          placement="top"
                          virtualized={false}
                          menuMaxHeight={200}
                          menuStyle={{ zIndex: 99999, position: 'absolute' }}
                          className="w-full max-w-xs [&_.rs-picker-toggle]:rounded-lg [&_.rs-picker-toggle]:border-gray-300/50 [&_.rs-picker-toggle]:bg-white/50 hover:[&_.rs-picker-toggle]:bg-white/70"
                          cleanable
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
                      <p className="text-sm font-bold mb-3 flex items-center gap-2">
                        Tax Breakdown
                      </p>
                      {(() => {
                        const taxSummary = {}
                        salesBill.products.forEach((p) => {
                          ;(p.taxAmount || []).forEach((t) => {
                            if (t.name) {
                              if (!taxSummary[t.name]) taxSummary[t.name] = 0
                              taxSummary[t.name] += Number(t.value || 0)
                            }
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
                                ₹{' '}
                                {toThousands(Math.max(0, grandTotal - (salesBill.paidAmount || 0)))}
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
    </>
  )
}

export default SalesBill
