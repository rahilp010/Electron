/* eslint-disable prettier/prettier */
/* eslint-disable react/prop-types */
import React, { useState, useEffect, useCallback, useMemo } from 'react'
import { SelectPicker } from 'rsuite'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Banknote,
  FileText,
  Clock,
  Building2,
  Trash2,
  PlusCircle,
  AlertCircle,
  CheckCircle2,
  CreditCard,
  Wallet,
  X,
  Plus,
  ArrowRight
} from 'lucide-react'
import { accountApi } from '../../API/Api'
import { useDispatch } from 'react-redux'
import { setAccount } from '../../app/features/electronSlice'
import { toast } from 'react-toastify'
import CreateAccountModal from '../Modal/CreateAccountModal'
import { IoLogoGoogle } from 'react-icons/io'

const PAYMENT_METHODS = {
  googlepay: {
    id: 'googlepay',
    label: 'Google Pay / UPI',
    icon: <IoLogoGoogle size={18} strokeWidth={1.5} />,
    color: '#3b82f6',
    bg: '#eff6ff'
  },
  bank: {
    id: 'bank',
    label: 'Bank Transfer',
    icon: <Building2 size={18} strokeWidth={1.5} />,
    color: '#0ea5e9',
    bg: '#f0f9ff'
  },
  cash: {
    id: 'cash',
    label: 'Cash',
    icon: <Banknote size={18} strokeWidth={1.5} />,
    color: '#10b981',
    bg: '#f0fdf4'
  },
  cheque: {
    id: 'cheque',
    label: 'Cheque',
    icon: <FileText size={18} strokeWidth={1.5} />,
    color: '#8b5cf6',
    bg: '#f5f3ff'
  },
  pending: {
    id: 'pending',
    label: 'Pending',
    icon: <Clock size={18} strokeWidth={1.5} />,
    color: '#f59e0b',
    bg: '#fffbeb'
  }
}

// Data arrays for rsuite SelectPickers
const methodOptions = Object.values(PAYMENT_METHODS).map((m) => ({
  label: m.label,
  value: m.id
}))

const chequeStatusOptions = [
  { label: 'Pending Clearance', value: 'pending' },
  { label: 'Cleared', value: 'cleared' }
]

