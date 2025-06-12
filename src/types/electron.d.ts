interface ElectronAPI {
  invoke: (channel: string, ...args: any[]) => Promise<any>
  closeApp: () => void
}

interface Window {
  electronAPI: ElectronAPI
}