/* eslint-disable prettier/prettier */
import { app, dialog } from 'electron'
import axios from 'axios'
import fs from 'fs'
import path from 'path'
import extract from 'extract-zip'

const CURRENT_VERSION = '1.2.0'
const UPDATE_ZIP = path.join(process.cwd(), 'Release.zip')
const APP_DIR = app.getAppPath()

async function checkForUpdate() {
  try {
    console.log('Checking for updates...')
    const { data } = await axios.get('https://electron-server-plum.vercel.app/api/version')
    const latestVersion = data.version

    console.log('Latest version:', latestVersion)
    console.log('Current version:', CURRENT_VERSION)

    if (latestVersion !== CURRENT_VERSION) {
      const choice = dialog.showMessageBoxSync({
        type: 'question',
        buttons: ['Update Now', 'Later'],
        defaultId: 0,
        title: 'Update Available',
        message: `New version ${latestVersion} available. Update now?`
      })

      if (choice === 0) {
        await downloadAndInstall(data.url)
      }
    }
  } catch (error) {
    console.error('Update check failed:', error)
  }
}

async function downloadAndInstall(url) {
  const writer = fs.createWriteStream(UPDATE_ZIP)
  console.log('Downloading update...')
  console.log('writer', writer)

  const response = await axios({
    url,
    method: 'GET',
    responseType: 'stream'
  })

  response.data.pipe(writer)

  await new Promise((resolve, reject) => {
    writer.on('finish', resolve)
    writer.on('error', reject)
  })

  console.log('✅ Update downloaded.')

  const extractedPath = path.join(APP_DIR, 'new_version')
  await extract(UPDATE_ZIP, { dir: extractedPath })

  // Optional: backup current version
  const backupPath = path.join(APP_DIR, 'backup')
  fs.copySync(APP_DIR, backupPath, { overwrite: true })

  // Replace app contents
  fs.copySync(extractedPath, APP_DIR, { overwrite: true })
  fs.removeSync(extractedPath)
  fs.removeSync(UPDATE_ZIP)

  dialog.showMessageBoxSync({
    type: 'info',
    title: 'Update Complete',
    message: 'App updated successfully! Restarting...'
  })

  // Restart app
  app.relaunch()
  app.exit()
}

export default checkForUpdate
