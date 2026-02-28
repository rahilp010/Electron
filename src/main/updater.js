/* eslint-disable prettier/prettier */
import { app, dialog, BrowserWindow } from 'electron'
import axios from 'axios'
import fs from 'fs'
import path from 'path'
import { spawn } from 'child_process'
import SemVer from 'semver'

export async function checkForUpdate() {
  try {
    const CURRENT_VERSION = app.getVersion()

    const { data } = await axios.get('https://electron-server-plum.vercel.app/api/version')

    if (!SemVer.gt(data.version, CURRENT_VERSION)) return

    const result = dialog.showMessageBoxSync({
      type: 'question',
      buttons: ['Update Now', 'Later'],
      defaultId: 0,
      message: `New version ${data.version} available. Update now?`
    })

    if (result === 0) {
      await downloadAndReplace(data.url)
    }
  } catch (err) {
    console.log('Update check failed:', err.message)
  }
}

async function downloadAndReplace(downloadUrl) {
  const exePath = app.getPath('exe')
  const exeDir = path.dirname(exePath)

  const newExePath = path.join(exeDir, 'app_new.exe')
  const batchPath = path.join(exeDir, 'update.bat')

  let isCancelled = false

  const progressWin = new BrowserWindow({
    width: 420,
    height: 260,
    resizable: false,
    frame: false,
    transparent: false,
    alwaysOnTop: true,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false
    }
  })

  progressWin.loadURL(`data:text/html,
  <html>
  <body style="margin:0;background:#0f172a;font-family:Segoe UI, sans-serif;color:white;display:flex;align-items:center;justify-content:center;height:100%;">
    <div style="width:85%;background:#1e293b;padding:25px;border-radius:18px;box-shadow:0 10px 40px rgba(0,0,0,0.6);text-align:center;">
      
      <div style="margin-bottom:15px;">
        <div class="loader"></div>
      </div>

      <h2 style="margin:0 0 10px 0;font-weight:500;">Updating Application</h2>

      <div style="height:8px;background:#334155;border-radius:10px;overflow:hidden;margin:15px 0;">
        <div id="bar" style="height:100%;width:0%;background:linear-gradient(90deg,#3b82f6,#06b6d4);transition:width .3s;"></div>
      </div>

      <p id="status" style="font-size:13px;color:#94a3b8;margin:0;">Preparing...</p>

      <button id="cancelBtn" style="margin-top:18px;padding:6px 16px;background:#ef4444;border:none;border-radius:8px;color:white;cursor:pointer;">
        Cancel
      </button>
    </div>

    <style>
      .loader {
        border: 3px solid #334155;
        border-top: 3px solid #3b82f6;
        border-radius: 50%;
        width: 35px;
        height: 35px;
        animation: spin 1s linear infinite;
        margin:auto;
      }

      @keyframes spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
      }

      button:hover {
        background:#dc2626;
      }
    </style>

    <script>
      const { ipcRenderer } = require('electron')

      ipcRenderer.on('progress', (_, percent, text) => {
        document.getElementById('bar').style.width = percent + '%'
        document.getElementById('status').innerText = text
      })

      document.getElementById('cancelBtn').addEventListener('click', () => {
        ipcRenderer.send('cancel-update')
      })
    </script>
  </body>
  </html>
  `)

  // 🔹 Cancel handler
  ipcMain.once('cancel-update', () => {
    isCancelled = true
    progressWin.close()
  })

  const writer = fs.createWriteStream(newExePath)

  const response = await axios({
    url: downloadUrl,
    method: 'GET',
    responseType: 'stream'
  })

  const totalLength = parseInt(response.headers['content-length'] || 0)
  let downloaded = 0

  response.data.on('data', (chunk) => {
    if (isCancelled) {
      response.data.destroy()
      return
    }

    downloaded += chunk.length
    const percent = totalLength ? Math.round((downloaded / totalLength) * 100) : 0

    progressWin.webContents.send('progress', percent, `Downloading... ${percent}%`)
  })

  response.data.pipe(writer)

  await new Promise((resolve, reject) => {
    writer.on('finish', resolve)
    writer.on('error', reject)
  })

  if (isCancelled) return

  progressWin.webContents.send('progress', 100, 'Installing update...')

  const batchScript = `
@echo off
timeout /t 2 /nobreak > nul
taskkill /f /im "${path.basename(exePath)}"
move /y "${newExePath}" "${exePath}"
start "" "${exePath}"
del "%~f0"
`

  fs.writeFileSync(batchPath, batchScript)

  spawn('cmd.exe', ['/c', batchPath], {
    detached: true,
    stdio: 'ignore'
  }).unref()

  app.quit()
}
