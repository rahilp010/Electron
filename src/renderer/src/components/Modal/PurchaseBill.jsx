/* eslint-disable prettier/prettier */
/* eslint-disable no-unused-vars */
/* eslint-disable react/prop-types */
import React, { useState, useEffect, useCallback, useMemo } from 'react'
import { InputNumber, SelectPicker, CheckPicker, Toggle, Checkbox, Animation } from 'rsuite'
import { CircleX, Trash } from 'lucide-react'
import { useDispatch, useSelector } from 'react-redux'
import {
  setClients,
  setProducts,
  setTransactions,
  setSettings
} from '../../app/features/electronSlice'
import { toast } from 'react-toastify'
import ClientModal from './ClientModal'
import ProductModal from './ProductModal'
import html2pdf from 'html2pdf.js'

/* ========= Subcomponent: Product Row ========= */
const ProductRow = ({ index, row, products, settings, onChange, onRemove, toThousands }) => {
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
    })),
    { label: 'Freight Charges', value: 'frightChanged' }
  ]

  return (
    <div className="grid grid-cols-6 gap-3 items-center border-b border-gray-200 py-2">
      <SelectPicker
        data={products.map((p) => ({ label: p.name, value: p.id, qty: p.stockQuantity || 0 }))}
        value={row.productId}
        placeholder="Product"
        virtualized={true}
        container={() => document.body}
        menuMaxHeight={200}
        menuStyle={{ zIndex: 99999, position: 'absolute' }}
        onChange={(val) => onChange(index, 'productId', val)}
      />

      <InputNumber
        min={1}
        value={row.quantity}
        onChange={(val) => onChange(index, 'quantity', val)}
      />

      <InputNumber prefix="₹" value={price} onChange={(val) => onChange(index, 'price', val)} />

      <CheckPicker
        data={taxOptions}
        value={Array.isArray(row.taxAmount) ? row.taxAmount.map((t) => t.code) : []}
        placeholder="Select Tax"
        virtualized={true}
        container={() => document.body}
        menuMaxHeight={200}
        menuStyle={{ zIndex: 99999, position: 'absolute' }}
        onChange={(val) => onChange(index, 'taxAmount', val)}
      />

      <InputNumber prefix="₹" disabled value={total} className="bg-gray-100" />

      <button
        type="button"
        onClick={() => onRemove(index)}
        className="group relative p-2 rounded-full bg-red-50 text-red-600 hover:bg-red-100 transition-all duration-300 hover:scale-110 cursor-pointer border border-red-400 flex items-center justify-center"
      >
        <Trash size={14} className="group-hover:rotate-12 transition-transform duration-300" />
      </button>
    </div>
  )
}

