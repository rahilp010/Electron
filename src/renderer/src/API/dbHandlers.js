import db from './db.js'
import { ipcMain } from 'electron'
import * as XLSX from 'xlsx'

const toInt = (val, fallback = 0) => {
  const n = parseInt(val, 10)
  return isNaN(n) ? fallback : n
}

const parseParts = (partsStr) => {
  try {
    return JSON.parse(partsStr || '[]')
  } catch {
    return []
  }
}

// -------- Products --------
ipcMain.handle('getAllProducts', async () => {
  return db.prepare('SELECT * FROM products ORDER BY createdAt DESC').all()
})

ipcMain.handle('createProduct', (event, product = {}) => {
  const {
    name = '',
    price = 0,
    quantity = 0,
    clientId = 0,
    assetsType = '',
    addParts = 0,
    parts = '[]'
  } = product

  const partsStr = typeof parts === 'string' ? parts : JSON.stringify(parts)

  const tx = db.transaction(() => {
    const res = db
      .prepare(
        `
        INSERT INTO products (name, price, quantity, clientId, assetsType, addParts, parts)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `
      )
      .run(name, price, quantity, clientId, assetsType, addParts, partsStr)

    if (assetsType === 'Finished Goods' && toInt(addParts) === 1) {
      const parsed = parseParts(partsStr)
      const stmt = db.prepare(`
          UPDATE products
          SET quantity = MAX(quantity - ?, 0), updatedAt = CURRENT_TIMESTAMP
          WHERE id = ?
        `)
      for (const row of parsed) {
        stmt.run(toInt(row.quantity, 0), toInt(row.partId))
      }
    }
    return res
  })

  return tx()
})

ipcMain.handle('updateProduct', (event, product) => {
  const {
    id,
    name,
    price,
    quantity = 0,
    clientId = 0,
    assetsType,
    addParts = 0,
    parts = '[]'
  } = product

  // Get old product
  const oldProduct = db.prepare(`SELECT * FROM products WHERE id = ?`).get(id)

  // Update product info
  const result = db
    .prepare(
      `
      UPDATE products
      SET name = ?, price = ?, quantity = ?, clientId = ?, assetsType = ?, addParts = ?, parts = ?
      WHERE id = ?
    `
    )
    .run(name, price, quantity, clientId, assetsType, addParts, parts, id)

  // Handle parts stock if Finished Goods
  if (assetsType === 'Finished Goods' && addParts === 1) {
    const oldParts = JSON.parse(oldProduct.parts || '[]')
    const newParts = JSON.parse(parts)

    // Convert to map for easy comparison
    const oldMap = Object.fromEntries(oldParts.map((p) => [p.partId, p.quantity]))
    const newMap = Object.fromEntries(newParts.map((p) => [p.partId, p.quantity]))

    // Restore removed or reduced parts
    for (const [partId, oldQty] of Object.entries(oldMap)) {
      const newQty = newMap[partId] || 0
      if (newQty < oldQty) {
        const diff = oldQty - newQty
        db.prepare(
          `
            UPDATE products
            SET quantity = quantity + ?
            WHERE id = ?
          `
        ).run(diff, partId)
      }
    }

    // Deduct added or increased parts
    for (const [partId, newQty] of Object.entries(newMap)) {
      const oldQty = oldMap[partId] || 0
      if (newQty > oldQty) {
        const diff = newQty - oldQty
        db.prepare(
          `
            UPDATE products
            SET quantity = MAX(quantity - ?, 0)
            WHERE id = ?
          `
        ).run(diff, partId)
      }
    }
  }

  return result
})

ipcMain.handle('deleteProduct', (event, id) => {
  const product = db.prepare(`SELECT * FROM products WHERE id = ?`).get(id)

  if (!product) return

  // If it was a Finished Goods, restore stock
  if (product.assetsType === 'Finished Goods' && product.addParts === 1) {
    const parsedParts = JSON.parse(product.parts || '[]')
    parsedParts.forEach((part) => {
      db.prepare(
        `
          UPDATE products
          SET quantity = quantity + ?
          WHERE id = ?
        `
      ).run(part.quantity, part.partId)
    })
  }

  // Delete the product itself
  return db.prepare(`DELETE FROM products WHERE id = ?`).run(id)
})

