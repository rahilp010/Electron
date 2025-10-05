/* eslint-disable react/prop-types */
import React, { useCallback, useState } from 'react'
import { Printer, Send, MessageCircle, X, Phone } from 'lucide-react'
import { toast } from 'react-toastify'
import { Input, Modal } from 'rsuite'

// Utility function to generate dynamic print HTML
const generatePrintHTML = (data, headers, title, reportType, additionalData = {}) => {
  const { clients = [], products = [], companyInfo = {} } = additionalData

  const getCellValue = (row, headerKey) => {
    switch (headerKey) {
      case 'id':
        return row.id ? `RO${String(row.id).slice(-3).toUpperCase()}` : 'RO---'
      case 'date':
        return new Date(row.createdAt || row.date).toLocaleDateString('en-IN')
      case 'clientName':
        const client = clients.find(c => c?.id === row.clientId)
        return client ? client.clientName : 'Unknown Client'
      case 'productName':
        const product = products.find(p => p?.id === row.productId)
        return product ? product.name : 'Unknown Product'
      case 'quantity':
        return row.quantity || 0
      case 'sellingPrice':
        return `₹ ${new Intl.NumberFormat('en-IN').format(Number(row.sellAmount || 0))}`
      case 'totalAmount':
        return `₹ ${new Intl.NumberFormat('en-IN').format(Number((row.sellAmount || 0) * (row.quantity || 0)))}`
      case 'pendingAmount':
        if (row.statusOfTransaction === 'pending' && row.paymentType === 'partial') {
          return `₹ ${new Intl.NumberFormat('en-IN').format(Number(row.pendingAmount || 0))}`
        }
        return row.statusOfTransaction === 'completed' ? '-' : 'Pending'
      case 'paidAmount':
        if (row.paymentType === 'partial') {
          return `₹ ${new Intl.NumberFormat('en-IN').format(Number(row.paidAmount || 0))}`
        }
        return row.statusOfTransaction === 'pending' ? '-' : 'Paid'
      case 'paymentStatus':
        return row.statusOfTransaction?.charAt(0).toUpperCase() + row.statusOfTransaction?.slice(1) || '-'
      case 'bank':
        return row.bank ? `${row.bank} Bank` : '-'
      case 'debit':
        return row.type === 'Payment' ? `₹ ${new Intl.NumberFormat('en-IN').format(Number(row.amount || 0))}` : '-'
      case 'credit':
        return row.type === 'Receipt' ? `₹ ${new Intl.NumberFormat('en-IN').format(Number(row.amount || 0))}` : '-'
      case 'balance':
        return row.balance ? `₹ ${new Intl.NumberFormat('en-IN').format(Number(row.balance))}` : '-'
      case 'description':
        return row.description || 'No description'
      default:
        return row[headerKey] || '-'
    }
  }

  const tableHeaders = headers
    .map(h => `<th style="border: 1px solid #ddd; padding: 12px 8px; background-color: #f8f9fa; font-weight: 600; text-align: left;">${h.label}</th>`)
    .join('')

  const tableRows = data
    .map((row, index) => {
      const rowBg = index % 2 === 0 ? '#ffffff' : '#f8f9fa'
      const cells = headers
        .map(h => `<td style="border: 1px solid #ddd; padding: 10px 8px; text-align: left; background-color: ${rowBg};">${getCellValue(row, h.key)}</td>`)
        .join('')
      return `<tr>${cells}</tr>`
    })
    .join('')

  // Calculate totals for financial reports
  let totalsSection = ''
  if (reportType === 'sales' || reportType === 'purchase') {
    const totalAmount = data.reduce((sum, row) => sum + ((row.sellAmount || 0) * (row.quantity || 0)), 0)
    const totalPending = data.reduce((sum, row) => {
      if (row.statusOfTransaction === 'pending' && row.paymentType === 'partial') {
        return sum + (row.pendingAmount || 0)
      }
      if (row.statusOfTransaction === 'pending' && row.paymentType === 'full') {
        return sum + ((row.sellAmount || 0) * (row.quantity || 0))
      }
      return sum
    }, 0)
    const totalPaid = data.reduce((sum, row) => sum + (row.paidAmount || 0), 0)

    totalsSection = `
      <tr style="background-color: #e9ecef; font-weight: bold;">
        <td colspan="${headers.length - 3}" style="border: 1px solid #ddd; padding: 12px 8px; text-align: right;">TOTALS:</td>
        <td style="border: 1px solid #ddd; padding: 12px 8px; text-align: left;">₹ ${new Intl.NumberFormat('en-IN').format(totalAmount)}</td>
        <td style="border: 1px solid #ddd; padding: 12px 8px; text-align: left;">₹ ${new Intl.NumberFormat('en-IN').format(totalPending)}</td>
        <td style="border: 1px solid #ddd; padding: 12px 8px; text-align: left;">₹ ${new Intl.NumberFormat('en-IN').format(totalPaid)}</td>
      </tr>
    `
  }

  return `
    <!DOCTYPE html>
    <html>
      <head>
        <title>${title} - ${new Date().toLocaleDateString('en-IN')}</title>
        <meta charset="UTF-8">
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { 
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; 
            padding: 20px; 
            background-color: #ffffff;
            color: #333;
          }
          .header { 
            text-align: center; 
            margin-bottom: 30px; 
            padding-bottom: 20px;
            border-bottom: 3px solid #3B82F6;
          }
          .company-name {
            font-size: 28px;
            font-weight: bold;
            color: #1E40AF;
            margin-bottom: 5px;
          }
          .report-title {
            font-size: 20px;
            color: #475569;
            margin-bottom: 10px;
          }
          .report-meta {
            font-size: 12px;
            color: #64748B;
          }
          table { 
            width: 100%; 
            border-collapse: collapse; 
            margin-top: 20px;
            box-shadow: 0 1px 3px rgba(0,0,0,0.1);
          }
          th, td { 
            border: 1px solid #E2E8F0; 
            padding: 12px 8px; 
            text-align: left;
            font-size: 13px;
          }
          th { 
            background-color: #F1F5F9; 
            font-weight: 600;
            color: #1E293B;
          }
          tr:nth-child(even) { background-color: #F8FAFC; }
          tr:hover { background-color: #F1F5F9; }
          .footer {
            margin-top: 30px;
            padding-top: 20px;
            border-top: 2px solid #E2E8F0;
            text-align: center;
            font-size: 12px;
            color: #64748B;
          }
          @media print { 
            body { padding: 10px; }
            .header { page-break-after: avoid; }
            table { page-break-inside: auto; }
            tr { page-break-inside: avoid; page-break-after: auto; }
            thead { display: table-header-group; }
          }
          @page {
            margin: 1cm;
            size: A4;
          }
        </style>
      </head>
      <body onload="window.print(); setTimeout(() => { window.close(); }, 500);">
        <div class="header">
          <div class="company-name">${companyInfo.name || 'Your Company Name'}</div>
          <div style="font-size: 12px; color: #64748B; margin: 5px 0;">
            ${companyInfo.address || 'Company Address'} | ${companyInfo.phone || 'Phone'} | ${companyInfo.email || 'Email'}
          </div>
          <div class="report-title">${title}</div>
          <div class="report-meta">
            Report Generated: ${new Date().toLocaleString('en-IN')} | 
            Total Records: ${data.length}
          </div>
        </div>
        <table>
          <thead><tr>${tableHeaders}</tr></thead>
          <tbody>
            ${tableRows}
            ${totalsSection}
          </tbody>
        </table>
        <div class="footer">
          <p>This is a computer-generated document. No signature is required.</p>
          <p>Generated by ${companyInfo.name || 'Business Management System'}</p>
        </div>
      </body>
    </html>
  `
}

