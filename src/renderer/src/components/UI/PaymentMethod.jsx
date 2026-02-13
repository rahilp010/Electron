/* eslint-disable prettier/prettier */
/* eslint-disable react/prop-types */
import React, { useState, useEffect, useCallback } from 'react'
import { Modal, Button, Input } from 'rsuite'
import { motion, AnimatePresence } from 'framer-motion'
import { Check, Loader2, Banknote, FileText, Clock, Building2, ChevronRight } from 'lucide-react'
import { accountApi } from '../../API/Api'
import { useDispatch } from 'react-redux'
import { setAccount } from '../../app/features/electronSlice'
import { toast } from 'react-toastify'

// ... [Icons remain the same] ...
const GooglePayIcon = () => (
  <svg viewBox="0 0 48 48" className="w-full h-full" fill="none">
    <rect width="48" height="48" rx="12" fill="white" />
    <path
      d="M24 9.5C15.992 9.5 9.5 15.992 9.5 24C9.5 32.008 15.992 38.5 24 38.5C32.008 38.5 38.5 32.008 38.5 24C38.5 15.992 32.008 9.5 24 9.5Z"
      fill="#F8F9FA"
    />
    <path
      d="M33.5 22.5H24V25.5H30.2C29.9 27.3 28.2 29.5 24 29.5C20.4 29.5 17.5 26.6 17.5 23C17.5 19.4 20.4 16.5 24 16.5C26 16.5 27.5 17.3 28.6 18.3L30.8 16.1C29 14.5 26.7 13.5 24 13.5C18.8 13.5 14.5 17.8 14.5 23C14.5 28.2 18.8 32.5 24 32.5C29.4 32.5 33.5 28.9 33.5 23.5C33.5 23 33.5 22.7 33.5 22.5Z"
      fill="#4285F4"
    />
  </svg>
)