ipcMain.handle('getProductById', (event, id) => {
  return db.prepare('SELECT * FROM products WHERE id = ?').get(id)
})

// -------- Clients --------
ipcMain.handle('getAllClients', () => {
  return db.prepare('SELECT * FROM clients ORDER BY createdAt DESC').all()
})

ipcMain.handle('createClient', (event, client) => {
  return db
    .prepare(
      `
    INSERT INTO clients (clientName, phoneNo, pendingAmount, paidAmount, pendingFromOurs)
    VALUES (?, ?, ?, ?, ?)
  `
    )
    .run(
      client.clientName,
      client.phoneNo,
      client.pendingAmount,
      client.paidAmount,
      client.pendingFromOurs
    )
})

ipcMain.handle('updateClient', (event, client) => {
  const stmt = db.prepare(`
    UPDATE clients
    SET clientName = ?, phoneNo = ?, pendingAmount = ?, paidAmount = ?, pendingFromOurs = ?, updatedAt = CURRENT_TIMESTAMP
    WHERE id = ?
  `)
  stmt.run(
    client.clientName,
    client.phoneNo,
    client.pendingAmount,
    client.paidAmount,
    client.pendingFromOurs,
    client.id
  )
  return client
})

ipcMain.handle('deleteClient', (event, id) => {
  db.prepare('DELETE FROM clients WHERE id = ?').run(id)
  return true
})

ipcMain.handle('getClientById', (event, id) => {
  return db.prepare('SELECT * FROM clients WHERE id = ?').get(id)
})

// -------- Transactions --------

ipcMain.handle('getAllTransactions', () => {
  const stmt = db.prepare('SELECT * FROM transactions ORDER BY createdAt DESC')
  return stmt.all()
})

// ✅ Create transaction
ipcMain.handle('createTransaction', (event, transaction) => {
  const {
    clientId,
    productId,
    quantity,
    sellAmount,
    statusOfTransaction,
    paymentType,
    pendingAmount,
    paidAmount,
    transactionType
  } = transaction

  // Check if product exists and has sufficient quantity
  const product = db.prepare('SELECT * FROM products WHERE id = ?').get(productId)
  if (!product) {
    throw new Error('Product not found')
  }

  if (product.quantity < quantity) {
    throw new Error('Insufficient product quantity')
  }

  // Fix: sellAmount is already the total amount, don't multiply by quantity
  if (paymentType === 'partial') {
    if ((pendingAmount || 0) + (paidAmount || 0) !== sellAmount) {
      throw new Error('Pending amount and paid amount should be equal to total selling amount')
    }
  }

  // Check if client exists
  const client = db.prepare('SELECT * FROM clients WHERE id = ?').get(clientId)
  if (!client) {
    throw new Error('Client not found')
  }

  // Start database transaction
  const dbTransaction = db.transaction(() => {
    // 1. Create the transaction record
    const stmt = db.prepare(`
            INSERT INTO transactions (clientId, productId, quantity, sellAmount, statusOfTransaction, paymentType, pendingAmount, paidAmount, transactionType)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        `)
    const result = stmt.run(
      clientId,
      productId,
      quantity,
      sellAmount,
      statusOfTransaction || 'pending',
      paymentType || 'cash',
      pendingAmount || 0,
      paidAmount || 0,
      transactionType
    )

    // 2. Update product quantity (reduce by sold quantity)
    const productStmt = db.prepare(`
            UPDATE products
            SET quantity = quantity - ?, updatedAt = CURRENT_TIMESTAMP
            WHERE id = ?
        `)
    productStmt.run(quantity, productId)

    // 3. Update client amounts based on payment type and transaction status
    let clientPendingIncrease = 0
    let clientPaidIncrease = 0
    const totalTransactionAmount = sellAmount

    if (paymentType === 'partial') {
      clientPendingIncrease = pendingAmount || 0
      clientPaidIncrease = paidAmount || 0
    } else if (statusOfTransaction === 'completed') {
      clientPaidIncrease = totalTransactionAmount
    } else {
      clientPendingIncrease = totalTransactionAmount
    }

    const clientStmt = db.prepare(`
            UPDATE clients
            SET pendingAmount = pendingAmount + ?, 
                paidAmount = paidAmount + ?,
                updatedAt = CURRENT_TIMESTAMP
            WHERE id = ?
        `)
    clientStmt.run(clientPendingIncrease, clientPaidIncrease, clientId)

    // 4. Get the created transaction with all details
    const createdTransaction = db
      .prepare('SELECT * FROM transactions WHERE id = ?')
      .get(result.lastInsertRowid)

    return createdTransaction
  })

  return dbTransaction()
})

