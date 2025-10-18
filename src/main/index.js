import { app, shell, BrowserWindow, ipcMain } from 'electron'
import { join, dirname } from 'path'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import { fileURLToPath } from 'url'
import icon from '../../resources/icon.png?asset'
import '../renderer/src/API/dbHandlers.js'
import { autoBackupOncePerDay } from './autoBackup.js'
import checkForUpdate from './version.js'
// import { initWhatsAppClient, getWhatsAppStatus, destroyWhatsAppClient } from './whatsappClient.js'

// Get directory name in ES module
const currentFilename = fileURLToPath(import.meta.url)
const currentDirname = dirname(currentFilename)

function createWindow() {
  // Create the browser window.
  const mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    show: false,
    autoHideMenuBar: true,
    ...(process.platform === 'linux' ? { icon } : {}),
    webPreferences: {
      preload: join(currentDirname, '../preload/index.js'),
      sandbox: false
    }
  })

  mainWindow.on('ready-to-show', () => {
    mainWindow.show()
    mainWindow.maximize()
  })

  mainWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url)
    return { action: 'deny' }
  })

  // HMR for renderer base on electron-vite cli.
  // Load the remote URL for development or the local html file for production.
  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    mainWindow.loadFile(join(currentDirname, '../renderer/index.html'))
  }

  return mainWindow
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.whenReady().then(() => {
  // Set app user model id for windows
  checkForUpdate()
  electronApp.setAppUserModelId('com.electron')

  // Default open or close DevTools by F12 in development
  // and ignore CommandOrControl + R in production.
  // see https://github.com/alex8088/electron-toolkit/tree/master/packages/utils
  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window)
  })

  // IPC test
  ipcMain.on('ping', () => console.log('pong'))

  // const mainWindow = createWindow()
  createWindow()

  autoBackupOncePerDay()

  // initWhatsAppClient(mainWindow)

  app.on('activate', function () {
    // On macOS it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow()
      // initWhatsAppClient(newWindow)
    }
  })
})

// ipcMain.handle('getWhatsAppStatus', () => {
//   return getWhatsAppStatus()
// })

// app.on('before-quit', async (event) => {
//   event.preventDefault()
//   console.log('🔄 Shutting down gracefully...')

//   try {
//     await destroyWhatsAppClient()
//   } catch (err) {
//     console.error('Error during shutdown:', err)
//   }

//   setTimeout(() => {
//     app.exit(0)
//   }, 1000)
// })

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and require them here.

// PDF Generation Handler
