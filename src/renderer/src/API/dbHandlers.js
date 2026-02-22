/* eslint-disable prettier/prettier */
import db from './db.js'
import { ipcMain, dialog } from 'electron'
import * as XLSX from 'xlsx'
import fs from 'fs-extra'
import PDFDocument from 'pdfkit'
import crypto from 'crypto'
import { app } from 'electron'
import path from 'path'
const { v4: uuidv4 } = require('uuid')
// import { sendWhatsAppPDF, getWhatsAppStatus, logoutWhatsApp } from '../../../main/whatsappClient.js'
// import cron from 'node-cron'

const dbPath = app.isPackaged
  ? path.join(process.resourcesPath, 'data.db')
  : path.join(process.cwd(), 'data.db')

const backupDir = path.join(process.cwd(), 'backups')

// AES-256-GCM setup
const ENCRYPTION_KEY = crypto
  .createHash('sha256')
  .update('YourStrongSecretKeyHere') // choose your secret key
  .digest()
const ALGO = 'aes-256-gcm'

// Ensure backup directory exists
fs.ensureDirSync(backupDir)

// --- Encryption Helper ---
function encryptFile(input, output) {
  const iv = crypto.randomBytes(16)
  const cipher = crypto.createCipheriv(ALGO, ENCRYPTION_KEY, iv)
  const data = fs.readFileSync(input)
  const encrypted = Buffer.concat([cipher.update(data), cipher.final()])
  const tag = cipher.getAuthTag()
  fs.writeFileSync(output, Buffer.concat([iv, tag, encrypted]))
}

// --- Decryption Helper ---
function decryptFile(input, output) {
  const data = fs.readFileSync(input)
  const iv = data.slice(0, 16)
  const tag = data.slice(16, 32)
  const encrypted = data.slice(32)
  const decipher = crypto.createDecipheriv(ALGO, ENCRYPTION_KEY, iv)
  decipher.setAuthTag(tag)
  const decrypted = Buffer.concat([decipher.update(encrypted), decipher.final()])
  fs.writeFileSync(output, decrypted)
}

// --- Create Backup ---
function createBackup() {
  try {
    if (!fs.existsSync(dbPath)) {
      console.warn('⚠️ Database file not found at', dbPath)
      return
    }

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
    const backupFile = path.join(backupDir, `backup-${timestamp}.bak`)
    encryptFile(dbPath, backupFile)
    console.log('✅ Backup created:', backupFile)
  } catch (err) {
    console.error('❌ Backup failed:', err)
  }
}

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
    productName = '',
    productPrice = 0,
    productQuantity = 0,
    clientId = 0,
    assetsType = '',
    addParts = 0,
    parts = '[]',
    pageName = ''
  } = product

  const partsStr = typeof parts === 'string' ? parts : JSON.stringify(parts)
  const parsedParts = parseParts(partsStr)

  const tx = db.transaction(() => {
    let finalPrice = toInt(productPrice, 0)

    // 🔹 Auto-calculate price for Finished Goods
    if (assetsType === 'Finished Goods' && toInt(addParts) === 1 && parsedParts.length > 0) {
      finalPrice = 0
      for (const part of parsedParts) {
        const partRow = db.prepare(`SELECT * FROM products WHERE id = ?`).get(toInt(part.partId))
        if (partRow) {
          finalPrice += (partRow.productPrice || 0) * toInt(part.productQuantity, 0)
        }
      }
    }

    const res = db
      .prepare(
        `
        INSERT INTO products (productName, productPrice, productQuantity, clientId, assetsType, addParts, parts,pageName)
        VALUES (?, ?, ?, ?, ?, ?, ?,?)
      `
      )
      .run(
        productName,
        finalPrice,
        productQuantity,
        clientId,
        assetsType,
        addParts,
        partsStr,
        pageName
      )

    // 🔹 Deduct sub-part stock for Finished Goods
    if (assetsType === 'Finished Goods' && toInt(addParts) === 1) {
      const stmt = db.prepare(`
        UPDATE products
        SET productQuantity = MAX(productQuantity - ?, 0), updatedAt = CURRENT_TIMESTAMP
        WHERE id = ?
      `)
      for (const row of parsedParts) {
        stmt.run(toInt(row.productQuantity, 0), toInt(row.partId))
      }
    }

    return res
  })

  return tx()
})

