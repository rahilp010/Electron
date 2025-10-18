/* eslint-disable prettier/prettier */
// import { Client, LocalAuth, MessageMedia } from 'whatsapp-web.js'
// import QRCode from 'qrcode'

// let client
// let mainWindow // Store reference to the main window

// export const initWhatsAppClient = (window) => {
//   mainWindow = window // Save the window reference

//   client = new Client({
//     authStrategy: new LocalAuth() // persists session
//   })

//   client.on('qr', async (qr) => {
//     console.log('QR code received, generating image...')
//     try {
//       // Generate QR code as data URL
//       const qrDataURL = await QRCode.toDataURL(qr, {
//         width: 300,
//         margin: 2,
//         color: {
//           dark: '#000000',
//           light: '#FFFFFF'
//         }
//       })

//       // Send QR code to renderer
//       if (mainWindow && !mainWindow.isDestroyed()) {
//         mainWindow.webContents.send('whatsapp-qr', qrDataURL)
//       }
//     } catch (err) {
//       console.error('Error generating QR code:', err)
//     }
//   })

//   client.on('ready', () => {
//     console.log('✅ WhatsApp client is ready')
//     if (mainWindow && !mainWindow.isDestroyed()) {
//       mainWindow.webContents.send('whatsapp-status', 'ready')
//     }
//   })

//   client.on('authenticated', () => {
//     console.log('🔐 Authenticated!')
//     if (mainWindow && !mainWindow.isDestroyed()) {
//       mainWindow.webContents.send('whatsapp-status', 'authenticated')
//     }
//   })

//   client.on('disconnected', (reason) => {
//     console.log('❌ Disconnected:', reason)
//     if (mainWindow && !mainWindow.isDestroyed()) {
//       mainWindow.webContents.send('whatsapp-status', 'disconnected')
//     }
//   })

//   client.initialize()
// }

// export const sendWhatsAppPDF = async (phoneNo, filePath, caption = '') => {
//   try {
//     if (!client) throw new Error('Client not initialized')
//     if (!client.info || !client.info.wid) throw new Error('Client not logged in yet')

//     const media = MessageMedia.fromFilePath(filePath)
//     await client.sendMessage(`${phoneNo}@c.us`, media, { caption })
//     console.log(`✅ Sent PDF to ${phoneNo}`)
//     return true
//   } catch (err) {
//     console.error('❌ Error sending message:', err)
//     return false
//   }
// }

// export const getWhatsAppStatus = () => {
//   if (!client) return 'not_initialized'
//   if (client.info && client.info.wid) return 'ready'
//   return 'waiting_for_qr'
// }

// export const logoutWhatsApp = () => {
//   if (client) {
//     client.destroy()
//     client = null
//     mainWindow = null
//   }
// }

// export const destroyWhatsAppClient = () => {
//   if (client) {
//     client.destroy()
//     client = null
//     mainWindow = null
//   }
// }
