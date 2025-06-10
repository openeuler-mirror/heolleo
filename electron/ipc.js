const { app, ipcMain } = require('electron')

function registerIpcListeners() {
  ipcMain.on('close-app', () => {
    app.quit()
  })
}

module.exports = {
  registerIpcListeners
}
