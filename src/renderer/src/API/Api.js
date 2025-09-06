const productApi = {
  getAllProducts: () => window.api.getAllProducts(),
  createProduct: (product) => window.api.createProduct(product),
  updateProduct: (product) => window.api.updateProduct(product),
  deleteProduct: (id) => window.api.deleteProduct(id),
  getProductById: (id) => window.api.getProductById(id)
}

const clientApi = {
  getAllClients: () => window.api.getAllClients(),
  createClient: (client) => window.api.createClient(client),
  updateClient: (client) => window.api.updateClient(client),
  deleteClient: (id) => window.api.deleteClient(id),
  getClientById: (id) => window.api.getClientById(id)
}

const transactionApi = {
  getAllTransactions: () => window.api.getAllTransactions(),
  createTransaction: (transaction) => window.api.createTransaction(transaction),
  updateTransaction: (transaction) => window.api.updateTransaction(transaction),
  deleteTransaction: (id) => window.api.deleteTransaction(id),
  getTransactionById: (id) => window.api.getTransactionById(id)
}

const bankReceiptApi = {
  getAllBankReceipts: () => window.api.getAllBankReceipts(),
  createBankReceipt: (bankReceipt) => window.api.createBankReceipt(bankReceipt)
}

const cashReceiptApi = {
  getAllCashReceipts: () => window.api.getAllCashReceipts(),
  createCashReceipt: (cashReceipt) => window.api.createCashReceipt(cashReceipt)
}

export { productApi, clientApi, transactionApi, bankReceiptApi, cashReceiptApi }
