const { contextBridge, ipcRenderer } = require('electron')

contextBridge.exposeInMainWorld('electron', {
  ipcRenderer: {
    invoke: (channel, ...args) => ipcRenderer.invoke(channel, ...args),
    send: (channel, ...args) => ipcRenderer.send(channel, ...args),
    on: (channel, listener) => ipcRenderer.on(channel, listener),
    removeListener: (channel, listener) => ipcRenderer.removeListener(channel, listener)
  }
})

contextBridge.exposeInMainWorld('electronAPI', {
  closeApp: () => ipcRenderer.send('close-app'),
  saveConfigFile: (filepath, content) => ipcRenderer.invoke('save-config-file', { filepath, content }),
  generateYescryptHash: (password) => ipcRenderer.invoke('generate-yescrypt-hash', { password }),
  getDiskSectorSize: (params) => ipcRenderer.invoke('get-disk-sector-size', params),
  getPartitionStartSector: (params) => ipcRenderer.invoke('get-partition-start-sector', params),
  getBootMode: () => ipcRenderer.invoke('get-boot-mode')
})
