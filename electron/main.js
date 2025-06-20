const { app, BrowserWindow } = require('electron')
const path = require('path')
const { registerIpcListeners } = require('./ipc.js')

// 禁用GPU加速
app.disableHardwareAcceleration()

function createWindow() {
  const win = new BrowserWindow({
    width: 800,
    height: 600,
    frame: false,
    resizable: false,
    transparent: true,
    backgroundColor: '#00000000',
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      webSecurity: false,
      allowRunningInsecureContent: true,
      devTools: true,
      additionalArguments: ['--enable-features=WebContentsForceDark'],
      preload: path.join(__dirname, 'preload.js')
    }
  })

  registerIpcListeners();

  if (process.env.NODE_ENV === 'development') {
    const viteUrl = 'http://localhost:5173'
    win.loadURL(viteUrl, {
      extraHeaders: 'pragma: no-cache\n',
      httpReferrer: viteUrl
    })

    win.webContents.openDevTools()

    win.webContents.on('did-finish-load', () => {
      console.log('Page loaded successfully')
      // 确保加载了所有资源
      win.webContents.executeJavaScript(`
        console.log('Checking scripts...');
        Array.from(document.scripts).forEach(script => {
          console.log('Script src:', script.src);
        });
      `)
    })

    win.webContents.on('did-fail-load', (event, errorCode, errorDesc) => {
      console.error('Failed to load page:', errorDesc)
    })

    // 解决资源加载问题
    win.webContents.session.webRequest.onBeforeRequest((details, callback) => {
      callback({ cancel: false })
    })
  } else {
    console.log('Open file in dist')
    win.loadFile(path.join(__dirname, '../dist/index.html'))
  }
}

app.whenReady().then(createWindow)

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})