// ✅ Update transaction
ipcMain.handle('updateTransaction', (event, updatedTransaction) => {
  try {
    const {
      id,
      clientId,
      productId,
      quantity,
      sellAmount,
      statusOfTransaction,
      paymentType,
      pendingAmount,
      paidAmount,
      transactionType
    } = updatedTransaction

    const dbTransaction = db.transaction(() => {
      // Fetch existing transaction
      const transaction = db.prepare('SELECT * FROM transactions WHERE id = ?').get(id)
      if (!transaction) throw new Error('Transaction not found')

      // Fetch client and product
      const client = db.prepare('SELECT * FROM clients WHERE id = ?').get(clientId)
      const product = db.prepare('SELECT * FROM products WHERE id = ?').get(productId)
      if (!client || !product) throw new Error('Client or Product not found')

      // Rollback previous stock
      db.prepare('UPDATE products SET quantity = quantity + ? WHERE id = ?').run(
        transaction.quantity,
        transaction.productId
      )

      // Calculate previous total
      const previousTotalAmount = transaction.sellAmount * transaction.quantity

      // Rollback client amounts
      if (transaction.paymentType === 'partial') {
        db.prepare(
          `
            UPDATE clients
            SET pendingAmount = pendingAmount - ?, 
                paidAmount = paidAmount - ?,
                updatedAt = CURRENT_TIMESTAMP
            WHERE id = ?
          `
        ).run(transaction.pendingAmount, transaction.paidAmount, transaction.clientId)
      } else if (transaction.statusOfTransaction === 'completed') {
        db.prepare(
          `
            UPDATE clients
            SET paidAmount = paidAmount - ?,
                updatedAt = CURRENT_TIMESTAMP
            WHERE id = ?
          `
        ).run(previousTotalAmount, transaction.clientId)
      } else {
        db.prepare(
          `
            UPDATE clients
            SET pendingAmount = pendingAmount - ?,
                updatedAt = CURRENT_TIMESTAMP
            WHERE id = ?
          `
        ).run(previousTotalAmount, transaction.clientId)
      }

      // Apply new values
      const newTotalAmount = sellAmount * quantity

      db.prepare(
        `
          UPDATE transactions
          SET clientId = ?, productId = ?, quantity = ?, sellAmount = ?, 
              statusOfTransaction = ?, paymentType = ?, 
              pendingAmount = ?, paidAmount = ?, transactionType = ?, updatedAt = CURRENT_TIMESTAMP
          WHERE id = ?
        `
      ).run(
        clientId,
        productId,
        quantity,
        sellAmount,
        statusOfTransaction,
        paymentType,
        pendingAmount,
        paidAmount,
        transactionType,
        id
      )

      // Deduct new stock
      db.prepare(
        'UPDATE products SET quantity = quantity - ?, updatedAt = CURRENT_TIMESTAMP WHERE id = ?'
      ).run(quantity, productId)

      // Update client amounts with new values
      if (paymentType === 'partial') {
        db.prepare(
          `
            UPDATE clients
            SET pendingAmount = pendingAmount + ?, 
                paidAmount = paidAmount + ?,
                updatedAt = CURRENT_TIMESTAMP
            WHERE id = ?
          `
        ).run(pendingAmount, paidAmount, clientId)
      } else if (statusOfTransaction === 'completed') {
        db.prepare(
          `
            UPDATE clients
            SET paidAmount = paidAmount + ?,
                updatedAt = CURRENT_TIMESTAMP
            WHERE id = ?
          `
        ).run(newTotalAmount, clientId)
      } else {
        db.prepare(
          `
            UPDATE clients
            SET pendingAmount = pendingAmount + ?,
                updatedAt = CURRENT_TIMESTAMP
            WHERE id = ?
          `
        ).run(newTotalAmount, clientId)
      }

      // Return updated transaction
      return db.prepare('SELECT * FROM transactions WHERE id = ?').get(id)
    })

    return { success: true, data: dbTransaction() }
  } catch (err) {
    console.error('updateTransaction error:', err)
    throw new Error(err.message || 'Failed to update transaction')
  }
})

