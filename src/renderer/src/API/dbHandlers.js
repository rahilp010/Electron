import db from './db.js'
import { ipcMain } from 'electron'
import * as XLSX from 'xlsx'
import toast from 'react-toastify'
import fs from 'fs'
import PDFDocument from 'pdfkit'

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
    INSERT INTO clients (clientName, phoneNo,address, pendingAmount, paidAmount, pendingFromOurs, accountType, gstNo)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `
    )
    .run(
      client.clientName,
      client.phoneNo,
      client.address,
      client.pendingAmount,
      client.paidAmount,
      client.pendingFromOurs,
      client.accountType,
      client.gstNo
    )
})

ipcMain.handle('updateClient', (event, client) => {
  const stmt = db.prepare(`
    UPDATE clients
    SET clientName = ?, phoneNo = ?, address = ?, pendingAmount = ?, paidAmount = ?, pendingFromOurs = ?, accountType = ?, gstNo = ?, updatedAt = CURRENT_TIMESTAMP
    WHERE id = ?
  `)
  stmt.run(
    client.clientName,
    client.phoneNo,
    client.address,
    client.pendingAmount,
    client.paidAmount,
    client.pendingFromOurs,
    client.accountType,
    client.gstNo,
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
ipcMain.handle('createTransaction', (event, transaction, bankReceipt = {}, cashReceipt = {}) => {
  const {
    clientId,
    productId,
    quantity,
    sellAmount,
    purchaseAmount,
    paymentMethod,
    statusOfTransaction,
    paymentType,
    pendingAmount,
    paidAmount,
    transactionType
  } = transaction

  const product = db.prepare('SELECT * FROM products WHERE id = ?').get(productId)
  if (!product) {
    toast.error('Product not Found')
    return
  }

  if (transactionType === 'sales' && product.quantity < quantity) {
    toast.error('Insufficient product quantity')
    return
  }

  // Fix: sellAmount is already the total amount, don't multiply by quantity
  if (transactionType === 'sales' && paymentType === 'partial') {
    if ((pendingAmount || 0) + (paidAmount || 0) !== sellAmount * quantity) {
      toast.error('Pending amount and paid amount should be equal to total selling amount')
      return
    }
  }

  // Check if client exists
  const client = db.prepare('SELECT * FROM clients WHERE id = ?').get(clientId)
  if (!client) {
    toast.error('Client not Found')
    return
  }

  // Start database transaction
  const dbTransaction = db.transaction(() => {
    let totalTransactionAmount = 0

    if (transactionType === 'sales') {
      totalTransactionAmount = sellAmount * quantity
    } else if (transactionType === 'purchase') {
      // ✅ For purchase, always calculate from product.price
      totalTransactionAmount = purchaseAmount * quantity
    }

    // 1. Create the transaction record
    const stmt = db.prepare(`
            INSERT INTO transactions (clientId, productId, quantity, sellAmount, purchaseAmount, paymentMethod, statusOfTransaction, paymentType, pendingAmount, paidAmount, transactionType)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `)
    const result = stmt.run(
      clientId,
      productId,
      quantity,
      sellAmount,
      purchaseAmount,
      paymentMethod,
      statusOfTransaction || 'pending',
      paymentType || 'cash',
      pendingAmount || 0,
      paidAmount || 0,
      transactionType
    )

    if (transactionType === 'sales') {
      // 2. Update product quantity (reduce by sold quantity)
      const productStmt = db.prepare(`
            UPDATE products
            SET quantity = quantity - ?, updatedAt = CURRENT_TIMESTAMP
            WHERE id = ?
        `)
      productStmt.run(quantity, productId)
    } else if (transactionType === 'purchase') {
      // 2. Update product quantity (reduce by sold quantity)
      const productStmt = db.prepare(`
            UPDATE products
            SET quantity = quantity + ?, updatedAt = CURRENT_TIMESTAMP
            WHERE id = ?
        `)
      productStmt.run(quantity, productId)
    }

    // 3. Update client amounts based on payment type and transaction status
    let clientPendingIncrease = 0
    let clientPaidIncrease = 0
    let clientPendingFromOursIncrease = 0

    if (transactionType === 'sales') {
      if (paymentType === 'partial') {
        clientPendingIncrease = pendingAmount || 0
        clientPaidIncrease = paidAmount || 0
      } else if (statusOfTransaction === 'completed') {
        clientPaidIncrease = totalTransactionAmount
      } else {
        clientPendingIncrease = totalTransactionAmount
      }
    } else if (transactionType === 'purchase') {
      if (paymentType === 'partial') {
        clientPendingFromOursIncrease = pendingAmount || 0
      } else if (statusOfTransaction === 'completed') {
        clientPendingFromOursIncrease = totalTransactionAmount
      } else {
        clientPendingFromOursIncrease = totalTransactionAmount
      }
    }

    if (transactionType === 'sales') {
      const clientStmt = db.prepare(`
            UPDATE clients
            SET pendingAmount = pendingAmount + ?, 
                paidAmount = paidAmount + ?,
                updatedAt = CURRENT_TIMESTAMP
            WHERE id = ?
        `)
      clientStmt.run(clientPendingIncrease, clientPaidIncrease, clientId)
    } else if (transactionType === 'purchase') {
      const clientStmt = db.prepare(`
        UPDATE clients SET pendingFromOurs = pendingFromOurs + ? WHERE id = ?`)
      clientStmt.run(clientPendingFromOursIncrease, clientId)
    }

    const transactionId = result.lastInsertRowid

    // 4. Create linked bank receipt if purchase
    if (
      transactionType === 'purchase' &&
      bankReceipt &&
      bankReceipt.type &&
      bankReceipt.bank &&
      bankReceipt.amount
    ) {
      const { type, bank, date, party, amount, description } = bankReceipt

      let formattedDate = null
      if (date) {
        const parsedDate = new Date(date)
        if (!isNaN(parsedDate)) {
          formattedDate = parsedDate.toISOString().slice(0, 19).replace('T', ' ')
        }
      }

      db.prepare(
        `
        INSERT INTO bankReceipts (transactionId, type, bank, date, party, amount, description)
        VALUES (?, ?, ?, ?, ?, ?, ?)
        `
      ).run(transactionId, type, bank, formattedDate, party, amount, description)
    } else if (
      transactionType === 'sales' &&
      bankReceipt &&
      bankReceipt.type &&
      bankReceipt.bank &&
      bankReceipt.amount
    ) {
      const { type, bank, date, party, amount, description } = bankReceipt

      let formattedDate = null
      if (date) {
        const parsedDate = new Date(date)
        if (!isNaN(parsedDate)) {
          formattedDate = parsedDate.toISOString().slice(0, 19).replace('T', ' ')
        }
      }

      db.prepare(
        `
        INSERT INTO bankReceipts (transactionId, type, bank, date, party, amount, description)
        VALUES (?, ?, ?, ?, ?, ?, ?)
        `
      ).run(transactionId, type, bank, formattedDate, party, amount, description)
    }

    //cash

    if (
      transactionType === 'purchase' &&
      cashReceipt &&
      cashReceipt.type &&
      cashReceipt.bank &&
      cashReceipt.amount
    ) {
      const { type, bank, date, party, amount, description } = cashReceipt

      let formattedDate = null
      if (date) {
        const parsedDate = new Date(date)
        if (!isNaN(parsedDate)) {
          formattedDate = parsedDate.toISOString().slice(0, 19).replace('T', ' ')
        }
      }

      db.prepare(
        `
        INSERT INTO cashReceipts (transactionId, type, bank, date, party, amount, description)
        VALUES (?, ?, ?, ?, ?, ?, ?)
        `
      ).run(transactionId, type, bank, formattedDate, party, amount, description)
    } else if (
      transactionType === 'sales' &&
      cashReceipt &&
      cashReceipt.type &&
      cashReceipt.bank &&
      cashReceipt.amount
    ) {
      const { type, bank, date, party, amount, description } = cashReceipt

      let formattedDate = null
      if (date) {
        const parsedDate = new Date(date)
        if (!isNaN(parsedDate)) {
          formattedDate = parsedDate.toISOString().slice(0, 19).replace('T', ' ')
        }
      }

      db.prepare(
        `
        INSERT INTO cashReceipts (transactionId, type, bank, date, party, amount, description)
        VALUES (?, ?, ?, ?, ?, ?, ?)
        `
      ).run(transactionId, type, bank, formattedDate, party, amount, description)
    }

    return db.prepare('SELECT * FROM transactions WHERE id = ?').get(transactionId)
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
      purchaseAmount,
      paymentMethod,
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

      // Fetch old product (for rollback math) and new product (for applying new)
      const newProduct = db.prepare('SELECT * FROM products WHERE id = ?').get(productId)

      // Fetch client and product
      const client = db.prepare('SELECT * FROM clients WHERE id = ?').get(clientId)
      if (!client || !newProduct) throw new Error('Client or Product not found')
      const product = db.prepare('SELECT * FROM products WHERE id = ?').get(productId)
      if (!client || !product) throw new Error('Client or Product not found')

      // Rollback stock changes from previous transaction
      if (transaction.transactionType === 'sales') {
        // Add back the stock that was deducted
        db.prepare('UPDATE products SET quantity = quantity + ? WHERE id = ?').run(
          transaction.quantity,
          transaction.productId
        )
      } else if (transaction.transactionType === 'purchase') {
        // Remove the stock that was added
        db.prepare('UPDATE products SET quantity = quantity - ? WHERE id = ?').run(
          transaction.quantity,
          transaction.productId
        )
      }

      // Calculate previous total amount
      let previousTotalAmount =
        transaction.transactionType === 'sales'
          ? transaction.sellAmount * transaction.quantity
          : transaction.purchaseAmount * transaction.quantity

      // Rollback client amounts from previous transaction
      if (transaction.transactionType === 'sales') {
        if (transaction.paymentType === 'partial') {
          db.prepare(
            `UPDATE clients
            SET pendingAmount = pendingAmount - ?, 
                paidAmount = paidAmount - ?,
                updatedAt = CURRENT_TIMESTAMP
            WHERE id = ?`
          ).run(transaction.pendingAmount, transaction.paidAmount, transaction.clientId)
        } else if (transaction.statusOfTransaction === 'completed') {
          db.prepare(
            `UPDATE clients
            SET paidAmount = paidAmount - ?, updatedAt = CURRENT_TIMESTAMP
            WHERE id = ?`
          ).run(previousTotalAmount, transaction.clientId)
        } else {
          // Previous status was pending
          db.prepare(
            `UPDATE clients
            SET pendingAmount = pendingAmount - ?, updatedAt = CURRENT_TIMESTAMP
            WHERE id = ?`
          ).run(previousTotalAmount, transaction.clientId)
        }
      } else if (transaction.transactionType === 'purchase') {
        // Rollback purchase amounts
        if (transaction.paymentType === 'partial') {
          // For partial: rollback only the pending amount that was added
          db.prepare(
            `UPDATE clients
            SET pendingFromOurs = pendingFromOurs - ?, updatedAt = CURRENT_TIMESTAMP
            WHERE id = ?`
          ).run(transaction.pendingAmount, transaction.clientId)
        } else if (transaction.statusOfTransaction === 'pending') {
          // Previous status was pending: remove the full amount from pendingFromOurs
          db.prepare(
            `UPDATE clients
            SET pendingFromOurs = pendingFromOurs - ?, updatedAt = CURRENT_TIMESTAMP
            WHERE id = ?`
          ).run(previousTotalAmount, transaction.clientId)
        }
        // If previous status was 'completed', nothing was in pendingFromOurs, so no rollback needed
      }

      // Update the transaction record
      db.prepare(
        `UPDATE transactions
        SET clientId = ?, productId = ?, quantity = ?, sellAmount = ?, purchaseAmount = ?, 
            paymentMethod = ?, statusOfTransaction = ?, paymentType = ?, 
            pendingAmount = ?, paidAmount = ?, transactionType = ?, updatedAt = CURRENT_TIMESTAMP
        WHERE id = ?`
      ).run(
        clientId,
        productId,
        quantity,
        sellAmount,
        purchaseAmount,
        paymentMethod,
        statusOfTransaction,
        paymentType,
        pendingAmount,
        paidAmount,
        transactionType,
        id
      )

      // Apply new stock changes
      if (transactionType === 'sales') {
        // Deduct stock for sales
        db.prepare(
          'UPDATE products SET quantity = quantity - ?, updatedAt = CURRENT_TIMESTAMP WHERE id = ?'
        ).run(quantity, productId)
      } else if (transactionType === 'purchase') {
        // Add stock for purchase
        db.prepare(
          'UPDATE products SET quantity = quantity + ?, updatedAt = CURRENT_TIMESTAMP WHERE id = ?'
        ).run(quantity, productId)
      }

      // Apply new client amount changes
      const newTotalAmount =
        transactionType === 'sales'
          ? (sellAmount || 0) * quantity
          : (purchaseAmount || 0) * quantity

      if (transactionType === 'sales') {
        if (paymentType === 'partial') {
          db.prepare(
            `UPDATE clients
            SET pendingAmount = pendingAmount + ?, 
                paidAmount = paidAmount + ?, updatedAt = CURRENT_TIMESTAMP
            WHERE id = ?`
          ).run(pendingAmount, paidAmount, clientId)
        } else if (statusOfTransaction === 'completed') {
          db.prepare(
            `UPDATE clients
            SET paidAmount = paidAmount + ?, updatedAt = CURRENT_TIMESTAMP
            WHERE id = ?`
          ).run(newTotalAmount, clientId)
        } else {
          // Status is pending
          db.prepare(
            `UPDATE clients
            SET pendingAmount = pendingAmount + ?, updatedAt = CURRENT_TIMESTAMP
            WHERE id = ?`
          ).run(newTotalAmount, clientId)
        }
      } else if (transactionType === 'purchase') {
        // Apply new purchase amounts
        if (paymentType === 'partial') {
          // For partial: only add the pending amount to pendingFromOurs
          db.prepare(
            `UPDATE clients
            SET pendingFromOurs = pendingFromOurs + ?, updatedAt = CURRENT_TIMESTAMP
            WHERE id = ?`
          ).run(pendingAmount, clientId)
        } else if (statusOfTransaction === 'pending') {
          // Status is pending: add full amount to pendingFromOurs
          db.prepare(
            `UPDATE clients
            SET pendingFromOurs = pendingFromOurs + ?, updatedAt = CURRENT_TIMESTAMP
            WHERE id = ?`
          ).run(newTotalAmount, clientId)
        } else if (statusOfTransaction === 'completed') {
          // For completed: nothing goes to pendingFromOurs (payment is already made)
          // db.prepare(
          //   `UPDATE clients
          //   SET pendingFromOurs = pendingFromOurs - ?, updatedAt = CURRENT_TIMESTAMP
          //   WHERE id = ?`
          // ).run(newTotalAmount, clientId)
        }
      }

      // After updating transaction amounts
      if (transactionType === 'purchase') {
        // Fetch existing bank receipt linked to this transaction
        const bankReceipt = db.prepare('SELECT * FROM bankReceipts WHERE transactionId = ?').get(id)

        const totalAmount = (purchaseAmount || 0) * quantity

        if (bankReceipt) {
          // Update existing bank receipt
          db.prepare(
            `UPDATE bankReceipts
       SET type = ?, bank = ?, date = CURRENT_TIMESTAMP, party = ?, amount = ?, description = ?
       WHERE id = ?`
          ).run(
            'Payment',
            updatedTransaction.bank || 'IDBI',
            client?.clientName || 'Unknown Client',
            totalAmount,
            `Purchase ${newProduct?.name}`,
            bankReceipt.id
          )
        } else {
          // Create new bank receipt if it didn't exist before
          db.prepare(
            `INSERT INTO bankReceipts (transactionId, type, bank, date, party, amount, description)
       VALUES (?, ?, ?, CURRENT_TIMESTAMP, ?, ?, ?)`
          ).run(
            id,
            'Payment',
            updatedTransaction.bank || 'IDBI',
            client?.clientName || 'Unknown Client',
            totalAmount,
            `Purchase ${newProduct?.name}`
          )
        }
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
      if (transaction.transactionType === 'sales') {
        if (product) {
          db.prepare(
            `UPDATE products 
             SET quantity = quantity + ?, updatedAt = CURRENT_TIMESTAMP 
             WHERE id = ?`
          ).run(transaction.quantity, transaction.productId)
        }
      } else if (transaction.transactionType === 'purchase') {
        if (product) {
          db.prepare(
            `UPDATE products 
             SET quantity = quantity - ?, updatedAt = CURRENT_TIMESTAMP 
             WHERE id = ?`
          ).run(transaction.quantity, transaction.productId)
        }
      }

      // Adjust client balances
      if (client) {
        let rollbackAmount =
          transaction.transactionType === 'sales'
            ? transaction.sellAmount * transaction.quantity
            : transaction.purchaseAmount * transaction.quantity

        if (transaction.transactionType === 'sales') {
          if (transaction.paymentType === 'partial') {
            db.prepare(
              `UPDATE clients
               SET pendingAmount = pendingAmount - ?, 
                   paidAmount = paidAmount - ?, updatedAt = CURRENT_TIMESTAMP
               WHERE id = ?`
            ).run(transaction.pendingAmount, transaction.paidAmount, transaction.clientId)
          } else if (transaction.statusOfTransaction === 'completed') {
            db.prepare(
              `UPDATE clients
               SET paidAmount = paidAmount - ?, updatedAt = CURRENT_TIMESTAMP
               WHERE id = ?`
            ).run(rollbackAmount, transaction.clientId)
          } else {
            // Status was pending
            db.prepare(
              `UPDATE clients
               SET pendingAmount = pendingAmount - ?, updatedAt = CURRENT_TIMESTAMP
               WHERE id = ?`
            ).run(rollbackAmount, transaction.clientId)
          }
        } else if (transaction.transactionType === 'purchase') {
          // Handle purchase transaction rollback
          if (transaction.paymentType === 'partial') {
            // For partial: only subtract the pending amount that was actually added
            db.prepare(
              `UPDATE clients
               SET pendingFromOurs = pendingFromOurs - ?, updatedAt = CURRENT_TIMESTAMP
               WHERE id = ?`
            ).run(transaction.pendingAmount, transaction.clientId)
          } else if (transaction.statusOfTransaction === 'pending') {
            // For pending: subtract the full amount that was added
            db.prepare(
              `UPDATE clients
               SET pendingFromOurs = pendingFromOurs - ?, updatedAt = CURRENT_TIMESTAMP
               WHERE id = ?`
            ).run(rollbackAmount, transaction.clientId)
          }
          // For completed status: nothing was in pendingFromOurs, so no rollback needed
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
  const { transactionId, type, bank, date, party, amount, description, statusOfTransaction } =
    bankReceipt

  const formattedDate =
    typeof date === 'string' ? date : new Date(date).toISOString().slice(0, 19).replace('T', ' ')

  const tx = db.transaction(() => {
    const res = db
      .prepare(
        `
      INSERT INTO bankReceipts (transactionId, type, bank, date, party, amount, description, statusOfTransaction)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?) `
      )
      .run(
        transactionId,
        type,
        bank,
        formattedDate,
        party,
        amount,
        description,
        statusOfTransaction
      )
    // Fetch the inserted row
    const createdBankReceipt = db
      .prepare('SELECT * FROM bankReceipts WHERE id = ?')
      .get(res.lastInsertRowid)

    return createdBankReceipt
  })
  return tx()
})

ipcMain.handle('updateBankReceipt', (event, bankReceipt) => {
  const { transactionId, type, bank, date, party, amount, description, statusOfTransaction } =
    bankReceipt

  const formattedDate =
    typeof date === 'string' ? date : new Date(date).toISOString().slice(0, 19).replace('T', ' ')

  const tx = db.transaction(() => {
    // 1️⃣ Check if bank receipt exists by transactionId
    const existing = db
      .prepare(`SELECT * FROM bankReceipts WHERE transactionId = ?`)
      .get(transactionId)

    if (existing) {
      // 2️⃣ Update existing
      db.prepare(
        `UPDATE bankReceipts
         SET type = ?, bank = ?, date = ?, party = ?, amount = ?, description = ?, statusOfTransaction = ?, updatedAt = CURRENT_TIMESTAMP
         WHERE transactionId = ?`
      ).run(
        type,
        bank,
        formattedDate,
        party,
        amount,
        description,
        statusOfTransaction,
        transactionId
      )

      // 3️⃣ Return the updated record using its id
      return db.prepare(`SELECT * FROM bankReceipts WHERE id = ?`).get(existing.id)
    } else {
      // 4️⃣ Insert new record if not exists
      const result = db
        .prepare(
          `INSERT INTO bankReceipts (transactionId, type, bank, date, party, amount, description, statusOfTransaction)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
        )
        .run(
          transactionId,
          type,
          bank,
          formattedDate,
          party,
          amount,
          description,
          statusOfTransaction
        )

      // 5️⃣ Return newly created record
      return db.prepare(`SELECT * FROM bankReceipts WHERE id = ?`).get(result.lastInsertRowid)
    }
  })

  return tx()
})

ipcMain.handle('deleteBankReceipt', (event, bankReceiptId) => {
  try {
    const dbBankReceipt = db.prepare('DELETE FROM bankReceipts WHERE id = ?').run(bankReceiptId)
    return { success: true, data: dbBankReceipt }
  } catch (err) {
    console.error('deleteBankReceipt error:', err)
    throw new Error(err.message || 'Failed to delete bank receipt')
  }
})

// -------- Cash Receipts --------

ipcMain.handle('getRecentCashReceipts', async () => {
  return db.prepare('SELECT * FROM cashReceipts ORDER BY createdAt DESC').all()
})

// ✅ Create bank receipt
ipcMain.handle('createCashReceipt', (event, cashReceipt) => {
  const { transactionId, type, cash, date, party, amount, description, statusOfTransaction } =
    cashReceipt

  const formattedDate =
    typeof date === 'string' ? date : new Date(date).toISOString().slice(0, 19).replace('T', ' ')

  const tx = db.transaction(() => {
    const res = db
      .prepare(
        `
      INSERT INTO cashReceipts (transactionId, type, cash, date, party, amount, description, statusOfTransaction)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?) `
      )
      .run(
        transactionId,
        type,
        cash,
        formattedDate,
        party,
        amount,
        description,
        statusOfTransaction
      )
    // Fetch the inserted row
    const createdCashReceipt = db
      .prepare(`SELECT * FROM cashReceipts WHERE id = ?`)
      .get(res.lastInsertRowid)
    return createdCashReceipt
  })
  return tx()
})

ipcMain.handle('updateCashReceipt', (event, cashReceipt) => {
  const { transactionId, type, cash, date, party, amount, description, statusOfTransaction } =
    cashReceipt

  const formattedDate =
    typeof date === 'string' ? date : new Date(date).toISOString().slice(0, 19).replace('T', ' ')

  const tx = db.transaction(() => {
    // 1️⃣ Check if bank receipt exists by transactionId
    const existing = db
      .prepare(`SELECT * FROM cashReceipts WHERE transactionId = ?`)
      .get(transactionId)

    if (existing) {
      // 2️⃣ Update existing
      db.prepare(
        `UPDATE cashReceipts
        SET type = ?, cash = ?, date = ?, party = ?, amount = ?, description = ?, statusOfTransaction = ?
        WHERE transactionId = ?`
      ).run(
        type,
        cash,
        formattedDate,
        party,
        amount,
        description,
        statusOfTransaction,
        transactionId
      )

      // 3️⃣ Return the updated record using its id
      return db.prepare(`SELECT * FROM cashReceipts WHERE id = ?`).get(existing.id)
    } else {
      // 4️⃣ Insert new record if not exists
      const result = db
        .prepare(
          `INSERT INTO cashReceipts (transactionId, type, cash, date, party, amount, description, statusOfTransaction)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
        )
        .run(
          transactionId,
          type,
          cash,
          formattedDate,
          party,
          amount,
          description,
          statusOfTransaction
        )

      // 5️⃣ Return newly created record
      return db.prepare(`SELECT * FROM cashReceipts WHERE id = ?`).get(result.lastInsertRowid)
    }
  })
  return tx()
})

