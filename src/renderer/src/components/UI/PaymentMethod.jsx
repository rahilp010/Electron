/* eslint-disable prettier/prettier */
/* eslint-disable react/prop-types */
import React, { useState, useEffect, useCallback, useMemo } from 'react'
import { Modal, Button, Input, SelectPicker } from 'rsuite'
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
  ChevronDown,
  Wallet,
  SplitSquareHorizontal,
  X
} from 'lucide-react'
import { accountApi } from '../../API/Api'
import { useDispatch } from 'react-redux'
import { setAccount } from '../../app/features/electronSlice'
import { toast } from 'react-toastify'

const PAYMENT_METHODS = {
  googlepay: {
    id: 'googlepay',
    label: 'Google Pay / UPI',
    icon: <CreditCard size={18} strokeWidth={1.5} />,
    color: '#3b82f6',
    bg: '#eff6ff'
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

/* ── Inline styles ────────────────────────────────────────── */
const styles = {
  overlay: {
    position: 'fixed',
    inset: 0,
    background: 'rgba(15,23,42,0.5)',
    backdropFilter: 'blur(4px)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
    padding: '1rem'
  },
  modal: {
    background: '#fff',
    borderRadius: '20px',
    width: '100%',
    maxWidth: '640px',
    boxShadow: '0 32px 64px -12px rgba(0,0,0,0.18), 0 0 0 1px rgba(0,0,0,0.05)',
    fontFamily: "'DM Sans', 'Segoe UI', sans-serif",
    overflow: 'hidden'
  },
  header: {
    padding: '24px 24px 0',
    display: 'flex',
    alignItems: 'flex-start',
    justifyContent: 'space-between'
  },
  headerTitle: {
    fontSize: '11px',
    fontWeight: 600,
    textTransform: 'uppercase',
    marginBottom: '4px'
  },
  headerAmount: {
    fontSize: '32px',
    fontWeight: 700,
    letterSpacing: '-0.02em',
    lineHeight: 1
  },
  headerSub: {
    fontSize: '12px',
    marginTop: '4px',
    fontWeight: 400
  },
  closeBtn: {
    width: '32px',
    height: '32px',
    borderRadius: '8px',
    border: '1px solid #ccc',
    background: '#f1f5f9',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    color: 'red',
    transition: 'background 0.15s'
  },
  divider: { height: '1px', background: '#f1f5f9', margin: '20px 0 0' },
  body: { padding: '20px 24px' },
  sectionLabel: {
    fontSize: '11px',
    fontWeight: 600,
    textTransform: 'uppercase',
    marginBottom: '10px'
  },
  amountRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    background: '#f8fafc',
    borderRadius: '12px',
    padding: '12px 14px',
    border: '1.5px solid #e2e8f0',
    marginBottom: '8px'
  },
  amountPrefix: { fontSize: '18px', fontWeight: 700, color: '#64748b' },
  amountInput: {
    flex: 1,
    border: 'none',
    background: 'transparent',
    outline: 'none',
    fontSize: '22px',
    fontWeight: 700,
    color: '#0f172a',
    letterSpacing: '-0.01em',
    width: '100%'
  },
  partialBadge: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    background: '#fff7ed',
    border: '1px solid #fed7aa',
    borderRadius: '8px',
    padding: '7px 12px',
    marginBottom: '16px'
  },
  methodGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(4, 1fr)',
    gap: '8px',
    marginBottom: '16px'
  },
  methodCard: (isSelected, method) => ({
    position: 'relative',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '6px',
    padding: '12px 8px',
    borderRadius: '12px',
    cursor: 'pointer',
    border: isSelected ? `1.5px solid ${method.color}` : '1.5px solid #e2e8f0',
    background: isSelected ? method.bg : '#fff',
    color: isSelected ? method.color : '#111',
    transition: 'all 0.18s ease',
    userSelect: 'none'
  }),
  methodLabel: { fontSize: '12px', fontWeight: 600 },
  selectedDot: {
    position: 'absolute',
    top: '6px',
    right: '6px',
    width: '6px',
    height: '6px',
    borderRadius: '50%',
    background: 'currentColor'
  },
  fieldGroup: {
    background: '#f8fafc',
    border: '1.5px solid #e2e8f0',
    borderRadius: '12px',
    overflow: 'hidden',
    marginBottom: '12px'
  },
  fieldRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    padding: '10px 14px',
    borderBottom: '1px solid #f1f5f9'
  },
  fieldRowLast: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    padding: '10px 14px'
  },
  fieldIcon: { flexShrink: 0 },
  fieldLabel: { fontSize: '18px', color: '#94a3b8', fontWeight: 500, minWidth: '80px' },
  fieldInput: {
    flex: 1,
    border: 'none',
    background: 'transparent',
    outline: 'none',
    fontSize: '13px',
    fontWeight: 600,
    color: '#0f172a'
  },
  fieldSelect: {
    flex: 1,
    border: 'none',
    background: 'transparent',
    outline: 'none',
    fontSize: '13px',
    fontWeight: 600,
    color: '#0f172a',
    cursor: 'pointer'
  },
  balancePill: (positive) => ({
    display: 'inline-flex',
    alignItems: 'center',
    gap: '5px',
    background: positive ? '#f0fdf4' : '#fef2f2',
    border: `1px solid ${positive ? '#bbf7d0' : '#fecaca'}`,
    color: positive ? '#16a34a' : '#dc2626',
    borderRadius: '8px',
    padding: '6px 12px',
    fontSize: '12px',
    fontWeight: 600,
    marginTop: '2px',
    marginBottom: '4px'
  }),
  splitHeader: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: '10px'
  },
  splitRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    background: '#f8fafc',
    borderRadius: '10px',
    padding: '8px 12px',
    border: '1.5px solid #e2e8f0',
    marginBottom: '6px'
  },
  splitMethodIcon: {
    width: '28px',
    height: '28px',
    borderRadius: '7px',
    background: '#e2e8f0',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: '#94a3b8',
    flexShrink: 0
  },
  splitSelect: {
    flex: 1,
    border: 'none',
    background: 'transparent',
    outline: 'none',
    fontSize: '12px',
    fontWeight: 600,
    color: '#0f172a',
    cursor: 'pointer'
  },
  splitAmtInput: {
    width: '80px',
    border: 'none',
    background: 'transparent',
    outline: 'none',
    fontSize: '13px',
    fontWeight: 700,
    color: '#0f172a',
    textAlign: 'right'
  },
  splitDeleteBtn: {
    width: '26px',
    height: '26px',
    borderRadius: '6px',
    border: 'none',
    background: '#fee2e2',
    color: '#ef4444',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'background 0.15s',
    flexShrink: 0
  },
  addSplitBtn: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    border: '1.5px dashed #cbd5e1',
    borderRadius: '10px',
    padding: '8px 14px',
    background: 'transparent',
    color: '#64748b',
    cursor: 'pointer',
    fontSize: '12px',
    fontWeight: 600,
    width: '100%',
    justifyContent: 'center',
    transition: 'all 0.15s',
    marginTop: '4px'
  },
  splitTotal: (match) => ({
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    background: match ? '#f0fdf4' : '#fef2f2',
    borderRadius: '10px',
    padding: '10px 14px',
    marginTop: '8px',
    border: `1.5px solid ${match ? '#bbf7d0' : '#fecaca'}`
  }),
  footer: {
    display: 'flex',
    gap: '10px',
    padding: '16px 24px 24px',
    borderTop: '1px solid #f1f5f9'
  },
  cancelBtn: {
    flex: 1,
    padding: '11px',
    borderRadius: '12px',
    border: '1.5px solid #e2e8f0',
    background: '#fff',
    color: '#64748b',
    fontWeight: 600,
    fontSize: '14px',
    cursor: 'pointer',
    transition: 'all 0.15s',
    fontFamily: 'inherit'
  },
  confirmBtn: (disabled) => ({
    flex: 2,
    padding: '11px',
    borderRadius: '12px',
    border: 'none',
    background: disabled ? '#e2e8f0' : 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
    color: disabled ? '#94a3b8' : '#fff',
    fontWeight: 700,
    fontSize: '14px',
    cursor: disabled ? 'not-allowed' : 'pointer',
    transition: 'all 0.18s',
    boxShadow: disabled ? 'none' : '0 4px 12px rgba(59,130,246,0.35)',
    fontFamily: 'inherit',
    letterSpacing: '0.01em'
  }),
  splitToggleBtn: (active) => ({
    display: 'flex',
    alignItems: 'center',
    gap: '5px',
    padding: '5px 10px',
    borderRadius: '8px',
    border: 'none',
    background: active ? '#eff6ff' : 'transparent',
    color: active ? '#3b82f6' : '#94a3b8',
    fontSize: '11px',
    fontWeight: 700,
    cursor: 'pointer',
    letterSpacing: '0.04em',
    textTransform: 'uppercase',
    transition: 'all 0.15s',
    fontFamily: 'inherit'
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

  const fetchAccounts = useCallback(async () => {
    setLoading(true)
    try {
      const response = await accountApi.getAllAccounts()
      const filteredResponse = response.filter(
        (acc) => acc.accounterType === 'Main' || acc.accounterType === 'Gpay'
      )
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
  }, [open, grandTotal, fetchAccounts])

  const addSplitPayment = () => setSplitPayments([...splitPayments, { method: '', amount: '' }])
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
    let payload = null
    if (splitMode) {
      if (totalSplitAmount !== paymentAmount)
        return toast.error('Split total must equal payment amount')
      payload = {
        paymentMethod: 'split',
        amount: paymentAmount,
        accountId: selectedMethod === 'googlepay' ? Number(googlePayAccount) : '',
        accountType:
          selectedMethod === 'cash'
            ? 'Cash'
            : selectedMethod === 'googlepay' || selectedMethod === 'cheque'
              ? 'Bank'
              : '',
        referenceNo: chequeNumber || null,
        chequeStatus: selectedMethod === 'cheque' ? chequeStatus : null,
        splits: splitPayments
      }
    } else {
      payload = {
        paymentMethod: selectedMethod,
        amount: paymentAmount,
        accountId: selectedMethod === 'googlepay' ? Number(googlePayAccount) : '',
        accountType:
          selectedMethod === 'cash'
            ? 'Cash'
            : selectedMethod === 'googlepay' || selectedMethod === 'cheque'
              ? 'Bank'
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
    if (splitMode) return paymentAmount <= 0 || totalSplitAmount !== paymentAmount
    if (!selectedMethod) return true
    if (selectedMethod === 'googlepay' && !googlePayAccount) return true
    if (selectedMethod === 'cheque' && !chequeNumber.trim()) return true
    return false
  }

  const toThousands = (value) => new Intl.NumberFormat('en-IN').format(Number(value || 0))

  if (!open) return null

  const splitMatch = totalSplitAmount === paymentAmount && splitPayments.length > 0

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
          <motion.div
            style={styles.modal}
            initial={{ opacity: 0, y: 24, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 16, scale: 0.97 }}
            transition={{ type: 'spring', stiffness: 400, damping: 30 }}
          >
            {/* ── Header ── */}
            <div style={styles.header}>
              <div>
                <div style={styles.headerTitle}>Amount Due</div>
                <div style={styles.headerAmount}>₹{toThousands(grandTotal)}</div>
                <div style={styles.headerSub}>Select a payment method to continue</div>
              </div>
              <button style={styles.closeBtn} onClick={handleClose}>
                <X size={14} strokeWidth={2.5} />
              </button>
            </div>

            <div style={styles.divider} />

            {/* ── Body ── */}
            <div style={styles.body}>
              {/* Amount Input */}
              <div style={{ marginBottom: '16px' }}>
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
                    <span
                      style={{
                        fontSize: '11px',
                        fontWeight: 600,
                        color: '#f59e0b',
                        background: '#fff7ed',
                        borderRadius: '6px',
                        padding: '2px 8px',
                        border: '1px solid #fed7aa',
                        whiteSpace: 'nowrap'
                      }}
                    >
                      Partial
                    </span>
                  )}
                </div>

                {paymentAmount < grandTotal && paymentAmount > 0 && (
                  <motion.div
                    style={styles.partialBadge}
                    initial={{ opacity: 0, y: -6 }}
                    animate={{ opacity: 1, y: 0 }}
                  >
                    <AlertCircle size={13} color="#f59e0b" strokeWidth={2} />
                    <span style={{ fontSize: '12px', color: '#92400e', fontWeight: 500 }}>
                      Remaining balance: <strong>₹{toThousands(grandTotal - paymentAmount)}</strong>
                    </span>
                  </motion.div>
                )}
              </div>

              {/* Method Header Row */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginBottom: '10px'
                }}
              >
                <div style={styles.sectionLabel}>Payment Method</div>
                <button
                  style={styles.splitToggleBtn(splitMode)}
                  onClick={() => {
                    setSplitMode(!splitMode)
                    setSelectedMethod(null)
                  }}
                >
                  <SplitSquareHorizontal size={11} strokeWidth={2.5} />
                  {splitMode ? 'Single' : 'Split'}
                </button>
              </div>

              {/* Method Cards */}
              {!splitMode && (
                <motion.div style={styles.methodGrid} layout>
                  {Object.keys(PAYMENT_METHODS).map((key) => {
                    const method = PAYMENT_METHODS[key]
                    const isSelected = selectedMethod === method.id
                    return (
                      <motion.div
                        key={key}
                        style={styles.methodCard(isSelected, method)}
                        onClick={() => setSelectedMethod(method.id)}
                        whileHover={{ y: -1 }}
                        whileTap={{ scale: 0.97 }}
                        layout
                      >
                        {isSelected && <div style={styles.selectedDot} />}
                        <div style={{ color: isSelected ? method.color : '#111' }}>
                          {method.icon}
                        </div>
                        <span style={styles.methodLabel}>{method.label}</span>
                      </motion.div>
                    )
                  })}
                </motion.div>
              )}

              {/* Bank / UPI Detail */}
              <AnimatePresence>
                {selectedMethod === 'googlepay' && !splitMode && (
                  <motion.div
                    style={styles.fieldGroup}
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    <div style={styles.fieldRow}>
                      <Building2 size={14} strokeWidth={1.5} style={styles.fieldIcon} />
                      <span style={styles.fieldLabel}>Account</span>
                      <SelectPicker
                        data={bankAccounts.map((acc) => ({
                          label: `${acc.accountName} (₹${toThousands(acc.balance)})`,
                          value: acc.id
                        }))}
                        value={googlePayAccount}
                        onChange={setGooglePayAccount}
                        placeholder="Select account"
                        searchable={bankAccounts.length > 1}
                        cleanable
                        style={{ width: '100%' }}
                        container={() => document.body}
                        className="w-full"
                        placement="top"
                      />
                    </div>
                    {selectedBank && (
                      <div style={{ padding: '8px 14px' }}>
                        <div style={styles.balancePill(projectedBalance >= 0)}>
                          {projectedBalance >= 0 ? (
                            <CheckCircle2 size={12} strokeWidth={2} />
                          ) : (
                            <AlertCircle size={12} strokeWidth={2} />
                          )}
                          After payment: ₹{toThousands(projectedBalance)}
                        </div>
                      </div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Cheque Detail */}
              <AnimatePresence>
                {selectedMethod === 'cheque' && !splitMode && (
                  <motion.div
                    style={styles.fieldGroup}
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    <div style={styles.fieldRow}>
                      <FileText size={14} strokeWidth={1.5} style={styles.fieldIcon} />
                      <span style={styles.fieldLabel}>Cheque No.</span>
                      <input
                        style={styles.fieldInput}
                        placeholder="Enter number"
                        value={chequeNumber}
                        onChange={(e) => setChequeNumber(e.target.value)}
                      />
                    </div>
                    <div style={styles.fieldRowLast}>
                      <Clock size={14} strokeWidth={1.5} style={styles.fieldIcon} />
                      <span style={styles.fieldLabel}>Status</span>
                      <select
                        value={chequeStatus}
                        onChange={(e) => setChequeStatus(e.target.value)}
                        style={styles.fieldSelect}
                      >
                        <option value="pending">Pending</option>
                        <option value="cleared">Cleared</option>
                      </select>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Split UI */}
              <AnimatePresence>
                {splitMode && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    {splitPayments.map((p, i) => {
                      const methodData =
                        p.method && PAYMENT_METHODS[p.method] ? PAYMENT_METHODS[p.method] : null
                      return (
                        <motion.div
                          key={i}
                          style={styles.splitRow}
                          initial={{ opacity: 0, x: -12 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: i * 0.05 }}
                        >
                          <div
                            style={{
                              ...styles.splitMethodIcon,
                              background: methodData ? methodData.bg : '#f1f5f9',
                              color: methodData ? methodData.color : '#94a3b8'
                            }}
                          >
                            {methodData ? methodData.icon : <Wallet size={13} strokeWidth={1.5} />}
                          </div>
                          <select
                            value={p.method}
                            onChange={(e) => updateSplitPayment(i, 'method', e.target.value)}
                            style={styles.splitSelect}
                          >
                            <option value="">Method</option>
                            {Object.keys(PAYMENT_METHODS).map((key) => (
                              <option key={key} value={key}>
                                {PAYMENT_METHODS[key].label}
                              </option>
                            ))}
                          </select>
                          <span style={{ color: '#94a3b8', fontWeight: 600, fontSize: '13px' }}>
                            ₹
                          </span>
                          <input
                            type="number"
                            value={p.amount}
                            placeholder="0"
                            onChange={(e) =>
                              updateSplitPayment(i, 'amount', Number(e.target.value))
                            }
                            style={styles.splitAmtInput}
                          />
                          <button
                            style={styles.splitDeleteBtn}
                            onClick={() => removeSplitPayment(i)}
                          >
                            <Trash2 size={11} strokeWidth={2} />
                          </button>
                        </motion.div>
                      )
                    })}

                    <button style={styles.addSplitBtn} onClick={addSplitPayment}>
                      <PlusCircle size={13} strokeWidth={2} />
                      Add Payment
                    </button>

                    {splitPayments.length > 0 && (
                      <div style={styles.splitTotal(splitMatch)}>
                        <span
                          style={{
                            fontSize: '12px',
                            fontWeight: 600,
                            color: splitMatch ? '#16a34a' : '#dc2626'
                          }}
                        >
                          {splitMatch ? (
                            <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                              <CheckCircle2 size={13} /> Total Matched
                            </span>
                          ) : (
                            'Split Total'
                          )}
                        </span>
                        <span
                          style={{
                            fontSize: '14px',
                            fontWeight: 700,
                            color: splitMatch ? '#16a34a' : '#dc2626'
                          }}
                        >
                          ₹{toThousands(totalSplitAmount)}
                          <span style={{ fontSize: '11px', fontWeight: 500, opacity: 0.7 }}>
                            {' '}
                            / ₹{toThousands(paymentAmount)}
                          </span>
                        </span>
                      </div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

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
                Confirm Payment
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

export default PaymentMethod