// ✅ Delete transaction
ipcMain.handle('deleteTransaction', (event, transactionId) => {
  try {
    const dbTransaction = db.transaction(() => {
      // Fetch the transaction
      const transaction = db.prepare('SELECT * FROM transactions WHERE id = ?').get(transactionId)
      if (!transaction) throw new Error('Transaction not found')

      // Fetch client and product
      const client = db.prepare('SELECT * FROM clients WHERE id = ?').get(transaction.clientId)
      const product = db.prepare('SELECT * FROM products WHERE id = ?').get(transaction.productId)

      // Restore product stock
      if (product) {
        db.prepare(
          `
            UPDATE products 
            SET quantity = quantity + ?, updatedAt = CURRENT_TIMESTAMP 
            WHERE id = ?
          `
        ).run(transaction.quantity, transaction.productId)
      }

      // Adjust client balances
      if (client) {
        if (transaction.paymentType === 'partial') {
          db.prepare(
            `
              UPDATE clients
              SET pendingAmount = pendingAmount - ?, 
                  paidAmount = paidAmount - ?, 
                  updatedAt = CURRENT_TIMESTAMP
              WHERE id = ?
            `
          ).run(transaction.pendingAmount, transaction.paidAmount, transaction.clientId)
        } else if (transaction.statusOfTransaction === 'completed') {
          db.prepare(
            `
              UPDATE clients
              SET paidAmount = paidAmount - ?, 
                  updatedAt = CURRENT_TIMESTAMP
              WHERE id = ?
            `
          ).run(transaction.sellAmount * transaction.quantity, transaction.clientId)
        } else {
          db.prepare(
            `
              UPDATE clients
              SET pendingAmount = pendingAmount - ?, 
                  updatedAt = CURRENT_TIMESTAMP
              WHERE id = ?
            `
          ).run(transaction.sellAmount * transaction.quantity, transaction.clientId)
        }
      }

      // Delete the transaction
      db.prepare('DELETE FROM transactions WHERE id = ?').run(transactionId)

      return { message: 'Transaction deleted successfully' }
    })

    return { success: true, data: dbTransaction() }
  } catch (err) {
    console.error('deleteTransaction error:', err)
    throw new Error(err.message || 'Failed to delete transaction')
  }
})

ipcMain.handle('getTransactionById', (event, id) => {
  return db.prepare('SELECT * FROM transactions WHERE id = ?').get(id)
})

// -------- Bank Receipts --------

ipcMain.handle('getRecentBankReceipts', async () => {
  return db.prepare('SELECT * FROM bankReceipts ORDER BY createdAt DESC').all()
})

// ✅ Create bank receipt
ipcMain.handle('createBankReceipt', (event, bankReceipt) => {
  const { srNo, type, bank, date, party, amount, description } = bankReceipt

  const formattedDate =
    typeof date === 'string' ? date : new Date(date).toISOString().slice(0, 19).replace('T', ' ')

  const tx = db.transaction(() => {
    const res = db
      .prepare(
        `
      INSERT INTO bankReceipts (srNo, type, bank, date, party, amount, description)
        VALUES (?, ?, ?, ?, ?, ?, ?) `
      )
      .run(srNo, type, bank, formattedDate, party, amount, description)
    return res
  })
  return tx()
})

// -------- Cash Receipts --------

ipcMain.handle('getRecentCashReceipts', async () => {
  return db.prepare('SELECT * FROM cashReceipts ORDER BY createdAt DESC').all()
})