ipcMain.handle('deleteCashReceipt', (event, cashReceiptId) => {
  try {
    const dbCashReceipt = db.prepare('DELETE FROM cashReceipts WHERE id = ?').run(cashReceiptId)
    return { success: true, data: dbCashReceipt }
  } catch (err) {
    console.error('deleteCashReceipt error:', err)
    throw new Error(err.message || 'Failed to delete cash receipt')
  }
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
            phoneNo: String(row.phoneNo).split('.')[0] || '',
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

ipcMain.handle('generate-pdf', async (_, { tableName, savePath }) => {
  try {
    const stmt = db.prepare(`SELECT * FROM ${tableName}`)
    const rows = stmt.all()

    const doc = new PDFDocument({ margin: 30, size: 'A4' })
    doc.pipe(fs.createWriteStream(savePath))

    // Title
    doc.fontSize(18).text(`${tableName} Report`, { align: 'center' })
    doc.moveDown()

    if (rows.length === 0) {
      doc.fontSize(12).text('No data found.')
      doc.end()
      return { success: true, path: savePath }
    }

    // Table setup
    const columns = Object.keys(rows[0])
    const colWidth = (doc.page.width - 60) / columns.length // equally divided

    let y = doc.y + 10
    const rowHeight = 20

    // Draw header
    columns.forEach((col, i) => {
      doc.rect(30 + i * colWidth, y, colWidth, rowHeight).stroke()
      doc.text(col, 35 + i * colWidth, y + 5, { width: colWidth - 5 })
    })
    y += rowHeight

    // Draw rows
    rows.forEach((row) => {
      columns.forEach((col, i) => {
        doc.rect(30 + i * colWidth, y, colWidth, rowHeight).stroke()
        const text = row[col] !== null ? String(row[col]) : ''
        doc.text(text, 35 + i * colWidth, y + 5, { width: colWidth - 5 })
      })
      y += rowHeight

      // Handle page break
      if (y > doc.page.height - 50) {
        doc.addPage()
        y = 50
      }
    })

    doc.end()
    return { success: true, path: savePath }
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
