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
        state.clients.data[index] = updatedClient
        localStorage.setItem('clients', JSON.stringify(state.clients.data))
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
      // Ensure state.products.data is always an array
      if (!Array.isArray(state.cashReceipt.data)) {
        state.cashReceipt.data = []
      }
      state.cashReceipt.data.push(action.payload)
      state.cashReceipt.data.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      localStorage.setItem('cashReceipt', JSON.stringify(state.cashReceipt.data))
    },
    updateCashReceipt: (state, action) => {
      if (!Array.isArray(state.cashReceipt.data)) {
        state.cashReceipt.data = []
        return
      }
      const updatedCashReceipt = action.payload
      const index = state.cashReceipt.data.findIndex(
        (cashReceipt) => cashReceipt.id === updatedCashReceipt.id
      )
      if (index !== -1) {
        state.cashReceipt.data[index] = updatedCashReceipt
        localStorage.setItem('cashReceipt', JSON.stringify(state.cashReceipt.data))
      }
    },
    setCashReceipt: (state, action) => {
      if (!Array.isArray(state.cashReceipt.data)) {
        state.cashReceipt.data = []
      }
      if (Array.isArray(action.payload)) {
        state.cashReceipt.data = action.payload
      } else {
        state.cashReceipt.data.push(action.payload)
      }
      localStorage.setItem('cashReceipt', JSON.stringify(state.cashReceipt.data))
    },
    getCashReceipt: (state) => {
      try {
        const data = localStorage.getItem('cashReceipt')
        if (data) {
          const parsed = JSON.parse(data)
          if (Array.isArray(parsed)) {
            state.cashReceipt.data = parsed
          } else {
            console.warn(
              'cashReceipt data in localStorage is not an array, resetting to empty array'
            )
            state.cashReceipt.data = []
            localStorage.setItem('cashReceipt', JSON.stringify([]))
          }
        }
      } catch (error) {
        console.error('Error loading cashReceipt from localStorage:', error)
        state.cashReceipt.data = []
        localStorage.removeItem('cashReceipt')
      }
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
  getCashReceipt
} = electronSlice.actions
export default electronSlice.reducer
