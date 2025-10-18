/* eslint-disable react/no-unknown-property */
/* eslint-disable prettier/prettier */
import { useState, useEffect } from 'react'
import { toast } from 'react-toastify'

const WhatsAppQRModal = () => {
  const [qrCode, setQrCode] = useState(null)
  const [status, setStatus] = useState('loading')

  useEffect(() => {
    // Listen for QR code
    window.api.onWhatsAppQR((qrDataURL) => {
      setQrCode(qrDataURL)
      setStatus('scan_qr')
    })

    // Listen for status changes
    window.api.onWhatsAppStatus((newStatus) => {
      setStatus(newStatus)
      if (newStatus === 'ready' || newStatus === 'authenticated') {
        setQrCode(null) // Clear QR when authenticated
      }
    })

    // Get initial status
    window.api.getWhatsAppStatus().then((currentStatus) => {
      setStatus(currentStatus)
    })

    // Cleanup on unmount
    return () => {
      window.api.removeWhatsAppListeners()
    }
  }, [])

  if (status === 'ready' || status === 'authenticated') {
    return (
      <div className="whatsapp-status connected">
        <span className="status-icon">✅</span>
        WhatsApp Connected
      </div>
    )
  }

  if (status === 'disconnected') {
    return (
      <div className="whatsapp-status error">
        <span className="status-icon">❌</span>
        WhatsApp Disconnected - Please restart app
      </div>
    )
  }

  const handleLogout = async () => {
    if (window.confirm('Are you sure you want to logout from WhatsApp?')) {
      await window.api.logoutWhatsApp()
      toast.info('Logged out from WhatsApp')
    }
  }

  return (
    <div className="whatsapp-qr-modal">
      <div className="qr-container">
        <h2>Connect WhatsApp</h2>
        <button onClick={handleLogout}>Logout</button>
        {qrCode ? (
          <>
            <img src={qrCode} alt="WhatsApp QR Code" />
            <p>Scan this QR code with WhatsApp</p>
            <ol className="instructions">
              <li>Open WhatsApp on your phone</li>
              <li>Tap Menu or Settings</li>
              <li>Tap Linked Devices</li>
              <li>Tap Link a Device</li>
              <li>Point your phone at this screen to scan the code</li>
            </ol>
          </>
        ) : (
          <div className="loading">
            <div className="spinner"></div>
            <p>Generating QR code...</p>
          </div>
        )}
      </div>

      <style jsx>
        {`
          .whatsapp-qr-modal {
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: rgba(0, 0, 0, 0.8);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 1000;
          }

          .qr-container {
            background: white;
            padding: 2rem;
            border-radius: 12px;
            text-align: center;
            max-width: 400px;
          }

          .qr-container h2 {
            margin-bottom: 1.5rem;
            color: #25d366;
          }

          .qr-container img {
            width: 300px;
            height: 300px;
            border: 2px solid #eee;
            border-radius: 8px;
            margin-bottom: 1rem;
          }

          .instructions {
            text-align: left;
            margin-top: 1rem;
            padding-left: 1.5rem;
          }

          .instructions li {
            margin: 0.5rem 0;
            color: #666;
          }

          .whatsapp-status {
            padding: 0.5rem 1rem;
            border-radius: 8px;
            display: inline-flex;
            align-items: center;
            gap: 0.5rem;
          }

          .whatsapp-status.connected {
            background: #d4edda;
            color: #155724;
          }

          .whatsapp-status.error {
            background: #f8d7da;
            color: #721c24;
          }

          .loading {
            padding: 2rem;
          }

          .spinner {
            border: 3px solid #f3f3f3;
            border-top: 3px solid #25d366;
            border-radius: 50%;
            width: 40px;
            height: 40px;
            animation: spin 1s linear infinite;
            margin: 0 auto 1rem;
          }

          @keyframes spin {
            0% {
              transform: rotate(0deg);
            }
            100% {
              transform: rotate(360deg);
            }
          }
        `}
      </style>
    </div>
  )
}

export default WhatsAppQRModal
