/* eslint-disable prettier/prettier */
/* eslint-disable no-unused-vars */
/* eslint-disable react/prop-types */
import React, { useState, useEffect, useCallback } from 'react'
import { Modal, Button, SelectPicker, Input, InputNumber } from 'rsuite'
import { motion, AnimatePresence } from 'framer-motion'
import { CheckCircle } from 'lucide-react'
import { FaGooglePay, FaMoneyCheckDollar } from 'react-icons/fa6'
import { LiaMoneyBillWaveAltSolid } from 'react-icons/lia'
import { accountApi } from '../../API/Api'
import { useDispatch } from 'react-redux'
import { setAccount } from '../../app/features/electronSlice'
import { toast } from 'react-toastify'

const PaymentMethod = ({
  overflow,
  open,
  setOpen,
  onConfirm,
  grandTotal,
  clientId,
  clientName
}) => {
  const [selectedMethod, setSelectedMethod] = useState(null)
  const [googlePayAccount, setGooglePayAccount] = useState('')
  const [cashAmount, setCashAmount] = useState(0)
  const [chequeNumber, setChequeNumber] = useState('')
  const [bankAccounts, setBankAccounts] = useState([])
  const [clientTransfer, setClientTransfer] = useState(null)
  const [allClients, setAllClients] = useState([])

  const dispatch = useDispatch()

  const fetchAccounts = useCallback(async () => {
    try {
      const response = await accountApi.getAllAccounts()
      dispatch(setAccount(response))
      setBankAccounts(response)
    } catch (error) {
      console.error('Error fetching transactions:', error)
      toast.error('Failed to fetch transactions')
    }
  }, [dispatch])

  const fetchClients = useCallback(async () => {
    try {
      const res = await accountApi.getAllAccounts()
      setAllClients(res)
    } catch (err) {
      console.log(err)
    }
  }, [])

  useEffect(() => {
    fetchAccounts()
    fetchClients()
  }, [fetchAccounts, fetchClients])

  console.log(bankAccounts)

  const handleMethodSelect = (method) => {
    setSelectedMethod(method)
    if (method !== 'googlepay') setGooglePayAccount('')
    if (method !== 'cash') setCashAmount()
    if (method !== 'cheque') setChequeNumber('')
    if (method !== 'client') setClientTransfer(null)
  }

  const handleConfirm = async () => {
    const selectedBank = bankAccounts.find((acc) => acc.id === googlePayAccount)?.accountName || ''

    // Format sendTo string
    const formattedSendTo =
      selectedMethod === 'googlepay'
        ? `${selectedBank}`
        : selectedMethod === 'cash'
          ? `CASH ACCOUNT`
          : selectedMethod === 'cheque'
            ? `BANK ACCOUNT`
            : ''

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

      sendTo: formattedSendTo,
      chequeNumber: chequeNumber,

      ...(selectedMethod === 'googlepay' && { account: googlePayAccount }),
      ...(selectedMethod === 'cash' && { cashPaid: cashAmount }),
      ...(selectedMethod === 'cheque' && { chequeNumber })
    }

    if (onConfirm) onConfirm(paymentData)
    setOpen(false)
  }

  const handleClose = () => {
    setSelectedMethod(null)
    setGooglePayAccount('')
    setCashAmount(0)
    setChequeNumber('')
    setClientTransfer(null)
    setOpen(false)
  }

  const isConfirmDisabled = () => {
    if (!selectedMethod) return true
    if (selectedMethod === 'googlepay' && !googlePayAccount) return true
    if (selectedMethod === 'cash' && cashAmount <= 0) return true
    if (selectedMethod === 'cheque' && !chequeNumber.trim()) return true
    if (selectedMethod === 'client' && !clientTransfer) return true
    return false
  }

  // Dynamic confirm button label
  const confirmText =
    selectedMethod === 'googlepay'
      ? 'Confirm Google Pay Payment'
      : selectedMethod === 'cash'
        ? 'Confirm Cash Payment'
        : selectedMethod === 'cheque'
          ? 'Confirm Cheque Payment'
          : selectedMethod === 'client'
            ? 'Confirm Client Transfer'
            : 'Confirm Payment'

  // Framer Motion variants
  const modalVariants = {
    hidden: { opacity: 0, scale: 0.95, y: -10 },
    visible: { opacity: 1, scale: 1, y: 0 },
    exit: { opacity: 0, scale: 0.95, y: 20 }
  }

  const methodOptions = [
    {
      key: 'googlepay',
      label: 'Google Pay',
      icon: FaGooglePay,
      color: 'blue',
      glow: 'shadow-blue-100',
      size: 52
    },
    {
      key: 'cash',
      label: 'Cash',
      icon: LiaMoneyBillWaveAltSolid,
      color: 'green',
      glow: 'shadow-green-100',
      size: 40
    },
    {
      key: 'cheque',
      label: 'Cheque',
      icon: FaMoneyCheckDollar,
      color: 'red',
      glow: 'shadow-red-100',
      size: 46
    }
    // {
    //   key: 'client',
    //   label: 'Client to Client',
    //   icon: Users,
    //   color: 'orange',
    //   glow: 'shadow-orange-200'
    // }
  ]

  const toThousands = (value) => {
    if (!value) return '0'
    return new Intl.NumberFormat('en-IN').format(Number(value))
  }

  

  return (
    <AnimatePresence>
      {open && (
        <Modal
          overflow={overflow}
          open={open}
          onClose={handleClose}
          size="md"
          className="modern-history-modal"
        >
          <motion.div
            variants={modalVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            transition={{ duration: 0.25, ease: 'easeOut' }}
          >
            <Modal.Header className="py-3 border-b border-gray-100">
              <Modal.Title>
                <p className="text-2xl font-semibold text-gray-800 flex items-center gap-2">
                  Select Payment Method
                </p>
              </Modal.Title>
            </Modal.Header>

            <Modal.Body>
              <p className="text-lg font-medium mb-4 text-gray-700">
                Choose how you’d like to pay:
              </p>

              {/* Payment options */}
              <div className="grid grid-cols-3 gap-5 mb-6 mx-2">
                {methodOptions.map(({ key, label, icon: Icon, color, glow, size }) => (
                  <motion.div
                    key={key}
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.97 }}
                    onClick={() => handleMethodSelect(key)}
                    className={`relative cursor-pointer border-2 rounded-xl p-5 transition-all duration-200 flex flex-col items-center justify-center gap-2 hover:shadow-md ${
                      selectedMethod === key
                        ? `border-${color}-500 bg-${color}-50 shadow-lg ${glow}`
                        : 'border-gray-300 hover:border-gray-400'
                    }`}
                  >
                    <Icon
                      size={size}
                      className={`transition-colors duration-300 ${
                        selectedMethod === key ? `text-${color}-600` : 'text-gray-500'
                      }`}
                    />

                    <p
                      className={`absolute bottom-0 text-[10px] font-bold bg-${color}-100 w-full text-center rounded-b-xl tracking-widest`}
                    >
                      {label}
                    </p>

                    {selectedMethod === key && (
                      <CheckCircle
                        size={18}
                        className={`absolute top-3 right-3 text-${color}-600 transition-all`}
                      />
                    )}
                  </motion.div>
                ))}
              </div>

              {/* Conditional fields */}
              <AnimatePresence mode="wait">
                {selectedMethod && (
                  <motion.div
                    key={selectedMethod}
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                    transition={{ duration: 0.3 }}
                    className="mt-4"
                  >
                    {selectedMethod === 'googlepay' && (
                      <div>
                        <label className="block text-sm font-light mb-2 text-gray-700">
                          Select Bank Account for Google Pay
                          <span className="text-xs text-gray-500 font-light block mt-1 mx-1">
                            Amount to transfer: ₹{toThousands(grandTotal)}
                          </span>
                        </label>
                        <SelectPicker
                          data={bankAccounts
                            .filter((f) => f.accountName !== 'CASH ACCOUNT' && f.accountName !== 'BANK ACCOUNT')
                            .map((acc) => ({
                              value: acc.id,
                              label: `${acc.accountName} (₹${toThousands(acc.balance)})`
                            }))}
                          value={googlePayAccount}
                          onChange={(value) => setGooglePayAccount(value)}
                          placeholder="Choose Bank Account"
                          className="w-full"
                          cleanable={false}
                          searchable={bankAccounts.length > 6}
                        />
                      </div>
                    )}

                    {selectedMethod === 'cash' && (
                      <div>
                        <label className="block text-sm font-semibold mb-2 text-gray-700">
                          Enter Cash Amount
                        </label>
                        <InputNumber
                          prefix="₹"
                          value={grandTotal}
                          onChange={(value) => setCashAmount(value)}
                          placeholder="0.00"
                          className="w-full"
                          min={0}
                          step={1}
                        />
                      </div>
                    )}

                    {selectedMethod === 'cheque' && (
                      <div>
                        <label className="block text-sm font-semibold mb-2 text-gray-700">
                          Enter Cheque Number
                        </label>
                        <Input
                          value={chequeNumber}
                          onChange={(value) => setChequeNumber(value)}
                          placeholder="e.g., CHK123456"
                          className="w-full"
                        />
                      </div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </Modal.Body>

            <Modal.Footer className="flex justify-end gap-2 mt-4">
              <Button onClick={handleClose} appearance="subtle">
                Cancel
              </Button>
              <Button
                onClick={handleConfirm}
                appearance="primary"
                disabled={isConfirmDisabled()}
                className={`ml-2 transition-all duration-300 ${
                  selectedMethod === 'googlepay'
                    ? 'bg-blue-600 hover:bg-blue-500'
                    : selectedMethod === 'cash'
                      ? 'bg-green-600 hover:bg-green-500'
                      : selectedMethod === 'cheque'
                        ? 'bg-purple-600 hover:bg-purple-500'
                        : 'bg-indigo-600 hover:bg-indigo-500'
                } text-white font-semibold px-6 py-2 rounded-lg`}
              >
                {confirmText}
              </Button>
            </Modal.Footer>
          </motion.div>
        </Modal>
      )}
    </AnimatePresence>
  )
}

export default PaymentMethod
