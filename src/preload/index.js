// import { contextBridge } from 'electron'
// import { electronAPI } from '@electron-toolkit/preload'

// // Custom APIs for renderer
// const api = {}

// // Use `contextBridge` APIs to expose Electron APIs to
// // renderer only if context isolation is enabled, otherwise
// // just add to the DOM global.
// if (process.contextIsolated) {
//   try {
//     contextBridge.exposeInMainWorld('electron', electronAPI)
//     contextBridge.exposeInMainWorld('api', api)
//   } catch (error) {
//     console.error(error)
//   }
// } else {
//   window.electron = electronAPI
//   window.api = api
// }

// // See the Electron documentation for details on how to use preload scripts:
// // https://www.electronjs.org/docs/latest/tutorial/process-model#preload-scripts

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

  // Transaction methods
  getAllTransactions: () => ipcRenderer.invoke('getAllTransactions'),
  createTransaction: (transaction) => ipcRenderer.invoke('createTransaction', transaction),
  updateTransaction: (transaction) => ipcRenderer.invoke('updateTransaction', transaction),
  deleteTransaction: (id) => ipcRenderer.invoke('deleteTransaction', id),
  getTransactionById: (id) => ipcRenderer.invoke('getTransactionById', id)
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
