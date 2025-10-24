import { createSlice } from '@reduxjs/toolkit'

export const electronSlice = createSlice({
  name: 'electron',
  initialState: {
    products: {
      data: (() => {
        try {
          const stored = localStorage.getItem('products')
          return stored ? JSON.parse(stored) : []
        } catch (error) {
          console.error('Error parsing products from localStorage:', error)
          localStorage.removeItem('products') // Clear corrupted data
          return []
        }
      })(),
      isLoading: false
    },
    clients: {
      data: (() => {
        try {
          const stored = localStorage.getItem('clients')
          return stored ? JSON.parse(stored) : []
        } catch (error) {
          console.error('Error parsing clients from localStorage:', error)
          localStorage.removeItem('clients') // Clear corrupted data
          return []
        }
      })(),
      isLoading: false
    },
    clientProducts: {
      data: (() => {
        try {
          const stored = localStorage.getItem('clientProducts')
          return stored ? JSON.parse(stored) : []
        } catch (error) {
          console.error('Error parsing clientProducts from localStorage:', error)
          localStorage.removeItem('clientProducts') // Clear corrupted data
          return []
        }
      })(),
      isLoading: false
    },
    transaction: {
      data: (() => {
        try {
          const stored = localStorage.getItem('transaction')
          return stored ? JSON.parse(stored) : []
        } catch (error) {
          console.error('Error parsing transaction from localStorage:', error)
          localStorage.removeItem('transaction') // Clear corrupted data
          return []
        }
      })(),
      isLoading: false
    },
    transactionItems: {
      data: (() => {
        try {
          const stored = localStorage.getItem('transactionItems')
          return stored ? JSON.parse(stored) : []
        } catch (error) {
          console.error('Error parsing transactionItems from localStorage:', error)
          localStorage.removeItem('transactionItems') // Clear corrupted data
          return []
        }
      })(),
      isLoading: false
    },
    settings: {
      data: (() => {
        try {
          const stored = localStorage.getItem('settings')
          return stored ? JSON.parse(stored) : []
        } catch (error) {
          console.error('Error parsing settings from localStorage:', error)
          localStorage.removeItem('settings') // Clear corrupted data
          return []
        }
      })(),
      isLoading: false
    },
    keyBindings: {
      data: [],
      loading: false,
      error: null
    },
    bankReceipt: {
      data: (() => {
        try {
          const stored = localStorage.getItem('bankReceipt')
          return stored ? JSON.parse(stored) : []
        } catch (error) {
          console.error('Error parsing bankReceipt from localStorage:', error)
          localStorage.removeItem('bankReceipt') // Clear corrupted data
          return []
        }
      })(),
      isLoading: false
    },
    cashReceipt: {
      data: (() => {
        try {
          const stored = localStorage.getItem('cashReceipt')
          return stored ? JSON.parse(stored) : []
        } catch (error) {
          console.error('Error parsing cashReceipt from localStorage:', error)
          localStorage.removeItem('cashReceipt') // Clear corrupted data
          return []
        }
      })(),
      isLoading: false
    }
  },
  reducers: {
    createProduct: (state, action) => {
      // Ensure state.products.data is always an array
      if (!Array.isArray(state.products.data)) {
        state.products.data = []
      }
      state.products.data.push(action.payload)
      state.products.data.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      localStorage.setItem('products', JSON.stringify(state.products.data))
    },
    updateProduct: (state, action) => {
      // Ensure state.products.data is always an array
      if (!Array.isArray(state.products.data)) {
        state.products.data = []
        return
      }

      // Expecting action.payload to contain the full updated product with id
      const updatedProduct = action.payload
      const index = state.products.data.findIndex((product) => product.id === updatedProduct.id)

      if (index !== -1) {
        state.products.data[index] = updatedProduct
        // state.products.data.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        localStorage.setItem('products', JSON.stringify(state.products.data))
      }
    },
    deleteProduct: (state, action) => {
      // Ensure state.products.data is always an array
      if (!Array.isArray(state.products.data)) {
        state.products.data = []
        return
      }
      state.products.data = state.products.data.filter((product) => product.id !== action.payload)
      // state.products.data.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      localStorage.setItem('products', JSON.stringify(state.products.data))
    },
    setProducts: (state, action) => {
      // Ensure state.products.data is always an array
      if (!Array.isArray(state.products.data)) {
        state.products.data = []
      }

      // This should add a new product, not replace all products
      if (Array.isArray(action.payload)) {
        state.products.data = action.payload
      } else {
        // Add single product
        state.products.data.push(action.payload)
      }
      // state.products.data.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      localStorage.setItem('products', JSON.stringify(state.products.data))
    },
    getProducts: (state) => {
      try {
        const data = localStorage.getItem('products')
        if (data) {
          const parsed = JSON.parse(data)
          if (Array.isArray(parsed)) {
            state.products.data = parsed
            // state.products.data.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
          } else {
            console.warn('Products data in localStorage is not an array, resetting to empty array')
            state.products.data = []
            localStorage.setItem('products', JSON.stringify([]))
          }
        }
      } catch (error) {
        console.error('Error loading products from localStorage:', error)
        state.products.data = []
        localStorage.removeItem('products')
      }
    },

    createClient: (state, action) => {
      if (!Array.isArray(state.clients.data)) {
        state.clients.data = []
      }
      state.clients.data.push(action.payload)
      state.clients.data.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      localStorage.setItem('clients', JSON.stringify(state.clients.data))
    },
    updateClient: (state, action) => {
      if (!Array.isArray(state.clients.data)) {
        state.clients.data = []
        return
      }

      const updatedClient = action.payload
      const index = state.clients.data.findIndex((client) => client.id === updatedClient.id)

      if (index !== -1) {
        // ✅ Create a new array to ensure UI re-renders
        const newData = [
          ...state.clients.data.slice(0, index),
          updatedClient,
          ...state.clients.data.slice(index + 1)
        ]

        state.clients.data = newData
        localStorage.setItem('clients', JSON.stringify(newData))
      }
    },
    deleteClient: (state, action) => {
      if (!Array.isArray(state.clients.data)) {
        state.clients.data = []
        return
      }
      state.clients.data = state.clients.data.filter((client) => client.id !== action.payload)
      localStorage.setItem('clients', JSON.stringify(state.clients.data))
    },
    setClients: (state, action) => {
      if (!Array.isArray(state.clients.data)) {
        state.clients.data = []
      }
      if (Array.isArray(action.payload)) {
        state.clients.data = action.payload
      } else {
        state.clients.data.push(action.payload)
      }
      localStorage.setItem('clients', JSON.stringify(state.clients.data))
    },
    getClients: (state) => {
      try {
        const data = localStorage.getItem('clients')
        if (data) {
          const parsed = JSON.parse(data)
          if (Array.isArray(parsed)) {
            state.clients.data = parsed
          } else {
            console.warn('Clients data in localStorage is not an array, resetting to empty array')
            state.clients.data = []
            localStorage.setItem('clients', JSON.stringify([]))
          }
        }
      } catch (error) {
        console.error('Error loading clients from localStorage:', error)
        state.clients.data = []
        localStorage.removeItem('clients')
      }
    },

    clientProducts: (state, action) => {
      if (!Array.isArray(state.clientProducts.data)) {
        state.clientProducts.data = []
        return
      }
      const clientProducts = action.payload
      const index = state.clientProducts.data.findIndex((client) => client.id === clientProducts.id)
      if (index !== -1) {
        state.clientProducts.data[index] = clientProducts
        localStorage.setItem('clientProducts', JSON.stringify(state.clientProducts.data))
      }
    },

    addTransaction: (state, action) => {
      if (!Array.isArray(state.transaction.data)) {
        state.transaction.data = []
      }
      state.transaction.data.push(action.payload)
      state.transaction.data.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      localStorage.setItem('transaction', JSON.stringify(state.transaction.data))
    },
    updateTransaction: (state, action) => {
      if (!Array.isArray(state.transaction.data)) {
        state.transaction.data = []
        return
      }
      const updatedTransaction = action.payload
      const index = state.transaction.data.findIndex(
        (transaction) => transaction.id === updatedTransaction.id
      )
      if (index !== -1) {
        state.transaction.data[index] = updatedTransaction
        localStorage.setItem('transaction', JSON.stringify(state.transaction.data))
      }
    },
    deleteTransaction: (state, action) => {
      if (!Array.isArray(state.transaction.data)) {
        state.transaction.data = []
        return
      }
      state.transaction.data = state.transaction.data.filter(
        (transaction) => transaction.id !== action.payload
      )
      localStorage.setItem('transaction', JSON.stringify(state.transaction.data))
    },
    setTransactions: (state, action) => {
      if (!Array.isArray(state.transaction.data)) {
        state.transaction.data = []
      }
      if (Array.isArray(action.payload)) {
        state.transaction.data = action.payload
      } else {
        state.transaction.data.push(action.payload)
      }
      localStorage.setItem('transaction', JSON.stringify(state.transaction.data))
    },
    getTransaction: (state) => {
      try {
        const data = localStorage.getItem('transaction')
        if (data) {
          const parsed = JSON.parse(data)
          if (Array.isArray(parsed)) {
            state.transaction.data = parsed
          } else {
            console.warn(
              'transaction data in localStorage is not an array, resetting to empty array'
            )
            state.transaction.data = []
            localStorage.setItem('transaction', JSON.stringify([]))
          }
        }
      } catch (error) {
        console.error('Error loading transaction from localStorage:', error)
        state.transaction.data = []
        localStorage.removeItem('transaction')
      }
    },

    createBankReceipt: (state, action) => {
      // Ensure state.products.data is always an array
      if (!Array.isArray(state.bankReceipt.data)) {
        state.bankReceipt.data = []
      }
      state.bankReceipt.data.push(action.payload)
      state.bankReceipt.data.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      localStorage.setItem('bankReceipt', JSON.stringify(state.bankReceipt.data))
    },
    updateBankReceipt: (state, action) => {
      const updatedBankReceipt = action.payload
      if (!updatedBankReceipt) return // safety check

      if (!Array.isArray(state.bankReceipt.data)) {
        state.bankReceipt.data = []
      }

      const index = state.bankReceipt.data.findIndex(
        (bankReceipt) => bankReceipt.id === updatedBankReceipt.id
      )

      if (index !== -1) {
        state.bankReceipt.data[index] = updatedBankReceipt
      } else {
        // If it doesn't exist, push it
        state.bankReceipt.data.push(updatedBankReceipt)
      }

      localStorage.setItem('bankReceipt', JSON.stringify(state.bankReceipt.data))
    },
    setBankReceipt: (state, action) => {
      if (!Array.isArray(state.bankReceipt.data)) {
        state.bankReceipt.data = []
      }
      if (Array.isArray(action.payload)) {
        state.bankReceipt.data = action.payload
      } else {
        state.bankReceipt.data.push(action.payload)
      }
      localStorage.setItem('bankReceipt', JSON.stringify(state.bankReceipt.data))
    },
    deleteBankReceipt: (state, action) => {
      if (!Array.isArray(state.bankReceipt.data)) {
        state.bankReceipt.data = []
        return
      }
      state.bankReceipt.data = state.bankReceipt.data.filter(
        (bankReceipt) => bankReceipt.id !== action.payload
      )
      localStorage.setItem('bankReceipt', JSON.stringify(state.bankReceipt.data))
    },
    getBankReceipt: (state) => {
      try {
        const data = localStorage.getItem('bankReceipt')
        if (data) {
          const parsed = JSON.parse(data)
          if (Array.isArray(parsed)) {
            state.bankReceipt.data = parsed
          } else {
            console.warn(
              'bankReceipt data in localStorage is not an array, resetting to empty array'
            )
            state.bankReceipt.data = []
            localStorage.setItem('bankReceipt', JSON.stringify([]))
          }
        }
      } catch (error) {
        console.error('Error loading bankReceipt from localStorage:', error)
        state.bankReceipt.data = []
        localStorage.removeItem('bankReceipt')
      }
    },
    createCashReceipt: (state, action) => {
      if (!Array.isArray(state.cashReceipt.data)) {
        state.cashReceipt.data = []
      }

      const newReceipt = action.payload
      if (!newReceipt || typeof newReceipt !== 'object') return

      state.cashReceipt.data.push(newReceipt)

      // Sort by createdAt (newest first)
      state.cashReceipt.data.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))

      localStorage.setItem('cashReceipt', JSON.stringify(state.cashReceipt.data))
    },

    updateCashReceipt: (state, action) => {
      if (!Array.isArray(state.cashReceipt.data)) {
        state.cashReceipt.data = []
        return
      }

      const updated = action.payload
      if (!updated || typeof updated.id === 'undefined') return

      const index = state.cashReceipt.data.findIndex((r) => r.id === updated.id)
      if (index !== -1) {
        state.cashReceipt.data[index] = updated
        localStorage.setItem('cashReceipt', JSON.stringify(state.cashReceipt.data))
      }
    },

    setCashReceipt: (state, action) => {
      if (!Array.isArray(state.cashReceipt.data)) {
        state.cashReceipt.data = []
      }

      const payload = action.payload
      if (Array.isArray(payload)) {
        state.cashReceipt.data = payload
      } else if (payload && typeof payload === 'object') {
        state.cashReceipt.data.push(payload)
      }

      localStorage.setItem('cashReceipt', JSON.stringify(state.cashReceipt.data))
    },

    deleteCashReceipt: (state, action) => {
      if (!Array.isArray(state.cashReceipt.data)) {
        state.cashReceipt.data = []
        return
      }

      const idToDelete = action.payload
      if (typeof idToDelete === 'undefined' || idToDelete === null) return

      state.cashReceipt.data = state.cashReceipt.data.filter(
        (cashReceipt) => cashReceipt.id !== action.payload
      )
      localStorage.setItem('cashReceipt', JSON.stringify(state.cashReceipt.data))
    },

    getCashReceipt: (state) => {
      try {
        const data = localStorage.getItem('cashReceipt')
        if (!data) return

        const parsed = JSON.parse(data)
        if (Array.isArray(parsed)) {
          state.cashReceipt.data = parsed
        } else {
          console.warn('cashReceipt data corrupted, resetting')
          state.cashReceipt.data = []
          localStorage.setItem('cashReceipt', JSON.stringify([]))
        }
      } catch (error) {
        console.error('Error loading cashReceipt from localStorage:', error)
        state.cashReceipt.data = []
        localStorage.removeItem('cashReceipt')
      }
    },

    createSettings: (state, action) => {
      if (!Array.isArray(state.settings.data)) {
        state.settings.data = []
      }

      const newSetting = action.payload
      if (newSetting && newSetting.id) {
        // Avoid duplicates (in case backend re-sends same record)
        const exists = state.settings.data.some((s) => s.id === newSetting.id)
        if (!exists) {
          state.settings.data.push(newSetting)
        }
      }

      localStorage.setItem('settings', JSON.stringify(state.settings.data))
    },

    updateSettings: (state, action) => {
      if (!Array.isArray(state.settings.data)) {
        state.settings.data = []
        return
      }

      const updatedSetting = action.payload
      const index = state.settings.data.findIndex((s) => s.id === updatedSetting.id)

      if (index !== -1) {
        state.settings.data[index] = updatedSetting
      } else {
        // if not found, push it (optional)
        state.settings.data.push(updatedSetting)
      }

      localStorage.setItem('settings', JSON.stringify(state.settings.data))
    },

    setSettings: (state, action) => {
      if (Array.isArray(action.payload)) {
        // When loading full list from DB
        state.settings.data = action.payload
      } else if (action.payload && typeof action.payload === 'object') {
        // When adding a single record
        if (!Array.isArray(state.settings.data)) {
          state.settings.data = []
        }

        const exists = state.settings.data.some((s) => s.id === action.payload.id)
        if (!exists) {
          state.settings.data.push(action.payload)
        }
      }

      localStorage.setItem('settings', JSON.stringify(state.settings.data))
    },

    getSettings: (state) => {
      try {
        const data = localStorage.getItem('settings')
        if (data) {
          const parsed = JSON.parse(data)
          state.settings.data = Array.isArray(parsed) ? parsed : []
        } else {
          state.settings.data = []
        }
      } catch (error) {
        console.error('Error loading settings from localStorage:', error)
        state.settings.data = []
        localStorage.removeItem('settings')
      }
    },

    setKeyBindings: (state, action) => {
      state.keyBindings.data = action.payload
      state.keyBindings.loading = false
    },
    updateKeyBinding: (state, action) => {
      const index = state.keyBindings.data.findIndex((kb) => kb.id === action.payload.id)
      if (index !== -1) {
        state.keyBindings.data[index] = action.payload
      }
    },
    deleteKeyBinding: (state, action) => {
      state.keyBindings.data = state.keyBindings.data.filter((kb) => kb.id !== action.payload)
    }
  }
})

export const {
  createProduct,
  updateProduct,
  deleteProduct,
  setProducts,
  getProducts,
  createClient,
  updateClient,
  deleteClient,
  setClients,
  getClients,
  addTransaction,
  updateTransaction,
  deleteTransaction,
  setTransactions,
  getTransaction,
  createBankReceipt,
  updateBankReceipt,
  setBankReceipt,
  getBankReceipt,
  createCashReceipt,
  updateCashReceipt,
  setCashReceipt,
  getCashReceipt,
  createSettings,
  updateSettings,
  setSettings,
  getSettings,
  setKeyBindings,
  updateKeyBinding,
  deleteKeyBinding,
  clientProducts,
  deleteBankReceipt,
  deleteCashReceipt
} = electronSlice.actions
export default electronSlice.reducer