const PaymentMethod = ({ overflow, open, setOpen, onConfirm, grandTotal }) => {
  const [selectedMethod, setSelectedMethod] = useState(null)
  const [googlePayAccount, setGooglePayAccount] = useState('')
  const [chequeNumber, setChequeNumber] = useState('')
  const [bankAccounts, setBankAccounts] = useState([])
  const [loading, setLoading] = useState(false)

  const dispatch = useDispatch()

  // ... [Payment Methods Configuration remains the same] ...
  const paymentMethods = [
    {
      id: 'googlepay',
      label: 'Google Pay',
      sublabel: 'UPI & Bank Transfer',
      icon: <GooglePayIcon />,
      gradient: 'from-blue-500 to-blue-600',
      ringColor: 'ring-blue-500/20',
      bgColor: 'bg-blue-50',
      textColor: 'text-blue-700',
      buttonColor: 'bg-blue-600 hover:bg-blue-700'
    },
    {
      id: 'cash',
      label: 'Cash Payment',
      sublabel: 'Physical Currency',
      icon: <Banknote className="w-8 h-8" strokeWidth={1.5} />,
      gradient: 'from-emerald-500 to-emerald-600',
      ringColor: 'ring-emerald-500/20',
      bgColor: 'bg-emerald-50',
      textColor: 'text-emerald-700',
      buttonColor: 'bg-emerald-600 hover:bg-emerald-700'
    },
    {
      id: 'cheque',
      label: 'Bank Cheque',
      sublabel: 'Check Payment',
      icon: <FileText className="w-8 h-8" strokeWidth={1.5} />,
      gradient: 'from-purple-500 to-purple-600',
      ringColor: 'ring-purple-500/20',
      bgColor: 'bg-purple-50',
      textColor: 'text-purple-700',
      buttonColor: 'bg-purple-600 hover:bg-purple-700'
    },
    {
      id: 'pending',
      label: 'Mark Pending',
      sublabel: 'Pay Later',
      icon: <Clock className="w-8 h-8" strokeWidth={1.5} />,
      gradient: 'from-amber-500 to-orange-600',
      ringColor: 'ring-amber-500/20',
      bgColor: 'bg-amber-50',
      textColor: 'text-amber-700',
      buttonColor: 'bg-amber-600 hover:bg-amber-700'
    }
  ]

  const buttonGradients = {
    googlepay: '!from-blue-600 !to-blue-700 hover:!from-blue-700 hover:!to-blue-800',
    cash: '!from-emerald-600 !to-emerald-700 hover:!from-emerald-700 hover:!to-emerald-800',
    cheque: '!from-violet-600 !to-violet-700 hover:!from-violet-700 hover:!to-violet-800',
    pending: '!from-amber-500 !to-amber-600 hover:!from-amber-600 hover:!to-amber-700',
    default: '!from-gray-700 !to-gray-800 hover:!from-gray-800 hover:!to-gray-900'
  }

  const activeGradient = buttonGradients[selectedMethod] || buttonGradients.default

  const fetchAccounts = useCallback(async () => {
    setLoading(true)
    try {
      const response = await accountApi.getAllAccounts()
      // Ensure response is an array before setting
      if (Array.isArray(response)) {
        dispatch(setAccount(response))
        setBankAccounts(response)
      } else {
        console.error('API did not return an array:', response)
      }
    } catch (error) {
      console.error('Error fetching transactions:', error)
      toast.error('Failed to fetch transactions')
    } finally {
      setLoading(false)
    }
  }, [dispatch])

  useEffect(() => {
    if (open) fetchAccounts()
  }, [open, fetchAccounts])

  const handleMethodSelect = (method) => {
    setSelectedMethod(method)
    if (method !== 'googlepay') setGooglePayAccount('')
    if (method !== 'cheque') setChequeNumber('')
  }

  const handleConfirm = () => {
    debugger

    console.log(bankAccounts.find((acc) => acc.id === Number(googlePayAccount)))

    const selectedBank =
      bankAccounts.find((acc) => acc.id === Number(googlePayAccount))?.accountName || ''

    let sendTo = ''
    if (selectedMethod === 'googlepay') sendTo = selectedBank
    else if (selectedMethod === 'cash') sendTo = 'CASH ACCOUNT'
    else if (selectedMethod === 'cheque') sendTo = 'BANK ACCOUNT'

    const paymentData = {
      method: selectedMethod,
      amount: grandTotal,
      transactionAccount:
        selectedMethod === 'googlepay'
          ? googlePayAccount
          : selectedMethod === 'cash'
            ? 'CASH ACCOUNT'
            : selectedMethod === 'cheque'
              ? 'BANK ACCOUNT'
              : null,
      sendTo,
      chequeNumber,
      ...(selectedMethod === 'googlepay' && { account: googlePayAccount }),
      ...(selectedMethod === 'cash' && { cashPaid: grandTotal }),
      ...(selectedMethod === 'cheque' && { chequeNumber })
    }

    if (onConfirm) onConfirm(paymentData)
    handleClose()
  }

  const handleClose = () => {
    setSelectedMethod(null)
    setGooglePayAccount('')
    setChequeNumber('')
    setOpen(false)
  }

  const isConfirmDisabled = () => {
    if (!selectedMethod) return true
    if (selectedMethod === 'googlepay' && !googlePayAccount) return true
    if (selectedMethod === 'cheque' && !chequeNumber.trim()) return true
    return false
  }

  const toThousands = (value) => new Intl.NumberFormat('en-IN').format(Number(value || 0))

  const selectedMethodConfig = paymentMethods.find((m) => m.id === selectedMethod)

  // ... [MethodCard Component remains the same] ...
  const MethodCard = ({ method }) => {
    const isSelected = selectedMethod === method.id
    return (
      <motion.button
        whileHover={{ scale: 1.02, y: -2 }}
        whileTap={{ scale: 0.98 }}
        onClick={() => handleMethodSelect(method.id)}
        className={`
          relative w-full rounded-2xl border-2 p-5 transition-all duration-300 text-left
          ${
            isSelected
              ? `border-transparent bg-gradient-to-br ${method.gradient} shadow-lg ring-4 ${method.ringColor}`
              : 'border-gray-200 bg-white hover:border-gray-300 hover:shadow-md'
          }
        `}
      >
        <div
          className={`absolute top-4 right-4 w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${isSelected ? 'border-white bg-white/20' : 'border-gray-300 bg-transparent'}`}
        >
          {isSelected && (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="w-3 h-3 rounded-full bg-white"
            />
          )}
        </div>
        <div
          className={`w-16 h-16 rounded-2xl flex items-center justify-center mb-4 transition-all ${isSelected ? 'bg-white/90 shadow-md' : `${method.bgColor}`}`}
        >
          <div className={isSelected ? 'text-gray-700' : method.textColor}>{method.icon}</div>
        </div>
        <div>
          <h3 className={`font-bold text-base mb-1 ${isSelected ? 'text-white' : 'text-gray-900'}`}>
            {method.label}
          </h3>
          <p className={`text-xs ${isSelected ? 'text-white/80' : 'text-gray-500'}`}>
            {method.sublabel}
          </p>
        </div>
        {isSelected && (
          <motion.div
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            className="absolute bottom-4 right-4"
          >
            <ChevronRight className="w-5 h-5 text-white/80" />
          </motion.div>
        )}
      </motion.button>
    )
  }

  return (
    <Modal
      overflow={overflow}
      open={open}
      onClose={handleClose}
      size="lg"
      className="payment-modal"
    >
      <Modal.Header className="border-b border-gray-100 !px-2 !pt-4">
        <div className="text-center">
          <h2 className="text-xl font-bold text-gray-900 mb-2">Payment Method</h2>
          <div className="flex items-center justify-center gap-2 text-gray-500 text-sm">
            <span>Total Amount:</span>
            <span className="text-lg font-bold text-gray-900">₹{toThousands(grandTotal)}</span>
          </div>
        </div>
      </Modal.Header>

      <Modal.Body className="!px-4 !py-6 customScrollbar">
        <div className="mb-6">
          <div className="grid grid-cols-4 gap-2">
            {paymentMethods.map((method) => (
              <MethodCard key={method.id} method={method} />
            ))}
          </div>
        </div>

        <AnimatePresence mode="wait">
          {selectedMethod && selectedMethod !== 'pending' && selectedMethod !== 'cash' && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
              // FIXED: Removed 'overflow-hidden' so the dropdown can be seen
              className={`rounded-2xl border-2 ${selectedMethodConfig.bgColor} border-${selectedMethodConfig.gradient.split('-')[1]}-200`}
            >
              <div className="p-6">
                {selectedMethod === 'googlepay' && (
                  <div className="space-y-3">
                    <label className="block">
                      <span className="text-xs font-bold text-gray-700 uppercase tracking-wider mb-2 flex items-center gap-2">
                        <Building2 className="w-4 h-4" />
                        Select Bank Account
                      </span>
                      {loading ? (
                        <div className="flex items-center gap-3 text-sm text-gray-600 p-4 bg-white rounded-xl">
                          <Loader2 className="animate-spin w-5 h-5 text-blue-600" />
                          <span>Loading accounts...</span>
                        </div>
                      ) : (
                        <select
                          value={googlePayAccount}
                          onChange={(e) => setGooglePayAccount(e.target.value)}
                          className="w-full border border-gray-300 rounded px-3 py-2 bg-white cursor-pointer outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all"
                        >
                          {bankAccounts
                            .filter(
                              (f) =>
                                f.accountName !== 'CASH ACCOUNT' && f.accountName !== 'BANK ACCOUNT'
                            )
                            .map((acc) => (
                              <option key={acc.id} value={acc.id}>
                                {acc.accountName} - ₹{toThousands(acc.balance)}
                              </option>
                            ))}
                        </select>
                      )}
                      <p className="text-xs text-gray-500 mt-2 ml-1">
                        Payment will be processed from this account
                      </p>
                    </label>
                  </div>
                )}

                {selectedMethod === 'cheque' && (
                  <div className="space-y-3">
                    <label className="block">
                      <span className="text-xs font-bold text-gray-700 uppercase tracking-wider mb-2 flex items-center gap-2">
                        <FileText className="w-4 h-4" />
                        Cheque Number
                      </span>
                      <div className="relative">
                        <Input
                          value={chequeNumber}
                          onChange={setChequeNumber}
                          placeholder="Enter cheque number (e.g., 123456)"
                          className="w-full !pl-10 !py-3 !text-base"
                          style={{ paddingLeft: '2.5rem' }}
                        />
                        <FileText className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                      </div>
                      <p className="text-xs text-gray-500 mt-2 ml-1">
                        Enter the cheque number for record keeping
                      </p>
                    </label>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </Modal.Body>

      <Modal.Footer className="py-2 bg-gray-50/50 flex justify-end items-center gap-4">
        <Button
          onClick={handleClose}
          appearance="subtle"
          size="lg"
          className="!bg-gradient-to-r !from-red-500 !to-red-600 hover:!from-red-600 hover:!to-red-700 !text-white !font-bold !px-6 !rounded-xl shadow-md hover:shadow-lg transition-all duration-300 transform hover:scale-105 active:scale-95"
        >
          Cancel
        </Button>
        <Button
          onClick={handleConfirm}
          disabled={isConfirmDisabled()}
          size="lg"
          className={`
            flex items-center gap-3 !px-8 !py-3 !font-bold transition-all duration-300 !rounded-xl
            !bg-gradient-to-r shadow-lg
            ${
              isConfirmDisabled()
                ? '!from-gray-300 !to-gray-400 !text-gray-100 cursor-not-allowed shadow-none'
                : `${activeGradient} !text-white hover:shadow-xl transform hover:scale-105 active:scale-95`
            }
          `}
        >
          <span>{selectedMethod === 'pending' ? 'Mark as Pending' : 'Confirm Payment'}</span>
          {!isConfirmDisabled() && <Check className="w-5 h-5" strokeWidth={2.5} />}
        </Button>
      </Modal.Footer>
    </Modal>
  )
}

export default PaymentMethod
