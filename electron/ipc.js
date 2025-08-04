const { app, ipcMain } = require('electron')
const { execSync, exec } = require('child_process')
const fs = require('fs')
const path = require('path')

// 检查root权限
function checkRoot() {
  return process.getuid && process.getuid() === 0
}

// 获取启动模式(UEFI/BIOS)
function getBootMode() {
  try {
    return fs.existsSync('/sys/firmware/efi') ? 'uefi' : 'bios'
  } catch {
    return 'bios'
  }
}

function registerIpcListeners() {
  // 检查root权限
  ipcMain.handle('check-root', () => {
    return { isRoot: checkRoot() }
  })

  // 获取启动模式
  ipcMain.handle('get-boot-mode', () => {
    return { mode: getBootMode() }
  })
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

  // 卸载磁盘核心逻辑
  function unmountDisk(disk) {
    try {
      // 检查哪些分区被挂载
      const mounted = execSync(`mount | grep ${disk} | awk '{print $1}' || true`).toString().trim()
      if (mounted) {
        // 尝试正常卸载
        mounted.split('\n').forEach(part => {
          try { execSync(`umount ${part}`) } catch {}
        })
        
        // 强制卸载剩余分区
        const partitions = execSync(`ls ${disk}* 2>/dev/null || true`).toString().trim()
        if (partitions) {
          partitions.split('\n').forEach(part => {
            try { execSync(`umount -f ${part}`) } catch {}
            try { execSync(`umount -l ${part}`) } catch {}
          })
        }

        // 终止使用分区的进程
        execSync(`fuser -km ${disk} 2>/dev/null || true`)
        execSync(`lsof | grep ${disk} | awk '{print $2}' | xargs kill -9 2>/dev/null || true`)
      }
      return { success: true }
    } catch (error) {
      return { success: false, error: error.message }
    }
  }

  // 卸载分区
  ipcMain.handle('unmount-disk', (event, { disk }) => {
    return unmountDisk(disk)
  })

  // 磁盘分区
  ipcMain.handle('partition-disk', async (event, { disk, bootMode }) => {
    try {
      // 检查root权限
      if (!checkRoot()) {
        throw new Error('需要root权限执行磁盘分区操作')
      }

      // 检查磁盘设备是否存在
      if (!fs.existsSync(disk)) {
        throw new Error(`磁盘设备 ${disk} 不存在`)
      }

      // 检查分区工具是否可用
      // 检查并安装必要的分区工具
      try {
        execSync('which parted && which mkfs.fat && which mkfs.ext4')
      } catch (checkError) {
        console.log('正在安装必要的分区工具...')
        execSync('dnf install -y parted dosfstools e2fsprogs', {stdio: 'inherit'})
        try {
          execSync('which parted && which mkfs.fat && which mkfs.ext4')
        } catch (finalError) {
          throw new Error('缺少必要的分区工具(parted/mkfs.fat/mkfs.ext4)，且自动安装失败: ' + finalError.message)
        }
      }

      // 卸载磁盘
      const { success: unmountSuccess } = unmountDisk(disk)
      if (!unmountSuccess) {
        throw new Error('无法卸载磁盘')
      }

      // 清除磁盘签名
      execSync(`wipefs -af ${disk}`)
      
      // 创建GPT分区表
      execSync(`parted -s ${disk} mklabel gpt`)
      
      if (bootMode === 'uefi') {
        // UEFI模式分区方案
        execSync(`parted -s ${disk} mkpart primary fat32 1MiB 301MiB`)
        execSync(`parted -s ${disk} set 1 esp on`)
        execSync(`parted -s ${disk} mkpart primary ext4 301MiB 1301MiB`)  // /boot分区 (1GB)
        execSync(`parted -s ${disk} mkpart primary ext4 1301MiB 100%`)    // 根分区
        
        // 格式化分区
        execSync(`mkfs.fat -F32 -n "EFI" ${disk}1`)
        execSync(`mkfs.ext4 -F -L "BOOT" ${disk}2`)
        execSync(`mkfs.ext4 -F -L "ROOT" ${disk}3`)
      } else {
        // BIOS模式分区方案
        execSync(`parted -s ${disk} mkpart primary ext4 1MiB 2MiB`)
        execSync(`parted -s ${disk} set 1 bios_grub on`)
        execSync(`parted -s ${disk} mkpart primary ext4 2MiB 100%`)
        execSync(`mkfs.ext4 -F -L "ROOT" ${disk}2`)
      }
      
      return { success: true }
    } catch (error) {
      console.error('磁盘分区失败:', error)
      return {
        success: false,
        error: error.message,
        suggestion: '请检查: 1) 是否以root权限运行 2) 磁盘设备是否正确 3) 磁盘是否被占用'
      }
    }
  })

  // 安装系统
  ipcMain.handle('install-system', (event, { rootPath, packages }) => {
    try {
      // 检查并创建rootPath目录
      if (!fs.existsSync(rootPath)) {
        fs.mkdirSync(rootPath, { recursive: true })
      }
      // 确保yum.repos.d目录存在
      execSync(`mkdir -p ${rootPath}/etc/yum.repos.d`)
      
      // 复制镜像源配置
      execSync(`cp -f /etc/yum.repos.d/openEuler.repo ${rootPath}/etc/yum.repos.d/`)
      
      // 安装基本系统
      execSync(`dnf --installroot=${rootPath} install --nogpgcheck --assumeyes --setopt=sslverify=0 ${packages.join(' ')}`)
      
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
  ipcMain.handle('configure-grub', (event, { disk, bootMode, rootPath }) => {
    try {
      // 检查并创建rootPath目录
      if (!fs.existsSync(rootPath)) {
        fs.mkdirSync(rootPath, { recursive: true })
      }
      if (bootMode === 'uefi') {
        // UEFI模式GRUB安装
        execSync(`chroot ${rootPath} grub2-install --target=x86_64-efi --efi-directory=/boot/efi --bootloader-id=openEuler`)
        execSync(`chroot ${rootPath} grub2-mkconfig -o /boot/grub2/grub.cfg`)
      } else {
        // BIOS模式GRUB安装
        execSync(`chroot ${rootPath} grub2-install ${disk}`)
        execSync(`chroot ${rootPath} grub2-mkconfig -o /boot/grub2/grub.cfg`)
      }
      return { success: true }
    } catch (error) {
      return { success: false, error: error.message }
    }
  })

  // 清理安装环境
  ipcMain.handle('cleanup-install', (event, { rootPath }) => {
    try {
      // 卸载所有挂载点
      execSync(`umount -R ${rootPath} 2>/dev/null || true`)
      // 删除临时文件
      execSync(`rm -rf ${rootPath}/var/cache/dnf/*`)
      return { success: true }
    } catch (error) {
      return { success: false, error: error.message }
    }
  })

  // 重启系统
  ipcMain.handle('reboot-system', () => {
    try {
      execSync(`reboot`)
      return { success: true }
    } catch (error) {
      return { success: false, error: error.message }
    }
  })

  // 获取所有磁盘信息
  ipcMain.handle('get-disk-info', () => {
    try {
      // 检查lsblk命令是否可用
      try {
        execSync('which lsblk')
      } catch {
        throw new Error('lsblk command not found')
      }

      const output = execSync('lsblk -J -o NAME,SIZE,TYPE,MOUNTPOINT,FSTYPE').toString()
      const { blockdevices } = JSON.parse(output)
      
      const disks = blockdevices
        .filter(device => device.type === 'disk')
        .map(disk => ({
          name: disk.name,
          size: disk.size,
          type: disk.type,
          mountpoint: disk.mountpoint || null,
          partitions: disk.children?.map(part => ({
            name: part.name,
            size: part.size,
            type: part.type,
            fsType: part.fstype || null,
            mountpoint: part.mountpoint || null
          })) || []
        }))

      console.log('Disks info:', disks)
      return { success: true, disks }
    } catch (error) {
      console.error('Failed to get disk info:', error)
      return {
        success: false,
        error: error.message,
        suggestion: 'Please ensure lsblk command is available and try again'
      }
    }
  })

  // 通过磁盘名称获取分区详细信息
  ipcMain.handle('get-disk-partitions', async (event, { diskName }) => {
    try {
      // 检查命令是否可用
      try {
        execSync('which lsblk && which df')
      } catch {
        throw new Error('Required commands (lsblk/df) not found')
      }

      // 验证磁盘是否存在
      if (!fs.existsSync(`/dev/${diskName}`)) {
        throw new Error(`Disk /dev/${diskName} not found`)
      }

      // 获取分区基本信息
      const lsblkOutput = execSync(`lsblk -J -o NAME,SIZE,TYPE,MOUNTPOINT,FSTYPE /dev/${diskName}`).toString()
      const { blockdevices } = JSON.parse(lsblkOutput)
      
      if (!blockdevices || blockdevices.length === 0) {
        throw new Error('No partitions found for disk')
      }

      const disk = blockdevices[0]
      const partitions = disk.children || []

      // 获取分区使用情况
      const partitionDetails = await Promise.all(partitions.map(async (part) => {
        try {
          const dfOutput = part.mountpoint
            ? execSync(`df -h ${part.mountpoint} | tail -n +2`).toString().trim()
            : null
          
          let used, available, percent
          if (dfOutput) {
            const [,,,usedStr, availStr, percentStr] = dfOutput.split(/\s+/)
            used = usedStr
            available = availStr
            percent = percentStr
          }

          return {
            name: part.name,
            size: part.size,
            fsType: part.fstype || 'unknown',
            mountpoint: part.mountpoint || null,
            used: used || null,
            available: available || null,
            percentUsed: percent || null
          }
        } catch (error) {
          console.error(`Error getting usage for partition ${part.name}:`, error)
          return {
            name: part.name,
            size: part.size,
            fsType: part.fstype || 'unknown',
            mountpoint: part.mountpoint || null,
            used: null,
            available: null,
            percentUsed: null
          }
        }
      }))

      return {
        success: true,
        disk: {
          name: disk.name,
          size: disk.size,
          partitions: partitionDetails
        }
      }
    } catch (error) {
      console.error('Failed to get disk partitions:', error)
      return {
        success: false,
        error: error.message,
        suggestion: 'Please check: 1) Disk exists 2) Required commands available'
      }
    }
  })

}


module.exports = {
  registerIpcListeners
}
