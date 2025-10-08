/* eslint-disable prettier/prettier */
import fs from 'fs'
import path from 'path'
import crypto from 'crypto'

// --- Encryption setup ---
const ENCRYPTION_KEY = crypto
  .createHash('sha256')
  .update('YourStrongSecretKeyHere') // change this secret
  .digest()

export function encryptFile(inputPath, outputPath) {
  const data = fs.readFileSync(inputPath)
  const iv = crypto.randomBytes(16)
  const cipher = crypto.createCipheriv('aes-256-gcm', ENCRYPTION_KEY, iv)
  const encrypted = Buffer.concat([cipher.update(data), cipher.final()])
  const tag = cipher.getAuthTag()
  fs.writeFileSync(outputPath, Buffer.concat([iv, tag, encrypted]))
}

export function autoBackupOncePerDay() {
  try {
    // const userDir = app.getPath('userData') // ✅ safe writable dir
    const dbPath = path.join(process.cwd(), 'data.db')
    const backupDir = path.join(process.cwd(), 'backups')
    if (!fs.existsSync(backupDir)) fs.mkdirSync(backupDir, { recursive: true })

    const today = new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' })
    const backupFile = path.join(backupDir, `backup_${today}.enc`)

    if (fs.existsSync(backupFile)) {
      console.log(`🟡 Backup for ${today} already exists. Skipping.`)
      return
    }

    if (!fs.existsSync(dbPath)) {
      console.log(`⚠️ Database not found at ${dbPath}. Skipping backup.`)
      return
    }

    encryptFile(dbPath, backupFile)
    console.log(`✅ Auto backup created for ${today}: ${backupFile}`)
  } catch (err) {
    console.error('❌ Auto backup failed:', err)
  }
}
