/* eslint-disable prettier/prettier */
import { useRef, useState, useEffect } from 'react'
import { toast } from 'react-toastify'
import { Lock, X, CheckCircle2 } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

const Authentication = () => {
  const [showPasscode, setShowPasscode] = useState(false)
  const [mounted, setMounted] = useState(false)
  const [passcode, setPasscode] = useState(['', '', '', '', '', ''])
  const [isVerifying, setIsVerifying] = useState(false)
  const inputRefs = useRef([])
  const navigate = useNavigate()

  useEffect(() => {
    setMounted(true)
  }, [])

  // Passcode handling
  const handlePasscodeChange = (index, value) => {
    if (value.length > 1) return
    if (!/^\d*$/.test(value)) return

    const newPasscode = [...passcode]
    newPasscode[index] = value
    setPasscode(newPasscode)

    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus()
    }
  }

  const handlePasscodeKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !passcode[index] && index > 0) {
      inputRefs.current[index - 1]?.focus()
    }
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && passcode.join('').length === 6) {
      handlePasscodeSubmit()
    }
  }

  const handlePasscodeSubmit = async () => {
    const code = passcode.join('')
    if (code.length !== 6) {
      toast.error('Please enter complete passcode')
      return
    }

    const response = await window.api.getAuthorization()

    if (code !== response.passcode) {
      toast.error('Incorrect passcode ❌')
      return
    } else if (code === response.passcode) {
      setIsVerifying(true)
      toast.success('Authenticated successfully')
      setTimeout(() => {
        setIsVerifying(false)
        setShowPasscode(false)
        setPasscode(['', '', '', '', '', ''])
        navigate('/dashboard')
      }, 1000)
    }
  }

  const closePasscode = () => {
    setShowPasscode(false)
    setPasscode(['', '', '', '', '', ''])
  }

  return (
    <div className="select-none h-screen w-full overflow-hidden bg-gradient-to-br from-gray-50 via-gray-100 to-gray-50">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-72 h-72 bg-blue-100/30 rounded-full blur-3xl animate-float" />
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-purple-100/20 rounded-full blur-3xl animate-float-delayed" />
      </div>

      <div className="relative z-10">
        {/* Header */}
        <div
          className={`flex justify-between items-center px-8 pt-8 pb-4 transform transition-all duration-700 ${mounted ? 'translate-y-0 opacity-100' : '-translate-y-10 opacity-0'}`}
        >
          <div className="flex items-center gap-4">
            <p className="text-4xl font-light text-gray-800">Authentication</p>
          </div>
          <div className="bg-gradient-to-br from-gray-900 to-gray-700 rounded-full px-6 py-2 shadow-lg">
            <span className="text-lg font-semibold bg-gradient-to-r from-white to-gray-200 bg-clip-text text-transparent">
              Electron
            </span>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex items-center justify-center gap-8 h-[calc(100vh-10rem)] -ml-10">
          {/* QR Code Card */}
          {/* <div
            className={`relative group transform transition-all duration-700 ${mounted ? 'translate-x-0 opacity-100' : '-translate-x-20 opacity-0'}`}
          >
            <div
              className={`relative p-8 border-2 w-[340px] h-[380px] rounded-3xl backdrop-blur-sm flex flex-col items-center justify-center cursor-pointer overflow-hidden transition-all duration-500 ${
                showQRCode
                  ? 'bg-white/90 border-gray-900 shadow-2xl scale-105'
                  : 'bg-white/60 border-gray-200 shadow-lg hover:shadow-xl hover:scale-105 hover:border-gray-300'
              }`}
              onClick={!showQRCode ? generateChallenge : undefined}
            >
              <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

              {showQRCode ? (
                <div className="relative flex flex-col items-center animate-fadeIn">
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      closeQR()
                    }}
                    className="absolute -top-4.5 -right-9 p-2 bg-gray-900 text-white rounded-full hover:bg-gray-700 transition-all duration-300 hover:rotate-90 shadow-lg"
                  >
                    <X size={20} />
                  </button>
                  <div className="p-4 bg-white rounded-2xl shadow-inner">
                    <div ref={qrRef} className="animate-scaleIn"></div>
                  </div>
                  <p className="text-xl font-light mt-6 text-gray-700 flex items-center gap-2">
                    <Scan size={24} className="animate-pulse" />
                    Scan QR Code
                  </p>
                  <div className="mt-4 flex gap-1">
                    <div
                      className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                      style={{ animationDelay: '0ms' }}
                    />
                    <div
                      className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                      style={{ animationDelay: '150ms' }}
                    />
                    <div
                      className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                      style={{ animationDelay: '300ms' }}
                    />
                  </div>
                  <div className="text-3xl text-center mt-2 absolute bg-white/50 backdrop-blur-lg w-full h-full flex items-center justify-center">
                    Not Available in this version
                  </div>
                </div>
              ) : (
                <div className="relative flex flex-col items-center animate-fadeIn">
                  <div className="relative">
                    <div className="absolute inset-0 rounded-full blur-2xl opacity-20 group-hover:opacity-40 transition-opacity duration-500" />
                    <Scan
                      size={120}
                      className="text-gray-800 transform group-hover:scale-110 transition-all duration-500 relative z-10"
                      strokeWidth={1.5}
                    />
                  </div>
                  <p className="text-2xl font-light mt-8 text-gray-700 group-hover:text-gray-900 transition-colors duration-300">
                    QR Authentication
                  </p>
                  <p className="text-sm text-gray-500 mt-2">Tap to generate code</p>
                </div>
              )}
            </div>
          </div> */}

          {/* Passcode Card */}
          <div
            className={`relative group transform transition-all duration-700 delay-100 ${mounted ? 'translate-x-0 opacity-100' : 'translate-x-20 opacity-0'}`}
          >
            <div
              className={`relative p-8 border-2 w-[340px] h-[380px] rounded-3xl backdrop-blur-sm flex flex-col items-center justify-center cursor-pointer overflow-hidden transition-all duration-500 ${
                showPasscode
                  ? 'bg-white/90 border-gray-900 shadow-2xl scale-105'
                  : 'bg-white/60 border-gray-200 shadow-lg hover:shadow-xl hover:scale-105 hover:border-gray-300'
              }`}
              onClick={!showPasscode ? () => setShowPasscode(true) : undefined}
            >
              {/* Animated gradient border effect */}
              <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

              {showPasscode ? (
                <div className="relative flex flex-col items-center w-full animate-fadeIn">
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      closePasscode()
                    }}
                    className="absolute -top-13 -right-6.5 p-2 bg-gray-900 text-white rounded-full hover:bg-gray-700 transition-all duration-300 hover:rotate-90 shadow-lg"
                  >
                    <X size={20} />
                  </button>
                  <Lock size={48} className="text-gray-700 mb-6" />
                  <p className="text-xl font-light mb-6 text-gray-700">Enter Passcode</p>
                  <div className="flex gap-2 w-full mb-8 -ml-8">
                    {passcode.map((digit, index) => (
                      <input
                        key={index}
                        ref={(el) => (inputRefs.current[index] = el)}
                        type="text"
                        inputMode="numeric"
                        maxLength={1}
                        value={digit}
                        onChange={(e) => handlePasscodeChange(index, e.target.value)}
                        onKeyDown={(e) => {
                          handlePasscodeKeyDown(index, e)
                          handleKeyDown(e)
                        }}
                        className="w-11 h-14 text-center text-2xl font-semibold border-2 border-gray-300 rounded-xl focus:border-gray-900 focus:outline-none transition-all duration-300 focus:scale-110 bg-white/80"
                        autoFocus={index === 0}
                      />
                    ))}
                  </div>
                  <button
                    onClick={handlePasscodeSubmit}
                    disabled={isVerifying || passcode.join('').length !== 6}
                    className="px-8 py-3 bg-gradient-to-r from-gray-900 to-gray-700 text-white rounded-full font-medium hover:shadow-lg transform hover:scale-105 active:scale-95 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                  >
                    {isVerifying ? (
                      <>
                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        Verifying...
                      </>
                    ) : (
                      <>
                        <CheckCircle2 size={20} />
                        Verify
                      </>
                    )}
                  </button>
                </div>
              ) : (
                <div className="relative flex flex-col items-center animate-fadeIn">
                  <div className="relative">
                    <div className="absolute inset-0 rounded-full blur-2xl opacity-20 group-hover:opacity-40 transition-opacity duration-500" />
                    <Lock
                      size={120}
                      className="text-gray-800 transform group-hover:scale-110 transition-all duration-500 relative z-10"
                      strokeWidth={1.5}
                    />
                  </div>
                  <p className="text-2xl font-light mt-8 text-gray-700 group-hover:text-gray-900 transition-colors duration-300">
                    Passcode Entry
                  </p>
                  <p className="text-sm text-gray-500 mt-2">Tap to enter code</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes float {
          0%, 100% { transform: translate(0, 0) rotate(0deg); }
          33% { transform: translate(30px, -30px) rotate(120deg); }
          66% { transform: translate(-20px, 20px) rotate(240deg); }
        }
        @keyframes float-delayed {
          0%, 100% { transform: translate(0, 0) rotate(0deg); }
          33% { transform: translate(-30px, 30px) rotate(-120deg); }
          66% { transform: translate(20px, -20px) rotate(-240deg); }
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: scale(0.95); }
          to { opacity: 1; transform: scale(1); }
        }
        @keyframes scaleIn {
          from { opacity: 0; transform: scale(0.8) rotate(-10deg); }
          to { opacity: 1; transform: scale(1) rotate(0deg); }
        }
        .animate-float {
          animation: float 20s ease-in-out infinite;
        }
        .animate-float-delayed {
          animation: float-delayed 25s ease-in-out infinite;
        }
        .animate-fadeIn {
          animation: fadeIn 0.4s ease-out;
        }
        .animate-scaleIn {
          animation: scaleIn 0.5s ease-out;
        }
      `}</style>
    </div>
  )
}

export default Authentication