/* ========= Main Component ========= */
const PurchaseBill = ({ setShowPurchaseBillModal }) => {
  const dispatch = useDispatch()

  const products = useSelector((state) => state.electron.products.data || [])
  const clients = useSelector((state) => state.electron.clients.data || [])
  const settings = useSelector((state) => state.electron.settings.data || [])

  const [clientModal, setClientModal] = useState(false)
  const [productModal, setProductModal] = useState(false)

  const [purchaseBill, setPurchaseBill] = useState({
    clientId: '',
    paymentType: 'full',
    paymentMethod: 'bank',
    statusOfTransaction: 'pending',
    frightCharges: 0,
    paidAmount: 0,
    products: [
      {
        productId: '',
        quantity: 1,
        taxAmount: [],
        price: 0
      }
    ]
  })

  const [nextBillId, setNextBillId] = useState(null)

  /* ========= Fetch Data ========= */
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

  const toThousands = (v) => new Intl.NumberFormat('en-IN').format(Number(v) || 0)

  const handleProductChange = (index, field, value) => {
    setPurchaseBill((prev) => {
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

      if (field === 'taxAmount') {
        const selectedCodes = value || []
        row.taxAmount = selectedCodes
          .map((code) => {
            if (code === 'frightChanged') {
              return {
                code: 'frightChanged',
                name: 'Freight Charges',
                percentage: 0,
                value: Number(purchaseBill.frightCharges || 0) / selectedCodes.length || 0 // Approximate even split for preview
              }
            }
            const st = settings.find((s) => `custom-${s.id}` === code)
            if (st) {
              const base = (row.price || 0) * (row.quantity || 0)
              return {
                code,
                name: st.taxName,
                percentage: st.taxValue,
                value: (base * st.taxValue) / 100
              }
            }
            return null
          })
          .filter(Boolean)
      }

      updatedRows[index] = row
      return { ...prev, products: updatedRows }
    })
  }

  const handleAddRow = () => {
    setPurchaseBill((prev) => ({
      ...prev,
      products: [...prev.products, { productId: '', quantity: 1, taxAmount: [], price: 0 }]
    }))
  }

  const handleRemoveRow = (index) => {
    setPurchaseBill((prev) => ({
      ...prev,
      products: prev.products.filter((_, i) => i !== index)
    }))
  }

  const productRowTotals = useMemo(() => {
    return purchaseBill.products.map((p) => {
      const price = Number(p.price || 0)
      const qty = Number(p.quantity || 0)
      const base = price * qty
      const tax = Array.isArray(p.taxAmount)
        ? p.taxAmount.reduce((a, t) => a + (t.value || 0), 0)
        : 0
      const freight = p.taxAmount?.find((t) => t.code === 'frightChanged')?.value || 0
      const total = base + tax + freight
      return { base, tax, freight, total }
    })
  }, [purchaseBill.products])

  const billSubTotal = useMemo(() => {
    return productRowTotals.reduce((s, r) => s + r.base, 0)
  }, [productRowTotals])

  const billTaxTotal = useMemo(() => {
    return productRowTotals.reduce((s, r) => s + r.tax, 0)
  }, [productRowTotals])

  const billFreight = useMemo(() => {
    return Number(purchaseBill.frightCharges || 0)
  }, [purchaseBill.frightCharges])

  const grandTotal = useMemo(() => {
    const productTotals = productRowTotals.reduce((s, r) => s + r.total, 0)
    const total = productTotals + (billFreight || 0)
    return total
  }, [productRowTotals, billFreight])

  /* ========= Generate Invoice HTML (Updated to match PDF) ========= */
  const generateInvoiceHtml = useCallback(() => {
    let number = 0
    const selectedClient = clients.find((c) => c.id === purchaseBill.clientId)
    // Note: The "Bill To" section is required in the PDF, so we check for client.
    if (!selectedClient) return ''
    // Using the hardcoded date from your sample code
    const now = new Date()
    const invoiceDate = now.toLocaleDateString('en-US', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    })
    const invoiceNumber = `PB-${now.getFullYear()}${now.getMonth() + 1}${now.getDate()}-${number}` // From PDF [cite: 6]
    number++
    // Filter valid products and compute totalBase
    const validProducts = purchaseBill.products.filter((p) => p.productId && p.quantity > 0)
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
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Purchase Invoice</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }

    body {
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      background: #f5f5f5;
      padding: 20px;
      color: #333;
    }

    .container {
      max-width: 900px;
      margin: 0 auto;
      background: white;
      padding: 40px;
      box-shadow: 0 0 20px rgba(0,0,0,0.1);
    }

    /* Header */
    .header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 40px;
      padding-bottom: 20px;
      border-bottom: 3px solid #2c3e50;
    }

    .company-info {
      flex: 1;
    }

    .logo {
      width: 60px;
      height: 60px;
      background: #3498db;
      border-radius: 8px;
      display: flex;
      align-items: center;
      justify-content: center;
      color: white;
      font-weight: bold;
      font-size: 24px;
      margin-bottom: 10px;
    }

    .company-name {
      font-size: 20px;
      font-weight: bold;
      color: #2c3e50;
      margin-bottom: 8px;
    }

    .company-details {
      font-size: 12px;
      line-height: 1.6;
      color: #666;
    }

    .invoice-details {
      text-align: right;
    }

    .invoice-title {
      font-size: 36px;
      font-weight: bold;
      color: #2c3e50;
      margin-bottom: 10px;
    }

    .invoice-meta {
      font-size: 13px;
      margin: 5px 0;
      color: #555;
    }

    .invoice-meta strong {
      color: #2c3e50;
      min-width: 100px;
      display: inline-block;
    }

    /* Bill To Section */
    .info-boxes {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 20px;
      margin-bottom: 30px;
    }

    .info-box {
      border: 2px solid #e0e0e0;
      border-radius: 8px;
      padding: 20px;
      background: #fafafa;
    }

    .info-box-title {
      font-weight: bold;
      font-size: 14px;
      color: #2c3e50;
      margin-bottom: 12px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    .info-box-content {
      font-size: 13px;
      line-height: 1.6;
      color: #555;
    }

    .info-row {
      display: flex;
      justify-content: space-between;
      margin: 8px 0;
    }

    .info-label {
      font-weight: 600;
      color: #2c3e50;
    }

    /* Table */
    .table-container {
      margin: 30px 0;
      overflow-x: auto;
    }

    table {
      width: 100%;
      border-collapse: collapse;
      font-size: 13px;
    }

    thead {
      background: #2c3e50;
      color: white;
    }

    th {
      padding: 12px 10px;
      text-align: left;
      font-weight: 600;
      text-transform: uppercase;
      font-size: 11px;
      letter-spacing: 0.5px;
    }

    td {
      padding: 12px 10px;
      border-bottom: 1px solid #e0e0e0;
    }

    tbody tr:hover {
      background: #f9f9f9;
    }

    tbody tr:last-child td {
      border-bottom: 2px solid #2c3e50;
    }

    .text-center {
      text-align: center;
    }

    .text-right {
      text-align: right;
    }

    /* Footer */
    .footer-section {
      display: grid;
      grid-template-columns: 1.5fr 1fr;
      gap: 30px;
      margin-top: 40px;
    }

    .notes-section {
      background: #fafafa;
      padding: 20px;
      border-radius: 8px;
      border-left: 4px solid #3498db;
    }

    .notes-title {
      font-weight: bold;
      font-size: 14px;
      color: #2c3e50;
      margin-bottom: 10px;
      text-transform: uppercase;
    }

    .notes-content {
      font-size: 12px;
      line-height: 1.6;
      color: #666;
    }

    .totals-section {
      background: #2c3e50;
      color: white;
      padding: 20px;
      border-radius: 8px;
    }

    .total-row {
      display: flex;
      justify-content: space-between;
      padding: 10px 0;
      border-bottom: 1px solid rgba(255,255,255,0.1);
      font-size: 13px;
    }

    .total-row:last-child {
      border-bottom: none;
      padding-top: 15px;
      margin-top: 5px;
      border-top: 2px solid rgba(255,255,255,0.3);
      font-size: 16px;
      font-weight: bold;
    }

    .total-label {
      color: rgba(255,255,255,0.8);
    }

    .total-value {
      font-weight: 600;
    }

    /* Signatures */
    .signatures {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 40px;
      margin-top: 60px;
      padding-top: 20px;
    }

    .signature-box {
      text-align: center;
    }

    .signature-line {
      border-top: 2px solid #2c3e50;
      padding-top: 10px;
      margin-top: 50px;
      font-weight: 600;
      font-size: 12px;
      color: #2c3e50;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    /* Print Styles */
    @media print {
      body {
        background: white;
        padding: 0;
      }
      .container {
        box-shadow: none;
        padding: 20px;
      }
      .no-print {
        display: none;
      }
    }

    /* Action Buttons */
    .action-buttons {
      display: flex;
      gap: 10px;
      margin-bottom: 20px;
      justify-content: flex-end;
    }

    .btn {
      padding: 10px 20px;
      border: none;
      border-radius: 5px;
      cursor: pointer;
      font-size: 14px;
      font-weight: 600;
      transition: all 0.3s;
    }

    .btn-primary {
      background: #3498db;
      color: white;
    }

    .btn-primary:hover {
      background: #2980b9;
    }

    .btn-secondary {
      background: #95a5a6;
      color: white;
    }

    .btn-secondary:hover {
      background: #7f8c8d;
    }

    .status-badge {
      display: inline-block;
      padding: 4px 12px;
      border-radius: 20px;
      font-size: 11px;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    .status-paid {
      background: #d4edda;
      color: #155724;
    }

    .status-pending {
      background: #fff3cd;
      color: #856404;
    }

    .status-cancelled {
      background: #f8d7da;
      color: #721c24;
    }
  </style>
</head>
<body>
  <div class="container">
    <!-- Header -->
    <div class="header">
      <div class="company-info">
        
      </div>
      <div class="invoice-details">
        <div class="invoice-title">PURCHASE INVOICE</div>
        <div class="invoice-meta"><strong>Invoice No:</strong> ${invoiceNumber}</div>
        <div class="invoice-meta"><strong>Date:</strong> ${invoiceDate}</div>
      </div>
    </div>

    <!-- Bill To & Payment Info -->
    <div class="info-boxes">
      <div class="info-box">
        <div class="info-box-title">Bill To</div>
        <div class="info-box-content">
          <strong>${selectedClient.clientName}</strong><br>
          Address:${selectedClient.address}<br>
          GSTIN: ${selectedClient.gstin}<br>
          Phone: ${selectedClient.phone}
        </div>
      </div>
      <div class="info-box">
        <div class="info-box-title">Payment Details</div>
        <div class="info-box-content">
          <div class="info-row">
            <span class="info-label">Payment Method:</span>
            <span>${purchaseBill.paymentMethod === 'bank' ? 'Bank Transfer' : 'Cash'}</span>
          </div>
          <div class="info-row">
            <span class="info-label">Status:</span>
            <span class="status-badge status-${purchaseBill.statusOfTransaction}">${purchaseBill.statusOfTransaction}</span>
          </div>
          <div class="info-row">
            <span class="info-label">Reference No:</span>
            <span>${purchaseBill.referenceNo}</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Items Table -->
    <div class="table-container">
      <table>
        <thead>
          <tr>
            <th class="text-center">#</th>
            <th>Product</th>
            <th class="text-center">Qty</th>
            <th class="text-right">Unit Price (₹)</th>
            <th class="text-right">Tax/Charges (₹)</th>
            <th class="text-right">Line Total (₹)</th>
          </tr>
        </thead>
        <tbody>
  ${finalItems
    .map(
      (it) => `
  <tr class="text-center">
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
    </div>

    <!-- Footer Section -->
    <div class="footer-section">
      <div class="notes-section">
        <div class="notes-title">Notes & Terms</div>
        <div class="notes-content">
          Thank you for your business! Payment terms are Net 14 days from the invoice date. 
          Please include the invoice number with your payment. Late payments may incur additional charges. 
          For any queries regarding this invoice, please contact our accounts department.
        </div>
      </div>

      <div class="totals-section">
        <div class="total-row">
          <span class="total-label">Subtotal:</span>
          <span class="total-value">₹ ${billSubTotal}</span>
        </div>
        <div class="total-row">
          <span class="total-label">Total Tax/Charges:</span>
          <span class="total-value">₹ ${billFreight}</span>
        </div>
        <div class="total-row">
          <span class="total-label">Grand Total:</span>
          <span class="total-value">₹ ${grandTotal}</span>
        </div>
      </div>
    </div>

    <!-- Signatures -->
    <div class="signatures">
      <div class="signature-box">
        <div class="signature-line">Receiver's Signature</div>
      </div>
      <div class="signature-box">
        <div class="signature-line">Authorized Signatory</div>
      </div>
    </div>
  </div>
</body>
</html>
 `
    return html
  }, [purchaseBill, products, clients, billSubTotal, billFreight, grandTotal])

  /* ========= Submit Handler ========= */
  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!purchaseBill.clientId) {
      toast.error('Please select a client')
      return
    }

    try {
      // Validate rows
      const validRows = purchaseBill.products.filter((it) => it.productId && it.quantity > 0)
      if (validRows.length === 0) {
        toast.error('Add at least one product with valid quantity')
        return
      }

      const rowsDetailed = validRows.map((r) => {
        const price = Number(r.price || 0)
        const qty = Number(r.quantity || 0)
        const base = price * qty

        const taxes = (r.taxAmount || [])
          .map((t) => {
            if (typeof t === 'object') return t
            if (t === 'frightChanged') {
              return { code: 'frightChanged', name: 'Freight Charges', percentage: 0, value: 0 }
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

      const totalBase = rowsDetailed.reduce((s, r) => s + r.base, 0)
      if (billFreight > 0 && totalBase > 0) {
        rowsDetailed.forEach((r) => {
          const share = r.base / totalBase
          const allocated = Math.round(billFreight * share * 100) / 100
          r.taxes.push({
            code: 'frightChanged',
            name: 'Freight Charges',
            percentage: 0,
            value: allocated
          })
          r.total = r.total + allocated
          r.taxTotal = r.taxTotal + allocated
        })

        // adjust rounding drift: ensure sum allocation equals billFreight
        const allocatedSum = rowsDetailed.reduce(
          (s, r) => s + (r.taxes.find((t) => t.code === 'frightChanged')?.value || 0),
          0
        )
        const drift = Math.round((billFreight - allocatedSum) * 100) / 100
        if (Math.abs(drift) >= 0.01) {
          // add drift to first row
          rowsDetailed[0].taxes = rowsDetailed[0].taxes.map((t) =>
            t.code === 'frightChanged' ? { ...t, value: t.value + drift } : t
          )
          rowsDetailed[0].total += drift
          rowsDetailed[0].taxTotal += drift
        }
      }

      let paidDistribution = []
      const totalBillAmount = rowsDetailed.reduce((s, r) => s + r.total, 0)

      if (purchaseBill.paymentType === 'full') {
        paidDistribution = rowsDetailed.map((r) => Math.round(r.total * 100) / 100)
      } else if (purchaseBill.paymentType === 'partial') {
        const totalToDistribute = Number(purchaseBill.paidAmount || 0)
        if (totalToDistribute <= 0) {
          toast.error('Enter paid amount for partial payment')
          return
        }
        let runningAllocated = 0
        rowsDetailed.forEach((r, idx) => {
          if (idx === rowsDetailed.length - 1) {
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

      for (let i = 0; i < rowsDetailed.length; i++) {
        const row = rowsDetailed[i]
        const itemPaid = Number(paidDistribution[i] || 0)
        const purchaseAmount = Math.round(row.total * 100) / 100
        const pendingAmount =
          purchaseBill.paymentType === 'full'
            ? 0
            : purchaseBill.paymentType === 'partial'
              ? Math.max(0, Math.round((purchaseAmount - itemPaid) * 100) / 100)
              : purchaseAmount

        const transactionData = {
          clientId: purchaseBill.clientId,
          productId: row.productId,
          quantity: Number(row.quantity),
          purchaseAmount: purchaseAmount,
          paymentType: purchaseBill.paymentType,
          sellAmount: Number(row.price),
          paymentMethod: purchaseBill.paymentMethod,
          statusOfTransaction: purchaseBill.statusOfTransaction,
          pageName: 'Purchase',
          transactionType: 'purchase',
          pendingAmount: pendingAmount,
          paidAmount: itemPaid,
          taxAmount: row.taxes.map((t) => ({ ...t })) || []
        }

        const createdTransaction = await window.api.createTransaction(transactionData)

        if (itemPaid > 0) {
          const baseReceipt = {
            transactionId: createdTransaction.id,
            type: 'Payment',
            date: new Date().toISOString().slice(0, 19).replace('T', ' '),
            statusOfTransaction: createdTransaction.statusOfTransaction,
            clientId: createdTransaction.clientId,
            paymentType: createdTransaction.paymentType,
            party:
              clients.find((c) => c.id === purchaseBill.clientId)?.clientName || 'Unknown Client',
            amount: itemPaid,
            description: `Purchase ${products.find((p) => p.id === row.productId)?.name || ''}`,
            taxAmount: row.taxes || [],
            dueDate: null,
            productId: createdTransaction.productId || '',
            pendingAmount: createdTransaction.pendingAmount || 0,
            paidAmount: createdTransaction.paidAmount || 0
          }
          if (purchaseBill.paymentMethod === 'bank') {
            await window.api.createBankReceipt({ ...baseReceipt, bank: 'IDBI' }).catch((e) => {
              // non-fatal
              console.error('createBankReceipt failed', e)
            })
          } else {
            await window.api.createCashReceipt({ ...baseReceipt, cash: 'Cash' }).catch((e) => {
              console.error('createCashReceipt failed', e)
            })
          }
        }
      }

      const transactionsAll = await window.api.getAllTransactions()
      dispatch(setTransactions(transactionsAll))

      toast.success('All purchase items added successfully')
      setShowPurchaseBillModal(false)
    } catch (err) {
      console.error('Error saving purchase bill', err)
      toast.error('Error saving purchase bill: ' + (err.message || err))
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
      filename: `purchase-invoice-${new Date('2025-11-09').toISOString().slice(0, 10)}.pdf`,
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
    return `PB${padded}`
  }

  return (
    <>
      <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center print:hidden">
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
        <div className="flex gap-1 mx-2">
          <div className="bg-white w-[80%] max-w-6xl rounded-2xl shadow-2xl p-6 relative overflow-y-auto max-h-[90vh] customScrollbar print:hidden">
            <CircleX
              className="absolute top-4 right-4 text-red-400 hover:text-red-600 cursor-pointer"
              onClick={() => setShowPurchaseBillModal(false)}
              size={28}
            />
            <h2 className="text-2xl font-semibold mb-4 flex items-center gap-3">
              Create Purchase Bill{' '}
              <span className="bg-amber-300 p-1 text-sm rounded-full text-white px-4">
                {formatTransactionId(nextBillId)}
              </span>
            </h2>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Client */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm mb-1 text-gray-600">Client</label>
                  <SelectPicker
                    data={clients.map((c) => ({ label: c.clientName, value: c.id }))}
                    value={purchaseBill.clientId}
                    onChange={(v) => setPurchaseBill((prev) => ({ ...prev, clientId: v }))}
                    placeholder="Select Client"
                    style={{ width: '100%' }}
                    container={() => document.body}
                    menuStyle={{ zIndex: 99999, position: 'absolute' }}
                    virtualized={true}
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
                  <label className="block text-sm mb-1 text-gray-600">Products</label>
                  <div className="flex gap-2">
                    <SelectPicker
                      data={products.map((p) => ({
                        label: p.name,
                        value: p.id,
                        qty: p.quantity || 0
                      }))}
                      value={null}
                      container={() => document.body}
                      menuStyle={{ zIndex: 99999, position: 'absolute' }}
                      virtualized={true}
                      onChange={(value) => {
                        // convenience: when user picks product in top control, append new row with that product
                        if (!value) return
                        setPurchaseBill((prev) => ({
                          ...prev,
                          products: [
                            ...prev.products,
                            {
                              productId: value,
                              quantity: 1,
                              taxAmount: [],
                              price: products.find((p) => p.id === value)?.price || 0
                            }
                          ]
                        }))
                      }}
                      menuMaxHeight={250}
                      placeholder="Pick & Add Product"
                      style={{ width: '100%' }}
                      renderMenuItem={(label, item) => (
                        <div className="flex justify-between w-full items-center">
                          <span className="truncate max-w-[500px]">{label}</span>
                          <span
                            className={`text-xs font-medium ${
                              item.qty > 0 ? 'text-green-500' : 'text-red-400'
                            }`}
                          >
                            Qty: {item.qty}
                          </span>
                        </div>
                      )}
                      renderValue={(value, item) => (
                        <span className="truncate max-w-[250px]">{item?.label}</span>
                      )}
                      renderExtraFooter={() => (
                        <div className="px-3 py-1 border-t border-gray-200">
                          <p
                            className="text-blue-600 text-sm font-bold cursor-pointer"
                            onClick={() => setProductModal(true)}
                          >
                            + Create Product
                          </p>
                        </div>
                      )}
                    />
                  </div>
                </div>
              </div>

              {/* Product Table */}
              <div className="border rounded-lg p-4 bg-gray-50">
                <div className="grid grid-cols-6 gap-3 border-b pb-2 mb-2 font-medium text-gray-700 text-sm">
                  <span>Product</span>
                  <span>Qty</span>
                  <span>Price</span>
                  <span>Tax</span>
                  <span>Total</span>
                  <span>Action</span>
                </div>

                {purchaseBill.products.map((row, index) => (
                  <ProductRow
                    key={index}
                    index={index}
                    row={row}
                    products={products}
                    settings={settings}
                    onChange={handleProductChange}
                    onRemove={handleRemoveRow}
                    toThousands={toThousands}
                  />
                ))}

                <div className="flex justify-between items-center mt-4">
                  <p
                    onClick={handleAddRow}
                    className="px-4 py-2 bg-indigo-100 text-indigo-700 rounded-md hover:bg-indigo-200 cursor-pointer"
                  >
                    + Add Product
                  </p>

                  <div className="text-right">
                    <p className="text-gray-600 text-sm">Grand Total</p>
                    <p className="text-2xl font-semibold text-gray-800">
                      ₹ {toThousands(grandTotal)}
                    </p>
                  </div>
                </div>
              </div>

              {/* Freight and Payment */}
              <div className="grid grid-cols-2 gap-4 mt-4">
                <div className="grid grid-cols-2 items-center gap-4">
                  <div>
                    <label className="block text-sm mb-1 text-gray-600">Payment Status</label>
                    <Toggle
                      size="lg"
                      checkedChildren="Completed"
                      unCheckedChildren="Pending"
                      checked={purchaseBill.statusOfTransaction === 'completed'}
                      onChange={(checked) =>
                        setPurchaseBill((prev) => ({
                          ...prev,
                          statusOfTransaction: checked ? 'completed' : 'pending'
                        }))
                      }
                    />
                  </div>
                  <div>
                    <label className="block text-sm mb-1 text-gray-600">
                      Freight Charges (bill)
                    </label>
                    <InputNumber
                      prefix="₹"
                      value={purchaseBill.frightCharges}
                      className=""
                      onChange={(v) =>
                        setPurchaseBill((prev) => ({ ...prev, frightCharges: Number(v) || 0 }))
                      }
                    />
                  </div>
                </div>

                <div className="flex items-center gap-6 mt-4">
                  <Checkbox
                    checked={purchaseBill.paymentType === 'partial'}
                    onChange={(_, checked) =>
                      setPurchaseBill((prev) => ({
                        ...prev,
                        paymentType: checked ? 'partial' : 'full'
                      }))
                    }
                  >
                    Partial Payment
                  </Checkbox>
                  <Checkbox
                    checked={purchaseBill.paymentMethod === 'cash'}
                    onChange={(_, checked) =>
                      setPurchaseBill((prev) => ({
                        ...prev,
                        paymentMethod: checked ? 'cash' : 'bank'
                      }))
                    }
                  >
                    Cash Payment
                  </Checkbox>
                </div>
              </div>

              {/* Partial Payment Inputs */}
              <Animation.Collapse in={purchaseBill.paymentType === 'partial'}>
                <div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-gray-100 rounded-lg border border-gray-200">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Paid Amount
                      </label>
                      <InputNumber
                        prefix="₹"
                        value={purchaseBill.paidAmount}
                        onChange={(val) =>
                          setPurchaseBill((prev) => ({ ...prev, paidAmount: Number(val) || 0 }))
                        }
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
                        value={Math.max(0, grandTotal - (purchaseBill.paidAmount || 0))}
                        formatter={toThousands}
                        disabled
                        size="md"
                        className="w-full bg-gray-50" // 💡 Changed disabled style
                      />
                    </div>
                  </div>
                </div>
              </Animation.Collapse>

              {/* Footer */}
              <div className="flex justify-end mt-6 gap-3">
                <button
                  type="button"
                  onClick={() => setShowPurchaseBillModal(false)}
                  className="px-6 py-2 bg-gray-500 hover:bg-gray-600 text-white rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg"
                >
                  Save Bill
                </button>
              </div>
            </form>
          </div>
          {/* ===== Rate Breakdown Sidebar ===== */}
          <div className="bg-white w-[340px] rounded-2xl shadow-2xl p-6 relative overflow-y-auto max-h-[90vh] border border-gray-100">
            <div className="print:hidden">
              <h2 className="text-xl font-semibold mb-4 text-gray-700 flex items-center justify-between">
                Rate Breakdown
                <span className="text-[10px] bg-red-400 text-white font-bold px-3 py-1 rounded-full">
                  Live Summary
                </span>
              </h2>

              <Animation.Fade in>
                <div className="space-y-3 text-sm transition-all duration-500 ease-in-out">
                  {/* Subtotal */}
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Subtotal</span>
                    <span className="font-medium text-gray-800">₹ {toThousands(billSubTotal)}</span>
                  </div>

                  {/* Tax Breakdown */}
                  <div className="mt-4">
                    <p className="text-sm font-semibold text-gray-700 mb-2">Tax Breakdown</p>
                    {(() => {
                      const taxSummary = {}
                      purchaseBill.products.forEach((p) => {
                        ;(p.taxAmount || []).forEach((t) => {
                          if (t.name) {
                            if (!taxSummary[t.name]) taxSummary[t.name] = 0
                            taxSummary[t.name] += Number(t.value || 0)
                          }
                        })
                      })
                      const entries = Object.entries(taxSummary)
                      return entries.length === 0 ? (
                        <p className="text-sm text-gray-400">No taxes applied</p>
                      ) : (
                        <Animation.Fade in>
                          <div className="space-y-1">
                            {entries.map(([name, value]) => (
                              <div key={name} className="flex justify-between text-gray-700">
                                <span>{name}</span>
                                <span>₹ {toThousands(value.toFixed(2))}</span>
                              </div>
                            ))}
                          </div>
                        </Animation.Fade>
                      )
                    })()}
                  </div>

                  {/* Freight */}
                  {billFreight > 0 && (
                    <div className="flex justify-between items-center mt-3">
                      <span className="text-gray-600">Freight Charges</span>
                      <span className="font-medium text-gray-800">
                        ₹ {toThousands(billFreight)}
                      </span>
                    </div>
                  )}

                  {/* Divider */}
                  <div className="border-t border-gray-200 my-3"></div>

                  {/* Grand Total */}
                  <div className="flex justify-between items-center mt-2">
                    <span className="text-base font-semibold text-gray-800">Grand Total</span>
                    <span className="text-xl font-bold text-indigo-600">
                      ₹ {toThousands(grandTotal)}
                    </span>
                  </div>

                  {/* Partial Payment Summary */}
                  {purchaseBill.paymentType === 'partial' && (
                    <Animation.Collapse in={purchaseBill.paymentType === 'partial'}>
                      <div className="mt-4 p-4 bg-gray-50 border border-gray-200 rounded-xl">
                        <p className="text-sm font-semibold text-gray-700 mb-3">
                          Partial Payment Summary
                        </p>

                        <div className="flex justify-between mb-2">
                          <span className="text-gray-600">Paid Amount</span>
                          <span className="font-medium text-green-700">
                            ₹ {toThousands(purchaseBill.paidAmount)}
                          </span>
                        </div>

                        <div className="flex justify-between">
                          <span className="text-gray-600">Pending Amount</span>
                          <span className="font-medium text-red-600">
                            ₹{' '}
                            {toThousands(Math.max(0, grandTotal - (purchaseBill.paidAmount || 0)))}
                          </span>
                        </div>

                        <div className="w-full mt-3 bg-gray-200 rounded-full h-2 overflow-hidden">
                          <div
                            className="bg-indigo-500 h-2 rounded-full transition-all duration-500"
                            style={{
                              width: `${
                                grandTotal > 0
                                  ? Math.min(
                                      100,
                                      ((purchaseBill.paidAmount || 0) / grandTotal) * 100
                                    )
                                  : 0
                              }%`
                            }}
                          ></div>
                        </div>

                        <p className="text-xs text-gray-500 mt-2">
                          {Math.round(((purchaseBill.paidAmount || 0) / (grandTotal || 1)) * 100)}%
                          paid
                        </p>
                      </div>
                    </Animation.Collapse>
                  )}
                </div>
              </Animation.Fade>

              {/* Divider & Buttons */}
              <div className="absolute bottom-3 left-0 right-0">
                <div className="border-t border-gray-400 my-3"></div>
                <p
                  className="text-center text-gray-700 bg-gray-300 p-2 rounded-full hover:bg-gray-400 cursor-pointer mb-2"
                  onClick={handlePdfExport}
                >
                  Download PDF
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}

export default PurchaseBill
