const { app, ipcMain } = require('electron')
const { execSync } = require('child_process')
const fs = require('fs')
const path = require('path')

function registerIpcListeners() {
  ipcMain.on('close-app', () => {
    app.quit()
  })

  // 用户管理
  ipcMain.handle('create-user', (event, { username, password }) => {
    try {
      execSync(`useradd -m ${username}`)
      execSync(`echo "${username}:${password}" | chpasswd`)
      return { success: true }
    } catch (error) {
      return { success: false, error: error.message }
    }
  })

  // 磁盘分区
  ipcMain.handle('partition-disk', (event, { disk, partitions }) => {
    try {
      // 实现分区逻辑
      return { success: true }
    } catch (error) {
      return { success: false, error: error.message }
    }
  })

  // 挂载镜像
  ipcMain.handle('mount-image', (event, { imagePath, mountPoint }) => {
    try {
      execSync(`mkdir -p ${mountPoint}`)
      execSync(`mount -o loop ${imagePath} ${mountPoint}`)
      return { success: true }
    } catch (error) {
      return { success: false, error: error.message }
    }
  })

  // 文件复制
  ipcMain.handle('copy-files', (event, { source, destination }) => {
    try {
      execSync(`cp -r ${source} ${destination}`)
      return { success: true }
    } catch (error) {
      return { success: false, error: error.message }
    }
  })

  // GRUB配置
  ipcMain.handle('configure-grub', (event, { disk }) => {
    try {
      execSync(`grub-install ${disk}`)
      execSync(`update-grub`)
      return { success: true }
    } catch (error) {
      return { success: false, error: error.message }
    }
  })

  // 获取磁盘信息
  ipcMain.handle('get-disk-info', () => {
    try {
      const output = execSync('lsblk -J -o NAME,SIZE,TYPE,MOUNTPOINT').toString()
      const { blockdevices } = JSON.parse(output)
      const disks = blockdevices
        .filter(device => device.type === 'disk')
        .map(device => ({
          name: device.name,
          size: device.size,
          type: device.type,
          mountpoint: device.mountpoint || null
        }))
      console.log(disks)
      return { success: true, disks }
    } catch (error) {
      return { success: false, error: error.message }
    }
  })

}


module.exports = {
  registerIpcListeners
}