// Main PrintPDF Component
const PrintPDF = ({ 
  data, 
  headers, 
  title, 
  reportType = 'default',
  additionalData = {},
  onPrintComplete,
  showWhatsAppOption = true 
}) => {
  const [showWhatsAppModal, setShowWhatsAppModal] = useState(false)
  const [phoneNumber, setPhoneNumber] = useState('')
  const [message, setMessage] = useState('')
  const [isPrinting, setIsPrinting] = useState(false)

  // Check if WhatsApp Desktop is available
  const checkWhatsAppDesktop = useCallback(() => {
    // WhatsApp Desktop uses whatsapp:// protocol
    // This will work on systems with WhatsApp Desktop installed
    return new Promise((resolve) => {
      const iframe = document.createElement('iframe')
      iframe.style.display = 'none'
      iframe.src = 'whatsapp://send?text=test'
      
      document.body.appendChild(iframe)
      
      setTimeout(() => {
        document.body.removeChild(iframe)
        // If we reach here without error, assume WhatsApp Desktop might be available
        resolve(true)
      }, 1000)
    })
  }, [])

  // Open WhatsApp with message
  const openWhatsApp = useCallback(async (phone, msg) => {
    // Clean phone number (remove spaces, dashes, etc.)
    const cleanPhone = phone.replace(/\D/g, '')
    
    // Ensure country code (default to India +91 if not provided)
    const fullPhone = cleanPhone.startsWith('91') ? cleanPhone : `91${cleanPhone}`
    
    // Encode message
    const encodedMessage = encodeURIComponent(msg)
    
    try {
      // Try WhatsApp Desktop first
      const hasDesktop = await checkWhatsAppDesktop()
      const desktopUrl = `whatsapp://send?phone=${fullPhone}&text=${encodedMessage}`
      
      // Try opening desktop app
      window.location.href = desktopUrl
      
      // Fallback to web after 2 seconds if desktop didn't open
      setTimeout(() => {
        const webUrl = `https://web.whatsapp.com/send?phone=${fullPhone}&text=${encodedMessage}`
        window.open(webUrl, '_blank')
        toast.info('Opening WhatsApp Web as fallback')
      }, 2000)
      
      toast.success('Opening WhatsApp...')
    } catch (error) {
      // Fallback to web version
      const webUrl = `https://web.whatsapp.com/send?phone=${fullPhone}&text=${encodedMessage}`
      window.open(webUrl, '_blank')
      toast.info('Opening WhatsApp Web')
    }
  }, [checkWhatsAppDesktop])

  // Handle print with optional WhatsApp
  const handlePrint = useCallback(async (withWhatsApp = false) => {
    if (isPrinting) return
    
    setIsPrinting(true)
    
    try {
      const printHTML = generatePrintHTML(data, headers, title, reportType, additionalData)
      
      // Create iframe for printing
      const printFrame = document.createElement('iframe')
      printFrame.style.position = 'absolute'
      printFrame.style.left = '-9999px'
      printFrame.style.width = '0'
      printFrame.style.height = '0'
      printFrame.style.border = '0'
      document.body.appendChild(printFrame)

      const printDoc = printFrame.contentDocument || printFrame.contentWindow.document
      printDoc.open()
      printDoc.write(printHTML)
      printDoc.close()

      // Wait for content to load
      await new Promise(resolve => setTimeout(resolve, 500))
      
      printFrame.contentWindow.focus()
      printFrame.contentWindow.print()

      // Cleanup
      setTimeout(() => {
        document.body.removeChild(printFrame)
        setIsPrinting(false)
        
        if (onPrintComplete) {
          onPrintComplete()
        }
        
        // Show WhatsApp option if enabled
        if (withWhatsApp && showWhatsAppOption) {
          setShowWhatsAppModal(true)
        }
        
        toast.success('Print dialog opened. Choose "Save as PDF" to generate PDF.')
      }, 1000)
    } catch (error) {
      console.error('Error initiating print:', error)
      toast.error('Failed to initiate print: ' + error.message)
      setIsPrinting(false)
    }
  }, [data, headers, title, reportType, additionalData, isPrinting, onPrintComplete, showWhatsAppOption])

  // Handle WhatsApp send
  const handleWhatsAppSend = useCallback(() => {
    if (!phoneNumber) {
      toast.error('Please enter a phone number')
      return
    }
    
    if (phoneNumber.length < 10) {
      toast.error('Please enter a valid 10-digit phone number')
      return
    }
    
    const defaultMessage = message || `Hi! I'm sharing the ${title} report with you. Please check the attached PDF.`
    
    openWhatsApp(phoneNumber, defaultMessage)
    setShowWhatsAppModal(false)
    setPhoneNumber('')
    setMessage('')
  }, [phoneNumber, message, title, openWhatsApp])

  return (
    <>
      {/* Print Button */}
      <div className="flex gap-2">
        <button
          onClick={() => handlePrint(false)}
          disabled={isPrinting || !data || data.length === 0}
          className="flex items-center gap-2 border border-gray-300 px-4 py-2 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          title="Print/Save as PDF"
        >
          <Printer size={16} className={isPrinting ? 'animate-pulse' : ''} />
          <span className="text-sm">{isPrinting ? 'Printing...' : 'Print PDF'}</span>
        </button>

        {showWhatsAppOption && (
          <button
            onClick={() => handlePrint(true)}
            disabled={isPrinting || !data || data.length === 0}
            className="flex items-center gap-2 bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            title="Print and Share on WhatsApp"
          >
            <MessageCircle size={16} />
            <span className="text-sm">Print & Share</span>
          </button>
        )}
      </div>

      {/* WhatsApp Modal */}
      <Modal 
        open={showWhatsAppModal} 
        onClose={() => setShowWhatsAppModal(false)}
        size="sm"
      >
        <Modal.Header>
          <Modal.Title className="flex items-center gap-2">
            <MessageCircle className="text-green-500" size={20} />
            Share via WhatsApp
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Phone size={14} className="inline mr-1" />
                Phone Number (10 digits)
              </label>
              <Input
                type="tel"
                placeholder="Enter phone number (e.g., 9876543210)"
                value={phoneNumber}
                onChange={setPhoneNumber}
                maxLength={10}
                className="w-full"
              />
              <p className="text-xs text-gray-500 mt-1">
                Note: Country code +91 will be added automatically
              </p>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Send size={14} className="inline mr-1" />
                Message (Optional)
              </label>
              <Input
                as="textarea"
                rows={3}
                placeholder="Enter your message..."
                value={message}
                onChange={setMessage}
                className="w-full"
              />
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm text-blue-800">
              <strong>How it works:</strong>
              <ul className="list-disc list-inside mt-2 space-y-1">
                <li>PDF will be generated using your browser's print function</li>
                <li>System will try to open WhatsApp Desktop first</li>
                <li>If not available, WhatsApp Web will open automatically</li>
                <li>You can then attach the saved PDF to the chat</li>
              </ul>
            </div>
          </div>
        </Modal.Body>
        <Modal.Footer>
          <button
            onClick={handleWhatsAppSend}
            className="flex items-center gap-2 bg-green-500 text-white px-6 py-2 rounded-lg hover:bg-green-600 transition-colors"
          >
            <MessageCircle size={16} />
            Open WhatsApp
          </button>
          <button
            onClick={() => {
              setShowWhatsAppModal(false)
              setPhoneNumber('')
              setMessage('')
            }}
            className="flex items-center gap-2 bg-gray-200 text-gray-700 px-6 py-2 rounded-lg hover:bg-gray-300 transition-colors"
          >
            <X size={16} />
            Cancel
          </button>
        </Modal.Footer>
      </Modal>
    </>
  )
}

export default PrintPDF