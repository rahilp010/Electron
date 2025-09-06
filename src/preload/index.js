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
  createBankReceipt: (bankReceipt) => ipcRenderer.invoke('createBankReceipt', bankReceipt),

  // Cash receipt methods
  getRecentCashReceipts: () => ipcRenderer.invoke('getRecentCashReceipts'),
  createCashReceipt: (cashReceipt) => ipcRenderer.invoke('createCashReceipt', cashReceipt)
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
