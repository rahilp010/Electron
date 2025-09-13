/* eslint-disable prettier/prettier */
/* eslint-disable no-unused-vars */
import 'rsuite/dist/rsuite-no-reset.min.css'
import scanner from '../../assets/scanner.png'
import { useRef, useState, useEffect } from 'react'
import QRCodeStyling from 'qr-code-styling'
import { toast } from 'react-toastify'
import electron from '../../assets/electron.svg'
import passcode from '../../assets/passcode.jpg'

const trustedPublicKeyBase64 = '' // 🔑 Put your trusted device's public key (spki DER, base64-encoded)

const Authentication = () => {
  const [showQRCode, setShowQRCode] = useState(false)
  const [challenge, setChallenge] = useState('')
  const [qrCode, setQrCode] = useState(null)
  const qrRef = useRef(null)

  // ---- UUID / Challenge Generator ----
  const generateChallenge = () => {
    const newChallenge =
      self.crypto.randomUUID?.() ||
      ([1e7] + -1e3 + -4e3 + -8e3 + -1e11).replace(/[018]/g, (c) =>
        (c ^ (crypto.getRandomValues(new Uint8Array(1))[0] & (15 >> (c / 4)))).toString(16)
      )

    setChallenge(newChallenge)
    setShowQRCode(true)
  }

  // ---- Init QR when challenge changes ----
  useEffect(() => {
    if (challenge) {
      const qr = new QRCodeStyling({
        width: 200,
        height: 200,
        data: JSON.stringify({ challenge }),
        image: electron,
        dotsOptions: {
          color: '#52549b',
          type: 'rounded'
        },
        imageOptions: {
          margin: 4
        }
      })
      setQrCode(qr)
    }
  }, [challenge])

  // ---- Render QR into DOM ----
  useEffect(() => {
    if (qrCode && qrRef.current) {
      qrRef.current.innerHTML = ''
      qrCode.append(qrRef.current)
    }
  }, [qrCode])

  // ---- Helper: base64 → ArrayBuffer ----
  function base64ToArrayBuffer(base64) {
    const binaryString = atob(base64)
    const len = binaryString.length
    const bytes = new Uint8Array(len)
    for (let i = 0; i < len; i++) {
      bytes[i] = binaryString.charCodeAt(i)
    }
    return bytes.buffer
  }

  // ---- Verify response from trusted device ----
  const verifyResponse = async (response) => {
    try {
      const parsed = JSON.parse(response)
      const { challenge: respChallenge, signature } = parsed

      if (respChallenge !== challenge) {
        toast.error('Challenge mismatch ❌')
        return
      }

      // Import public key
      const keyBuffer = base64ToArrayBuffer(trustedPublicKeyBase64)
      const publicKey = await crypto.subtle.importKey(
        'spki',
        keyBuffer,
        { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
        false,
        ['verify']
      )

      const encoder = new TextEncoder()
      const signatureBytes = Uint8Array.from(atob(signature), (c) => c.charCodeAt(0))

      const isValid = await crypto.subtle.verify(
        { name: 'RSASSA-PKCS1-v1_5' },
        publicKey,
        signatureBytes,
        encoder.encode(respChallenge)
      )

      if (isValid) {
        toast.success('Device authenticated ✅')
        setShowQRCode(false)
      } else {
        toast.error('Invalid signature ❌')
      }
    } catch (err) {
      console.error(err)
      toast.error('Invalid QR format ❌')
    }
  }

  return (
    <div className="select-none gap-10 h-screen w-full overflow-x-auto transition-all duration-300 min-w-[720px] overflow-auto customScrollbar">
      <div className="flex justify-between mt-10 pb-2 items-center">
        <p className="text-3xl font-light mx-7">Authentication</p>
        <div className="bg-white rounded-full px-6 py-2 mx-7 border border-gray-400">
          <span className="text-lg font-medium text-gray-900">Electron</span>
        </div>
      </div>

      <div className="flex items-center justify-center gap-5 h-[calc(100vh-10rem)]">
        <div
          className="p-6 border border-gray-100 shadow-lg w-[300px] rounded-4xl h-[300px] bg-gray-50 font-poppins flex flex-col items-center justify-center hover:cursor-pointer hover:scale-102 transition-all duration-300"
          onClick={!showQRCode ? generateChallenge : undefined}
        >
          {showQRCode ? (
            <div className="flex flex-col items-center">
              <div ref={qrRef}></div>
              <p className="text-xl font-light mt-5 text-shadow-2xs">Scan QR Code</p>
            </div>
          ) : (
            <div className="flex flex-col items-center">
              <img src={scanner} alt="scanner" className="w-48 h-48 object-cover bg-blend-screen" />
              <p className="text-xl font-light mt-5 text-shadow-2xs">Tap to Show QR Code</p>
            </div>
          )}
        </div>
        <div
          className="p-6 border border-gray-100 shadow-lg w-[300px] rounded-4xl h-[300px] bg-gray-50 font-poppins flex flex-col items-center justify-center hover:cursor-pointer hover:scale-102 transition-all duration-300"
          onClick={!showQRCode ? generateChallenge : undefined}
        >
          <div className="flex flex-col items-center">
            <img
              src={passcode}
              alt="passcode"
              className="w-[184px] h-[188px] object-cover rounded-4xl"
            />
            <p className="text-xl font-light mt-5 text-shadow-2xs">Tap to Add PassCode</p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Authentication
