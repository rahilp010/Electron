import { contextBridge, ipcRenderer } from 'electron'

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld('api', {
  // Product methods
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

  getSystemInfo: () => ipcRenderer.invoke('getSystemInfo'),

  //Purchase methods
  getPurchaseById: (id) => ipcRenderer.invoke('getPurchaseById', id),
  getAllPurchases: () => ipcRenderer.invoke('getAllPurchases'),
  createPurchase: (purchase) => ipcRenderer.invoke('createPurchase', purchase),
  updatePurchase: (purchase) => ipcRenderer.invoke('updatePurchase', purchase),
  deletePurchase: (id) => ipcRenderer.invoke('deletePurchase', id),

  //Purchase methods
  getSalesById: (id) => ipcRenderer.invoke('getSalesById', id),
  getAllSales: () => ipcRenderer.invoke('getAllSales'),
  createSales: (sales) => ipcRenderer.invoke('createSales', sales),
  updateSales: (sales) => ipcRenderer.invoke('updateSales', sales),
  deleteSales: (id) => ipcRenderer.invoke('deleteSales', id),

  // Excel Import
  importExcel: (filePath, tableName) => ipcRenderer.invoke('importExcel', filePath, tableName),

  // (Optional) Excel Export
  exportExcel: (tableName, savePath) => ipcRenderer.invoke('exportExcel', tableName, savePath),

  // PDF Export
  generatePDF: (options) => ipcRenderer.invoke('generate-pdf', options),

  //ladger

  getAccountBalances: () => ipcRenderer.invoke('getAccountBalances'),
  transferAmount: (data) => ipcRenderer.invoke('transferAmount', data),

  addLedgerEntry: () => ipcRenderer.invoke('addLedgerEntry'),
  getTransferHistory: (id) => ipcRenderer.invoke('getTransferHistory', id),
  getClientLedger: (id) => ipcRenderer.invoke('getClientLedger', id),
  deleteLedgerEntry: (id) => ipcRenderer.invoke('deleteLedgerEntry', id),
  getAccountLedger: (id) => ipcRenderer.invoke('getAccountLedger', id),
  getAccountLedgerByType: (data) => ipcRenderer.invoke('getAccountLedgerByType', data),
  getAccountLedgerByDate: (data) => ipcRenderer.invoke('getAccountLedgerByDate', data),
  getTrialBalance: () => ipcRenderer.invoke('getTrialBalance'),
  deleteMultipleLedgerEntries: () => ipcRenderer.invoke('deleteMultipleLedgerEntries'),

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
  getTaxes: () => ipcRenderer.invoke('getTaxes'),
  createTax: (data) => ipcRenderer.invoke('createTax', data),
  deleteTax: (id) => ipcRenderer.invoke('deleteTax', id),

  // Backup methods
  restoreBackup: (backupFilePath) => ipcRenderer.invoke('restoreBackup', backupFilePath),
  selectBackupFile: () => ipcRenderer.invoke('selectBackupFile'),
  manualBackup: () => ipcRenderer.invoke('manualBackup'),
  generateBillNo: (pageName) => ipcRenderer.invoke('generateBillNo', pageName),

  // Authorization
  getAuthorization: () => ipcRenderer.invoke('getAuthorization'),

  getPendingCollections: () => ipcRenderer.invoke('getPendingCollections'),
  getPendingPayments: () => ipcRenderer.invoke('getPendingPayments'),

  onBackupStatus: (callback) => {
    ipcRenderer.on('backup-status', (_, data) => callback(data))

    return () => ipcRenderer.removeAllListeners('backup-status')
  }

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
  // },
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
