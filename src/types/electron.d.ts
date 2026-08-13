interface IpcRenderer {
  invoke: (channel: string, ...args: any[]) => Promise<any>
  send: (channel: string, ...args: any[]) => void
  on: (channel: string, listener: (...args: any[]) => void) => void
  removeListener: (channel: string, listener: (...args: any[]) => void) => void
}

export interface ElectronAPI {
  closeApp: () => void
  saveConfigFile: (filepath: string, content: string) => Promise<void>
  getDiskSectorSize: (params: { diskDevice: string }) => Promise<{ success: boolean; sector_size?: { value: number; unit: string }; error?: string }>
  getBootMode: () => Promise<{ mode: 'uefi' | 'bios' }>
}

interface Window {
  electron: {
    ipcRenderer: IpcRenderer
  }
  electronAPI?: ElectronAPI
}