// ✅ Create bank receipt
ipcMain.handle('createCashReceipt', (event, cashReceipt) => {
  const { srNo, type, cash, date, party, amount, description } = cashReceipt

  const formattedDate =
    typeof date === 'string' ? date : new Date(date).toISOString().slice(0, 19).replace('T', ' ')

  const tx = db.transaction(() => {
    const res = db
      .prepare(
        `
      INSERT INTO cashReceipts (srNo, type, cash, date, party, amount, description)
        VALUES (?, ?, ?, ?, ?, ?, ?) `
      )
      .run(srNo, type, cash, formattedDate, party, amount, description)
    return res
  })
  return tx()
})

// -------- Excel Import --------
ipcMain.handle('importExcel', async (_event, filePath, tableName) => {
  try {
    const workbook = XLSX.readFile(filePath)
    const sheet = workbook.Sheets[workbook.SheetNames[0]]
    const rows = XLSX.utils.sheet_to_json(sheet)

    let stmt
    let count = 0

    if (tableName === 'clients') {
      stmt = db.prepare(`
        INSERT INTO clients (clientName, phoneNo, pendingAmount, paidAmount, pendingFromOurs)
        VALUES (@clientName, @phoneNo, @pendingAmount, @paidAmount, @pendingFromOurs)
      `)

      const insertMany = db.transaction((rows) => {
        for (const row of rows) {
          stmt.run({
            clientName: row.clientName || '',
            phoneNo: row.phoneNo || '',
            pendingAmount: row.pendingAmount || 0,
            paidAmount: row.paidAmount || 0,
            pendingFromOurs: row.pendingFromOurs || 0
          })
          count++
        }
      })
      insertMany(rows)
    } else if (tableName === 'products') {
      stmt = db.prepare(`
        INSERT INTO products (productName, quantity, price)
        VALUES (@productName, @quantity, @price)
      `)

      const insertMany = db.transaction((rows) => {
        for (const row of rows) {
          stmt.run({
            productName: row.productName || '',
            quantity: row.quantity || 0,
            price: row.price || 0
          })
          count++
        }
      })
      insertMany(rows)
    } else if (tableName === 'transactions') {
      stmt = db.prepare(`
        INSERT INTO transactions (clientId, productId, quantity, sellAmount, statusOfTransaction, paymentType, pendingAmount, paidAmount, transactionType)
        VALUES (@clientId, @productId, @quantity, @sellAmount, @statusOfTransaction, @paymentType, @pendingAmount, @paidAmount, @transactionType)
      `)

      const insertMany = db.transaction((rows) => {
        for (const row of rows) {
          stmt.run({
            clientId: row.clientId || 0,
            productId: row.productId || 0,
            quantity: row.quantity || 0,
            sellAmount: row.sellAmount || 0,
            statusOfTransaction: row.statusOfTransaction || '',
            paymentType: row.paymentType || '',
            pendingAmount: row.pendingAmount || 0,
            paidAmount: row.paidAmount || 0,
            transactionType: row.transactionType || ''
          })
          count++
        }
      })
      insertMany(rows)
    }

    return { success: true, tableName, count }
  } catch (err) {
    return { success: false, error: err.message }
  }
})

ipcMain.handle('exportExcel', async (_, { tableName, savePath }) => {
  try {
    let rows = []
    if (tableName === 'clients') {
      rows = db.prepare(`SELECT * FROM clients`).all()
    }
    const worksheet = XLSX.utils.json_to_sheet(rows)
    const workbook = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(workbook, worksheet, tableName)

    XLSX.writeFile(workbook, savePath)
    return { success: true, savePath }
  } catch (err) {
    return { success: false, error: err.message }
  }
})

db.exec(`
    CREATE INDEX IF NOT EXISTS idx_transactions_clientId ON transactions(clientId);
    CREATE INDEX IF NOT EXISTS idx_transactions_productId ON transactions(productId);
    CREATE INDEX IF NOT EXISTS idx_bankReceipts_bank ON bankReceipts(bank);
    CREATE INDEX IF NOT EXISTS idx_cashReceipts_cash ON cashReceipts(cash);
  `)