/* ── Refined Styles for Wider Layout & Smaller Fonts ──────────────────── */
const styles = {
  overlay: {
    position: 'fixed',
    inset: 0,
    background: 'rgba(15,23,42,0.6)',
    backdropFilter: 'blur(6px)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
    padding: '1.5rem'
  },
  modal: {
    background: '#ffffff',
    borderRadius: '20px',
    width: '100%',
    maxWidth: '840px', // Increased width
    boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25), 0 0 0 1px rgba(0,0,0,0.05)',
    fontFamily: "'DM Sans', 'Inter', sans-serif",
    display: 'flex',
    flexDirection: 'column',
    maxHeight: '90vh'
  },
  header: {
    padding: '24px 32px 20px',
    background: '#f8fafc',
    borderBottom: '1px solid #e2e8f0',
    display: 'flex',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    borderRadius: '20px 20px 0 0'
  },
  headerTitle: {
    fontSize: '12px', // Scaled down
    fontWeight: 700,
    color: '#64748b',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
    marginBottom: '6px'
  },
  headerAmount: {
    fontSize: '36px', // Scaled down from 42px
    fontWeight: 800,
    color: '#0f172a',
    letterSpacing: '-0.03em',
    lineHeight: 1
  },
  headerSub: {
    fontSize: '13px',
    color: '#64748b',
    marginTop: '6px',
    fontWeight: 500
  },
  closeBtn: {
    width: '32px',
    height: '32px',
    borderRadius: '50%',
    background: '#ffffff',
    border: '1px solid #e2e8f0',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    color: '#64748b',
    transition: 'all 0.2s',
    boxShadow: '0 2px 4px rgba(0,0,0,0.02)'
  },
  // Adding CSS custom properties to hide the scrollbar but keep functionality
  bodyScroll: {
    padding: '24px 32px',
    overflowY: 'auto',
    flex: 1,
    scrollbarWidth: 'none', // Firefox
    msOverflowStyle: 'none' // IE and Edge
  },
  sectionLabel: {
    fontSize: '12px',
    fontWeight: 700,
    color: '#475569',
    textTransform: 'uppercase',
    letterSpacing: '0.04em',
    marginBottom: '10px'
  },
  amountRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    background: '#ffffff',
    borderRadius: '12px',
    padding: '12px 20px',
    border: '2px solid #e2e8f0',
    marginBottom: '20px',
    boxShadow: '0 2px 4px -1px rgba(0,0,0,0.02)'
  },
  amountPrefix: { fontSize: '20px', fontWeight: 700, color: '#94a3b8' },
  amountInput: {
    flex: 1,
    border: 'none',
    background: 'transparent',
    outline: 'none',
    fontSize: '24px', // Scaled down
    fontWeight: 700,
    color: '#0f172a',
    letterSpacing: '-0.02em',
    width: '100%'
  },
  tabsContainer: {
    display: 'flex',
    background: '#f1f5f9',
    borderRadius: '10px',
    padding: '4px',
    marginBottom: '20px'
  },
  tab: (active) => ({
    flex: 1,
    padding: '8px 16px',
    borderRadius: '8px',
    fontSize: '13px',
    fontWeight: 600,
    border: 'none',
    cursor: 'pointer',
    transition: 'all 0.2s',
    background: active ? '#ffffff' : 'transparent',
    color: active ? '#0f172a' : '#64748b',
    boxShadow: active ? '0 2px 6px rgba(0,0,0,0.05)' : 'none'
  }),
  methodGrid: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '10px',
    marginBottom: '20px',
    justifyContent: 'center'
  },
  methodCard: (isSelected, method) => ({
    flex: '1 1 calc(20% - 10px)', // Fit 5 in a row comfortably with 840px width
    minWidth: '120px',
    position: 'relative',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    padding: '12px',
    borderRadius: '12px',
    cursor: 'pointer',
    border: isSelected ? `2px solid ${method.color}` : '2px solid #e2e8f0',
    background: isSelected ? method.bg : '#ffffff',
    color: isSelected ? method.color : '#475569',
    transition: 'all 0.2s ease',
    userSelect: 'none',
    boxShadow: isSelected ? `0 4px 12px ${method.color}20` : '0 2px 4px rgba(0,0,0,0.02)'
  }),
  methodLabel: { fontSize: '12px', fontWeight: 600, textAlign: 'center' },
  selectedIndicator: {
    position: 'absolute',
    top: '8px',
    right: '8px',
    color: 'currentColor'
  },
  fieldGroup: {
    background: '#ffffff',
    border: '2px solid #e2e8f0',
    borderRadius: '12px',
    overflow: 'hidden',
    marginBottom: '16px'
  },
  fieldRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
    padding: '12px 20px',
    borderBottom: '1px solid #f1f5f9'
  },
  fieldLabel: { fontSize: '13px', color: '#64748b', fontWeight: 600, minWidth: '90px' },
  fieldInput: {
    flex: 1,
    border: 'none',
    background: 'transparent',
    outline: 'none',
    fontSize: '14px',
    fontWeight: 600,
    color: '#0f172a'
  },
  splitCard: {
    background: '#ffffff',
    borderRadius: '12px',
    padding: '14px',
    border: '2px solid #e2e8f0',
    marginBottom: '10px',
    boxShadow: '0 2px 4px rgba(0,0,0,0.02)'
  },
  addSplitBtn: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    border: '2px dashed #cbd5e1',
    borderRadius: '12px',
    padding: '12px',
    background: '#f8fafc',
    color: '#475569',
    cursor: 'pointer',
    fontSize: '13px',
    fontWeight: 600,
    width: '100%',
    justifyContent: 'center',
    transition: 'all 0.2s'
  },
  footer: {
    display: 'flex',
    gap: '12px',
    padding: '20px 32px',
    background: '#ffffff',
    borderTop: '1px solid #e2e8f0',
    borderRadius: '0 0 20px 20px'
  },
  cancelBtn: {
    flex: 1,
    padding: '12px',
    borderRadius: '10px',
    border: '2px solid #e2e8f0',
    background: '#ffffff',
    color: '#475569',
    fontWeight: 700,
    fontSize: '14px',
    cursor: 'pointer',
    transition: 'all 0.2s'
  },
  confirmBtn: (disabled) => ({
    flex: 2,
    padding: '12px',
    borderRadius: '10px',
    border: 'none',
    background: disabled ? '#cbd5e1' : '#0f172a',
    color: disabled ? '#f8fafc' : '#ffffff',
    fontWeight: 700,
    fontSize: '14px',
    cursor: disabled ? 'not-allowed' : 'pointer',
    transition: 'all 0.2s',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    boxShadow: disabled ? 'none' : '0 8px 12px -3px rgba(15, 23, 42, 0.2)'
  })
}

