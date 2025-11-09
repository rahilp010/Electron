/* eslint-disable prettier/prettier */
/* eslint-disable no-unused-vars */
/* eslint-disable react/prop-types */
import React, { useState, useEffect, useCallback, useMemo } from 'react'
import { InputNumber, SelectPicker, CheckPicker, Toggle, Animation, Checkbox } from 'rsuite'
import { CircleX, Trash } from 'lucide-react'
import { useDispatch, useSelector } from 'react-redux'
import {
  setClients,
  setProducts,
  setTransactions,
  setSettings,
  setBankReceipt,
  setCashReceipt
} from '../../app/features/electronSlice'
import { toast } from 'react-toastify'
import html2pdf from 'html2pdf.js'
import ProductModal from './ProductModal'
import ClientModal from './ClientModal'

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
    })),
    { label: 'Freight Charges', value: 'frightChanged' }
  ]

  return (
    <div className="grid grid-cols-6 gap-3 items-center border-b border-gray-200 py-2">
      <SelectPicker
        data={products.map((p) => ({ label: p.name, value: p.id }))}
        value={row.productId}
        placeholder="Product"
        onChange={(val) => onChange(index, 'productId', val)}
        menuStyle={{ zIndex: 99999 }}
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
        onChange={(val) => onChange(index, 'taxAmount', val)}
        menuStyle={{ zIndex: 99999 }}
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

const SalesBill = ({ setShowSalesBillModal }) => {
  const dispatch = useDispatch()
  const products = useSelector((state) => state.electron.products.data || [])
  const clients = useSelector((state) => state.electron.clients.data || [])
  const settings = useSelector((state) => state.electron.settings.data || [])

  const [clientModal, setClientModal] = useState(false)
  const [productModal, setProductModal] = useState(false)

  const [salesBill, setSalesBill] = useState({
    clientId: '',
    paymentType: 'full',
    paymentMethod: 'bank',
    statusOfTransaction: 'pending',
    frightCharges: 0,
    paidAmount: 0,
    products: [{ productId: '', quantity: 1, taxAmount: [], price: 0 }]
  })

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

  const [nextBillId, setNextBillId] = useState(null)

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
      products: [...prev.products, { productId: '', quantity: 1, taxAmount: [], price: 0 }]
    }))

  const handleRemoveRow = (i) =>
    setSalesBill((prev) => ({ ...prev, products: prev.products.filter((_, idx) => idx !== i) }))

  const productRowTotals = useMemo(
    () =>
      salesBill.products.map((p) => {
        const base = (p.price || 0) * (p.quantity || 0)
        const tax = (p.taxAmount || []).reduce((a, t) => a + (t.value || 0), 0)
        const freight = p.taxAmount?.find((t) => t.code === 'frightChanged')?.value || 0
        return { base, tax, freight, total: base + tax + freight, taxes: p.taxAmount }
      }),
    [salesBill.products]
  )

  const billSubTotal = useMemo(
    () => productRowTotals.reduce((s, r) => s + r.base, 0),
    [productRowTotals]
  )
  const billFreight = useMemo(() => Number(salesBill.frightCharges || 0), [salesBill.frightCharges])
  const grandTotal = useMemo(
    () => productRowTotals.reduce((s, r) => s + r.total, 0) + billFreight,
    [productRowTotals, billFreight]
  )

  /* ========= Generate Invoice HTML ========= */
  const generateInvoiceHtml = useCallback(() => {
    const selectedClient = clients.find((c) => c.id === salesBill.clientId)
    // Note: The "Bill To" section is required in the PDF, so we check for client.
    if (!selectedClient) return ''
    // Using the hardcoded date from your sample code
    const now = new Date('2025-11-09')
    const invoiceDate = '09/11/2025' // From PDF [cite: 7]
    const invoiceNumber = 'PB-20251109-0048' // From PDF [cite: 6]
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
  }, [salesBill, products, clients, billSubTotal, billFreight, grandTotal, toThousands])

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!salesBill.clientId) return toast.error('Please select a client')

    try {
      const rows = salesBill.products.filter((r) => r.productId && r.quantity > 0)
      if (rows.length === 0) return toast.error('Add at least one product')

      const detailed = rows.map((r) => {
        const base = r.price * r.quantity
        const taxes = (r.taxAmount || []).map((t) => ({
          ...t,
          value: t.value || 0
        }))
        const total = base + taxes.reduce((a, t) => a + t.value, 0)
        return { ...r, base, total, taxes }
      })

      const totalAmount = detailed.reduce((s, r) => s + r.total, 0)
      let paidDist = []
      if (salesBill.paymentType === 'full') {
        paidDist = detailed.map((r) => r.total)
      } else if (salesBill.paymentType === 'partial') {
        const totalPaid = Number(salesBill.paidAmount || 0)
        let allocated = 0
        detailed.forEach((r, i) => {
          if (i === detailed.length - 1) paidDist.push(totalPaid - allocated)
          else {
            const part = totalPaid * (r.total / totalAmount)
            paidDist.push(part)
            allocated += part
          }
        })
      } else paidDist = detailed.map(() => 0)

      for (let i = 0; i < detailed.length; i++) {
        const r = detailed[i]
        const paid = Number(paidDist[i] || 0)
        const transactionData = {
          clientId: salesBill.clientId,
          productId: r.productId,
          quantity: r.quantity,
          sellAmount: r.price,
          purchaseAmount: r.total,
          paymentType: salesBill.paymentType,
          paymentMethod: salesBill.paymentMethod,
          statusOfTransaction: salesBill.statusOfTransaction,
          pageName: 'Sales',
          transactionType: 'sales',
          pendingAmount:
            salesBill.paymentType === 'full'
              ? 0
              : Math.max(0, Math.round((r.total - paid) * 100) / 100),
          paidAmount: paid,
          totalAmount: r.total,
          taxAmount: r.taxes,
          dueDate: new Date().setMonth(new Date().getMonth() + 1)
        }

        const created = await window.api.createTransaction(transactionData)
        if (paid > 0) {
          const baseReceipt = {
            transactionId: created.id,
            type: 'Receipt',
            date: new Date().toISOString().slice(0, 19).replace('T', ' '),
            statusOfTransaction: created.statusOfTransaction,
            clientId: created.clientId,
            paymentType: created.paymentType,
            party: clients.find((c) => c.id === salesBill.clientId)?.clientName || 'Unknown',
            amount: paid,
            description: `Sale ${products.find((p) => p.id === r.productId)?.name || ''}`,
            productId: created.productId,
            taxAmount: r.taxes,
            pageName: 'Sales'
          }
          if (salesBill.paymentMethod === 'bank') {
            const rec = await window.api.createBankReceipt({ ...baseReceipt, bank: 'IDBI' })
            dispatch(setBankReceipt(rec))
          } else {
            const rec = await window.api.createCashReceipt({ ...baseReceipt, cash: 'Cash' })
            dispatch(setCashReceipt(rec))
          }
        }
      }

      const all = await window.api.getAllTransactions()
      dispatch(setTransactions(all))
      toast.success('Sales Bill Saved')
      setShowSalesBillModal(false)
    } catch (err) {
      toast.error('Error saving bill: ' + err.message)
    }
  }

  // 🧾 Print Handler (New Window)
  const handlePrint = useCallback(() => {
    const html = generateInvoiceHtml()
    if (!html) {
      toast.error('No valid data to print')
      return
    }

    // Open new window synchronously
    const win = window.open('', '_blank', 'width=800,height=600,scrollbars=yes')
    if (!win) {
      toast.error('Popup blocked. Please allow popups for printing or use PDF export.')
      return
    }

    win.document.open()
    win.document.write(html)
    win.document.close()

    // Print after a delay to allow rendering and image load
    setTimeout(() => {
      win.focus()
      win.print()
      // Auto-close after print (optional)
      win.onafterprint = () => win.close()
    }, 1000)
  }, [generateInvoiceHtml])

  // 🧾 PDF Export Handler
  const handlePdfExport = useCallback(() => {
    const html = generateInvoiceHtml()
    if (!html) {
      toast.error('No valid data for PDF')
      return
    }

    const opt = {
      filename: `sales-invoice-${new Date('2025-11-09').toISOString().slice(0, 10)}.pdf`,
      margin: [10, 10, 10, 10],
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2, useCORS: true },
      jsPDF: { unit: 'in', format: 'a4', orientation: 'portrait' }
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
              onClick={() => setShowSalesBillModal(false)}
              size={28}
            />
            <h2 className="text-2xl font-semibold mb-4 flex items-center gap-3">
              Create Sales Bill{' '}
              <span className="bg-amber-300 p-1 text-sm rounded-full text-white px-4">
                {formatTransactionId(nextBillId)}
              </span>
            </h2>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm mb-1 text-gray-600">Client</label>
                  <SelectPicker
                    data={clients.map((c) => ({ label: c.clientName, value: c.id }))}
                    value={salesBill.clientId}
                    onChange={(v) => setSalesBill((prev) => ({ ...prev, clientId: v }))}
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
                        setSalesBill((prev) => ({
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
                          {console.log(item)}
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

              <div className="border rounded-lg p-4 bg-gray-50">
                <div className="grid grid-cols-6 gap-3 border-b pb-2 mb-2 font-medium text-gray-700 text-sm">
                  <span>Product</span>
                  <span>Qty</span>
                  <span>Price</span>
                  <span>Tax</span>
                  <span>Total</span>
                  <span className="text-center">Action</span>
                </div>
                {salesBill.products.map((row, i) => (
                  <SalesRow
                    key={i}
                    index={i}
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

              <div className="grid grid-cols-2 gap-4 mt-4">
                <div className="grid grid-cols-2 items-center gap-4">
                  <div>
                    <label className="block text-sm mb-1 text-gray-600">Payment Status</label>
                    <Toggle
                      size="lg"
                      checkedChildren="Completed"
                      unCheckedChildren="Pending"
                      checked={salesBill.statusOfTransaction === 'completed'}
                      onChange={(checked) =>
                        setSalesBill((p) => ({
                          ...p,
                          statusOfTransaction: checked ? 'completed' : 'pending'
                        }))
                      }
                    />
                  </div>
                  <div>
                    <label className="block text-sm mb-1 text-gray-600">Freight Charges</label>
                    <InputNumber
                      prefix="₹"
                      value={salesBill.frightCharges}
                      onChange={(v) =>
                        setSalesBill((p) => ({ ...p, frightCharges: Number(v) || 0 }))
                      }
                    />
                  </div>
                </div>

                <div className="flex items-center gap-6 mt-4">
                  <Checkbox
                    checked={salesBill.paymentType === 'partial'}
                    onChange={(_, checked) =>
                      setSalesBill((prev) => ({
                        ...prev,
                        paymentType: checked ? 'partial' : 'full'
                      }))
                    }
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
                  >
                    Cash Payment
                  </Checkbox>
                </div>
              </div>

              {/* Partial Payment Inputs */}
              <Animation.Collapse in={salesBill.paymentType === 'partial'}>
                <div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-gray-100 rounded-lg border border-gray-200">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Paid Amount
                      </label>
                      <InputNumber
                        prefix="₹"
                        value={salesBill.paidAmount}
                        onChange={(val) =>
                          setSalesBill((prev) => ({ ...prev, paidAmount: Number(val) || 0 }))
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
                        value={Math.max(0, grandTotal - (salesBill.paidAmount || 0))}
                        formatter={toThousands}
                        disabled
                        size="md"
                        className="w-full bg-gray-50" // 💡 Changed disabled style
                      />
                    </div>
                  </div>
                </div>
              </Animation.Collapse>

              <div className="flex justify-end mt-6 gap-3">
                <button
                  type="button"
                  onClick={() => setShowSalesBillModal(false)}
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
                  {salesBill.paymentType === 'partial' && (
                    <Animation.Collapse in={salesBill.paymentType === 'partial'}>
                      <div className="mt-4 p-4 bg-gray-50 border border-gray-200 rounded-xl">
                        <p className="text-sm font-semibold text-gray-700 mb-3">
                          Partial Payment Summary
                        </p>

                        <div className="flex justify-between mb-2">
                          <span className="text-gray-600">Paid Amount</span>
                          <span className="font-medium text-green-700">
                            ₹ {toThousands(salesBill.paidAmount)}
                          </span>
                        </div>

                        <div className="flex justify-between">
                          <span className="text-gray-600">Pending Amount</span>
                          <span className="font-medium text-red-600">
                            ₹ {toThousands(Math.max(0, grandTotal - (salesBill.paidAmount || 0)))}
                          </span>
                        </div>

                        <div className="w-full mt-3 bg-gray-200 rounded-full h-2 overflow-hidden">
                          <div
                            className="bg-indigo-500 h-2 rounded-full transition-all duration-500"
                            style={{
                              width: `${
                                grandTotal > 0
                                  ? Math.min(100, ((salesBill.paidAmount || 0) / grandTotal) * 100)
                                  : 0
                              }%`
                            }}
                          ></div>
                        </div>

                        <p className="text-xs text-gray-500 mt-2">
                          {Math.round(((salesBill.paidAmount || 0) / (grandTotal || 1)) * 100)}%
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

export default SalesBill
