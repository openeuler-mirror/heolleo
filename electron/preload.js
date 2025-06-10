const { contextBridge, ipcRenderer } = require('electron');

console.log('Preload script starting...');

try {
  contextBridge.exposeInMainWorld('electronAPI', {
    closeApp: () => {
      console.log('closeApp method called');
      ipcRenderer.send('close-app');
    }
  });
  console.log('electronAPI exposed successfully');
} catch (error) {
  console.error('Error exposing electronAPI:', error);
}