/* ── Component ────────────────────────────────────────────── */
const PaymentMethod = ({ overflow = false, open, setOpen, onConfirm, grandTotal }) => {
  const dispatch = useDispatch()
  const [selectedMethod, setSelectedMethod] = useState(null)
  const [bankAccounts, setBankAccounts] = useState([])
  const [loading, setLoading] = useState(false)
  const [paymentAmount, setPaymentAmount] = useState(grandTotal)
  const [splitMode, setSplitMode] = useState(false)
  const [splitPayments, setSplitPayments] = useState([])
  const [googlePayAccount, setGooglePayAccount] = useState('')
  const [chequeNumber, setChequeNumber] = useState('')
  const [chequeStatus, setChequeStatus] = useState('pending')
  const [createAccountModal, setCreateAccountModal] = useState(false)

  const fetchAccounts = useCallback(async () => {
    setLoading(true)
    try {
      const response = await accountApi.getAllAccounts()
      const filteredResponse = response.filter((acc) => acc.accounterType === 'GPay')
      if (Array.isArray(filteredResponse)) {
        dispatch(setAccount(filteredResponse))
        setBankAccounts(filteredResponse)
      }
    } catch {
      toast.error('Failed to fetch accounts')
    } finally {
      setLoading(false)
    }
  }, [dispatch])

  useEffect(() => {
    if (open) {
      fetchAccounts()
      setPaymentAmount(grandTotal)
      setSplitMode(false)
      setSplitPayments([])
    }
  }, [open, grandTotal, fetchAccounts, createAccountModal])

  const addSplitPayment = () =>
    setSplitPayments([...splitPayments, { method: '', amount: '', accountId: '' }])

  const updateSplitPayment = (index, key, value) => {
    const updated = [...splitPayments]
    updated[index][key] = value
    setSplitPayments(updated)
  }

  const removeSplitPayment = (index) =>
    setSplitPayments(splitPayments.filter((_, i) => i !== index))

  const totalSplitAmount = useMemo(
    () => splitPayments.reduce((sum, p) => sum + Number(p.amount || 0), 0),
    [splitPayments]
  )

  const selectedBank = bankAccounts.find((acc) => acc.id === Number(googlePayAccount))
  const projectedBalance = selectedBank ? selectedBank.balance - paymentAmount : null

  const handleConfirm = () => {
    debugger
    let payload = null
    if (splitMode) {
      if (totalSplitAmount !== paymentAmount)
        return toast.error('Split total must equal receiving amount')

      const hasInvalidAccount = splitPayments.some((p) => p.method === 'googlepay' && !p.accountId)
      if (hasInvalidAccount) return toast.error('Select an account for GooglePay splits')

      if (splitMode) {
        if (paymentAmount <= 0 || totalSplitAmount !== paymentAmount) return true

        payload = {
          paymentMethod: 'split',
          amount: paymentAmount,
          accountType:
            selectedMethod === 'cash'
              ? 'Cash'
              : selectedMethod === 'bank' || selectedMethod === 'cheque'
                ? 'Bank'
                : selectedMethod === 'googlepay'
                  ? 'Gpay'
                  : '',
          referenceNo: chequeNumber || null,
          chequeStatus: selectedMethod === 'cheque' ? chequeStatus : null,
          splits: splitPayments.map((p) => ({
            method: p.method,
            amount: Number(p.amount),
            accountId: p.accountId || null
          }))
        }
      }
    } else {
      payload = {
        paymentMethod:
          selectedMethod === 'bank' || selectedMethod === 'cheque'
            ? 'bank'
            : selectedMethod === 'pending'
              ? 'pending'
              : selectedMethod,
        amount: paymentAmount,
        accountId: selectedMethod === 'googlepay' ? Number(googlePayAccount) : '',
        accountType:
          selectedMethod === 'cash'
            ? 'Cash'
            : selectedMethod === 'bank' || selectedMethod === 'cheque'
              ? 'Bank'
              : selectedMethod === 'googlepay'
                ? 'Gpay'
                : '',
        referenceNo: chequeNumber || null,
        chequeStatus: selectedMethod === 'cheque' ? chequeStatus : null
      }
    }
    if (onConfirm) onConfirm(payload)
    handleClose()
  }

  const handleClose = () => {
    setSelectedMethod(null)
    setGooglePayAccount('')
    setChequeNumber('')
    setChequeStatus('pending')
    setSplitPayments([])
    setSplitMode(false)
    setOpen(false)
  }

  const isConfirmDisabled = () => {
    if (splitMode)
      return paymentAmount <= 0 || totalSplitAmount !== paymentAmount || splitPayments.length === 0
    if (!selectedMethod) return true
    if (selectedMethod === 'googlepay' && !googlePayAccount) return true
    if (selectedMethod === 'cheque' && !chequeNumber.trim()) return true
    return false
  }

  const toThousands = (value) => new Intl.NumberFormat('en-IN').format(Number(value || 0))

  if (!open) return null

  const splitRemaining = paymentAmount - totalSplitAmount

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          style={styles.overlay}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={(e) => e.target === e.currentTarget && handleClose()}
        >
          {/* Internal scoped CSS to hide WebKit scrollbar */}
          <style>
            {`
              .hide-scrollbar::-webkit-scrollbar {
                display: none;
              }
            `}
          </style>

          <motion.div
            style={styles.modal}
            initial={{ opacity: 0, y: 30, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.98 }}
            transition={{ type: 'spring', stiffness: 350, damping: 30 }}
          >
            {/* ── Header ── */}
            <div style={styles.header}>
              <div>
                <div style={styles.headerTitle}>Total Amount Due</div>
                <div style={styles.headerAmount}>₹{toThousands(grandTotal)}</div>
                <div style={styles.headerSub}>Configure your payment receiving details</div>
              </div>
              <button
                style={styles.closeBtn}
                onClick={handleClose}
                onMouseEnter={(e) => (e.currentTarget.style.background = '#f1f5f9')}
                onMouseLeave={(e) => (e.currentTarget.style.background = '#ffffff')}
              >
                <X size={16} strokeWidth={2.5} />
              </button>
            </div>

            {/* ── Scrollable Body ── */}
            <div style={styles.bodyScroll} className="hide-scrollbar">
              {/* Receiving Amount Input */}
              {/* <div>
                <div style={styles.sectionLabel}>Receiving Amount</div>
                <div style={styles.amountRow}>
                  <span style={styles.amountPrefix}>₹</span>
                  <input
                    style={styles.amountInput}
                    type="number"
                    value={paymentAmount}
                    onChange={(e) => setPaymentAmount(Number(e.target.value))}
                    placeholder="0"
                  />
                  {paymentAmount > 0 && paymentAmount !== grandTotal && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        background: '#fff7ed',
                        color: '#ea580c',
                        padding: '4px 10px',
                        borderRadius: '8px',
                        fontWeight: 700,
                        fontSize: '12px',
                        border: '1px solid #fdba74'
                      }}
                    >
                      <AlertCircle size={13} strokeWidth={2.5} />
                      Partial Payment
                    </motion.div>
                  )}
                </div>
              </div> */}

              {/* Tabs Switcher */}
              <div style={styles.tabsContainer}>
                <button
                  style={styles.tab(!splitMode)}
                  onClick={() => {
                    setSplitMode(false)
                    setSplitPayments([])
                  }}
                >
                  Single Method
                </button>
                <button
                  style={styles.tab(splitMode)}
                  onClick={() => {
                    setSplitMode(true)
                    setSelectedMethod(null)
                    if (splitPayments.length === 0) addSplitPayment()
                  }}
                >
                  Split Payment
                </button>
              </div>

              {/* ── Single Payment Flow ── */}
              {!splitMode && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                  <div style={styles.sectionLabel}>Select Method</div>
                  <div style={styles.methodGrid}>
                    {Object.keys(PAYMENT_METHODS).map((key) => {
                      const method = PAYMENT_METHODS[key]
                      const isSelected = selectedMethod === method.id
                      return (
                        <motion.div
                          key={key}
                          style={styles.methodCard(isSelected, method)}
                          onClick={() => setSelectedMethod(method.id)}
                          whileHover={{ y: -2 }}
                          whileTap={{ scale: 0.98 }}
                        >
                          {isSelected && (
                            <div style={styles.selectedIndicator}>
                              <CheckCircle2 size={14} fill="currentColor" color="#fff" />
                            </div>
                          )}
                          <div>{method.icon}</div>
                          <span style={styles.methodLabel}>{method.label}</span>
                        </motion.div>
                      )
                    })}
                  </div>

                  {/* GPay Dynamic Field */}
                  <AnimatePresence>
                    {selectedMethod === 'googlepay' && (
                      <motion.div
                        style={styles.fieldGroup}
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                      >
                        <div style={styles.fieldRow}>
                          <Building2 size={16} color="#64748b" />
                          <span style={styles.fieldLabel}>Account</span>
                          <div style={{ flex: 1 }}>
                            <SelectPicker
                              data={bankAccounts.map((acc) => ({
                                label: `${acc.accountName} (₹${toThousands(acc?.closingBalance)})`,
                                value: acc.id
                              }))}
                              value={googlePayAccount}
                              onChange={setGooglePayAccount}
                              placeholder="Select receiving account"
                              searchable={bankAccounts.length > 1}
                              cleanable
                              style={{ width: '100%' }}
                              renderExtraFooter={() => (
                                <div className="p-3 border-t border-gray-100 bg-gray-50">
                                  <button
                                    className="text-blue-600 text-sm font-bold flex items-center gap-2 w-full hover:text-blue-800"
                                    onClick={(e) => {
                                      e.preventDefault()
                                      setCreateAccountModal(true)
                                    }}
                                  >
                                    <Plus size={16} /> Create New Account
                                  </button>
                                </div>
                              )}
                            />
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Cheque Dynamic Field */}
                  <AnimatePresence>
                    {selectedMethod === 'cheque' && (
                      <motion.div
                        style={styles.fieldGroup}
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                      >
                        <div style={styles.fieldRow}>
                          <FileText size={16} color="#64748b" />
                          <span style={styles.fieldLabel}>Cheque No.</span>
                          <input
                            style={styles.fieldInput}
                            placeholder="Enter 6-digit number"
                            value={chequeNumber}
                            onChange={(e) => setChequeNumber(e.target.value)}
                          />
                        </div>
                        <div style={{ ...styles.fieldRow, borderBottom: 'none' }}>
                          <Clock size={16} color="#64748b" />
                          <span style={styles.fieldLabel}>Status</span>
                          <div style={{ flex: 1 }}>
                            <SelectPicker
                              data={chequeStatusOptions}
                              value={chequeStatus}
                              onChange={setChequeStatus}
                              searchable={false}
                              cleanable={false}
                              style={{ width: '100%' }}
                            />
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              )}

              {/* ── Split Payment Flow ── */}
              <AnimatePresence>
                {splitMode && (
                  <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                  >
                    {/* Progress Overview */}
                    <div
                      style={{
                        background: splitRemaining === 0 ? '#f0fdf4' : '#f8fafc',
                        border: `2px solid ${splitRemaining === 0 ? '#bbf7d0' : '#e2e8f0'}`,
                        borderRadius: '12px',
                        padding: '12px 16px',
                        marginBottom: '16px',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center'
                      }}
                    >
                      <div>
                        <div
                          style={{
                            fontSize: '11px',
                            fontWeight: 700,
                            color: '#64748b',
                            textTransform: 'uppercase'
                          }}
                        >
                          Split Progress
                        </div>
                        <div
                          style={{
                            fontSize: '18px',
                            fontWeight: 800,
                            color: splitRemaining === 0 ? '#16a34a' : '#0f172a'
                          }}
                        >
                          ₹{toThousands(totalSplitAmount)}{' '}
                          <span style={{ opacity: 0.5, fontSize: '14px' }}>
                            / ₹{toThousands(paymentAmount)}
                          </span>
                        </div>
                      </div>

                      {splitRemaining > 0 && (
                        <div style={{ textAlign: 'right' }}>
                          <div style={{ fontSize: '11px', fontWeight: 600, color: '#ef4444' }}>
                            Remaining
                          </div>
                          <div style={{ fontSize: '15px', fontWeight: 700, color: '#ef4444' }}>
                            ₹{toThousands(splitRemaining)}
                          </div>
                        </div>
                      )}
                      {splitRemaining === 0 && (
                        <div
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px',
                            color: '#16a34a',
                            fontWeight: 700,
                            fontSize: '14px'
                          }}
                        >
                          <CheckCircle2 size={18} /> Matched
                        </div>
                      )}
                    </div>

                    {/* Split Items */}
                    {splitPayments.map((p, i) => {
                      const mData = p.method ? PAYMENT_METHODS[p.method] : null
                      return (
                        <motion.div key={i} style={styles.splitCard} layout>
                          <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                            {/* Method Icon */}
                            <div
                              style={{
                                width: 38,
                                height: 38,
                                borderRadius: 10,
                                background: mData ? mData.bg : '#f1f5f9',
                                color: mData ? mData.color : '#94a3b8',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center'
                              }}
                            >
                              {mData ? mData.icon : <Wallet size={18} />}
                            </div>

                            {/* Method Select (Using SelectPicker) */}
                            <div style={{ flex: 1 }}>
                              <SelectPicker
                                data={methodOptions}
                                value={p.method}
                                onChange={(val) => {
                                  updateSplitPayment(i, 'method', val)
                                  updateSplitPayment(i, 'accountId', '')
                                }}
                                placeholder="Select Method"
                                searchable={true}
                                cleanable={false}
                                style={{ width: '100%' }}
                              />
                            </div>

                            {/* Amount Input */}
                            <div
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                background: '#f8fafc',
                                padding: '6px 10px',
                                borderRadius: '8px',
                                border: '1px solid #e2e8f0'
                              }}
                            >
                              <span
                                style={{
                                  fontWeight: 600,
                                  color: '#64748b',
                                  marginRight: '4px',
                                  fontSize: '14px'
                                }}
                              >
                                ₹
                              </span>
                              <input
                                type="text"
                                value={p.amount}
                                placeholder="0"
                                onChange={(e) =>
                                  updateSplitPayment(i, 'amount', Number(e.target.value))
                                }
                                style={{
                                  width: '80px',
                                  border: 'none',
                                  background: 'transparent',
                                  fontWeight: 700,
                                  fontSize: '15px',
                                  textAlign: 'right',
                                  outline: 'none'
                                }}
                              />
                            </div>

                            {/* Delete */}
                            <button
                              onClick={() => removeSplitPayment(i)}
                              style={{
                                width: 34,
                                height: 34,
                                borderRadius: 8,
                                border: 'none',
                                background: '#fef2f2',
                                color: '#ef4444',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center'
                              }}
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>

                          {/* Conditional GPay Account Select for Split */}
                          {p.method === 'googlepay' && (
                            <div
                              style={{
                                marginTop: '12px',
                                borderTop: '1px dashed #e2e8f0',
                                paddingTop: '12px'
                              }}
                            >
                              <SelectPicker
                                data={bankAccounts.map((acc) => ({
                                  label: `${acc.accountName} (₹${toThousands(acc.closingBalance)})`,
                                  value: acc.id
                                }))}
                                value={p.accountId}
                                onChange={(val) => updateSplitPayment(i, 'accountId', val)}
                                placeholder="Select receiving GPay Account"
                                style={{ width: '100%' }}
                                renderExtraFooter={() => (
                                  <div className="p-3 border-t border-gray-100 bg-gray-50">
                                    <button
                                      className="text-blue-600 text-sm font-bold flex items-center gap-2 w-full hover:text-blue-800"
                                      onClick={(e) => {
                                        e.preventDefault()
                                        setCreateAccountModal(true)
                                      }}
                                    >
                                      <Plus size={16} /> Create New Account
                                    </button>
                                  </div>
                                )}
                              />
                            </div>
                          )}
                        </motion.div>
                      )
                    })}

                    <button
                      style={styles.addSplitBtn}
                      onClick={addSplitPayment}
                      onMouseEnter={(e) => (e.currentTarget.style.borderColor = '#94a3b8')}
                      onMouseLeave={(e) => (e.currentTarget.style.borderColor = '#cbd5e1')}
                    >
                      <PlusCircle size={16} />
                      Add Another Method
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {createAccountModal && (
              <CreateAccountModal setShowModal={() => setCreateAccountModal(false)} />
            )}

            {/* ── Footer ── */}
            <div style={styles.footer}>
              <button style={styles.cancelBtn} onClick={handleClose}>
                Cancel
              </button>
              <button
                style={styles.confirmBtn(isConfirmDisabled())}
                onClick={handleConfirm}
                disabled={isConfirmDisabled()}
              >
                Confirm Receipt <ArrowRight size={16} />
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

export default PaymentMethod
