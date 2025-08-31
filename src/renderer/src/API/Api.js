const productApi = {
    getAllProducts: () => window.api.getAllProducts(),
    createProduct: (product) => window.api.createProduct(product),
    updateProduct: (product) => window.api.updateProduct(product),
    deleteProduct: (id) => window.api.deleteProduct(id),    
    getProductById: (id) => window.api.getProductById(id),
};

const productPartApi = {
    createProductParts: (productParts) => window.api.createProductParts(productParts),
    updateProductParts: (productParts) => window.api.updateProductParts(productParts),
    deleteProductParts: (id) => window.api.deleteProductParts(id),
    getProductPartsById: (id) => window.api.getProductPartsById(id),
}

const clientApi = {
    getAllClients: () => window.api.getAllClients(),
    createClient: (client) => window.api.createClient(client),
    updateClient: (client) => window.api.updateClient(client),
    deleteClient: (id) => window.api.deleteClient(id),
    getClientById: (id) => window.api.getClientById(id),
}

const transactionApi = {
    getAllTransactions: () => window.api.getAllTransactions(),
    createTransaction: (transaction) => window.api.createTransaction(transaction),
    updateTransaction: (transaction) => window.api.updateTransaction(transaction),
    deleteTransaction: (id) => window.api.deleteTransaction(id),
    getTransactionById: (id) => window.api.getTransactionById(id),
};

export { productApi, productPartApi, clientApi, transactionApi };