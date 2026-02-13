import { contextBridge, ipcRenderer } from 'electron'

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld('api', {
  getAllProducts: () => ipcRenderer.invoke('getAllProducts'),
  createProduct: (product) => ipcRenderer.invoke('createProduct', product),
  updateProduct: (product) => ipcRenderer.invoke('updateProduct', product),
  deleteProduct: (id) => ipcRenderer.invoke('deleteProduct', id),
  getProductById: (id) => ipcRenderer.invoke('getProductById', id),

  // Client methods
  getAllClients: () => ipcRenderer.invoke('getAllClients'),
  createClient: (client) => ipcRenderer.invoke('createClient', client),
  updateClient: (client) => ipcRenderer.invoke('updateClient', client),
  deleteClient: (id) => ipcRenderer.invoke('deleteClient', id),
  getClientById: (id) => ipcRenderer.invoke('getClientById', id),

  // Transaction methods
  getAllTransactions: () => ipcRenderer.invoke('getAllTransactions'),
  createTransaction: (transaction) => ipcRenderer.invoke('createTransaction', transaction),
  updateTransaction: (transaction) => ipcRenderer.invoke('updateTransaction', transaction),
  deleteTransaction: (id) => ipcRenderer.invoke('deleteTransaction', id),
  getTransactionById: (id) => ipcRenderer.invoke('getTransactionById', id),

  // Bank receipt methods
  getRecentBankReceipts: () => ipcRenderer.invoke('getRecentBankReceipts'),
  getBankReceiptByTransactionId: (transactionId) =>
    ipcRenderer.invoke('getBankReceiptByTransactionId', transactionId),
  createBankReceipt: (bankReceipt) => ipcRenderer.invoke('createBankReceipt', bankReceipt),
  updateBankReceipt: (bankReceipt) => ipcRenderer.invoke('updateBankReceipt', bankReceipt),
  deleteBankReceipt: (id) => ipcRenderer.invoke('deleteBankReceipt', id),

  // Cash receipt methods
  getRecentCashReceipts: () => ipcRenderer.invoke('getRecentCashReceipts'),
  getRecentCashReceiptsByTransactionId: (transactionId) =>
    ipcRenderer.invoke('getRecentCashReceiptsByTransactionId', transactionId),
  createCashReceipt: (cashReceipt) => ipcRenderer.invoke('createCashReceipt', cashReceipt),
  updateCashReceipt: (cashReceipt) => ipcRenderer.invoke('updateCashReceipt', cashReceipt),
  deleteCashReceipt: (id) => ipcRenderer.invoke('deleteCashReceipt', id),
  deleteCashReceiptByTransaction: (transactionId) =>
    ipcRenderer.invoke('deleteCashReceiptByTransaction', transactionId),
  deleteBankReceiptByTransaction: (transactionId) =>
    ipcRenderer.invoke('deleteBankReceiptByTransaction', transactionId),
  getCashReceiptByTransactionId: (transactionId) =>
    ipcRenderer.invoke('getCashReceiptByTransactionId', transactionId),

  // Excel Import
  importExcel: (filePath, tableName) => ipcRenderer.invoke('importExcel', filePath, tableName),

  // (Optional) Excel Export
  exportExcel: (tableName, savePath) => ipcRenderer.invoke('exportExcel', tableName, savePath),

  // PDF Export
  generatePDF: (options) => ipcRenderer.invoke('generate-pdf', options),

  //ladger

  getLedgerTransactions: () => ipcRenderer.invoke('getLedgerTransactions'),
  getAccountBalances: () => ipcRenderer.invoke('getAccountBalances'),
  createLedgerTransaction: (ledgerTransaction) =>
    ipcRenderer.invoke('createLedgerTransaction', ledgerTransaction),
  updateLedgerTransaction: (ledgerTransaction) =>
    ipcRenderer.invoke('updateLedgerTransaction', ledgerTransaction),
  deleteLedgerTransaction: (id) => ipcRenderer.invoke('deleteLedgerTransaction', id),
  transferAmount: (data) => ipcRenderer.invoke('transferAmount', data),

  // Account methods
  getAllAccounts: () => ipcRenderer.invoke('getAllAccounts'),
  createAccount: (account) => ipcRenderer.invoke('createAccount', account),
  updateAccount: (account) => ipcRenderer.invoke('updateAccount', account),
  deleteAccount: (id) => ipcRenderer.invoke('deleteAccount', id),
  getAccountById: (id) => ipcRenderer.invoke('getAccountById', id),

  // Settings
  getSettings: () => ipcRenderer.invoke('getSettings'),
  createSettings: (settings) => ipcRenderer.invoke('createSettings', settings),
  updateSettings: (settings) => ipcRenderer.invoke('updateSettings', settings),
  deleteSettings: (id) => ipcRenderer.invoke('deleteSettings', id),

  getKeyBindings: () => ipcRenderer.invoke('getKeyBindings'),
  createKeyBinding: (data) => ipcRenderer.invoke('createKeyBinding', data),
  updateKeyBinding: (data) => ipcRenderer.invoke('updateKeyBinding', data),
  deleteKeyBinding: (id) => ipcRenderer.invoke('deleteKeyBinding', id),

  // Backup methods
  restoreBackup: (backupFilePath) => ipcRenderer.invoke('restoreBackup', backupFilePath),
  selectBackupFile: () => ipcRenderer.invoke('selectBackupFile'),
  manualBackup: () => ipcRenderer.invoke('manualBackup'),

  // Authorization
  getAuthorization: () => ipcRenderer.invoke('getAuthorization')

  // // WhatsApp methods
  // saveAndSendWhatsAppPDF: (phone, arrayBuffer, fileName, caption) =>
  //   ipcRenderer.invoke('saveAndSendWhatsAppPDF', phone, arrayBuffer, fileName, caption),

  // getWhatsAppStatus: () => ipcRenderer.invoke('getWhatsAppStatus'),

  // logoutWhatsApp: () => ipcRenderer.invoke('logoutWhatsApp'),

  // // Listen for WhatsApp events
  // onWhatsAppQR: (callback) => {
  //   ipcRenderer.on('whatsapp-qr', (event, qrDataURL) => callback(qrDataURL))
  // },

  // onWhatsAppStatus: (callback) => {
  //   ipcRenderer.on('whatsapp-status', (event, status) => callback(status))
  // },

  // // Cleanup listeners
  // removeWhatsAppListeners: () => {
  //   ipcRenderer.removeAllListeners('whatsapp-qr')
  //   ipcRenderer.removeAllListeners('whatsapp-status')
  // }
})

// Version information
window.addEventListener('DOMContentLoaded', () => {
  const replaceText = (selector, text) => {
    const element = document.getElementById(selector)
    if (element) element.innerText = text
  }

  for (const dependency of ['chrome', 'node', 'electron']) {
    replaceText(`${dependency}-version`, process.versions[dependency])
  }
})