ipcMain.handle('updateProduct', (event, product) => {
  const {
    id,
    productName,
    productPrice,
    productQuantity = 0,
    clientId = 0,
    assetsType,
    addParts = 0,
    parts = '[]',
    pageName = ''
  } = product

  // Get old product
  const oldProduct = db.prepare(`SELECT * FROM products WHERE id = ?`).get(id)

  // Update product info
  const result = db
    .prepare(
      `
      UPDATE products
      SET productName = ?, productPrice = ?, productQuantity = ?, clientId = ?, assetsType = ?, addParts = ?, parts = ?, pageName = ?
      WHERE id = ?
    `
    )
    .run(
      productName,
      productPrice,
      productQuantity,
      clientId,
      assetsType,
      addParts,
      parts,
      pageName,
      id
    )

  // Handle parts stock if Finished Goods
  if (assetsType === 'Finished Goods' && addParts === 1) {
    const oldParts = JSON.parse(oldProduct.parts || '[]')
    const newParts = JSON.parse(parts)

    // Convert to map for easy comparison
    const oldMap = Object.fromEntries(oldParts.map((p) => [p.partId, p.productQuantity]))
    const newMap = Object.fromEntries(newParts.map((p) => [p.partId, p.productQuantity]))

    // Restore removed or reduced parts
    for (const [partId, oldQty] of Object.entries(oldMap)) {
      const newQty = newMap[partId] || 0
      if (newQty < oldQty) {
        const diff = oldQty - newQty
        db.prepare(
          `
            UPDATE products
            SET productQuantity = productQuantity + ?
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
            SET productQuantity = MAX(productQuantity - ?, 0)
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
          SET productQuantity = productQuantity + ?
          WHERE id = ?
        `
      ).run(part.productQuantity, part.partId)
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

// ipcMain.handle('createClient', (event, client) => {
//   return db
//     .prepare(
//       `
//     INSERT INTO clients (clientName, phoneNo,address, pendingAmount, paidAmount, pendingFromOurs, accountType, gstNo, pageName, isEmployee, salary, salaryHistory)
//     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
//   `
//     )
//     .run(
//       client.clientName,
//       client.phoneNo,
//       client.address,
//       client.pendingAmount,
//       client.paidAmount,
//       client.pendingFromOurs,
//       client.accountType,
//       client.gstNo,
//       client.pageName,
//       client.isEmployee,
//       client.salary,
//       client.salaryHistory
//     )
// })

ipcMain.handle('createClient', (event, client) => {
  try {
    const {
      clientName,
      phoneNo,
      gstNo,
      address,
      accountType,
      openingBalance = 0,
      pageName,
      isEmployee,
      salary,
      salaryHistory,
      pendingAmount = 0,
      paidAmount = 0,
      pendingFromOurs = 0
    } = client

    // 1️⃣ Insert Client
    const clientResult = db
      .prepare(
        `
        INSERT INTO clients 
        (clientName, phoneNo, gstNo, address, accountType, pageName, isEmployee, salary, salaryHistory, pendingAmount, paidAmount, pendingFromOurs)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `
      )
      .run(
        clientName,
        phoneNo,
        gstNo,
        address,
        accountType,
        pageName,
        isEmployee ? 1 : 0,
        salary || 0,
        salaryHistory || [],
        pendingAmount,
        paidAmount,
        pendingFromOurs
      )

    const clientId = clientResult.lastInsertRowid

    // 2️⃣ Generate Account Number (Example Logic)
    const accountNumber = `ACC-${Date.now()}`

    // 3️⃣ Insert Account
    const accountResult = db
      .prepare(
        `
    INSERT INTO accounts
    (clientId, accountName, openingBalance, closingBalance, accountNumber, accountType, accounterType, status)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `
      )
      .run(
        clientId,
        clientName,
        openingBalance,
        openingBalance,
        accountNumber,
        accountType,
        'Client',
        'active'
      )

    const accountId = accountResult.lastInsertRowid

    // 4️⃣ Insert Ledger Entry (Opening Balance)
    db.prepare(
      `
      INSERT INTO ledger
      (accountId, clientId, entryType, amount, balanceAfter, referenceType, narration)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `
    ).run(
      accountId,
      clientId,
      openingBalance >= 0 ? 'debit' : 'credit',
      Math.abs(openingBalance),
      openingBalance,
      'Opening',
      'Opening Balance'
    )

    // 5️⃣ Update Client with Account Info
    db.prepare(
      `
      UPDATE clients
      SET accountId = ?, accountNumber = ?
      WHERE id = ?
    `
    ).run(accountId, accountNumber, clientId)

    return {
      success: true,
      message: 'Client created successfully',
      clientId,
      accountId,
      accountNumber
    }
  } catch (error) {
    console.error('Error creating client:', error)
    return { success: false, message: 'Failed to create client' }
  }
})

ipcMain.handle('updateClient', (event, client) => {
  try {
    const stmt = db.prepare(`
      UPDATE clients
      SET clientName = ?, phoneNo = ?, address = ?, pendingAmount = ?, paidAmount = ?, pendingFromOurs = ?, accountType = ?, gstNo = ?, pageName = ?, isEmployee = ?, salary = ?, salaryHistory = ?, updatedAt = CURRENT_TIMESTAMP
      WHERE id = ?
    `)

    const result = stmt.run(
      client.clientName,
      client.phoneNo,
      client.address,
      client.pendingAmount,
      client.paidAmount,
      client.pendingFromOurs,
      client.accountType,
      client.gstNo,
      client.pageName,
      client.isEmployee,
      client.salary,
      client.salaryHistory,
      client.id
    )

    if (result.changes === 0) {
      console.error('❌ Update failed: No rows matched that ID', client.id)
      return { error: 'No matching record found' }
    }

    const updated = db.prepare('SELECT * FROM clients WHERE id = ?').get(client.id)
    return updated
  } catch (err) {
    console.error('🔥 UpdateClient IPC error:', err)
    return { error: err.message }
  }
})

ipcMain.handle('deleteClient', (event, id) => {
  db.prepare('DELETE FROM clients WHERE id = ?').run(id)
  return true
})

ipcMain.handle('getClientById', (event, id) => {
  return db.prepare('SELECT * FROM clients WHERE id = ?').get(id)
})

// 🔹 Adjust product stock
function adjustProductStock(productId, qtyChange) {
  const parsedId = Number(productId)
  const change = Number(qtyChange)

  const result = db
    .prepare(
      `
    UPDATE products
    SET productQuantity = productQuantity + ?
    WHERE id = ?
  `
    )
    .run(change, parsedId)

  if (result.changes === 0) {
    throw new Error(`Product ${parsedId} not found. Stock NOT updated.`)
  }
}

// 🔹 Update client balances
function updateClientBalances(clientId, tx, mode = 'apply') {
  const factor = mode === 'rollback' ? -1 : 1

  if (tx.pageName === 'Sales') {
    if (tx.paymentType === 'partial' && tx.statusOfTransaction === 'pending') {
      db.prepare(
        `UPDATE clients SET pendingAmount = pendingAmount + ?, paidAmount = paidAmount + ?, updatedAt = CURRENT_TIMESTAMP WHERE id = ?`
      ).run(factor * tx.pendingAmount, factor * tx.paidAmount, clientId)
    } else if (tx.statusOfTransaction === 'completed') {
      db.prepare(
        `UPDATE clients SET paidAmount = paidAmount + ?, updatedAt = CURRENT_TIMESTAMP WHERE id = ?`
      ).run(factor * tx.totalAmountWithTax, clientId)
    } else {
      db.prepare(
        `UPDATE clients SET pendingAmount = pendingAmount + ?, updatedAt = CURRENT_TIMESTAMP WHERE id = ?`
      ).run(factor * tx.totalAmountWithTax, clientId)
    }
  } else if (tx.pageName === 'Purchase') {
    const pendingFromOurs = Number(tx.pendingFromOurs || 0)
    const paidAmount = Number(tx.paidAmount || 0)

    console.log('PrndingfromOurs', pendingFromOurs)

    db.prepare(
      `
    UPDATE clients
    SET pendingFromOurs = pendingFromOurs + ?,
        paidAmount = paidAmount + ?,
        updatedAt = CURRENT_TIMESTAMP
    WHERE id = ?
  `
    ).run(factor * pendingFromOurs, factor * paidAmount, clientId)
  }
}

// ✅ Fetch transaction by ID

function applyPurchaseEffects(purchase, purchaseId) {
  const {
    clientId,
    productId,
    quantity,
    totalAmountWithTax,
    paidAmount = 0,
    paymentMethod,
    billNo
  } = purchase

  const qty = Number(quantity)
  const total = Number(totalAmountWithTax || 0)
  const paid = Number(paidAmount || 0)

  const product = db.prepare(`SELECT * FROM products WHERE id = ?`).get(productId)

  /* ---------- STOCK INCREASE ---------- */
  adjustProductStock(productId, qty)

  /* ---------- CLIENT ACCOUNT CREDIT ---------- */
  const client = db.prepare(`SELECT * FROM clients WHERE id = ?`).get(clientId)
  if (!client?.accountId) throw new Error('Client account missing')

  const clientAccount = db.prepare(`SELECT * FROM accounts WHERE id = ?`).get(client.accountId)

  const newClientBalance = Number(clientAccount.closingBalance || 0) + total

  db.prepare(
    `
    INSERT INTO ledger (
      accountId, clientId, entryType, amount, balanceAfter,
      referenceType, referenceId, narration
    )
    VALUES (?, ?, 'credit', ?, ?, 'Purchase', ?, ?)
  `
  ).run(
    clientAccount.id,
    clientId,
    total,
    newClientBalance,
    purchaseId,
    `Make Payment of ${paid} to ${client.clientName} for ${qty} × ${product.productName} (Bill ${billNo || '-'})`
  )

  db.prepare(`UPDATE accounts SET closingBalance = ? WHERE id = ?`).run(
    newClientBalance,
    clientAccount.id
  )

  /* ---------- SYSTEM ACCOUNT DEBIT (ONLY PAID) ---------- */
  if (paid > 0) {
    const systemAccount = getOrCreateSystemAccount(paymentMethod)

    const newSystemBalance = Number(systemAccount.closingBalance || 0) - paid

    db.prepare(
      `
      INSERT INTO ledger (
        accountId, entryType, amount, balanceAfter,
        referenceType, referenceId, narration
      )
      VALUES (?, 'debit', ?, ?, 'Payment', ?, ?)
    `
    ).run(
      systemAccount.id,
      paid,
      newSystemBalance,
      purchaseId,
      `Make Payment of ${paid} to ${client.clientName} for ${qty} × ${product.productName} (Bill ${billNo || '-'}`
    )

    db.prepare(`UPDATE accounts SET closingBalance = ? WHERE id = ?`).run(
      newSystemBalance,
      systemAccount.id
    )
  }
}

function rollbackPurchaseEffects(oldPurchase) {
  const {
    id,
    clientId,
    productId,
    quantity,
    totalAmountWithTax,
    paidAmount = 0,
    paymentMethod,
    billNo
  } = oldPurchase

  const qty = Number(quantity)
  const total = Number(totalAmountWithTax || 0)
  const paid = Number(paidAmount || 0)

  /* ---------- STOCK ROLLBACK ---------- */
  adjustProductStock(productId, -qty)

  /* ---------- CLIENT ACCOUNT DEBIT ---------- */
  const client = db.prepare(`SELECT * FROM clients WHERE id = ?`).get(clientId)
  if (!client?.accountId) throw new Error('Client account missing')

  const clientAccount = db.prepare(`SELECT * FROM accounts WHERE id = ?`).get(client.accountId)

  const newClientBalance = Number(clientAccount.closingBalance || 0) - total

  db.prepare(
    `
    INSERT INTO ledger (
      accountId, clientId, entryType, amount, balanceAfter,
      referenceType, referenceId, narration
    )
    VALUES (?, ?, 'debit', ?, ?, 'Adjustment', ?, ?)
  `
  ).run(
    clientAccount.id,
    clientId,
    total,
    newClientBalance,
    id,
    `Adjustment Purchase Bill ${billNo || '-'}`
  )

  db.prepare(`UPDATE accounts SET closingBalance = ? WHERE id = ?`).run(
    newClientBalance,
    clientAccount.id
  )

  /* ---------- SYSTEM ACCOUNT CREDIT ---------- */
  if (paid > 0) {
    const systemAccount = getOrCreateSystemAccount(paymentMethod)

    const newSystemBalance = Number(systemAccount.closingBalance || 0) + paid

    db.prepare(
      `
      INSERT INTO ledger (
        accountId, entryType, amount, balanceAfter,
        referenceType, referenceId, narration
      )
      VALUES (?, 'credit', ?, ?, 'Adjustment', ?, ?)
    `
    ).run(
      systemAccount.id,
      paid,
      newSystemBalance,
      id,
      `Adjustment Purchase Payment Bill ${billNo || '-'}`
    )

    db.prepare(`UPDATE accounts SET closingBalance = ? WHERE id = ?`).run(
      newSystemBalance,
      systemAccount.id
    )
  }
}

function getOrCreateSystemAccount(paymentMethod) {
  let systemAccount = db
    .prepare(
      `
    SELECT * FROM accounts
    WHERE accountType = ?
    LIMIT 1
  `
    )
    .get(paymentMethod === 'cash' ? 'Cash' : 'Bank')

  if (!systemAccount) {
    const insert = db
      .prepare(
        `
      INSERT INTO accounts
      (accountName, accountType, openingBalance, closingBalance, accounterType, status)
      VALUES (?, ?, 0, 0, 'Main', 'active')
    `
      )
      .run(
        paymentMethod === 'cash' ? 'Cash Account' : 'Bank Account',
        paymentMethod === 'cash' ? 'Cash' : 'Bank'
      )

    systemAccount = db.prepare(`SELECT * FROM accounts WHERE id = ?`).get(insert.lastInsertRowid)
  }

  return systemAccount
}

ipcMain.handle('getPurchaseById', (event, id) => {
  const transaction = db.prepare('SELECT * FROM purchases WHERE id = ?').get(id)
  transaction.taxAmount = JSON.parse(transaction.taxAmount)
  return transaction
})

ipcMain.handle('getAllPurchases', (event, page = 1) => {
  try {
    const limit = 20
    const offset = (page - 1) * limit

    const purchases = db
      .prepare(
        `
      SELECT p.*, 
             c.clientName,
             pr.productName
      FROM purchases p
      LEFT JOIN clients c ON p.clientId = c.id
      LEFT JOIN products pr ON p.productId = pr.id
      ORDER BY p.createdAt DESC
      LIMIT ? OFFSET ?
    `
      )
      .all(limit, offset)

    return { success: true, data: purchases }
  } catch (error) {
    return { success: false, message: error.message }
  }
})

ipcMain.handle('createPurchase', (event, data) => {
  try {
    const transaction = db.transaction(() => {
      const {
        clientId,
        productId,
        quantity,
        purchaseAmount,
        paidAmount = 0,
        paymentType,
        paymentMethod,
        pendingAmount = 0,
        pendingFromOurs,
        statusOfTransaction,
        billNo,
        description,
        date,
        dueDate = null,
        payments,
        taxAmount,
        totalAmountWithTax,
        totalAmountWithoutTax,
        methodType = 'Payment'
      } = data

      if (!clientId || !productId || !quantity || !purchaseAmount) {
        throw new Error('Missing required fields')
      }

      const qty = Number(quantity)
      const total = Number(totalAmountWithTax)
      const paid = Number(paidAmount)
      let pending = Number(pendingAmount || 0)

      if (paymentType === 'full') {
        pending = 0
      } else {
        pending = Math.max(0, total - paid)
      }

      let finalStatus = statusOfTransaction

      if (!finalStatus) {
        if (pending === 0 && paid > 0) {
          finalStatus = 'completed'
        } else {
          finalStatus = 'pending'
        }
      }

      const purchaseResult = db
        .prepare(
          `
        INSERT INTO purchases (
          clientId, productId, quantity, purchaseAmount,
          paidAmount, pendingAmount, pendingFromOurs,
          paymentMethod, paymentType, statusOfTransaction,
          billNo, description, date, dueDate, methodType,
          taxAmount, totalAmountWithTax, totalAmountWithoutTax, payments
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `
        )
        .run(
          clientId,
          productId,
          qty,
          purchaseAmount,
          paid,
          pendingAmount,
          pendingFromOurs,
          paymentMethod,
          paymentType,
          finalStatus,
          billNo,
          description || '',
          date,
          dueDate,
          methodType,
          JSON.stringify(taxAmount || []),
          totalAmountWithTax,
          totalAmountWithoutTax,
          JSON.stringify(payments || [])
        )

      const purchaseId = purchaseResult.lastInsertRowid

      applyPurchaseEffects(data, purchaseId)
      updateClientBalances(clientId, data, 'apply')

      return purchaseId
    })

    return { success: true, id: transaction() }
  } catch (error) {
    console.error('createPurchase error:', error)
    return { success: false, message: error.message }
  }
})

ipcMain.handle('updatePurchase', (event, { id, ...data }) => {
  try {
    const transaction = db.transaction(() => {
      const oldPurchase = db.prepare(`SELECT * FROM purchases WHERE id = ?`).get(id)
      if (!oldPurchase) throw new Error('Purchase not found')

      rollbackPurchaseEffects(oldPurchase)
      updateClientBalances(oldPurchase.clientId, oldPurchase, 'rollback')

      db.prepare(
        `
        UPDATE purchases SET
          clientId=?, productId=?, quantity=?, purchaseAmount=?,
          paidAmount=?, pendingAmount=?, pendingFromOurs=?,
          paymentMethod=?, paymentType=?, statusOfTransaction=?,
          billNo=?, description=?, taxAmount=?,
          totalAmountWithTax=?, totalAmountWithoutTax=?,
          updatedAt=CURRENT_TIMESTAMP
        WHERE id=?
      `
      ).run(
        data.clientId,
        data.productId,
        data.quantity,
        data.purchaseAmount,
        data.paidAmount,
        data.pendingAmount,
        data.pendingFromOurs,
        data.paymentMethod,
        data.paymentType,
        data.statusOfTransaction,
        data.billNo,
        data.description,
        JSON.stringify(data.taxAmount || []),
        data.totalAmountWithTax,
        data.totalAmountWithoutTax,
        id
      )

      applyPurchaseEffects(data, id)
      updateClientBalances(data.clientId, data, 'apply')

      return id
    })

    return { success: true, id: transaction() }
  } catch (error) {
    console.error('updatePurchase error:', error)
    return { success: false, message: error.message }
  }
})

ipcMain.handle('deletePurchase', (event, id) => {
  try {
    const transaction = db.transaction(() => {
      const purchase = db.prepare(`SELECT * FROM purchases WHERE id = ?`).get(id)
      if (!purchase) throw new Error('Purchase not found')

      rollbackPurchaseEffects(purchase)
      updateClientBalances(purchase.clientId, purchase, 'rollback')

      db.prepare(`DELETE FROM purchases WHERE id = ?`).run(id)

      return id
    })

    return { success: true, id: transaction() }
  } catch (error) {
    console.error('deletePurchase error:', error)
    return { success: false, message: error.message }
  }
})

// -------- Sales ---------------

function applySaleEffects(sale, saleId) {
  const {
    clientId,
    productId,
    quantity,
    totalAmountWithTax,
    paidAmount = 0,
    paymentMethod,
    billNo
  } = sale

  const qty = Number(quantity)
  const total = Number(totalAmountWithTax || 0)
  const paid = Number(paidAmount || 0)

  /* ---------- STOCK DEDUCTION ---------- */
  adjustProductStock(productId, -qty)

  /* ---------- CLIENT ACCOUNT DEBIT ---------- */
  const client = db.prepare(`SELECT * FROM clients WHERE id = ?`).get(clientId)
  if (!client?.accountId) throw new Error('Client account missing')

  const clientAccount = db.prepare(`SELECT * FROM accounts WHERE id = ?`).get(client.accountId)
  const product = db.prepare(`SELECT * FROM products WHERE id = ?`).get(productId)

  const newClientBalance = Number(clientAccount.closingBalance || 0) - total

  db.prepare(
    `
    INSERT INTO ledger (
      accountId, clientId, entryType, amount, balanceAfter,
      referenceType, referenceId, narration
    )
    VALUES (?, ?, 'debit', ?, ?, 'Sales', ?, ?)
  `
  ).run(
    clientAccount.id,
    clientId,
    total,
    newClientBalance,
    saleId,
    `Sold ${qty} × ${product.productName} to ${client.clientName} (Bill ${billNo || '-'})`
  )

  db.prepare(`UPDATE accounts SET closingBalance = ? WHERE id = ?`).run(
    newClientBalance,
    clientAccount.id
  )

  /* ---------- SYSTEM ACCOUNT CREDIT (ONLY PAID) ---------- */
  if (paid > 0) {
    const systemAccount = getOrCreateSystemAccount(paymentMethod)

    console.log('systemAccount', systemAccount)
    console.log('paid', paid)

    const newSystemBalance = Number(systemAccount.closingBalance || 0) + paid

    console.log('newBalance', newSystemBalance)

    db.prepare(
      `
      INSERT INTO ledger (
        accountId, entryType, amount, balanceAfter,
        referenceType, referenceId, narration
      )
      VALUES (?, 'credit', ?, ?, 'Payment', ?, ?)
    `
    ).run(
      systemAccount.id,
      paid,
      newSystemBalance,
      saleId,
      `Sold ${qty} × ${product.productName} to ${client.clientName} (Bill ${billNo || '-'})`
    )

    db.prepare(`UPDATE accounts SET closingBalance = ? WHERE id = ?`).run(
      newSystemBalance,
      systemAccount.id
    )
  }
}

function rollbackSaleEffects(oldSale) {
  const {
    id,
    clientId,
    productId,
    quantity,
    totalAmountWithTax,
    paidAmount = 0,
    paymentMethod,
    billNo
  } = oldSale

  const qty = Number(quantity)
  const total = Number(totalAmountWithTax || 0)
  const paid = Number(paidAmount || 0)

  /* ---------- STOCK ROLLBACK ---------- */
  adjustProductStock(productId, qty)

  /* ---------- CLIENT ACCOUNT CREDIT ---------- */
  const client = db.prepare(`SELECT * FROM clients WHERE id = ?`).get(clientId)
  if (!client?.accountId) throw new Error('Client account missing')

  const clientAccount = db.prepare(`SELECT * FROM accounts WHERE id = ?`).get(client.accountId)

  const newClientBalance = Number(clientAccount.closingBalance || 0) + total

  db.prepare(
    `
    INSERT INTO ledger (
      accountId, clientId, entryType, amount, balanceAfter,
      referenceType, referenceId, narration
    )
    VALUES (?, ?, 'credit', ?, ?, 'Adjustment', ?, ?)
  `
  ).run(
    clientAccount.id,
    clientId,
    total,
    newClientBalance,
    id,
    `Adjustment Sale Bill ${billNo || '-'}`
  )

  db.prepare(`UPDATE accounts SET closingBalance = ? WHERE id = ?`).run(
    newClientBalance,
    clientAccount.id
  )

  /* ---------- SYSTEM ACCOUNT DEBIT ---------- */
  if (paid > 0) {
    const systemAccount = getOrCreateSystemAccount(paymentMethod)

    const newSystemBalance = Number(systemAccount.closingBalance || 0) - paid

    db.prepare(
      `
      INSERT INTO ledger (
        accountId, entryType, amount, balanceAfter,
        referenceType, referenceId, narration
      )
      VALUES (?, 'debit', ?, ?, 'Adjustment', ?, ?)
    `
    ).run(
      systemAccount.id,
      paid,
      newSystemBalance,
      id,
      `Adjustment Sale Payment Bill ${billNo || '-'}`
    )

    db.prepare(`UPDATE accounts SET closingBalance = ? WHERE id = ?`).run(
      newSystemBalance,
      systemAccount.id
    )
  }
}

ipcMain.handle('getSalesById', (event, id) => {
  const transaction = db.prepare('SELECT * FROM sales WHERE id = ?').get(id)
  transaction.taxAmount = JSON.parse(transaction.taxAmount)
  return transaction
})

ipcMain.handle('getAllSales', (event, page = 1) => {
  try {
    const limit = 20
    const offset = (page - 1) * limit

    const sales = db
      .prepare(
        `
      SELECT s.*, 
             c.clientName,
             pr.productName
      FROM sales s
      LEFT JOIN clients c ON s.clientId = c.id
      LEFT JOIN products pr ON s.productId = pr.id
      ORDER BY s.createdAt DESC
      LIMIT ? OFFSET ?
    `
      )
      .all(limit, offset)

    return { success: true, data: sales }
  } catch (error) {
    return { success: false, message: error.message }
  }
})

ipcMain.handle('createSales', (event, data) => {
  try {
    const transaction = db.transaction(() => {
      const {
        clientId,
        productId,
        quantity,
        saleAmount,
        paidAmount = 0,
        paymentType,
        paymentMethod,
        pendingAmount = 0,
        pendingFromOurs,
        statusOfTransaction,
        billNo,
        description,
        date,
        dueDate = null,
        payments,
        taxAmount,
        totalAmountWithTax,
        totalAmountWithoutTax,
        methodType = 'Receipt'
      } = data

      if (!clientId || !productId || !quantity || !saleAmount) {
        throw new Error('Missing required fields')
      }

      const qty = Number(quantity)
      const total = Number(totalAmountWithTax)
      const paid = Number(paidAmount)
      let pending = Number(pendingAmount || 0)

      if (paymentType === 'full') {
        pending = 0
      } else {
        pending = Math.max(0, total - paid)
      }

      let finalStatus = statusOfTransaction

      if (!finalStatus) {
        if (pending === 0 && paid > 0) {
          finalStatus = 'completed'
        } else {
          finalStatus = 'pending'
        }
      }

      // const paymentMethodAccordingToPayment = payments[0].paymentMethod

      const saleResult = db
        .prepare(
          `
        INSERT INTO sales (
          clientId, productId, quantity, saleAmount,
          paidAmount, pendingAmount, pendingFromOurs,
          paymentMethod, paymentType, statusOfTransaction,
          billNo, description, date, dueDate, methodType,
          taxAmount, totalAmountWithTax, totalAmountWithoutTax, payments
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `
        )
        .run(
          clientId,
          productId,
          qty,
          saleAmount,
          paid,
          pendingAmount,
          pendingFromOurs,
          paymentMethod,
          paymentType,
          finalStatus,
          billNo,
          description || '',
          date,
          dueDate,
          methodType,
          JSON.stringify(taxAmount || []),
          totalAmountWithTax,
          totalAmountWithoutTax,
          JSON.stringify(payments || [])
        )

      const saleId = saleResult.lastInsertRowid

      applySaleEffects(data, saleId)
      updateClientBalances(clientId, data, 'apply')

      return saleId
    })

    return { success: true, id: transaction() }
  } catch (error) {
    console.error('createSales error:', error)
    return { success: false, message: error.message }
  }
})

ipcMain.handle('updateSales', (event, { id, ...data }) => {
  try {
    const transaction = db.transaction(() => {
      const oldSale = db.prepare(`SELECT * FROM sales WHERE id = ?`).get(id)
      if (!oldSale) throw new Error('Sale not found')

      rollbackSaleEffects(oldSale)
      updateClientBalances(oldSale.clientId, oldSale, 'rollback')

      db.prepare(
        `
        UPDATE sales SET
          clientId=?, productId=?, quantity=?, saleAmount=?,
          paidAmount=?, pendingAmount=?, pendingFromOurs=?,
          paymentMethod=?, paymentType=?, statusOfTransaction=?,
          billNo=?, description=?, taxAmount=?,
          totalAmountWithTax=?, totalAmountWithoutTax=?,
          updatedAt=CURRENT_TIMESTAMP
        WHERE id=?
      `
      ).run(
        data.clientId,
        data.productId,
        data.quantity,
        data.saleAmount,
        data.paidAmount,
        data.pendingAmount,
        data.pendingFromOurs,
        data.paymentMethod,
        data.paymentType,
        data.statusOfTransaction,
        data.billNo,
        data.description,
        JSON.stringify(data.taxAmount || []),
        data.totalAmountWithTax,
        data.totalAmountWithoutTax,
        id
      )

      applySaleEffects(data, id)
      updateClientBalances(data.clientId, data, 'apply')

      return id
    })

    return { success: true, id: transaction() }
  } catch (error) {
    console.error('updateSales error:', error)
    return { success: false, message: error.message }
  }
})

ipcMain.handle('deleteSales', (event, id) => {
  try {
    const transaction = db.transaction(() => {
      const sale = db.prepare(`SELECT * FROM sales WHERE id = ?`).get(id)
      if (!sale) throw new Error('Sale not found')

      rollbackSaleEffects(sale)
      updateClientBalances(sale.clientId, sale, 'rollback')

      db.prepare(`DELETE FROM sales WHERE id = ?`).run(id)

      return id
    })

    return { success: true, id: transaction() }
  } catch (error) {
    console.error('deleteSales error:', error)
    return { success: false, message: error.message }
  }
})

// -------- Bank Receipts --------

ipcMain.handle('getRecentBankReceipts', async () => {
  return db.prepare('SELECT * FROM bankReceipts ORDER BY createdAt DESC').all()
})

// ✅ Create bank receipt
ipcMain.handle('createBankReceipt', (event, bankReceipt) => {
  const {
    clientId,
    productId,
    transactionId,
    type,
    bank,
    date,
    amount,
    description,
    statusOfTransaction,
    dueDate,
    pendingAmount,
    pendingFromOurs,
    paidAmount,
    quantity,
    paymentType,
    pageName,
    sendTo,
    billNo,
    createdAt,
    updatedAt
  } = bankReceipt

  const formattedDate =
    typeof date === 'string' ? date : new Date(date).toISOString().slice(0, 19).replace('T', ' ')

  const tx = db.transaction(() => {
    const res = db
      .prepare(
        `
    INSERT INTO bankReceipts (
      clientId, productId, transactionId, type, bank, date, amount,
      description, statusOfTransaction, dueDate, pendingAmount, pendingFromOurs, paidAmount,quantity,paymentType, pageName, sendTo,billNo, createdAt, updatedAt
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?,?, ?, ?, ?, ?)
  `
      )
      .run(
        clientId,
        productId,
        transactionId,
        type,
        bank,
        formattedDate,
        amount,
        description,
        statusOfTransaction,
        dueDate,
        pendingAmount,
        pendingFromOurs,
        paidAmount,
        quantity,
        paymentType,
        pageName,
        sendTo,
        billNo,
        createdAt,
        updatedAt
      )

    const createdBankReceipt = db
      .prepare('SELECT * FROM bankReceipts WHERE id = ?')
      .get(res.lastInsertRowid)

    return createdBankReceipt
  })
  return tx()
})

ipcMain.handle('updateBankReceipt', (event, bankReceipt) => {
  const {
    transactionId,
    type,
    bank,
    date,
    amount,
    description,
    statusOfTransaction,
    dueDate,
    pendingAmount,
    pendingFromOurs,
    paidAmount,
    paymentType,
    quantity,
    pageName,
    sendTo,
    billNo
  } = bankReceipt

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
         SET type = ?, bank = ?, date = ?, amount = ?, description = ?, statusOfTransaction = ?, dueDate = ?,pendingAmount = ?,pendingFromOurs = ?,paidAmount = ?,paymentType = ?,quantity = ?,pageName = ?, sendTo = ?, billNo = ?, updatedAt = CURRENT_TIMESTAMP
         WHERE transactionId = ?`
      ).run(
        type,
        bank,
        formattedDate,
        amount,
        description,
        statusOfTransaction,
        dueDate,
        pendingAmount,
        pendingFromOurs,
        paidAmount,
        paymentType,
        quantity,
        pageName,
        sendTo,
        billNo,
        transactionId
      )

      // 3️⃣ Return the updated record using its id
      return db.prepare(`SELECT * FROM bankReceipts WHERE id = ?`).get(existing.id)
    } else {
      // 4️⃣ Insert new record if not exists
      const result = db
        .prepare(
          `INSERT INTO bankReceipts (transactionId, type, bank, date, amount, description, statusOfTransaction, dueDate,pendingAmount,pendingFromOurs,paidAmount,paymentType,quantity,pageName, sendTo, billNo)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
        )
        .run(
          transactionId,
          type,
          bank,
          formattedDate,
          amount,
          description,
          statusOfTransaction,
          dueDate,
          pendingAmount,
          pendingFromOurs,
          paidAmount,
          paymentType,
          quantity,
          pageName,
          sendTo,
          billNo
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
  const {
    clientId,
    productId,
    transactionId,
    type,
    cash,
    date,
    amount,
    description,
    statusOfTransaction,
    dueDate,
    pendingAmount,
    pendingFromOurs,
    paidAmount,
    quantity,
    paymentType,
    pageName,
    sendTo,
    chequeNumber,
    transactionAccount,
    billNo,
    createdAt,
    updatedAt
  } = cashReceipt

  const formattedDate =
    typeof date === 'string' ? date : new Date(date).toISOString().slice(0, 19).replace('T', ' ')

  const tx = db.transaction(() => {
    const res = db
      .prepare(
        `
       INSERT INTO cashReceipts (
      clientId, productId, transactionId, type, cash, date, amount,
      description, statusOfTransaction, dueDate, pendingAmount, pendingFromOurs, paidAmount,quantity,paymentType, pageName,sendTo,chequeNumber,transactionAccount,billNo, createdAt, updatedAt
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?,?, ?) `
      )
      .run(
        clientId,
        productId,
        transactionId,
        type,
        cash,
        formattedDate,
        amount,
        description,
        statusOfTransaction,
        dueDate,
        pendingAmount,
        pendingFromOurs,
        paidAmount,
        quantity,
        paymentType,
        pageName,
        sendTo,
        chequeNumber,
        transactionAccount,
        billNo,
        createdAt,
        updatedAt
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
  const {
    transactionId,
    type,
    cash,
    date,
    amount,
    description,
    statusOfTransaction,
    dueDate,
    pendingAmount,
    pendingFromOurs,
    paidAmount,
    paymentType,
    quantity,
    pageName,
    sendTo,
    chequeNumber,
    transactionAccount,
    billNo
  } = cashReceipt

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
         SET type = ?, cash = ?, date = ?, amount = ?, description = ?, statusOfTransaction = ?, dueDate = ?,pendingAmount = ?,pendingFromOurs = ?,paidAmount = ?,paymentType = ?,quantity = ?, pageName = ?,sendTo = ?,chequeNumber = ?,transactionAccount = ?,billNo = ?, updatedAt = CURRENT_TIMESTAMP
         WHERE transactionId = ?`
      ).run(
        type,
        cash,
        formattedDate,
        amount,
        description,
        statusOfTransaction,
        dueDate,
        pendingAmount,
        pendingFromOurs,
        paidAmount,
        paymentType,
        quantity,
        pageName,
        sendTo,
        chequeNumber,
        transactionAccount,
        billNo,
        transactionId
      )

      // 3️⃣ Return the updated record using its id
      return db.prepare(`SELECT * FROM cashReceipts WHERE id = ?`).get(existing.id)
    } else {
      // 4️⃣ Insert new record if not exists
      const result = db
        .prepare(
          `INSERT INTO cashReceipts (transactionId, type, cash, date, amount, description, statusOfTransaction, dueDate,pendingAmount,pendingFromOurs,paidAmount,paymentType,quantity, pageName,sendTo,chequeNumber,transactionAccount)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
        )
        .run(
          transactionId,
          type,
          cash,
          formattedDate,
          amount,
          description,
          statusOfTransaction,
          dueDate,
          pendingAmount,
          pendingFromOurs,
          paidAmount,
          paymentType,
          quantity,
          pageName,
          sendTo,
          chequeNumber,
          transactionAccount,
          billNo
        )

      // 5️⃣ Return newly created record
      return db.prepare(`SELECT * FROM cashReceipts WHERE id = ?`).get(result.lastInsertRowid)
    }
  })
  return tx()
})

ipcMain.handle('deleteCashReceipt', async (event, cashReceiptId) => {
  try {
    const result = db.prepare('DELETE FROM cashReceipts WHERE id = ?').run(cashReceiptId)
    if (result.changes === 0) {
      return { success: false, message: 'Cash receipt not found' }
    }
    return { success: true, data: result }
  } catch (err) {
    console.error('deleteCashReceipt error:', err)
    return { success: false, message: err.message || 'Failed to delete cash receipt' }
  }
})

ipcMain.handle('deleteCashReceiptByTransaction', async (event, transactionId) => {
  try {
    // Delete ALL receipts for this transaction (handles multi-row edge cases)
    const result = db.prepare('DELETE FROM cashReceipts WHERE transactionId = ?').run(transactionId)
    if (result.changes === 0) {
      return { success: false, message: 'No cash receipts found for this transaction' }
    }
    console.log(`Deleted ${result.changes} cash receipt(s) for transaction ${transactionId}`)
    return { success: true, data: { changes: result.changes, transactionId } }
  } catch (err) {
    console.error('deleteCashReceiptByTransaction error:', { transactionId, err })
    return { success: false, message: err.message || 'Failed to delete cash receipt' }
  }
})

ipcMain.handle('getCashReceiptByTransactionId', async (event, transactionId) => {
  try {
    const receipt = db
      .prepare('SELECT * FROM cashReceipts WHERE transactionId = ? LIMIT 1')
      .get(transactionId)
    return receipt
      ? { success: true, data: receipt }
      : { success: false, message: 'Receipt not found' }
  } catch (err) {
    console.error('getCashReceiptByTransactionId error:', err)
    return { success: false, message: err.message }
  }
})

ipcMain.handle('getBankReceiptByTransactionId', async (event, transactionId) => {
  try {
    const receipt = db
      .prepare('SELECT * FROM bankReceipts WHERE transactionId = ? LIMIT 1')
      .get(transactionId)
    return receipt
      ? { success: true, data: receipt }
      : { success: false, message: 'Receipt not found' }
  } catch (err) {
    console.error('getBankReceiptByTransactionId error:', err)
    return { success: false, message: err.message }
  }
})

ipcMain.handle('deleteBankReceiptByTransaction', async (event, transactionId) => {
  try {
    const result = db.prepare('DELETE FROM bankReceipts WHERE transactionId = ?').run(transactionId)
    if (result.changes === 0) {
      return { success: false, message: 'No bank receipts found for this transaction' }
    }
    console.log(`Deleted ${result.changes} bank receipt(s) for transaction ${transactionId}`)
    return { success: true, data: { changes: result.changes, transactionId } }
  } catch (err) {
    console.error('deleteBankReceiptByTransaction error:', { transactionId, err })
    return { success: false, message: err.message || 'Failed to delete bank receipt' }
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
        INSERT INTO clients (clientName, phoneNo, pendingAmount, paidAmount, pendingFromOurs, accountType)
        VALUES (@clientName, @phoneNo, @pendingAmount, @paidAmount, @pendingFromOurs, @accountType)
      `)

      const insertMany = db.transaction((rows) => {
        for (const row of rows) {
          stmt.run({
            clientName: row.clientName || '',
            phoneNo: String(row.phoneNo).split('.')[0] || '',
            pendingAmount: row.pendingAmount || 0,
            paidAmount: row.paidAmount || 0,
            pendingFromOurs: row.pendingFromOurs || 0,
            accountType: row.accountType || ''
          })
          count++
        }
      })
      insertMany(rows)
    } else if (tableName === 'products') {
      stmt = db.prepare(`
        INSERT INTO products (name, quantity, price)
        VALUES (@name, @quantity, @price)
      `)

      const insertMany = db.transaction((rows) => {
        for (const row of rows) {
          stmt.run({
            name: row.name || '',
            quantity: row.quantity || 0,
            price: row.price || 0
          })
          count++
        }
      })
      insertMany(rows)
    } else if (tableName === 'transactions') {
      stmt = db.prepare(`
        INSERT INTO transactions (clientId, productId, quantity, saleAmount, statusOfTransaction, paymentType, pendingAmount, paidAmount, transactionType)
        VALUES (@clientId, @productId, @quantity, @saleAmount, @statusOfTransaction, @paymentType, @pendingAmount, @paidAmount, @transactionType)
      `)

      const insertMany = db.transaction((rows) => {
        for (const row of rows) {
          stmt.run({
            clientId: row.clientId || 0,
            productId: row.productId || 0,
            quantity: row.quantity || 0,
            saleAmount: row.saleAmount || 0,
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

ipcMain.handle('getAccountBalances', () => {
  const accounts = db
    .prepare(
      `
    SELECT debitAccount AS account FROM ledger
    UNION
    SELECT creditAccount AS account FROM ledger
  `
    )
    .all()

  return accounts.map((acc) => {
    const debit =
      db.prepare(`SELECT SUM(amount) AS total FROM ledger WHERE debitAccount = ?`).get(acc.account)
        ?.total || 0
    const credit =
      db.prepare(`SELECT SUM(amount) AS total FROM ledger WHERE creditAccount = ?`).get(acc.account)
        ?.total || 0
    return { account: acc.account, balance: debit - credit }
  })
})

ipcMain.handle('getTrialBalance', () => {
  try {
    const result = db
      .prepare(
        `
      SELECT 
        a.id,
        a.accountName,
        a.accountType,
        SUM(CASE WHEN l.entryType = 'debit' THEN l.amount ELSE 0 END) AS totalDebit,
        SUM(CASE WHEN l.entryType = 'credit' THEN l.amount ELSE 0 END) AS totalCredit
      FROM accounts a
      LEFT JOIN ledger l ON a.id = l.accountId
      GROUP BY a.id
      ORDER BY a.accountName ASC
    `
      )
      .all()

    return { success: true, data: result }
  } catch (err) {
    return { success: false, message: err.message }
  }
})

ipcMain.handle('getAccountLedger', (event, accountId) => {
  try {
    const data = db
      .prepare(
        `
      SELECT *
      FROM ledger
      WHERE accountId = ?
      ORDER BY date ASC
    `
      )
      .all(accountId)

    return { success: true, data }
  } catch (err) {
    return { success: false, message: err.message }
  }
})

ipcMain.handle('getAccountLedgerByType', (event, accountType) => {
  try {
    const data = db
      .prepare(
        `
      SELECT ledger.*
      FROM ledger
      JOIN accounts ON ledger.accountId = accounts.id
      WHERE accounts.accountType = ?
      ORDER BY ledger.date ASC, ledger.createdAt ASC
    `
      )
      .all(accountType)

    return { success: true, data }
  } catch (err) {
    console.error('Ledger error:', err)
    return { success: false, message: err.message }
  }
})

ipcMain.handle('getAccountLedgerByDate', (event, { accountId, from, to }) => {
  try {
    const data = db
      .prepare(
        `
      SELECT *
      FROM ledger
      WHERE accountId = ?
      AND date BETWEEN ? AND ?
      ORDER BY date ASC
    `
      )
      .all(accountId, from, to)

    return { success: true, data }
  } catch (err) {
    return { success: false, message: err.message }
  }
})

ipcMain.handle('addLedgerEntry', (event, data) => {
  const { accountId, clientId, entryType, amount, referenceType, referenceId, narration } = data

  if (!['debit', 'credit'].includes(entryType)) {
    return { success: false, message: 'Invalid entry type' }
  }

  try {
    const transaction = db.transaction(() => {
      const account = db.prepare(`SELECT * FROM accounts WHERE id = ?`).get(accountId)

      if (!account) {
        throw new Error('Account not found')
      }

      const newBalance =
        entryType === 'debit' ? account.closingBalance + amount : account.closingBalance - amount

      db.prepare(
        `
        INSERT INTO ledger
        (accountId, clientId, entryType, amount, balanceAfter, referenceType, referenceId, narration)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `
      ).run(
        accountId,
        clientId,
        entryType,
        amount,
        newBalance,
        referenceType,
        referenceId,
        narration
      )

      db.prepare(
        `
        UPDATE accounts
        SET closingBalance = ?, updatedAt = CURRENT_TIMESTAMP
        WHERE id = ?
      `
      ).run(newBalance, accountId)

      return newBalance
    })

    const balance = transaction()

    return {
      success: true,
      message: 'Ledger entry added successfully',
      balance
    }
  } catch (error) {
    console.error('❌ Error adding ledger entry:', error)
    return { success: false, message: error.message }
  }
})

ipcMain.handle('getTransferHistory', (event, accountId) => {
  try {
    let query = `
      SELECT l.*, a.accountName
      FROM ledger l
      LEFT JOIN accounts a ON l.accountId = a.id
      WHERE referenceType = 'Transfer'
    `

    const params = []

    if (accountId) {
      query += ` AND l.accountId = ?`
      params.push(accountId)
    }

    query += ` ORDER BY l.date DESC, l.createdAt DESC`

    const history = db.prepare(query).all(...params)

    return { success: true, data: history }
  } catch (error) {
    console.error('❌ Error fetching transfer history:', error)
    return { success: false, message: 'Failed to fetch transfer history' }
  }
})

ipcMain.handle('getClientLedger', (event, clientId) => {
  try {
    const numericId = Number(clientId)

    const ledger = db
      .prepare(
        `
      SELECT *
      FROM ledger
      WHERE clientId = ?
      ORDER BY date ASC, createdAt ASC
    `
      )
      .all(numericId)

    const ledgerData = db.prepare(`SELECT * FROM ledger`).all()
    console.log('ALL LEDGER:', ledgerData)

    console.log('Fetching ledger for client:', clientId)

    return { success: true, data: ledger }
  } catch (error) {
    console.error('❌ Error fetching client ledger:', error)
    return { success: false, message: 'Failed to fetch ledger' }
  }
})

ipcMain.handle('deleteLedgerEntry', (event, id) => {
  try {
    const transaction = db.transaction(() => {
      const entry = db.prepare(`SELECT * FROM ledger WHERE id = ?`).get(id)

      if (!entry) throw new Error('Ledger entry not found')

      if (entry.referenceType === 'Opening') {
        throw new Error('Opening balance entry cannot be deleted')
      }

      const account = db.prepare(`SELECT * FROM accounts WHERE id = ?`).get(entry.accountId)

      if (!account) throw new Error('Account not found')

      const newBalance =
        entry.entryType === 'debit'
          ? account.closingBalance - entry.amount
          : account.closingBalance + entry.amount

      db.prepare(
        `
        UPDATE accounts
        SET closingBalance = ?
        WHERE id = ?
      `
      ).run(newBalance, entry.accountId)

      db.prepare(`DELETE FROM ledger WHERE id = ?`).run(id)
    })

    transaction()

    return { success: true, message: 'Ledger entry deleted successfully' }
  } catch (error) {
    console.error('❌ Error deleting ledger entry:', error)
    return { success: false, message: error.message }
  }
})

ipcMain.handle('deleteMultipleLedgerEntries', (event, ids) => {
  if (!Array.isArray(ids) || ids.length === 0) {
    return { success: false, message: 'Invalid request format' }
  }

  try {
    const transaction = db.transaction(() => {
      for (const id of ids) {
        const entry = db.prepare(`SELECT * FROM ledger WHERE id = ?`).get(id)

        if (!entry) continue

        const account = db.prepare(`SELECT * FROM accounts WHERE id = ?`).get(entry.accountId)

        if (!account) continue

        const newBalance =
          entry.entryType === 'debit'
            ? account.closingBalance - entry.amount
            : account.closingBalance + entry.amount

        db.prepare(
          `
          UPDATE accounts
          SET closingBalance = ?
          WHERE id = ?
        `
        ).run(newBalance, entry.accountId)
      }

      db.prepare(
        `
        DELETE FROM ledger
        WHERE id IN (${ids.map(() => '?').join(',')})
      `
      ).run(...ids)
    })

    transaction()

    return {
      success: true,
      message: 'Multiple ledger entries deleted successfully'
    }
  } catch (error) {
    console.error('❌ Ledger bulk delete error:', error)
    return { success: false, message: error.message }
  }
})

// Create Account
ipcMain.handle('createAccount', (event, accountData) => {
  try {
    const {
      accountName,
      accountType = 'Bank',
      clientId = null,
      openingBalance = 0,
      accounterType,
      status = 'active'
    } = accountData

    if (!accountName?.trim()) {
      return { success: false, message: 'Account name is required' }
    }

    const existing = db
      .prepare('SELECT id FROM accounts WHERE accountName = ?')
      .get(accountName.trim())

    if (existing) {
      return { success: false, message: 'Account name already exists' }
    }

    const stmt = db.prepare(`
      INSERT INTO accounts
      (clientId, accountName, accountType, openingBalance, closingBalance, status, accounterType, createdAt, updatedAt)
      VALUES (?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
    `)

    const info = stmt.run(
      clientId,
      accountName.trim(),
      accountType,
      openingBalance,
      openingBalance,
      status,
      accounterType
    )

    return {
      success: true,
      message: `Account "${accountName}" created successfully`,
      data: {
        id: info.lastInsertRowid,
        accountName: accountName.trim(),
        accountType,
        openingBalance,
        closingBalance: openingBalance,
        status,
        accounterType,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        pageName: 'Account'
      }
    }
  } catch (error) {
    console.error('Create account error:', error)
    return { success: false, message: error.message }
  }
})

// Update Account
ipcMain.handle('updateAccount', (event, { id, ...updates }) => {
  try {
    if (!id) {
      return { success: false, message: 'Account ID is required' }
    }

    const current = db.prepare('SELECT * FROM accounts WHERE id = ?').get(id)
    if (!current) {
      return { success: false, message: 'Account not found' }
    }

    const { accountName, accountType, status, openingBalance, accounterType } = updates

    if (accountName && !accountName.trim()) {
      return { success: false, message: 'Account name cannot be empty' }
    }

    if (accountName) {
      const existing = db
        .prepare('SELECT id FROM accounts WHERE accountName = ? AND id != ?')
        .get(accountName.trim(), id)

      if (existing) {
        return { success: false, message: 'Account name already exists' }
      }
    }

    // If openingBalance changes, adjust closingBalance accordingly
    let newClosingBalance = current.closingBalance
    if (openingBalance !== undefined) {
      const difference = openingBalance - current.openingBalance
      newClosingBalance = current.closingBalance + difference
    }

    db.prepare(
      `
      UPDATE accounts
      SET accountName = ?,
          accountType = ?,
          openingBalance = ?,
          closingBalance = ?,
          status = ?,
          accounterType = ?,
          updatedAt = CURRENT_TIMESTAMP
      WHERE id = ?
    `
    ).run(
      accountName?.trim() || current.accountName,
      accountType || current.accountType,
      openingBalance !== undefined ? openingBalance : current.openingBalance,
      newClosingBalance,
      status || current.status,
      accounterType || current.accounterType,
      id
    )

    return {
      success: true,
      message: 'Account updated successfully',
      data: {
        ...current,
        accountName: accountName?.trim() || current.accountName,
        accountType: accountType || current.accountType,
        openingBalance: openingBalance !== undefined ? openingBalance : current.openingBalance,
        closingBalance: newClosingBalance,
        status: status || current.status,
        accounterType: accounterType || current.accounterType,
        updatedAt: new Date().toISOString()
      }
    }
  } catch (error) {
    console.error('Update account error:', error)
    return { success: false, message: error.message }
  }
})

ipcMain.handle('deleteAccount', async (event, id) => {
  db.prepare('DELETE FROM accounts WHERE id = ?').run(id)
})

ipcMain.handle('getAllAccounts', async () => {
  return db.prepare('SELECT * FROM accounts').all()
})

ipcMain.handle('getAccountById', async (event, id) => {
  return db.prepare('SELECT * FROM accounts WHERE id = ?').get(id)
})

// Settings

ipcMain.handle('getSettings', async () => {
  return db.prepare('SELECT * FROM settings').all()
})

ipcMain.handle('createSettings', async (event, settingsData) => {
  const { taxName, taxValue } = settingsData

  const tx = db.transaction(() => {
    const result = db
      .prepare(`INSERT INTO settings (taxName, taxValue) VALUES (?, ?)`)
      .run(taxName, taxValue)

    // Return the inserted record
    const inserted = db.prepare(`SELECT * FROM settings WHERE id = ?`).get(result.lastInsertRowid)

    return inserted
  })

  return tx()
})

ipcMain.handle('updateSettings', async (event, settings) => {
  const { id, taxName, taxValue } = settings

  const tx = db.transaction(() => {
    db.prepare(`UPDATE settings SET taxName = ?, taxValue = ? WHERE id = ?`).run(
      taxName,
      taxValue,
      id
    )
  })

  return tx()
})

ipcMain.handle('deleteSettings', async (event, id) => {
  db.prepare(`DELETE FROM settings WHERE id = ?`).run(id)
})

const USER_DATA = app.getPath('userData')
const FILE_PATH = path.join(USER_DATA, 'keyBindings.json')

function ensureFile() {
  if (!fs.existsSync(USER_DATA)) fs.mkdirSync(USER_DATA, { recursive: true })
  if (!fs.existsSync(FILE_PATH)) fs.writeFileSync(FILE_PATH, JSON.stringify([]))
}

function readBindings() {
  ensureFile()
  try {
    const raw = fs.readFileSync(FILE_PATH, 'utf8')
    return JSON.parse(raw || '[]')
  } catch (err) {
    console.error('Failed to read keyBindings:', err)
    return []
  }
}

function writeBindings(list) {
  ensureFile()
  try {
    fs.writeFileSync(FILE_PATH, JSON.stringify(list, null, 2), 'utf8')
  } catch (err) {
    console.error('Failed to write keyBindings:', err)
  }
}

// ✅ Get all key bindings
ipcMain.handle('getKeyBindings', async () => {
  return readBindings()
})

// ✅ Create new key binding
ipcMain.handle('createKeyBinding', async (event, data) => {
  const list = readBindings()
  const record = { id: Date.now(), ...data }
  list.push(record)
  writeBindings(list)
  return record
})

// ✅ Update key binding
ipcMain.handle('updateKeyBinding', async (event, data) => {
  const list = readBindings()
  const idx = list.findIndex((r) => String(r.id) === String(data.id))
  if (idx !== -1) {
    list[idx] = { ...list[idx], ...data }
    writeBindings(list)
    return list[idx]
  } else {
    throw new Error('Key binding not found')
  }
})

// ✅ Delete key binding
ipcMain.handle('deleteKeyBinding', async (event, id) => {
  const list = readBindings()
  const updated = list.filter((r) => String(r.id) !== String(id))
  writeBindings(updated)
  return { success: true }
})

// --- Restore Backup ---
ipcMain.handle('restoreBackup', async (_, backupFilePath) => {
  try {
    decryptFile(backupFilePath, dbPath)
    return { success: true, message: 'Database restored successfully.' }
  } catch (err) {
    return { success: false, message: err.message }
  }
})

// --- List Backups ---
ipcMain.handle('selectBackupFile', async () => {
  const result = await dialog.showOpenDialog({
    title: 'Select Backup File',
    defaultPath: backupDir,
    // filters: [{ name: 'Encrypted Backups', extensions: ['enc'] }],
    properties: ['openFile']
  })
  return result
})

// --- Manual Backup (on demand) ---
ipcMain.handle('manualBackup', async () => {
  try {
    createBackup()
    return { success: true, message: 'Manual backup created.' }
  } catch (err) {
    return { success: false, message: err.message }
  }
})

ipcMain.handle('getAuthorization', async () => {
  try {
    const passcode = '123123'
    if (!passcode) {
      return { success: false, message: 'Wrong Passcode' }
    }
    return { success: true, passcode: passcode, message: 'Authorization successful.' }
  } catch (err) {
    console.error('Authorization error:', err)
    return { success: false, message: err.message }
  }
})

ipcMain.handle('getSystemInfo', () => {
  const totalProducts = db.prepare('SELECT COUNT(*) as count FROM products').get().count
  const totalClients = db.prepare('SELECT COUNT(*) as count FROM clients').get().count
  const totalAccounts = db.prepare('SELECT COUNT(*) as count FROM accounts').get().count
  const totalTransactions = db.prepare('SELECT COUNT(*) as count FROM ledger').get().count

  return {
    version: app.getVersion(),
    totalProducts,
    totalClients,
    totalAccounts,
    totalTransactions
  }
})

// --- Schedule Daily Backup at 12:01 AM ---
// cron.schedule(
//   '8 23 * * *',
//   () => {
//     const now = moment().tz('Asia/Kolkata').format('YYYY-MM-DD HH:mm:ss')
//     console.log(`🕐 Running backup at ${now} (IST)`)
//     createBackup()
//   },
//   {
//     scheduled: true,
//     timezone: 'Asia/Kolkata'
//   }
// )

// console.log('✅ Daily backup job scheduled for 23:07 AM IST')

// ipcMain.handle('saveAndSendWhatsAppPDF', async (event, phone, pdfBuffer, fileName, caption) => {
//   let pdfPath = null

//   try {
//     if (!phone || !pdfBuffer || !fileName) {
//       throw new Error('Missing required parameters')
//     }

//     const sanitizedFileName = path.basename(fileName)

//     let buffer
//     if (pdfBuffer instanceof ArrayBuffer) {
//       buffer = Buffer.from(pdfBuffer)
//     } else if (pdfBuffer instanceof Uint8Array) {
//       buffer = Buffer.from(pdfBuffer)
//     } else if (Buffer.isBuffer(pdfBuffer)) {
//       buffer = pdfBuffer
//     } else {
//       throw new Error('Invalid PDF data format')
//     }

//     pdfPath = path.join(app.getPath('documents'), sanitizedFileName)

//     await fs.writeFile(pdfPath, buffer)
//     console.log(`📄 PDF saved to: ${pdfPath}`)

//     const success = await sendWhatsAppPDF(phone, pdfPath, caption)

//     return { success, filePath: pdfPath }
//   } catch (err) {
//     console.error('❌ Error saving/sending PDF:', err)

//     if (pdfPath) {
//       try {
//         await fs.access(pdfPath)
//         await fs.unlink(pdfPath)
//         console.log('🗑️ Cleaned up failed PDF file')
//       } catch (unlinkErr) {
//         // Ignore
//         console.error('Failed to clean up failed PDF file:', unlinkErr)
//       }
//     }

//     return { success: false, error: err.message }
//   }
// })

// // Get WhatsApp status
// ipcMain.handle('getWhatsAppStatus', async () => {
//   return await getWhatsAppStatus()
// })

// // Logout WhatsApp
// ipcMain.handle('logoutWhatsApp', async () => {
//   await logoutWhatsApp()
//   return { success: true }
// })

//transferAmount

ipcMain.handle('transferAmount', (event, data) => {
  const { fromAccountId, toAccountId, amount, narration = 'Account Transfer' } = data

  if (!fromAccountId || !toAccountId || !amount || amount <= 0) {
    return { success: false, error: 'Invalid transfer data' }
  }

  if (fromAccountId === toAccountId) {
    return { success: false, error: 'Same account transfer not allowed' }
  }

  try {
    const transfer = db.transaction(() => {
      // 1️⃣ Fetch Accounts
      const fromAccount = db.prepare(`SELECT * FROM accounts WHERE id = ?`).get(fromAccountId)

      const toAccount = db.prepare(`SELECT * FROM accounts WHERE id = ?`).get(toAccountId)

      if (!fromAccount || !toAccount) {
        throw new Error('Account not found')
      }

      if (fromAccount.closingBalance < amount) {
        throw new Error('Insufficient balance')
      }

      // 2️⃣ Debit From Account
      const newFromBalance = fromAccount.closingBalance - amount

      db.prepare(
        `
        UPDATE accounts 
        SET closingBalance = ? 
        WHERE id = ?
      `
      ).run(newFromBalance, fromAccountId)

      db.prepare(
        `
        INSERT INTO ledger
        (accountId, clientId, entryType, amount, balanceAfter, referenceType, narration)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `
      ).run(
        fromAccountId,
        fromAccount.clientId,
        'debit',
        amount,
        newFromBalance,
        'Transfer',
        `To ${toAccount.accountName}`
      )

      // 3️⃣ Credit To Account
      const newToBalance = toAccount.closingBalance + amount

      db.prepare(
        `
        UPDATE accounts 
        SET closingBalance = ? 
        WHERE id = ?
      `
      ).run(newToBalance, toAccountId)

      db.prepare(
        `
        INSERT INTO ledger
        (accountId, clientId, entryType, amount, balanceAfter, referenceType, narration)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `
      ).run(
        toAccountId,
        toAccount.clientId,
        'credit',
        amount,
        newToBalance,
        'Transfer',
        `From ${fromAccount.accountName}`
      )

      return { success: true }
    })

    return transfer()
  } catch (error) {
    console.error('❌ Transfer failed:', error)
    return { success: false, error: error.message }
  }
})

db.exec(`
    CREATE INDEX IF NOT EXISTS idx_transactions_clientId ON transactions(clientId);
    CREATE INDEX IF NOT EXISTS idx_transactions_productId ON transactions(productId);
    CREATE INDEX IF NOT EXISTS idx_bankReceipts_bank ON bankReceipts(bank);
    CREATE INDEX IF NOT EXISTS idx_cashReceipts_cash ON cashReceipts(cash);
  `)

export default db
