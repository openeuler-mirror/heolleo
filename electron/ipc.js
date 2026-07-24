const { app, ipcMain } = require('electron')
const { execSync, exec } = require('child_process')
const fs = require('fs')
const path = require('path')

// 文件系统类型映射函数
function mapFileSystemType(fsType) {
  if (!fsType) return null;
  
  const fsTypeMap = {
    'vfat': 'fat32',
    'fat32': 'fat32',
    'fat16': 'fat16',
    'fat12': 'fat12',
    'ext4': 'ext4',
    'ext3': 'ext3',
    'ext2': 'ext2',
    'btrfs': 'btrfs',
    'xfs': 'xfs',
    'ntfs': 'ntfs',
    'swap': 'swap',
    'iso9660': 'iso9660',
    'udf': 'udf'
  };
  
  return fsTypeMap[fsType.toLowerCase()] || fsType;
}

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
  ipcMain.handle('install-system', async (event, { configPath, userConfigPath }) => {
    const webContents = event.sender
    
    let installCommand
    if (userConfigPath) {
      // 使用两个配置文件：eulerinstall配置和用户配置
      installCommand = `sudo eulerinstall --config ${configPath} --creds ${userConfigPath} --silent`
    } else {
      // 只使用eulerinstall配置文件
      installCommand = `sudo eulerinstall --config ${configPath} --silent`
    }
    
    console.log('Install command:', installCommand)
    const installProcess = exec(installCommand);

    installProcess.stdout.on('data', (data) => {
      const log = data.toString()
      console.log('Install stdout:', log)
      webContents.send('install-log', log)
    });

    installProcess.stderr.on('data', (data) => {
      const log = data.toString()
      console.error('Install stderr:', log)
      webContents.send('install-log', log)
    });

    return new Promise((resolve) => {
      installProcess.on('close', (code) => {
        if (code === 0) {
          resolve({ success: true })
        } else {
          resolve({ success: false, error: `Installation failed with code ${code}` })
        }
      });
    })
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
        execSync(`chroot ${rootPath} grub2-mkconfig -o /boot/efi/EFI/openEuler/grub.cfg`)
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

  // 保存配置文件
  ipcMain.handle('save-config-file', async (event, { filepath, content }) => {
    try {
      const resolvedPath = path.resolve(filepath)
      
      const SENSITIVE_PATHS = [
        '/etc', '/usr', '/bin', '/sbin', '/boot', '/lib', '/lib64',
        '/var', '/root', '/home', '/dev', '/proc', '/sys', '/opt'
      ]
      
      for (const sensitivePath of SENSITIVE_PATHS) {
        if (resolvedPath.startsWith(sensitivePath)) {
          console.error(`Path rejected: ${resolvedPath} is in sensitive directory ${sensitivePath}`)
          return { success: false, error: '路径被拒绝：禁止写入系统敏感目录' }
        }
      }
      
      if (!resolvedPath.startsWith('/tmp/')) {
        console.error(`Path rejected: ${resolvedPath} is not under /tmp/`)
        return { success: false, error: '路径被拒绝：仅允许保存至 /tmp 目录' }
      }
      
      const dir = path.dirname(resolvedPath)
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true })
      }
      
      fs.writeFileSync(resolvedPath, content, 'utf8')
      return { success: true }
    } catch (error) {
      console.error('Failed to save config file:', error)
      return { success: false, error: error.message }
    }
  })

  // 获取所有磁盘信息 - 优化版本
  ipcMain.handle('get-disk-info', async () => {
    try {
      // 清除多路径设备并更新分区表，等待设备事件完成
      try {
        execSync('sudo multipath -F');
      } catch (error) {
        console.warn('multipath -F failed (maybe multipath not installed):', error.message);
      }
      try {
        execSync('sudo partprobe');
      } catch (error) {
        console.warn('partprobe failed:', error.message);
      }
      // 等待设备事件完成，确保内核更新设备信息
      try {
        execSync('sudo udevadm settle');
      } catch (error) {
        console.warn('udevadm settle failed:', error.message);
      }
      
      // 获取基本磁盘信息（只使用lsblk，避免额外的系统调用）
      const lsblkOutput = execSync('lsblk -J -b -o NAME,SIZE,TYPE,MOUNTPOINT,FSTYPE,UUID,PATH').toString();
      const { blockdevices } = JSON.parse(lsblkOutput);
      console.log('blockdevices:', blockdevices);

      // 快速处理磁盘信息，避免对每个磁盘执行parted和blockdev
      const disks = blockdevices
        .filter(device => device.type === 'disk' && device.path)
        .map(disk => {
          // 简化的分区信息处理
          const partitions = disk.children?.map(part => {
            // 智能推断分区标志，避免parted调用
            const flags = [];
            if (part.mountpoint === '/boot/efi' || part.fstype === 'vfat') {
              flags.push('boot', 'esp');
            }
            if (part.mountpoint === '/boot') {
              flags.push('bls_boot');
            }

            // 获取分区起始扇区
            let startSector;
            try {
              // 使用fdisk获取分区起始扇区
              const fdiskOutput = execSync(`sudo fdisk -l /dev/${disk.name} 2>/dev/null || true`).toString();
              const lines = fdiskOutput.split('\n');
              for (const line of lines) {
                if (line.includes(`/dev/${part.name}`)) {
                  const parts = line.trim().split(/\s+/);
                  if (parts.length >= 3) {
                    startSector = parseInt(parts[1], 10);
                    console.log(`${part.name} --- ${parts[1]} --- ${startSector}`);
                    break;
                  }
                }
              }
            } catch (error) {
              console.warn(`Failed to get start sector for partition ${part.name}:`, error.message);
              // 如果获取失败，使用默认值1
              startSector = 2048;
            }

            console.log(part.fstype);
            fs_typee = mapFileSystemType(part.fstype)
            console.log(fs_typee);

            return {
              name: part.name,
              dev_path: part.path,
              size: parseInt(part.size, 10),
              fs_type: mapFileSystemType(part.fstype),
              mountpoint: part.mountpoint || null,
              uuid: part.uuid || null,
              flags: flags,
              start: startSector * 512, // 获取实际的起始扇区
              type: 'primary', // 默认类型
            };
          }) || [];

          return {
            name: disk.name,
            device: disk.path,
            size: parseInt(disk.size, 10) - 1024 * 1024,   // 最后1MiB为GPT分区表备份数据使用，提前预留出来
            type: disk.type,
            mountpoint: disk.mountpoint || null,
            sector_size: 512, // 使用默认值，避免blockdev调用
            partitions: partitions
          };
        });

      console.log('Optimized disks info retrieved, count:', disks.length);
      return { success: true, disks };
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

      // 清除多路径设备并更新分区表，等待设备事件完成
      try {
        execSync('sudo multipath -F');
      } catch (error) {
        console.warn('multipath -F failed (maybe multipath not installed):', error.message);
      }
      try {
        execSync('sudo partprobe');
      } catch (error) {
        console.warn('partprobe failed:', error.message);
      }
      // 等待设备事件完成，确保内核更新设备信息
      try {
        execSync('sudo udevadm settle');
      } catch (error) {
        console.warn('udevadm settle failed:', error.message);
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
            fsType: mapFileSystemType(part.fstype) || 'unknown',
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

  // 获取磁盘扇区大小
  ipcMain.handle('get-disk-sector-size', async (event, { diskDevice }) => {
    try {
      // 检查fdisk命令是否可用
      try {
        execSync('which fdisk');
      } catch {
        throw new Error('Required command (fdisk) not found');
      }

      // 验证磁盘设备是否存在
      if (!fs.existsSync(diskDevice)) {
        throw new Error(`Disk device ${diskDevice} not found`);
      }

      // 使用fdisk获取扇区大小信息
      const fdiskOutput = execSync(`fdisk -l ${diskDevice} | grep "Sector size"`).toString().trim();
      
      if (!fdiskOutput) {
        throw new Error('Could not determine sector size from fdisk output');
      }

      // 解析fdisk输出，例如: "Sector size (logical/physical): 512 bytes / 512 bytes"
      const sectorSizeMatch = fdiskOutput.match(/Sector size.*?(\d+) bytes/);
      if (!sectorSizeMatch) {
        throw new Error('Could not parse sector size from fdisk output');
      }

      const sectorSize = parseInt(sectorSizeMatch[1], 10);
      
      return {
        success: true,
        sector_size: {
          value: sectorSize,
          unit: 'B'
        }
      };
    } catch (error) {
      console.error('Failed to get disk sector size:', error);
      return {
        success: false,
        error: error.message,
        suggestion: 'Please ensure fdisk command is available and disk device exists'
      };
    }
  });

  // 获取分区起始扇区信息
  ipcMain.handle('get-partition-start-sector', async (event, { diskDevice, partitionDevice }) => {
    try {
      // 检查fdisk命令是否可用
      try {
        execSync('which fdisk');
      } catch {
        throw new Error('Required command (fdisk) not found');
      }

      // 验证磁盘设备和分区设备是否存在
      if (!fs.existsSync(diskDevice)) {
        throw new Error(`Disk device ${diskDevice} not found`);
      }
      if (!fs.existsSync(partitionDevice)) {
        throw new Error(`Partition device ${partitionDevice} not found`);
      }

      // 使用fdisk获取分区详细信息
      const fdiskOutput = execSync(`fdisk -l ${diskDevice}`).toString();
      
      // 解析分区表，找到指定分区的起始扇区
      const lines = fdiskOutput.split('\n');
      let foundPartition = false;
      let startSector = null;

      for (const line of lines) {
        // 查找分区行，例如: "/dev/sda1   *        2048    2099199    2097152   1G 83 Linux"
        if (line.includes(partitionDevice)) {
          const parts = line.trim().split(/\s+/);
          if (parts.length >= 3) {
            startSector = parseInt(parts[1], 10);
            foundPartition = true;
            break;
          }
        }
      }

      if (!foundPartition || startSector === null) {
        throw new Error(`Could not find start sector for partition ${partitionDevice}`);
      }

      return {
        success: true,
        start_sector: startSector
      };
    } catch (error) {
      console.error('Failed to get partition start sector:', error);
      return {
        success: false,
        error: error.message,
        suggestion: 'Please ensure fdisk command is available and partition device exists'
      };
    }
  });

}


module.exports = {
  registerIpcListeners
}
