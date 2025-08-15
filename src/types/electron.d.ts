interface IpcRenderer {
  invoke: (channel: string, ...args: any[]) => Promise<any>
  send: (channel: string, ...args: any[]) => void
  on: (channel: string, listener: (...args: any[]) => void) => void
  removeListener: (channel: string, listener: (...args: any[]) => void) => void
}

export interface ElectronAPI {
  closeApp: () => void
  saveConfigFile: (filepath: string, content: string) => Promise<void>
}

interface Window {
  electron: {
    ipcRenderer: IpcRenderer
  }
  electronAPI?: ElectronAPI
}