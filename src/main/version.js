/* eslint-disable prettier/prettier */
import { app, dialog, BrowserWindow } from 'electron'
import axios from 'axios'
import fs from 'fs-extra'
import path from 'path'
import extract from 'extract-zip'

const CURRENT_VERSION = '1.2.0'
const EXE_DIR = path.dirname(app.getPath('exe'))
const UPDATE_ZIP = path.join(EXE_DIR, 'Release.zip')
const APP_DIR = app.getAppPath()

async function checkForUpdate(mainWindow) {
  try {
    console.log('Checking for updates...')
    const { data } = await axios.get('https://electron-server-plum.vercel.app/api/version')
    const latestVersion = data.version

    console.log('Latest version:', latestVersion)
    console.log('Current version:', CURRENT_VERSION)

    if (latestVersion !== CURRENT_VERSION) {
      const choice = dialog.showMessageBoxSync(mainWindow, {
        // Pass mainWindow for parent
        type: 'question',
        buttons: ['Update Now', 'Later'],
        defaultId: 0,
        title: 'Update Available',
        message: `New version ${latestVersion} available. Update now?`
      })

      if (choice === 0) {
        await downloadAndInstall(data.url, mainWindow, latestVersion)
        app.quit()
      }
    }
  } catch (error) {
    console.error('Update check failed:', error)
    dialog.showErrorBox('Update Check Error', `Failed to check: ${error.message}`)
  }
}

async function downloadAndInstall(url, mainWindow, latestVersion) {
  let progressWin = null
  const EXE_DIR = path.dirname(app.getPath('exe'))
  const UPDATE_ZIP = path.join(EXE_DIR, 'Release.zip')

  try {
    // Create progress window
    progressWin = new BrowserWindow({
      width: 500,
      height: 350,
      parent: mainWindow,
      modal: true,
      show: false,
      resizable: false,
      webPreferences: {
        nodeIntegration: true,
        contextIsolation: false
      }
    })

    await progressWin.loadURL(`data:text/html,
      <!DOCTYPE html>
      <html><body style="margin:0;padding:20px;text-align:center;font-family:sans-serif;">
        <h3>Updating to v${latestVersion}...</h3>
        <progress id="progress" max="100" value="0" style="width:100%;height:20px;"></progress>
        <p id="status">Starting...</p>
      </body>
      <script>
        const { ipcRenderer } = require('electron');
        ipcRenderer.on('download-progress', (_, percent, status) => {
          document.getElementById('progress').value = percent;
          document.getElementById('status').textContent = status;
        });
        ipcRenderer.on('update-error', (_, msg) => {
          document.getElementById('status').textContent = 'Error: ' + msg;
        });
      </script>
      </html>
    `)
    progressWin.show()

    // --- DOWNLOAD ZIP ---
    const writer = fs.createWriteStream(UPDATE_ZIP)
    const response = await axios({ url, method: 'GET', responseType: 'stream' })

    const totalLength = parseInt(response.headers['content-length'] || 0, 10)
    let downloaded = 0

    response.data.on('data', (chunk) => {
      downloaded += chunk.length
      if (totalLength > 0) {
        const percent = Math.round((downloaded / totalLength) * 100)
        const status = `Downloading... ${percent}%`
        progressWin.webContents.send('download-progress', percent, status)
      }
    })

    response.data.pipe(writer)
    await new Promise((resolve, reject) => {
      writer.on('finish', () => writer.close(resolve))
      writer.on('error', reject)
    })

    console.log('✅ Download complete:', UPDATE_ZIP)
    progressWin.webContents.send('download-progress', 100, 'Extracting and replacing files...')

    // --- EXTRACT DIRECTLY INTO EXE FOLDER ---
    await extract(UPDATE_ZIP, { dir: EXE_DIR })

    // --- CLEANUP ZIP ---
    await fs.remove(UPDATE_ZIP)

    // Notify user
    dialog.showMessageBoxSync(mainWindow, {
      type: 'info',
      title: 'Update Complete',
      message: `Updated to version ${latestVersion}. Restarting...`
    })

    progressWin.close()

    // Relaunch updated app
    app.relaunch()
    app.quit()
  } catch (error) {
    console.error('❌ Update failed:', error)
    if (progressWin && !progressWin.isDestroyed()) {
      progressWin.webContents.send('update-error', error.message)
    }
    dialog.showErrorBox('Update Failed', error.message)
  }
}

export default checkForUpdate
